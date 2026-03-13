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

  supabase.auth.getSession().then(({ data: { session }, error }) => {
    // Invalid refresh token — clear session cleanly
    if (error?.message?.toLowerCase().includes("refresh token")) {
      supabase.auth.signOut();
      return;
    }

    if (session) {
      const isRemembered = localStorage.getItem("bph-remember-me") === "true";
      const rememberUntil = parseInt(localStorage.getItem("bph-remember-until") || "0");
      const isSessionActive = sessionStorage.getItem("bph-session-active") === "true";

      if (isRemembered && Date.now() > rememberUntil) {
        // 30-day period expired — sign out
        localStorage.removeItem("bph-remember-me");
        localStorage.removeItem("bph-remember-until");
        supabase.auth.signOut();
      } else if (!isRemembered && !isSessionActive) {
        // Not remembered + sessionStorage cleared (browser restarted) — sign out
        supabase.auth.signOut();
      }
    }
  });
}
