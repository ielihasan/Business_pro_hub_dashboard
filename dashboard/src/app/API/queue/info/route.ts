import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /API/queue/info - Get queue information for a business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Get business info
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("business_name, queue_active")
      .eq("id", businessId)
      .single();

    if (businessError) {
      // Return default info if business not found (for demo purposes)
      return NextResponse.json({
        data: {
          business_name: "Demo Business",
          is_open: true,
          current_serving: null,
          current_serving_number: null,
          total_waiting: 0,
          avg_wait_time: 5,
        },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get current serving entry
    const { data: currentServing } = await supabase
      .from("queue_entries")
      .select("id, ticket_number, customer_name")
      .eq("business_id", businessId)
      .eq("status", "serving")
      .order("served_at", { ascending: true })
      .limit(1)
      .single();

    // Get waiting count
    const { count: waitingCount } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "waiting")
      .gte("created_at", today);

    // Get completed entries for average wait time calculation
    const { data: completedEntries } = await supabase
      .from("queue_entries")
      .select("created_at, served_at")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .not("served_at", "is", null)
      .gte("created_at", today)
      .limit(20);

    // Calculate average wait time
    let avgWaitTime = 5; // Default 5 minutes
    if (completedEntries && completedEntries.length > 0) {
      const totalWaitMinutes = completedEntries.reduce((sum, entry) => {
        if (entry.served_at && entry.created_at) {
          const waitMs = new Date(entry.served_at).getTime() - new Date(entry.created_at).getTime();
          return sum + waitMs / 60000;
        }
        return sum;
      }, 0);
      avgWaitTime = Math.round(totalWaitMinutes / completedEntries.length) || 5;
    }

    return NextResponse.json({
      data: {
        business_name: business.business_name,
        is_open: business.queue_active !== false,
        current_serving: currentServing?.id || null,
        current_serving_number: currentServing?.ticket_number || null,
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
