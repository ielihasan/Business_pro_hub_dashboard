import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: Request) {
  try {
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

    // 🔐 Service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Delete from "User" table first
    const { error: tableError } = await supabaseAdmin
      .from("User")   // 👈 IMPORTANT
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
      console.log("Deleting auth user:", id);

      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(id);

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
