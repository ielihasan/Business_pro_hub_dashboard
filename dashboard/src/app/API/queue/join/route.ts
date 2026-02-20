import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Customer joins queue via QR code or mobile app
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      customer_name,
      customer_phone,
      customer_email,
      service_type,      // optional free-text service description
      queue_type_id,     // optional: ID of the queue type (from services table)
      queue_type_name,   // optional: name of the queue type
      notes,
      user_id, // Optional: authenticated user from mobile app
    } = body;

    // When user_id is provided (app scan), fetch user info from User table
    let resolvedName = customer_name;
    let resolvedPhone = customer_phone;
    let resolvedEmail = customer_email;

    if (user_id) {
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("id, full_name, email, phone_number")
        .eq("id", user_id)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: "User not found. Please make sure you are logged in." },
          { status: 404 }
        );
      }

      resolvedName = userData.full_name || customer_name;
      resolvedPhone = userData.phone_number || customer_phone;
      resolvedEmail = userData.email || customer_email;
    }

    if (!business_id || !resolvedName) {
      return NextResponse.json(
        { error: "Business ID and customer name are required" },
        { status: 400 }
      );
    }

    if (!user_id && !resolvedPhone) {
      return NextResponse.json(
        { error: "Phone number is required for non-app users" },
        { status: 400 }
      );
    }

    // Verify business exists and is active
    const { data: business, error: businessError } = await supabase
      .from("admins")
      .select("id, business_name, is_approved")
      .eq("id", business_id)
      .eq("role", "business_owner")
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check if customer is already in active queue for this business today
    const today = new Date().toISOString().split("T")[0];

    let existingQuery = supabase
      .from("queues")
      .select("id, position")
      .eq("business_id", business_id)
      .in("status", ["waiting", "serving"])
      .gte("created_at", `${today}T00:00:00.000Z`);

    // Check duplicates by customer_id (app users) or phone (web users)
    if (user_id) {
      existingQuery = existingQuery.eq("customer_id", user_id);
    } else {
      existingQuery = existingQuery.eq("customer_phone", resolvedPhone);
    }

    // If queue_type_id is specified, check duplicate within that queue type only
    if (queue_type_id) {
      existingQuery = existingQuery.eq("service_type", queue_type_id);
    }

    const { data: existingEntry } = await existingQuery.single();

    if (existingEntry) {
      return NextResponse.json(
        {
          error: "You are already in the queue",
          data: {
            ...existingEntry,
            // Return as ticket-compatible format
            ticket_number: existingEntry.id,
            business_name: business.business_name,
          },
        },
        { status: 400 }
      );
    }

    // Get the current max position for today (scoped to queue_type if applicable)
    let positionQuery = supabase
      .from("queues")
      .select("position")
      .eq("business_id", business_id)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .order("position", { ascending: false })
      .limit(1);

    if (queue_type_id) {
      positionQuery = positionQuery.eq("service_type", queue_type_id);
    }

    const { data: lastEntry } = await positionQuery.single();
    const nextPosition = (lastEntry?.position || 0) + 1;

    // service_type in the queues table: we store the queue_type_id here
    // so we can filter by queue type. The queue_type_name goes into notes
    // if no dedicated column exists.
    const serviceTypeValue = queue_type_id || service_type || null;

    // Create queue entry using existing queues table columns
    const { data: queueEntry, error } = await supabase
      .from("queues")
      .insert({
        business_id,
        customer_id: user_id || null,
        customer_name: resolvedName,
        customer_phone: resolvedPhone,
        customer_email: resolvedEmail,
        service_type: serviceTypeValue,
        notes: queue_type_name
          ? `[${queue_type_name}]${notes ? ` ${notes}` : ""}`
          : notes || null,
        priority: "normal",
        position: nextPosition,
        status: "waiting",
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Queue join error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate estimated wait time
    let estimatedWaitMinutes = nextPosition * 5;

    const { data: completedToday } = await supabase
      .from("queues")
      .select("started_at, created_at")
      .eq("business_id", business_id)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .not("started_at", "is", null)
      .limit(20);

    if (completedToday && completedToday.length > 0) {
      const avgServiceTime =
        completedToday.reduce((sum: number, entry: any) => {
          const serviceTime =
            new Date(entry.started_at).getTime() -
            new Date(entry.created_at).getTime();
          return sum + serviceTime;
        }, 0) /
        completedToday.length /
        60000;

      const { count: peopleAhead } = await supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business_id)
        .eq("status", "waiting")
        .lt("position", nextPosition)
        .gte("created_at", `${today}T00:00:00.000Z`);

      estimatedWaitMinutes = Math.round((peopleAhead || 0) * avgServiceTime);
    }

    return NextResponse.json({
      data: {
        ...queueEntry,
        // ticket_number = the entry's id (UUID), used for tracking
        ticket_number: queueEntry.id,
        business_name: business.business_name,
        queue_type_id: queue_type_id || null,
        queue_type_name: queue_type_name || null,
        estimated_wait_minutes: estimatedWaitMinutes,
        people_ahead: nextPosition - 1,
        display_number: String(nextPosition).padStart(3, "0"),
      },
      message: "Successfully joined the queue!",
    });
  } catch (err: any) {
    console.error("Queue join error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
