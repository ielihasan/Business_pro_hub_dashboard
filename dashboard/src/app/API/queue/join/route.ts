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
    } = body;

    if (!business_id || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: "Business ID, customer name, and phone are required" },
        { status: 400 }
      );
    }

    // Verify business exists and is active
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, business_name, is_queue_active")
      .eq("id", business_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check if queue is active for this business
    if (business.is_queue_active === false) {
      return NextResponse.json(
        { error: "Queue is currently closed for this business" },
        { status: 400 }
      );
    }

    // Check if customer is already in active queue
    const today = new Date().toISOString().split("T")[0];
    const { data: existingEntry } = await supabase
      .from("queue_entries")
      .select("id, ticket_number, position")
      .eq("business_id", business_id)
      .eq("customer_phone", customer_phone)
      .in("status", ["waiting", "serving"])
      .gte("created_at", `${today}T00:00:00.000Z`)
      .single();

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
    const { data: lastEntry } = await supabase
      .from("queue_entries")
      .select("position")
      .eq("business_id", business_id)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastEntry?.position || 0) + 1;

    // Generate unique ticket number
    const ticketNumber = `Q${today.replace(/-/g, "")}-${nextPosition
      .toString()
      .padStart(3, "0")}`;

    // Create queue entry
    const { data: queueEntry, error } = await supabase
      .from("queue_entries")
      .insert({
        business_id,
        customer_name,
        customer_phone,
        customer_email,
        service_type,
        notes,
        priority: "normal",
        position: nextPosition,
        ticket_number: ticketNumber,
        status: "waiting",
        joined_via: "qr_code", // Track how customer joined
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Queue join error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate estimated wait time based on average
    const { data: completedToday } = await supabase
      .from("queue_entries")
      .select("served_at, created_at")
      .eq("business_id", business_id)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .not("served_at", "is", null);

    let estimatedWaitMinutes = nextPosition * 5; // Default 5 min per person

    if (completedToday && completedToday.length > 0) {
      const avgServiceTime =
        completedToday.reduce((sum, entry) => {
          const serviceTime =
            new Date(entry.served_at).getTime() -
            new Date(entry.created_at).getTime();
          return sum + serviceTime;
        }, 0) /
        completedToday.length /
        60000;

      // Get number of people ahead
      const { count: peopleAhead } = await supabase
        .from("queue_entries")
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
