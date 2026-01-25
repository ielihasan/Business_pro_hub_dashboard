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
    const status = searchParams.get("status"); // waiting, serving, completed, cancelled
    const date = searchParams.get("date"); // Filter by date (YYYY-MM-DD)

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("queue_entries")
      .select(`
        *,
        customer:customers(id, full_name, email, phone)
      `)
      .eq("business_id", businessId)
      .order("position", { ascending: true });

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
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
      // If table doesn't exist, return empty data (will trigger demo mode on frontend)
      if (error.message?.includes("schema cache") || error.code === "42P01") {
        return NextResponse.json({
          data: [],
          stats: { total: 0, waiting: 0, serving: 0, completed: 0, cancelled: 0, avgWaitTime: 0 },
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get queue statistics
    const stats = {
      total: data?.length || 0,
      waiting: data?.filter((e) => e.status === "waiting").length || 0,
      serving: data?.filter((e) => e.status === "serving").length || 0,
      completed: data?.filter((e) => e.status === "completed").length || 0,
      cancelled: data?.filter((e) => e.status === "cancelled").length || 0,
    };

    // Calculate average wait time
    const completedEntries = data?.filter(
      (e) => e.status === "completed" && e.served_at && e.created_at
    );
    let avgWaitTime = 0;
    if (completedEntries && completedEntries.length > 0) {
      const totalWaitTime = completedEntries.reduce((sum, entry) => {
        const waitTime =
          new Date(entry.served_at).getTime() -
          new Date(entry.created_at).getTime();
        return sum + waitTime;
      }, 0);
      avgWaitTime = Math.round(totalWaitTime / completedEntries.length / 60000); // in minutes
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
      notes,
      priority = "normal",
    } = body;

    if (!business_id || !customer_name) {
      return NextResponse.json(
        { error: "Business ID and customer name are required" },
        { status: 400 }
      );
    }

    // Get the current max position for today
    const today = new Date().toISOString().split("T")[0];
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
        priority,
        position: nextPosition,
        ticket_number: ticketNumber,
        status: "waiting",
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
