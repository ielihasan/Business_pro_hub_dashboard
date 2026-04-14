import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AllowedRole = "admin" | "business_owner";

type AuthzSuccess = {
  ok: true;
  userId: string;
  role: AllowedRole;
  supabaseAdmin: ReturnType<typeof createClient>;
};

type AuthzFailure = {
  ok: false;
  response: NextResponse;
};

type AuthzResult = AuthzSuccess | AuthzFailure;

export async function requireApiRole(
  req: Request,
  allowedRoles: AllowedRole[],
): Promise<AuthzResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server auth configuration is incomplete" },
        { status: 500 },
      ),
    };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: adminRows, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("role, is_approved")
    .eq("id", user.id);

  if (adminError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to validate permissions" },
        { status: 500 },
      ),
    };
  }

  const matchedRole = adminRows?.find(
    (row) =>
      row &&
      allowedRoles.includes(row.role as AllowedRole) &&
      row.is_approved === true,
  )?.role as AllowedRole | undefined;

  if (!matchedRole) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    userId: user.id,
    role: matchedRole,
    supabaseAdmin,
  };
}
