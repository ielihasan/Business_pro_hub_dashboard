// src/app/(main)/dashboard/crm/api/getProfiles.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getProfiles() {
  const { data, error } = await supabase.from("User").select("*");
  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }
  return data;
  
}
