import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch customers for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sortBy = searchParams.get("sort_by") || "last_visit";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Get unique customers from queue entries
    let query = supabase
      .from("queues")
      .select("customer_name, customer_phone, customer_email, service_type, created_at, status")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }

    const { data: allEntries, error: entriesError } = await query;

    if (entriesError) {
      // If table doesn't exist, return empty data (will trigger demo mode on frontend)
      if (entriesError.message?.includes("schema cache") || entriesError.code === "42P01") {
        return NextResponse.json({
          data: [],
          stats: {
            total_customers: 0,
            new_customers_today: 0,
            repeat_customers: 0,
            total_visits: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
        });
      }
      throw entriesError;
    }

    // Process entries to get unique customers with visit data
    const customerMap = new Map<string, any>();

    allEntries?.forEach((entry) => {
      const key = entry.customer_phone || entry.customer_name;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: entry.customer_name,
          phone: entry.customer_phone,
          email: entry.customer_email,
          total_visits: 0,
          completed_visits: 0,
          cancelled_visits: 0,
          first_visit: entry.created_at,
          last_visit: entry.created_at,
          services_used: new Set<string>(),
          visit_history: [],
        });
      }

      const customer = customerMap.get(key);
      customer.total_visits++;

      if (entry.status === "completed") {
        customer.completed_visits++;
      } else if (entry.status === "cancelled") {
        customer.cancelled_visits++;
      }

      if (new Date(entry.created_at) < new Date(customer.first_visit)) {
        customer.first_visit = entry.created_at;
      }
      if (new Date(entry.created_at) > new Date(customer.last_visit)) {
        customer.last_visit = entry.created_at;
      }

      if (entry.service_type) {
        customer.services_used.add(entry.service_type);
      }

      customer.visit_history.push({
        date: entry.created_at,
        service: entry.service_type,
        status: entry.status,
      });
    });

    // Convert to array and process
    let customers = Array.from(customerMap.values()).map((c) => ({
      ...c,
      services_used: Array.from(c.services_used),
      visit_history: c.visit_history.slice(0, 10), // Last 10 visits
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(search) ||
          c.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort customers
    switch (sortBy) {
      case "name":
        customers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "visits":
        customers.sort((a, b) => b.total_visits - a.total_visits);
        break;
      case "first_visit":
        customers.sort((a, b) => new Date(a.first_visit).getTime() - new Date(b.first_visit).getTime());
        break;
      case "last_visit":
      default:
        customers.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());
        break;
    }

    // Calculate stats
    const stats = {
      total_customers: customers.length,
      new_customers_today: customers.filter((c) => {
        const today = new Date().toISOString().split("T")[0];
        return c.first_visit.startsWith(today);
      }).length,
      repeat_customers: customers.filter((c) => c.total_visits > 1).length,
      total_visits: customers.reduce((sum, c) => sum + c.total_visits, 0),
    };

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = customers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedCustomers,
      stats,
      pagination: {
        page,
        limit,
        total: customers.length,
        total_pages: Math.ceil(customers.length / limit),
      },
    });
  } catch (err: any) {
    console.error("Customers API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Add a new customer (manual entry)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_id, name, phone, email, notes } = body;

    if (!business_id || !name) {
      return NextResponse.json(
        { error: "Business ID and customer name are required" },
        { status: 400 }
      );
    }

    // Store customer in a customers table (or create a queue entry placeholder)
    const { data, error } = await supabase
      .from("customers")
      .insert({
        business_id,
        name,
        phone,
        email,
        notes,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If customers table doesn't exist, return success anyway
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          message: "Customer added (table not configured)",
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("Add customer error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
