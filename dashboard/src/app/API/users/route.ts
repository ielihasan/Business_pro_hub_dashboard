// src/app/api/users/update/route.ts
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

    // 🔐 Supabase Admin client using SERVICE ROLE KEY
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Update Auth user info (email only for now)
    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email,
      });

      if (authError) {
        console.error("Auth update error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    }

    // 2️⃣ Prepare update object for your table
    const updateData: Record<string, any> = {};
    if (username) updateData.username = username;
    if (full_name) updateData.full_name = full_name;
    if (phone_no) updateData.phone_no = phone_no;
    if (status) updateData.status = status; // Remove this if "status" column does not exist

    // 3️⃣ Update the table (change "profiles" to your actual table if needed)
    if (Object.keys(updateData).length > 0) {
      const { error: dbError } = await supabaseAdmin
        .from("profiles") // ✅ Replace with actual table name if different
        .update(updateData)
        .eq("id", id);

      if (dbError) {
        console.error("Database update error:", dbError);
        return NextResponse.json({ error: dbError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ message: "User updated successfully" });
  } catch (err: any) {
    console.error("Update API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
