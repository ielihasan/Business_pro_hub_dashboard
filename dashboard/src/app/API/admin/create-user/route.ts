import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api/route-auth";

export async function POST(req: Request) {
  const authz = await requireApiRole(req, ["admin"]);
  if (!authz.ok) return authz.response;

  const { email, password } = await req.json();
  const { data, error } = await authz.supabaseAdmin.auth.admin.createUser({
    email,
    password,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
