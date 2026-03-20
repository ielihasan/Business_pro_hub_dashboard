import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch current admin profile
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prefer business_owner row; fall back to admin row (handles users with both roles)
    const { data: rows } = await supabase
      .from("admins")
      .select("*")
      .eq("id", user.id);

    const admin = (rows ?? []).find((r) => r.role === "business_owner") ?? (rows ?? [])[0];

    if (!admin) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ data: admin });
  } catch (err: any) {
    console.error("Get profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update current admin profile
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, email, avatar_url, business_name, business_address, business_phone, business_description } = body;

    // Update Auth user if email changed
    if (email) {
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email }
      );

      if (updateAuthError) {
        console.error("Auth update error:", updateAuthError);
        return NextResponse.json(
          { error: updateAuthError.message },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (business_name !== undefined) updateData.business_name = business_name;
    if (business_address !== undefined) updateData.business_address = business_address;
    if (business_phone !== undefined) updateData.business_phone = business_phone;
    if (business_description !== undefined) updateData.business_description = business_description;

    // Determine which role row to update (prefer business_owner)
    const { data: existingRows } = await supabase.from("admins").select("role").eq("id", user.id);
    const targetRole = (existingRows ?? []).find((r) => r.role === "business_owner")?.role ?? "admin";

    // Update admins table for the correct role row
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admins")
      .update(updateData)
      .eq("id", user.id)
      .eq("role", targetRole)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: updatedAdmin,
      message: "Profile updated successfully",
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
