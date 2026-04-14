import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

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
        { error: "Business ID(s) required" },
        { status: 400 },
      );
    }

    // Verify all IDs are business_owners (not admins)
    const { data: businessesToDelete } = await authz.supabaseAdmin
      .from("admins")
      .select("id, role, business_name")
      .in("id", ids);

    if (businessesToDelete) {
      const nonBusinessOwners = businessesToDelete.filter(
        (b) => b.role !== "business_owner",
      );
      if (nonBusinessOwners.length > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete non-business accounts through this endpoint",
          },
          { status: 403 },
        );
      }
    }

    // Delete from businesses table first (queues FK cascades automatically)
    const { error: bizTableError } = await authz.supabaseAdmin
      .from("businesses")
      .delete()
      .in("id", ids);

    if (bizTableError) {
      console.error("Businesses table delete error:", bizTableError);
      return NextResponse.json(
        { error: bizTableError.message },
        { status: 400 },
      );
    }

    // Delete from admins table
    const { error: tableError } = await authz.supabaseAdmin
      .from("admins")
      .delete()
      .in("id", ids);

    if (tableError) {
      console.error("Admins table delete error:", tableError);
      // Non-fatal: businesses row already deleted, continue to delete auth user
    }

    // Delete from Auth
    const deleteErrors: string[] = [];
    for (const id of ids) {
      const { error: authError } =
        await authz.supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        console.error(`Auth delete error for ${id}:`, authError);
        deleteErrors.push(
          `Failed to delete auth user ${id}: ${authError.message}`,
        );
      }
    }

    if (deleteErrors.length > 0) {
      return NextResponse.json(
        {
          message: "Business(es) partially deleted",
          warnings: deleteErrors,
        },
        { status: 207 },
      );
    }

    return NextResponse.json({
      message: `${ids.length} business(es) deleted successfully`,
    });
  } catch (err: any) {
    console.error("Delete business error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
