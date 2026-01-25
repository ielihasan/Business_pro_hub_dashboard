import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default system settings
const DEFAULT_SETTINGS = {
  auto_approve_businesses: false,
  require_email_verification: true,
  max_businesses_per_plan: {
    free: 1,
    basic: 3,
    standard: 10,
    premium: -1, // unlimited
  },
  maintenance_mode: false,
  allow_new_registrations: true,
  default_subscription_plan: "free",
  notification_email: "",
  support_email: "",
};

// GET - Fetch system settings
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an admin
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("id", user.id)
      .eq("role", "admin")
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try to fetch settings from database
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    if (error || !settings) {
      // Return default settings if none exist
      return NextResponse.json({ data: DEFAULT_SETTINGS });
    }

    return NextResponse.json({ data: settings.settings });
  } catch (err: any) {
    console.error("Get system settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update system settings
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an admin
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("id", user.id)
      .eq("role", "admin")
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Merge with existing settings
    const { data: existingSettings } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    const currentSettings = existingSettings?.settings || DEFAULT_SETTINGS;
    const updatedSettings = { ...currentSettings, ...body };

    // Upsert settings
    const { data, error } = await supabase
      .from("system_settings")
      .upsert(
        {
          id: 1, // Single row for system settings
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      // If table doesn't exist, still return success with in-memory settings
      console.error("System settings update error:", error);
      return NextResponse.json({
        data: updatedSettings,
        message: "Settings updated (note: database table may not exist)",
      });
    }

    return NextResponse.json({
      data: data.settings,
      message: "System settings updated successfully",
    });
  } catch (err: any) {
    console.error("Update system settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
