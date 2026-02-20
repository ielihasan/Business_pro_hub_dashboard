import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch queue entries for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const status = searchParams.get("status"); // waiting, serving, completed, cancelled, all
    const date = searchParams.get("date"); // Filter by date (YYYY-MM-DD)
    const queueTypeId = searchParams.get("queue_type_id"); // Filter by queue type (stored in service_type column)

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("queues")
      .select(`
        *,
        scanned_user:User(id, full_name, email, phone_number, avatar_url)
      `)
      .eq("business_id", businessId)
      .order("position", { ascending: true });

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by queue type (queue type ID is stored in the service_type column)
    if (queueTypeId && queueTypeId !== "all") {
      query = query.eq("service_type", queueTypeId);
    }

    // Filter by date
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
    } else {
      // Default: today's queue
      const today = new Date().toISOString().split("T")[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;
      query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Queue fetch error:", error);
      if (error.message?.includes("schema cache") || error.code === "42P01") {
        return NextResponse.json({
          data: [],
          stats: { total: 0, waiting: 0, serving: 0, completed: 0, cancelled: 0, avgWaitTime: 0 },
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get full stats for the business today (not filtered by queue type, to show totals)
    const today = new Date().toISOString().split("T")[0];
    const { data: allTodayData } = await supabase
      .from("queues")
      .select("status, started_at, created_at")
      .eq("business_id", businessId)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lte("created_at", `${today}T23:59:59.999Z`);

    // Calculate stats
    const statsSource = queueTypeId && queueTypeId !== "all" ? data : (allTodayData || []);
    const stats = {
      total: statsSource?.length || 0,
      waiting: statsSource?.filter((e) => e.status === "waiting").length || 0,
      serving: statsSource?.filter((e) => e.status === "serving").length || 0,
      completed: statsSource?.filter((e) => e.status === "completed").length || 0,
      cancelled: statsSource?.filter((e) => e.status === "cancelled").length || 0,
    };

    // Calculate average wait time using started_at and created_at
    const completedEntries = statsSource?.filter(
      (e) => e.status === "completed" && e.started_at && e.created_at
    );
    let avgWaitTime = 0;
    if (completedEntries && completedEntries.length > 0) {
      const totalWaitTime = completedEntries.reduce((sum: number, entry: any) => {
        const waitTime =
          new Date(entry.started_at).getTime() -
          new Date(entry.created_at).getTime();
        return sum + waitTime;
      }, 0);
      avgWaitTime = Math.round(totalWaitTime / completedEntries.length / 60000);
    }

    return NextResponse.json({
      data,
      stats: { ...stats, avgWaitTime },
    });
  } catch (err: any) {
    console.error("Queue fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Add customer to queue (for walk-ins added by business)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      customer_name,
      customer_phone,
      customer_email,
      service_type,
      queue_type_id, // optional: queue type ID
      notes,
      priority = "normal",
    } = body;

    if (!business_id || !customer_name) {
      return NextResponse.json(
        { error: "Business ID and customer name are required" },
        { status: 400 }
      );
    }

    // Get the current max position for today (scoped to queue_type if applicable)
    const today = new Date().toISOString().split("T")[0];
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

    // service_type stores the queue_type_id if provided, else free-text service type
    const serviceTypeValue = queue_type_id || service_type || null;

    // Create queue entry using existing queues table columns
    const { data: queueEntry, error } = await supabase
      .from("queues")
      .insert({
        business_id,
        customer_name,
        customer_phone,
        customer_email,
        service_type: serviceTypeValue,
        notes,
        priority,
        position: nextPosition,
        status: "waiting",
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Queue entry create error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: queueEntry,
      message: "Customer added to queue successfully",
    });
  } catch (err: any) {
    console.error("Queue entry create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
