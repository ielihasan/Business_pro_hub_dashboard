import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
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
    const { data: existingBusiness } = await supabase
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
      await supabase.auth.admin.createUser({
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

    // Create business record in admins table
    const { data: businessData, error: businessError } = await supabase
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
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (businessError) {
      // Rollback: delete auth user if business record creation fails
      await supabase.auth.admin.deleteUser(userId);
      console.error("Business insert error:", businessError);
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
