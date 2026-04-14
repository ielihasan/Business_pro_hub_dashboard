import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

export async function PATCH(req: Request) {
  try {
    const authz = await requireApiRole(req, ["admin"]);
    if (!authz.ok) return authz.response;

    const body = await req.json();
    const { id, username, full_name, email, phone_no, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Update Auth user (email only)
    if (email) {
      const { error: authError } =
        await authz.supabaseAdmin.auth.admin.updateUserById(id, {
          email,
        });

      if (authError) {
        console.error("Auth update error:", authError);
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }

    // 2️⃣ Prepare update object for "User" table
    const updateData: Record<string, any> = {};

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone_no !== undefined) updateData.phone_number = phone_no;
    //if (status !== undefined) updateData.status = status;

    // 3️⃣ Update "User" table
    if (Object.keys(updateData).length > 0) {
      const { error: dbError } = await authz.supabaseAdmin
        .from('users')
        .update(updateData)
        .eq("id", id);

      if (dbError) {
        console.error("User table update error:", dbError);
        return NextResponse.json(
          { error: dbError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      message: "User updated successfully",
    });

  } catch (err: any) {
    console.error("Update API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
