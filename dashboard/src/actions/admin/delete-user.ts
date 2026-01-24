"use server";

import { createClient } from "@supabase/supabase-js";

// Use service role key for admin operations
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

export async function deleteUserCompletely(userId: string) {
  try {
    // Delete from business_applications
    const { error: appError } = await supabaseAdmin
      .from("business_applications")
      .delete()
      .eq("user_id", userId);

    if (appError) {
      console.error("Error deleting from business_applications:", appError);
    }

    // Delete from admins
    const { error: adminError } = await supabaseAdmin
      .from("admins")
      .delete()
      .eq("id", userId);

    if (adminError) {
      console.error("Error deleting from admins:", adminError);
    }

    // Delete from auth.users using admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return { error: authError.message };
    }

    return {
      success: true,
      message: "User deleted successfully from all tables",
    };
  } catch (error: any) {
    return { error: error.message || "Failed to delete user" };
  }
}

export async function deleteUserByEmail(email: string) {
  try {
    // First, find the user by email
    const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      return { error: searchError.message };
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return { error: "User not found" };
    }

    // Delete the user completely
    return await deleteUserCompletely(user.id);
  } catch (error: any) {
    return { error: error.message || "Failed to delete user" };
  }
}
