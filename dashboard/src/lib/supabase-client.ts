/*import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

*/
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // ✅ frontend safe
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// When refresh token is invalid (password reset, expired session),
// Supabase fires SIGNED_OUT — clear storage and redirect to login
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      const onAuthPage = window.location.pathname.startsWith("/auth/");
      if (!onAuthPage) {
        window.location.href = "/auth/v1/login";
      }
    }
  });
}
