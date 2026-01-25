import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single order
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
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

// PATCH - Update order
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      status,
      payment_status,
      items,
      notes,
      customer_name,
      customer_phone,
    } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;

      // Update timestamps based on status
      if (status === "processing") {
        updateData.started_at = new Date().toISOString();
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
      if (payment_status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }
    }

    if (items) {
      updateData.items = items;
      // Recalculate total
      updateData.total_amount = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
    }

    if (notes !== undefined) updateData.notes = notes;
    if (customer_name) updateData.customer_name = customer_name;
    if (customer_phone !== undefined) updateData.customer_phone = customer_phone;

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: "Order updated successfully",
    });
  } catch (err: any) {
    console.error("Order update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Delete order
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if order can be deleted (only pending orders)
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", id)
      .single();

    if (order && order.status !== "pending" && order.status !== "cancelled") {
      return NextResponse.json(
        { error: "Only pending or cancelled orders can be deleted" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      console.error("Order delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Order deleted successfully",
    });
  } catch (err: any) {
    console.error("Order delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
