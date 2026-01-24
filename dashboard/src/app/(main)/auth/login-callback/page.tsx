"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export default function LoginCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleLoginCallback();
  }, []);

  const handleLoginCallback = async () => {
    try {
      // Get the OAuth session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        toast.error("No authentication session found");
        router.push("/auth/v1/login");
        return;
      }

      // Check if user has admin records
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", session.user.id);

      if (adminError || !adminData || adminData.length === 0) {
        // Check if user has pending applications
        const { data: applicationData, error: appError } = await supabase
          .from("business_applications")
          .select("*")
          .eq("user_id", session.user.id);

        if (applicationData && applicationData.length > 0) {
          // User has pending application
          const firstApp = applicationData[0];
          if (firstApp.is_rejected) {
            toast.error(`Your application was rejected. Reason: ${firstApp.rejection_reason || 'Not specified'}`);
            await supabase.auth.signOut();
            router.push("/auth/v1/login");
            return;
          }

          // Redirect to appropriate waiting page based on application type
          const isAdminApplication = firstApp.business_type === "Admin";
          const waitingPage = isAdminApplication ? "/auth/waiting-approval-admin" : "/auth/waiting-approval-business";
          const message = isAdminApplication
            ? "Your admin registration is awaiting approval."
            : "Your business application is awaiting admin approval.";

          toast.warning(message);
          router.push(waitingPage);
          return;
        }

        // User not found in any table - need to register
        toast.error("No account found. Please register first.");
        await supabase.auth.signOut();
        router.push("/auth/v1/register");
        return;
      }

      // Check if user has multiple roles
      if (adminData.length > 1) {
        // User has multiple roles - store in session and redirect to role selection
        sessionStorage.setItem("multipleRoles", JSON.stringify(adminData));
        router.push("/auth/select-role");
        return;
      }

      // Single role - proceed with normal login
      const userRole = adminData[0];

      if (userRole.role === "admin") {
        // Admin - full access
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else if (userRole.role === "business_owner") {
        // Business Owner - check approval status
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
        return;
      }
    } catch (error: any) {
      console.error("Login callback error:", error);
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
