import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Available subscription plans
const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    currency: "PKR",
    interval: "month",
    features: [
      "Up to 50 queue entries/month",
      "Basic queue management",
      "QR code generation",
      "Email support",
      "1 staff member",
      "Up to 100 customers",
    ],
    limitations: {
      queue_entries: 50,
      staff_members: 1,
      customers: 100,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small businesses",
    price: 2999,
    currency: "PKR",
    interval: "month",
    features: [
      "Up to 500 queue entries/month",
      "Advanced queue management",
      "QR code generation",
      "Priority email support",
      "Basic analytics",
      "Up to 3 staff members",
      "Up to 500 customers",
    ],
    limitations: {
      queue_entries: 500,
      staff_members: 3,
      customers: 500,
    },
    popular: true,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses",
    price: 5999,
    currency: "PKR",
    interval: "month",
    features: [
      "Unlimited queue entries",
      "Advanced queue management",
      "QR code generation",
      "24/7 priority support",
      "Advanced analytics & reports",
      "Up to 10 staff members",
      "Up to 2,000 customers",
      "SMS notifications",
      "Custom branding",
    ],
    limitations: {
      queue_entries: -1, // unlimited
      staff_members: 10,
      customers: 2000,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 14999,
    currency: "PKR",
    interval: "month",
    features: [
      "Everything in Professional",
      "Unlimited staff members",
      "Unlimited customers",
      "Dedicated account manager",
      "Custom integrations",
      "White-label solution",
      "SLA guarantee",
      "On-premise option",
      "API access",
    ],
    limitations: {
      queue_entries: -1,
      staff_members: -1,
      customers: -1,
    },
  },
];

// GET - Fetch subscription info and payment history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const type = searchParams.get("type"); // 'plans', 'subscription', 'payments'

    if (type === "plans") {
      // Return all available plans
      return NextResponse.json({ data: PLANS });
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    if (type === "subscription") {
      // Get current subscription from subscriptions table
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "active")
        .single();

      // Also get from admins table as fallback
      const { data: adminData } = await supabase
        .from("admins")
        .select("subscription_plan, subscription_status, subscription_expires_at")
        .eq("id", businessId)
        .eq("role", "business_owner")
        .single();

      const planId = subscription?.plan_id || adminData?.subscription_plan || "free";
      const currentPlan = PLANS.find((p) => p.id === planId) || PLANS[0];

      return NextResponse.json({
        data: {
          subscription: subscription || {
            plan_id: planId,
            status: adminData?.subscription_status || "active",
            current_period_start: new Date().toISOString(),
            current_period_end: adminData?.subscription_expires_at || null,
          },
          plan: currentPlan,
        },
      });
    }

    if (type === "payments") {
      // Get payment history
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error && error.code !== "42P01") {
        // Ignore table not exist error
        throw error;
      }

      return NextResponse.json({ data: payments || [] });
    }

    // Default: return everything
    const [subscriptionRes, paymentsRes, adminRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "active")
        .single(),
      supabase
        .from("payments")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("admins")
        .select("subscription_plan, subscription_status, subscription_expires_at")
        .eq("id", businessId)
        .eq("role", "business_owner")
        .single(),
    ]);

    // Determine current plan - prioritize subscriptions table, fallback to admins
    const planId =
      subscriptionRes.data?.plan_id ||
      adminRes.data?.subscription_plan ||
      "free";
    const currentPlan = PLANS.find((p) => p.id === planId) || PLANS[0];

    return NextResponse.json({
      data: {
        plans: PLANS,
        subscription: subscriptionRes.data || {
          plan_id: planId,
          status: adminRes.data?.subscription_status || "active",
          current_period_start: new Date().toISOString(),
          current_period_end: adminRes.data?.subscription_expires_at || null,
        },
        current_plan: currentPlan,
        payments: paymentsRes.data || [],
      },
    });
  } catch (err: any) {
    console.error("Pricing API error:", err);
    // Return mock data structure on error
    return NextResponse.json({
      data: {
        plans: PLANS,
        subscription: {
          plan_id: "free",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: null,
        },
        current_plan: PLANS[0],
        payments: [],
      },
    });
  }
}

// POST - Create or update subscription
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_id, plan_id, payment_method, payment_details } = body;

    if (!business_id || !plan_id) {
      return NextResponse.json(
        { error: "Business ID and Plan ID are required" },
        { status: 400 }
      );
    }

    const plan = PLANS.find((p) => p.id === plan_id);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Try to work with subscriptions table
    let subscriptionUpdated = false;
    try {
      // Check for existing subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("business_id", business_id)
        .eq("status", "active")
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan_id,
            updated_at: now.toISOString(),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", existingSub.id);

        if (!updateError) subscriptionUpdated = true;
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            business_id,
            plan_id,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          });

        if (!insertError) subscriptionUpdated = true;
      }
    } catch (e) {
      // subscriptions table unavailable — fall back to admins table
    }

    // Always update admins table as the source of truth
    const { error: adminUpdateError } = await supabase
      .from("admins")
      .update({
        subscription_plan: plan_id,
        subscription_status: "active",
        subscription_expires_at: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", business_id)
      .eq("role", "business_owner");

    if (adminUpdateError) {
      console.error("Admin update error:", adminUpdateError);
    }

    // Record payment if not free plan
    if (plan.price > 0) {
      try {
        const { error: paymentError } = await supabase.from("payments").insert({
          business_id,
          amount: plan.price,
          currency: plan.currency,
          status: "completed",
          payment_method: payment_method || "card",
          description: `${plan.name} Plan - Monthly Subscription`,
          plan_id,
          transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        });

        if (paymentError) {
          console.error("Payment record error:", paymentError);
        }
      } catch (e) {
        // payments table unavailable — skip payment record
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      plan,
      subscription: {
        plan_id,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Subscription error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Cancel subscription
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Try to update subscriptions table
    try {
      await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("business_id", businessId)
        .eq("status", "active");
    } catch (e) {
      // subscriptions table unavailable — fall back to admins table
    }

    // Always update admins table
    const { error: adminError } = await supabase
      .from("admins")
      .update({
        subscription_plan: "free",
        subscription_status: "active",
        subscription_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId)
      .eq("role", "business_owner");

    if (adminError) {
      console.error("Admin update error:", adminError);
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. You are now on the Free plan.",
    });
  } catch (err: any) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
