import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role) — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch app user profile by auth user id
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("User")
      .select("id, full_name, email, phone_number, avatar_url, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Create or update app user profile (upsert)
// Called by the mobile app after registration/login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, full_name, email, phone_number, avatar_url } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("User")
      .upsert(
        {
          id: user_id,
          full_name: full_name || null,
          email: email || null,
          phone_number: phone_number || null,
          avatar_url: avatar_url || null,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, message: "Profile saved successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update specific fields of app user profile
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { user_id, full_name, email, phone_number, avatar_url } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, message: "Profile updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
