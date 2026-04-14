import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

export async function DELETE(req: Request) {
  try {
    const authz = await requireApiRole(req, ["admin"]);
    if (!authz.ok) return authz.response;

    const body = await req.json();
    let ids: string[] = [];

    if (body.id) ids = [body.id];
    else if (Array.isArray(body.ids)) ids = body.ids;

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "User ID(s) required" },
        { status: 400 }
      );
    }

    // 1️⃣ Delete from "User" table first
    const { error: tableError } = await authz.supabaseAdmin
      .from("users")
      .delete()
      .in("id", ids);

    if (tableError) {
      console.error("User table delete error:", tableError);
      return NextResponse.json(
        { error: tableError.message },
        { status: 400 }
      );
    }

    // 2️⃣ Delete from Auth
    for (const id of ids) {
      const { error: authError } =
        await authz.supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        console.error("Auth delete error:", authError);
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      message: "User(s) deleted successfully",
    });

  } catch (err: any) {
    console.error("Delete API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
