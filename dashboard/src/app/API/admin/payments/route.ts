import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Plan details for reference
const PLANS: Record<string, { name: string; price: number }> = {
  free: { name: "Free", price: 0 },
  starter: { name: "Starter", price: 2999 },
  professional: { name: "Professional", price: 5999 },
  enterprise: { name: "Enterprise", price: 14999 },
};

// GET - Fetch all payments with business details for admin
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const plan = searchParams.get("plan") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || ""; // 'stats', 'payments', 'subscriptions'

    // Get overall stats
    if (type === "stats") {
      // Total revenue from completed payments
      const { data: completedPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed");

      const totalRevenue = completedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Total transactions count
      const { count: totalTransactions } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      // Successful payments count
      const { count: successfulPayments } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Pending payments count
      const { count: pendingPayments } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Failed payments count
      const { count: failedPayments } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

      // Get subscription distribution
      const { data: subscriptions } = await supabase
        .from("admins")
        .select("subscription_plan")
        .eq("role", "business_owner");

      const planDistribution: Record<string, number> = {
        free: 0,
        starter: 0,
        professional: 0,
        enterprise: 0,
      };

      subscriptions?.forEach((s) => {
        const plan = s.subscription_plan || "free";
        if (planDistribution[plan] !== undefined) {
          planDistribution[plan]++;
        }
      });

      // Monthly revenue data (last 6 months)
      const monthlyRevenue: { month: string; revenue: number; transactions: number }[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const { data: monthPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("created_at", date.toISOString())
          .lte("created_at", endDate.toISOString());

        monthlyRevenue.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          transactions: monthPayments?.length || 0,
        });
      }

      return NextResponse.json({
        data: {
          totalRevenue,
          totalTransactions: totalTransactions || 0,
          successfulPayments: successfulPayments || 0,
          pendingPayments: pendingPayments || 0,
          failedPayments: failedPayments || 0,
          planDistribution,
          monthlyRevenue,
        },
      });
    }

    // Get subscription details for all businesses
    if (type === "subscriptions") {
      const { data: businesses, error } = await supabase
        .from("admins")
        .select("id, full_name, email, business_name, subscription_plan, subscription_status, subscription_expires_at, created_at")
        .eq("role", "business_owner")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        data: businesses?.map((b) => ({
          ...b,
          plan_details: PLANS[b.subscription_plan || "free"] || PLANS.free,
        })) || [],
      });
    }

    // Default: Get all payments with business details
    let query = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (plan) {
      query = query.eq("plan_id", plan);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: payments, error, count } = await supabase
      .from("payments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get business details for each payment
    const businessIds = [...new Set(payments?.map((p) => p.business_id) || [])];

    const { data: businesses } = await supabase
      .from("admins")
      .select("id, full_name, email, business_name")
      .eq("role", "business_owner")
      .in("id", businessIds);

    const businessMap = new Map(businesses?.map((b) => [b.id, b]) || []);

    // Enrich payments with business details
    const enrichedPayments = payments?.map((payment) => {
      const business = businessMap.get(payment.business_id);
      return {
        ...payment,
        business_name: business?.business_name || "Unknown Business",
        business_email: business?.email || "",
        owner_name: business?.full_name || "",
        plan_name: PLANS[payment.plan_id]?.name || payment.plan_id,
      };
    });

    // Apply search filter on enriched data
    let filteredPayments = enrichedPayments || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(
        (p) =>
          p.business_name?.toLowerCase().includes(searchLower) ||
          p.business_email?.toLowerCase().includes(searchLower) ||
          p.transaction_id?.toLowerCase().includes(searchLower) ||
          p.owner_name?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      data: filteredPayments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error("Admin payments API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
