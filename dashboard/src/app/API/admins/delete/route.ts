import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

// Default admin email that cannot be deleted
const DEFAULT_ADMIN_EMAIL = "admin@test.com";

export async function DELETE(req: Request) {
  try {
    const authz = await requireApiRole(req, ["admin"]);
    if (!authz.ok) return authz.response;

    const body = await req.json();
    let ids: string[] = [];

    // Support single ID or array of IDs
    if (body.id) ids = [body.id];
    else if (Array.isArray(body.ids)) ids = body.ids;

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Admin ID(s) required" },
        { status: 400 }
      );
    }

    // Check if trying to delete the default admin
    const { data: adminsToDelete } = await authz.supabaseAdmin
      .from("admins")
      .select("id, email")
      .in("id", ids);

    if (adminsToDelete) {
      const defaultAdmin = adminsToDelete.find(
        (admin) => admin.email === DEFAULT_ADMIN_EMAIL
      );
      if (defaultAdmin) {
        return NextResponse.json(
          { error: "Cannot delete the default system admin (admin@test.com)" },
          { status: 403 }
        );
      }
    }

    // Get current user to prevent self-deletion
    if (ids.includes(authz.userId)) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    // Delete from admins table first
    const { error: tableError } = await authz.supabaseAdmin
      .from("admins")
      .delete()
      .in("id", ids);

    if (tableError) {
      console.error("Admin table delete error:", tableError);
      return NextResponse.json({ error: tableError.message }, { status: 400 });
    }

    // Delete from Auth
    const deleteErrors: string[] = [];
    for (const id of ids) {
      const { error: authError } = await authz.supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        console.error(`Auth delete error for ${id}:`, authError);
        deleteErrors.push(`Failed to delete auth user ${id}: ${authError.message}`);
      }
    }

    if (deleteErrors.length > 0) {
      return NextResponse.json(
        {
          message: "Admin(s) partially deleted",
          warnings: deleteErrors,
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      message: `${ids.length} admin(s) deleted successfully`,
    });
  } catch (err: any) {
    console.error("Delete admin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
