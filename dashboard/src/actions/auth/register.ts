"use server";

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

export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  businessData?: {
    businessName: string;
    businessType: string;
    businessAddress: string;
    businessPhone: string;
    businessDescription: string;
  };
}) {
  try {
    const { email, password, fullName, role, businessData } = data;

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
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "User creation failed" };
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
        return { error: adminError.message };
      }
    } else if (role === "business_owner") {
      if (!businessData) {
        return { error: "Business data is required for business owner registration" };
      }

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
        return { error: applicationError.message };
      }
    }

    return {
      success: true,
      userId,
      message: "Registration successful",
    };
  } catch (error: any) {
    return { error: error.message || "Registration failed" };
  }
}
