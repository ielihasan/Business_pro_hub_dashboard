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
      service_type,
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

    // Check if customer is already in active queue
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

    const { data: existingEntry } = await existingQuery.single();

    if (existingEntry) {
      return NextResponse.json(
        {
          error: "You are already in the queue",
          data: existingEntry,
        },
        { status: 400 }
      );
    }

    // Get the current max position for today
    const positionQuery = supabase
      .from("queues")
      .select("position")
      .eq("business_id", business_id)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .order("position", { ascending: false })
      .limit(1);

    const { data: lastEntry } = await positionQuery.single();
    const nextPosition = (lastEntry?.position || 0) + 1;

    // Create queue entry using existing queues table columns
    const { data: queueEntry, error } = await supabase
      .from("queues")
      .insert({
        business_id,
        customer_id: user_id || null,
        customer_name: resolvedName,
        customer_phone: resolvedPhone,
        customer_email: resolvedEmail,
        service_type,
        notes,
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

    const completedQuery = supabase
      .from("queues")
      .select("started_at, created_at")
      .eq("business_id", business_id)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .not("started_at", "is", null)
      .limit(20);

    const { data: completedToday } = await completedQuery;

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

      const peopleAheadQuery = supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business_id)
        .eq("status", "waiting")
        .lt("position", nextPosition)
        .gte("created_at", `${today}T00:00:00.000Z`);

      const { count: peopleAhead } = await peopleAheadQuery;
      estimatedWaitMinutes = Math.round((peopleAhead || 0) * avgServiceTime);
    }

    return NextResponse.json({
      data: {
        ...queueEntry,
        business_name: business.business_name,
        estimated_wait_minutes: estimatedWaitMinutes,
        people_ahead: nextPosition - 1,
      },
      message: "Successfully joined the queue!",
    });
  } catch (err: any) {
    console.error("Queue join error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
