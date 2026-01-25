import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch business hours for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Get regular weekly hours
    const { data: weeklyHours, error: weeklyError } = await supabase
      .from("business_hours")
      .select("*")
      .eq("business_id", businessId)
      .order("day_of_week", { ascending: true });

    if (weeklyError) {
      throw weeklyError;
    }

    // Get special hours (holidays, special dates)
    const { data: specialHours, error: specialError } = await supabase
      .from("special_hours")
      .select("*")
      .eq("business_id", businessId)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (specialError) {
      console.error("Special hours error:", specialError);
    }

    return NextResponse.json({
      data: {
        weekly_hours: weeklyHours || [],
        special_hours: specialHours || [],
      },
    });
  } catch (err: any) {
    console.error("Get business hours error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create or update business hours
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_id, weekly_hours, special_hours } = body;

    if (!business_id) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    // Upsert weekly hours
    if (weekly_hours && Array.isArray(weekly_hours)) {
      // Delete existing hours for this business
      await supabase
        .from("business_hours")
        .delete()
        .eq("business_id", business_id);

      // Insert new hours
      const hoursToInsert = weekly_hours.map((hour: any) => ({
        business_id,
        day_of_week: hour.day_of_week,
        is_open: hour.is_open,
        open_time: hour.open_time || null,
        close_time: hour.close_time || null,
        break_start: hour.break_start || null,
        break_end: hour.break_end || null,
      }));

      const { error: insertError } = await supabase
        .from("business_hours")
        .insert(hoursToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Handle special hours if provided
    if (special_hours && Array.isArray(special_hours)) {
      for (const special of special_hours) {
        if (special.id) {
          // Update existing
          await supabase
            .from("special_hours")
            .update({
              date: special.date,
              is_closed: special.is_closed,
              open_time: special.open_time,
              close_time: special.close_time,
              reason: special.reason,
            })
            .eq("id", special.id);
        } else {
          // Insert new
          await supabase.from("special_hours").insert({
            business_id,
            date: special.date,
            is_closed: special.is_closed,
            open_time: special.open_time,
            close_time: special.close_time,
            reason: special.reason,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Business hours updated successfully",
    });
  } catch (err: any) {
    console.error("Update business hours error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Remove special hours
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialHourId = searchParams.get("id");

    if (!specialHourId) {
      return NextResponse.json(
        { error: "Special hour ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("special_hours")
      .delete()
      .eq("id", specialHourId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Special hours deleted successfully",
    });
  } catch (err: any) {
    console.error("Delete special hours error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
