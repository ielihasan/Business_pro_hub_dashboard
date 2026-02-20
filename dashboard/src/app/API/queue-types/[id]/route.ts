import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Queue types are stored in the existing `services` table.
// `description` holds a JSON string with { color, max_capacity, is_queue_type: true }.

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

// PATCH - Update a queue type
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description = "",
      color = "#3B82F6",
      estimated_service_time = 5,
      max_capacity = 50,
      is_active,
    } = body;

    const { data, error } = await supabase
      .from("services")
      .update({
        ...(name !== undefined && { name }),
        description: JSON.stringify({ label: description, color, max_capacity, is_queue_type: true }),
        estimated_duration: estimated_service_time,
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: rowToQueueType(data),
      message: "Queue type updated successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete a queue type
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Queue type deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
