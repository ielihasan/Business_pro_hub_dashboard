import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, username, full_name, email, phone_no, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 🔐 Supabase Admin client (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Update Auth user (email only)
    if (email) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(id, {
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

    if (username !== undefined) updateData.username = username;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone_no !== undefined) updateData.phone_no = phone_no;
    //if (status !== undefined) updateData.status = status;

    // 3️⃣ Update "User" table
    if (Object.keys(updateData).length > 0) {
      const { error: dbError } = await supabaseAdmin
        .from('User') // 👈 IMPORTANT
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
