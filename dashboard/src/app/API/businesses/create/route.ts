import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

export async function POST(req: Request) {
  try {
    const authz = await requireApiRole(req, ["admin"]);
    if (!authz.ok) return authz.response;

    const {
      full_name,
      email,
      password,
      business_name,
      business_type,
      business_address,
      business_phone,
      business_description,
      subscription_plan,
    } = await req.json();

    // Validation
    if (!full_name || !email || !password || !business_name || !business_type) {
      return NextResponse.json(
        { error: "Full name, email, password, business name, and business type are required" },
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

    // Check if business already exists
    const { data: existingBusiness } = await authz.supabaseAdmin
      .from("admins")
      .select("id")
      .eq("email", email)
      .single();

    if (existingBusiness) {
      return NextResponse.json(
        { error: "A business with this email already exists" },
        { status: 400 }
      );
    }

    // Create Auth User
    const { data: authData, error: authError } =
      await authz.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: "business_owner" },
      });

    if (authError) {
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

    const now = new Date().toISOString();

    // Create role record in admins table (auth/role management)
    const { error: adminError } = await authz.supabaseAdmin
      .from("admins")
      .insert({
        id: userId,
        full_name,
        email,
        role: "business_owner",
        business_name,
        business_type,
        business_address: business_address || null,
        business_phone: business_phone || null,
        business_description: business_description || null,
        subscription_plan: subscription_plan || "free",
        is_approved: true,
        approved_at: now,
      });

    if (adminError) {
      await authz.supabaseAdmin.auth.admin.deleteUser(userId);
      console.error("Admins insert error:", adminError);
      return NextResponse.json({ error: adminError.message }, { status: 400 });
    }

    // Create canonical business record — FK target for queues, services, subscriptions
    const { data: businessData, error: businessError } = await authz.supabaseAdmin
      .from("businesses")
      .insert({
        id: userId,
        full_name,
        email,
        business_name,
        business_type,
        business_address: business_address || null,
        business_phone: business_phone || null,
        business_description: business_description || null,
        subscription_plan: subscription_plan || "free",
        is_active: true,
        approved_at: now,
      })
      .select()
      .single();

    if (businessError) {
      // Rollback admins row and auth user
      await authz.supabaseAdmin.from("admins").delete().eq("id", userId).eq("role", "business_owner");
      await authz.supabaseAdmin.auth.admin.deleteUser(userId);
      console.error("Businesses insert error:", businessError);
      return NextResponse.json({ error: businessError.message }, { status: 400 });
    }

    return NextResponse.json(
      { data: businessData, message: "Business created successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Create business error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
