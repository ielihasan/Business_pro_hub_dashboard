import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    let ids: string[] = [];

    // Support single ID or array of IDs
    if (body.id) ids = [body.id];
    else if (Array.isArray(body.ids)) ids = body.ids;

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Business ID(s) required" },
        { status: 400 }
      );
    }

    // Verify all IDs are business_owners (not admins)
    const { data: businessesToDelete } = await supabase
      .from("admins")
      .select("id, role, business_name")
      .in("id", ids);

    if (businessesToDelete) {
      const nonBusinessOwners = businessesToDelete.filter(
        (b) => b.role !== "business_owner"
      );
      if (nonBusinessOwners.length > 0) {
        return NextResponse.json(
          { error: "Cannot delete non-business accounts through this endpoint" },
          { status: 403 }
        );
      }
    }

    // Delete from admins table first
    const { error: tableError } = await supabase
      .from("admins")
      .delete()
      .in("id", ids);

    if (tableError) {
      console.error("Business table delete error:", tableError);
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
          message: "Business(es) partially deleted",
          warnings: deleteErrors,
        },
        { status: 207 }
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
