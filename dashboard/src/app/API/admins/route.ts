import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all admins with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("admins")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply role filter (only show admins, not business_owners)
    if (role) {
      query = query.eq("role", role);
    } else {
      // By default, show only admin role users
      query = query.eq("role", "admin");
    }

    // Apply status filter
    if (status === "approved") {
      query = query.eq("is_approved", true);
    } else if (status === "pending") {
      query = query.eq("is_approved", false);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Fetch admins error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error("GET admins error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
