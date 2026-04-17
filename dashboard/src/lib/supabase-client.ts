import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // ✅ frontend safe
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// When refresh token is invalid (password reset, expired session),
// Supabase fires SIGNED_OUT — clear storage and redirect to login
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      const onAuthPage = window.location.pathname.startsWith("/auth/");
      if (!onAuthPage) {
        window.location.href = "/auth/v1/login";
      }
      return;
    }

    // On sign-in or token refresh, enforce remember-me expiry only when no
    // active session flag exists (i.e. the user did NOT check "Remember me"
    // and this is a fresh tab/window where sessionStorage was not carried over).
    if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
      if (window.location.pathname === "/auth/reset-password") return;

      const isRemembered = localStorage.getItem("bph-remember-me") === "true";
      const rememberUntil = parseInt(localStorage.getItem("bph-remember-until") || "0");
      const isSessionActive = sessionStorage.getItem("bph-session-active") === "true";

      if (isRemembered && Date.now() > rememberUntil) {
        localStorage.removeItem("bph-remember-me");
        localStorage.removeItem("bph-remember-until");
        supabase.auth.signOut();
      } else if (!isRemembered && !isSessionActive) {
        // Restore the flag so subsequent module loads don't re-trigger this branch
        sessionStorage.setItem("bph-session-active", "true");
      }
    }
  });
}
