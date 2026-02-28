import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all approved businesses with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const businessType = searchParams.get("business_type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("businesses")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("approved_at", { ascending: false });

    // Apply business type filter
    if (businessType) {
      query = query.eq("business_type", businessType);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Fetch businesses error:", error);
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
    console.error("GET businesses error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
