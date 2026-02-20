import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get queue status for a customer by queue entry ID or phone
// The join-queue page calls this with ?ticket=<id> (the queue entry id)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // "ticket" param = the queue entry's `id` (UUID) stored in localStorage
    const entryId = searchParams.get("ticket");
    const phone = searchParams.get("phone");
    const businessId = searchParams.get("business_id");

    if (!entryId && !phone) {
      return NextResponse.json(
        { error: "Entry ID or phone is required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("queues")
      .select(`
        id,
        customer_name,
        customer_phone,
        position,
        status,
        service_type,
        created_at,
        started_at,
        business_id,
        customer_id
      `)
      .gte("created_at", `${today}T00:00:00.000Z`);

    if (entryId) {
      query = query.eq("id", entryId);
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

    // Get business name from admins table
    const { data: business } = await supabase
      .from("admins")
      .select("business_name")
      .eq("id", entry.business_id)
      .eq("role", "business_owner")
      .single();

    // Get number of people ahead (waiting, with lower position)
    const { count: peopleAhead } = await supabase
      .from("queues")
      .select("*", { count: "exact", head: true })
      .eq("business_id", entry.business_id)
      .eq("status", "waiting")
      .lt("position", entry.position)
      .gte("created_at", `${today}T00:00:00.000Z`);

    // Get current serving entry
    const { data: currentServing } = await supabase
      .from("queues")
      .select("id, position, customer_name")
      .eq("business_id", entry.business_id)
      .eq("status", "serving")
      .order("started_at", { ascending: true })
      .limit(1)
      .single();

    // Get waiting count
    const { count: waitingCount } = await supabase
      .from("queues")
      .select("*", { count: "exact", head: true })
      .eq("business_id", entry.business_id)
      .eq("status", "waiting")
      .gte("created_at", `${today}T00:00:00.000Z`);

    // Calculate estimated wait time using completed entries
    const { data: completedToday } = await supabase
      .from("queues")
      .select("started_at, created_at")
      .eq("business_id", entry.business_id)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .not("started_at", "is", null)
      .limit(20);

    let estimatedWaitMinutes = (peopleAhead || 0) * 5; // Default 5 min per person

    if (completedToday && completedToday.length > 0) {
      const avgServiceTime =
        completedToday.reduce((sum: number, e: any) => {
          const serviceTime =
            new Date(e.started_at).getTime() - new Date(e.created_at).getTime();
          return sum + serviceTime;
        }, 0) /
        completedToday.length /
        60000;

      estimatedWaitMinutes = Math.round((peopleAhead || 0) * avgServiceTime);
    }

    // Use position as the display number (padded)
    const displayNumber = String(entry.position).padStart(3, "0");
    const servingDisplayNumber = currentServing
      ? String(currentServing.position).padStart(3, "0")
      : null;

    return NextResponse.json({
      data: {
        id: entry.id,
        // Keep ticket_number compatible field for the join-queue page
        ticket_number: entry.id,
        customer_name: entry.customer_name,
        customer_phone: entry.customer_phone,
        position: entry.position,
        status: entry.status,
        service_type: entry.service_type,
        created_at: entry.created_at,
        started_at: entry.started_at,
        business_id: entry.business_id,
        business_name: business?.business_name || "Business",
        people_ahead: peopleAhead || 0,
        estimated_wait_minutes: estimatedWaitMinutes,
        display_number: displayNumber,
      },
      queue_info: {
        current_serving: currentServing?.id || null,
        current_serving_number: servingDisplayNumber,
        current_serving_name: currentServing?.customer_name || null,
        total_waiting: waitingCount || 0,
      },
    });
  } catch (err: any) {
    console.error("Queue status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
