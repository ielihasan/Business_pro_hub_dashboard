import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

export async function PATCH(req: Request) {
  try {
    const authz = await requireApiRole(req, ["admin"]);
    if (!authz.ok) return authz.response;

    const body = await req.json();
    const { id, full_name, email, password, is_approved } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Verify admin exists
    const { data: existingAdmin, error: fetchError } = await authz.supabaseAdmin
      .from("admins")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingAdmin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Update Auth user if email or password changed
    const authUpdates: Record<string, any> = {};
    if (email && email !== existingAdmin.email) {
      authUpdates.email = email;
    }
    if (password) {
      authUpdates.password = password;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await authz.supabaseAdmin.auth.admin.updateUserById(
        id,
        authUpdates
      );

      if (authError) {
        console.error("Auth update error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // Prepare update object for admins table
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (is_approved !== undefined) {
      updateData.is_approved = is_approved;
      if (is_approved) {
        updateData.approved_at = new Date().toISOString();
      }
    }

    // Update admins table
    const { data: updatedAdmin, error: updateError } = await authz.supabaseAdmin
      .from("admins")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Admin update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: updatedAdmin,
      message: "Admin updated successfully",
    });
  } catch (err: any) {
    console.error("Update admin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
