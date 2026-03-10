/**
 * resolveBusinessId
 *
 * Returns the canonical business UUID for whoever is currently logged in:
 *   - Business owner  → their own auth user UUID (already stored as businesses.id)
 *   - Staff member    → the business_id from the staff record (owner's UUID)
 *
 * Returns null if the user is not authenticated or not linked to any business.
 */

import { supabase } from "@/lib/supabase-client";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function resolveBusinessId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  // ── 1. Check if the user is a business owner ──────────────────────────────
  const { data: adminRecord } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .eq("role", "business_owner")
    .single();

  if (adminRecord) return user.id; // owner's own UUID is the business_id

  // ── 2. Check if the user is a staff member ────────────────────────────────
  try {
    const res = await fetch(
      `${API}/api/staff/me?auth_user_id=${user.id}`,
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    const json = await res.json();
    if (json.success && json.data?.business_id) {
      return json.data.business_id as string;
    }
  } catch {
    // Staff lookup failed — fall through
  }

  return null;
}
