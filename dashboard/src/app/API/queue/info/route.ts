import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /API/queue/info - Get queue information for a business (used by join-queue page)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const queueTypeId = searchParams.get("queue_type_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Get business info from admins table (business_owner role)
    const { data: business, error: businessError } = await supabase
      .from("admins")
      .select("id, business_name")
      .eq("id", businessId)
      .eq("role", "business_owner")
      .single();

    if (businessError || !business) {
      // Return default info if business not found
      return NextResponse.json({
        data: {
          business_name: "Business",
          is_open: true,
          current_serving: null,
          current_serving_number: null,
          total_waiting: 0,
          avg_wait_time: 5,
        },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Build queries for the queues table
    // Filter by queue_type_id if provided — stored in service_type field as the queue type ID
    let servingQuery = supabase
      .from("queues")
      .select("id, position, customer_name, service_type")
      .eq("business_id", businessId)
      .eq("status", "serving")
      .order("started_at", { ascending: true })
      .limit(1);

    let waitingQuery = supabase
      .from("queues")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "waiting")
      .gte("created_at", `${today}T00:00:00.000Z`);

    let completedQuery = supabase
      .from("queues")
      .select("created_at, started_at")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .not("started_at", "is", null)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .limit(20);

    // Apply queue_type_id filter if provided (stored in service_type column)
    if (queueTypeId && queueTypeId !== "default" && queueTypeId !== "all") {
      servingQuery = servingQuery.eq("service_type", queueTypeId);
      waitingQuery = waitingQuery.eq("service_type", queueTypeId);
      completedQuery = completedQuery.eq("service_type", queueTypeId);
    }

    // Get current serving entry
    const { data: currentServing } = await servingQuery.single();

    // Get waiting count
    const { count: waitingCount } = await waitingQuery;

    // Get completed entries for average wait time calculation
    const { data: completedEntries } = await completedQuery;

    // Calculate average wait time
    let avgWaitTime = 5; // Default 5 minutes
    if (completedEntries && completedEntries.length > 0) {
      const totalWaitMinutes = completedEntries.reduce((sum: number, entry: any) => {
        if (entry.started_at && entry.created_at) {
          const waitMs = new Date(entry.started_at).getTime() - new Date(entry.created_at).getTime();
          return sum + waitMs / 60000;
        }
        return sum;
      }, 0);
      avgWaitTime = Math.round(totalWaitMinutes / completedEntries.length) || 5;
    }

    // Display number uses position
    const servingDisplayNumber = currentServing
      ? String(currentServing.position).padStart(3, "0")
      : null;

    return NextResponse.json({
      data: {
        business_name: business.business_name,
        is_open: true, // Always open (no queue_active flag in admins table)
        current_serving: currentServing?.id || null,
        current_serving_number: servingDisplayNumber,
        current_serving_name: currentServing?.customer_name || null,
        total_waiting: waitingCount || 0,
        avg_wait_time: avgWaitTime,
      },
    });
  } catch (err: any) {
    console.error("Queue info error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
