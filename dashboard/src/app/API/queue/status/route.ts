import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get queue status for a customer by ticket number or phone
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketNumber = searchParams.get("ticket");
    const phone = searchParams.get("phone");
    const businessId = searchParams.get("business_id");

    if (!ticketNumber && !phone) {
      return NextResponse.json(
        { error: "Ticket number or phone is required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("queue_entries")
      .select(
        `
        id,
        ticket_number,
        customer_name,
        customer_phone,
        position,
        status,
        service_type,
        created_at,
        served_at,
        business_id,
        businesses:business_id(business_name)
      `
      )
      .gte("created_at", `${today}T00:00:00.000Z`);

    if (ticketNumber) {
      query = query.eq("ticket_number", ticketNumber);
    } else if (phone && businessId) {
      query = query
        .eq("customer_phone", phone)
        .eq("business_id", businessId)
        .in("status", ["waiting", "serving"]);
    }

    const { data: entry, error } = await query.single();

    if (error || !entry) {
      return NextResponse.json(
        { error: "Queue entry not found" },
        { status: 404 }
      );
    }

    // Get number of people ahead
    const { count: peopleAhead } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("business_id", entry.business_id)
      .eq("status", "waiting")
      .lt("position", entry.position)
      .gte("created_at", `${today}T00:00:00.000Z`);

    // Get current serving
    const { data: currentServing } = await supabase
      .from("queue_entries")
      .select("id, ticket_number, customer_name")
      .eq("business_id", entry.business_id)
      .eq("status", "serving")
      .order("served_at", { ascending: true })
      .limit(1)
      .single();

    // Get waiting count
    const { count: waitingCount } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("business_id", entry.business_id)
      .eq("status", "waiting")
      .gte("created_at", `${today}T00:00:00.000Z`);

    // Calculate estimated wait time
    const { data: completedToday } = await supabase
      .from("queue_entries")
      .select("served_at, created_at")
      .eq("business_id", entry.business_id)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .not("served_at", "is", null)
      .limit(20);

    let estimatedWaitMinutes = (peopleAhead || 0) * 5; // Default 5 min per person

    if (completedToday && completedToday.length > 0) {
      const avgServiceTime =
        completedToday.reduce((sum, e) => {
          const serviceTime =
            new Date(e.served_at).getTime() - new Date(e.created_at).getTime();
          return sum + serviceTime;
        }, 0) /
        completedToday.length /
        60000;

      estimatedWaitMinutes = Math.round((peopleAhead || 0) * avgServiceTime);
    }

    // Extract business name from nested object
    const businessName = (entry.businesses as any)?.business_name || "Business";

    return NextResponse.json({
      data: {
        id: entry.id,
        ticket_number: entry.ticket_number,
        customer_name: entry.customer_name,
        customer_phone: entry.customer_phone,
        position: entry.position,
        status: entry.status,
        service_type: entry.service_type,
        created_at: entry.created_at,
        served_at: entry.served_at,
        business_id: entry.business_id,
        business_name: businessName,
        people_ahead: peopleAhead || 0,
        estimated_wait_minutes: estimatedWaitMinutes,
      },
      queue_info: {
        current_serving: currentServing?.id || null,
        current_serving_number: currentServing?.ticket_number || null,
        current_serving_name: currentServing?.customer_name || null,
        total_waiting: waitingCount || 0,
      },
    });
  } catch (err: any) {
    console.error("Queue status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
