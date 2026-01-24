import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass rate limits
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, businessData } = body;

    // Create user with admin API (bypasses rate limits)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: fullName,
        role,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create role-specific record
    if (role === "admin") {
      const { error: adminError } = await supabaseAdmin
        .from("admins")
        .insert({
          id: userId,
          full_name: fullName,
          email,
          role: "admin",
          is_approved: true,
        });

      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 400 });
      }
    } else if (role === "business_owner") {
      const { error: applicationError } = await supabaseAdmin
        .from("business_applications")
        .insert({
          user_id: userId,
          full_name: fullName,
          email,
          business_name: businessData.businessName,
          business_type: businessData.businessType,
          business_address: businessData.businessAddress,
          business_phone: businessData.businessPhone,
          business_description: businessData.businessDescription || "",
          is_approved: false,
          is_rejected: false,
        });

      if (applicationError) {
        return NextResponse.json({ error: applicationError.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "Registration successful"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
