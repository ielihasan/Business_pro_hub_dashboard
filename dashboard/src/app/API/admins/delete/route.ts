import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default admin email that cannot be deleted
const DEFAULT_ADMIN_EMAIL = "admin@test.com";

export async function DELETE(req: Request) {
  try {
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
    const { data: adminsToDelete } = await supabase
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
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user && ids.includes(user.id)) {
        return NextResponse.json(
          { error: "You cannot delete your own admin account" },
          { status: 400 }
        );
      }
    }

    // Delete from admins table first
    const { error: tableError } = await supabase
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
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

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
