import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single queue entry
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("queues")
      .select(`
        *,
        scanned_user:User(id, full_name, email, phone_number, avatar_url)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update queue entry status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, service_type, priority } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;

      // Update timestamps based on status
      // queues table uses: called_at, started_at, completed_at, cancelled_at
      if (status === "serving") {
        updateData.started_at = new Date().toISOString();
        updateData.called_at = new Date().toISOString();
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (service_type !== undefined) updateData.service_type = service_type;
    if (priority !== undefined) updateData.priority = priority;

    const { data, error } = await supabase
      .from("queues")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Queue update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: "Queue entry updated successfully",
    });
  } catch (err: any) {
    console.error("Queue update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Remove queue entry
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("queues")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Queue delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Queue entry removed successfully",
    });
  } catch (err: any) {
    console.error("Queue delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
