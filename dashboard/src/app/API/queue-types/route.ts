import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Queue types are stored in the existing `services` table.
// `description` holds a JSON string with { color, max_capacity, is_queue_type: true }.
// `estimated_duration` maps to estimated_service_time.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function rowToQueueType(row: any) {
  let extra: any = {};
  try { extra = JSON.parse(row.description || "{}"); } catch {}
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    description: extra.label ?? "",
    color: extra.color ?? "#3B82F6",
    icon: "users",
    estimated_service_time: row.estimated_duration ?? 5,
    max_capacity: extra.max_capacity ?? 50,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET - Fetch all queue types for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");
    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .like("description", '%"is_queue_type":true%')
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: (data ?? []).map(rowToQueueType) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create a new queue type
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      name,
      description = "",
      color = "#3B82F6",
      estimated_service_time = 5,
      max_capacity = 50,
      is_active = true,
    } = body;

    if (!business_id || !name) {
      return NextResponse.json(
        { error: "Business ID and name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("services")
      .insert({
        business_id,
        name,
        description: JSON.stringify({ label: description, color, max_capacity, is_queue_type: true }),
        estimated_duration: estimated_service_time,
        is_active,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: rowToQueueType(data),
      message: "Queue type created successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
