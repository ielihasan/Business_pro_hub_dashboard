"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/utils";

export default function LoginCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const handled = useRef(false); // prevent double-handling

  useEffect(() => {
    // Strategy: listen for SIGNED_IN (fires after PKCE code exchange),
    // and also try getSession() immediately for already-active sessions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          if (!handled.current) {
            handled.current = true;
            subscription.unsubscribe();
            routeUser(session);
          }
        }
      }
    );

    // Also check immediately — covers the case where the session is already
    // stored in localStorage (e.g. user is already signed in).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !handled.current) {
        handled.current = true;
        subscription.unsubscribe();
        routeUser(session);
      }
    });

    // Safety timeout — if nothing fires in 10 s, bail out
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        subscription.unsubscribe();
        toast.error("Sign-in timed out. Please try again.");
        router.push("/auth/v1/login");
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const routeUser = async (session: Session) => {
    try {
      // Check if user has admin records
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", session.user.id);

      if (adminError || !adminData || adminData.length === 0) {
        // Check if user has pending applications
        const { data: applicationData } = await supabase
          .from("business_applications")
          .select("*")
          .eq("user_id", session.user.id);

        if (applicationData && applicationData.length > 0) {
          const firstApp = applicationData[0];
          if (firstApp.is_rejected) {
            const reason = firstApp.rejection_reason || "Not specified";
            toast.error(`Your application was rejected. Reason: "${reason}". You may register again.`);
            await supabase.auth.signOut();
            router.push("/auth/v1/register");
            return;
          }

          const isAdminApplication = firstApp.business_type === "Admin";
          const waitingPage = isAdminApplication
            ? "/auth/waiting-approval-admin"
            : "/auth/waiting-approval-business";
          toast.warning(
            isAdminApplication
              ? "Your admin registration is awaiting approval."
              : "Your business application is awaiting admin approval."
          );
          router.push(waitingPage);
          return;
        }

        // User not found in any table — send to register
        toast.error("No account found. Please register first.");
        await supabase.auth.signOut();
        router.push("/auth/v1/register");
        return;
      }

      // Multiple roles → role selection page
      if (adminData.length > 1) {
        sessionStorage.setItem("multipleRoles", JSON.stringify(adminData));
        router.push("/auth/select-role");
        return;
      }

      // Single role
      const userRole = adminData[0];

      if (userRole.role === "admin") {
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else if (userRole.role === "business_owner") {
        if (!userRole.is_approved) {
          toast.warning("Your business account is pending approval.");
          router.push("/auth/waiting-approval-business");
          return;
        }
        toast.success(`Welcome back, ${userRole.business_name}!`);
        router.push("/business/dashboard");
      } else {
        toast.error("Invalid account type.");
        await supabase.auth.signOut();
        router.push("/auth/v1/login");
      }
    } catch (error: unknown) {
      console.error("Login callback error:", getErrorMessage(error));
      toast.error("Authentication failed");
      router.push("/auth/v1/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Completing your login...</p>
        </div>
      </div>
    );
  }

  return null;
}
