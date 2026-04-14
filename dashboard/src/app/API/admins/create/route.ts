import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

export async function POST(req: Request) {
  try {
    const authz = await requireApiRole(req, ["admin"]);
    if (!authz.ok) return authz.response;

    const { full_name, email, password } = await req.json();

    // Validation
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await authz.supabaseAdmin
      .from("admins")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 400 }
      );
    }

    // Create Auth User
    const { data: authData, error: authError } =
      await authz.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: "admin" },
      });

    if (authError) {
      // Handle existing auth user
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "A user with this email already exists in the system" },
          { status: 400 }
        );
      }
      console.error("Auth create error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create admin record
    const { data: adminData, error: adminError } = await authz.supabaseAdmin
      .from("admins")
      .insert({
        id: userId,
        full_name,
        email,
        role: "admin",
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (adminError) {
      // Rollback: delete auth user if admin record creation fails
      await authz.supabaseAdmin.auth.admin.deleteUser(userId);
      console.error("Admin insert error:", adminError);
      return NextResponse.json({ error: adminError.message }, { status: 400 });
    }

    return NextResponse.json(
      { data: adminData, message: "Admin created successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create admin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
