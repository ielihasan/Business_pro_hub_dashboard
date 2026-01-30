import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all queue types for a business
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

    const { data, error } = await supabase
      .from("queue_types")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (error) {
      // If table doesn't exist, return default queue types
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({
          data: [
            {
              id: "default",
              business_id: businessId,
              name: "General Queue",
              description: "Default queue for all services",
              color: "#3B82F6",
              icon: "users",
              estimated_service_time: 5,
              is_active: true,
              max_capacity: 50,
            },
          ],
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If no queue types exist, return a default one
    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [
          {
            id: "default",
            business_id: businessId,
            name: "General Queue",
            description: "Default queue for all services",
            color: "#3B82F6",
            icon: "users",
            estimated_service_time: 5,
            is_active: true,
            max_capacity: 50,
          },
        ],
      });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Queue types fetch error:", err);
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
      description,
      color = "#3B82F6",
      icon = "users",
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
      .from("queue_types")
      .insert({
        business_id,
        name,
        description,
        color,
        icon,
        estimated_service_time,
        max_capacity,
        is_active,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Queue type create error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: "Queue type created successfully",
    });
  } catch (err: any) {
    console.error("Queue type create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
