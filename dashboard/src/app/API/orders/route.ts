import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch orders for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by date
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;
      query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
    }

    // Search by order number or customer name
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get order statistics
    const today = new Date().toISOString().split("T")[0];
    const { data: todayOrders } = await supabase
      .from("orders")
      .select("status, total_amount")
      .eq("business_id", businessId)
      .gte("created_at", `${today}T00:00:00.000Z`);

    const stats = {
      total: todayOrders?.length || 0,
      pending: todayOrders?.filter((o) => o.status === "pending").length || 0,
      processing: todayOrders?.filter((o) => o.status === "processing").length || 0,
      completed: todayOrders?.filter((o) => o.status === "completed").length || 0,
      cancelled: todayOrders?.filter((o) => o.status === "cancelled").length || 0,
      totalRevenue: todayOrders
        ?.filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    };

    return NextResponse.json({
      data,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error("Orders fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      customer_name,
      customer_phone,
      customer_email,
      items,
      notes,
      payment_method = "cash",
      queue_entry_id,
    } = body;

    if (!business_id || !customer_name || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Business ID, customer name, and items are required" },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Generate order number
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business_id)
      .gte("created_at", `${new Date().toISOString().split("T")[0]}T00:00:00.000Z`);

    const orderNumber = `ORD-${today}-${((count || 0) + 1).toString().padStart(4, "0")}`;

    // Create order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        business_id,
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email,
        items,
        notes,
        total_amount: totalAmount,
        payment_method,
        payment_status: "pending",
        status: "pending",
        queue_entry_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Order create error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: order,
      message: "Order created successfully",
    });
  } catch (err: any) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
