"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { getErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Load last registered email
  const lastRegisteredEmail = typeof window !== "undefined" ? sessionStorage.getItem("lastRegisteredEmail") || "" : "";

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: lastRegisteredEmail, password: "", remember: false },
  });

  const applyRememberMe = (remember: boolean) => {
    if (remember) {
      localStorage.setItem("bph-remember-me", "true");
      localStorage.setItem("bph-remember-until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
      sessionStorage.removeItem("bph-session-active");
    } else {
      localStorage.removeItem("bph-remember-me");
      localStorage.removeItem("bph-remember-until");
      sessionStorage.setItem("bph-session-active", "true");
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      if (!authData.user) throw new Error("Login failed");

      // Check admins table for all approved roles
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("id", authData.user.id);

      // Check business_applications for all pending applications (not rejected)
      const { data: pendingApplications } = await supabase
        .from("business_applications")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("is_approved", false)
        .eq("is_rejected", false);

      // Combine approved accounts and pending applications
      const approvedAccounts = (adminData || []).map(acc => ({
        ...acc,
        is_pending: false,
      }));

      const pendingAccounts = (pendingApplications || []).map(app => ({
        ...app,
        id: app.user_id,
        role: app.business_type === "Admin" ? "admin" : "business_owner",
        is_approved: false,
        is_pending: true,
        email_verified: app.email_verified,
      }));

      // Filter out pending applications that already have an approved account of the same role
      const filteredPendingAccounts = pendingAccounts.filter(pending => {
        return !approvedAccounts.some(approved => approved.role === pending.role);
      });

      const allAccounts = [...approvedAccounts, ...filteredPendingAccounts];

      // No accounts found at all — check if they are a staff member first
      if (allAccounts.length === 0) {
        const API = process.env.NEXT_PUBLIC_API_URL;
        const token = authData.session?.access_token;
        try {
          const staffRes = await fetch(
            `${API}/api/staff/me?auth_user_id=${authData.user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (staffRes.ok) {
            const staffJson = await staffRes.json();
            if (staffJson.data) {
              // Valid staff member — send them to the business dashboard
              applyRememberMe(data.remember ?? false);
              toast.success(`Welcome, ${staffJson.data.full_name}!`);
              router.push("/business/dashboard");
              return;
            }
          }
        } catch {
          // Staff check failed — fall through to normal error handling
        }

        // Check for a rejected application
        const { data: rejectedApps } = await supabase
          .from("business_applications")
          .select("*")
          .eq("user_id", authData.user.id)
          .eq("is_rejected", true);

        if (rejectedApps && rejectedApps.length > 0) {
          const reason = rejectedApps[0].rejection_reason || "Not specified";
          toast.error(`Your application was rejected. Reason: "${reason}". You may register again.`);
          await supabase.auth.signOut();
          router.push("/auth/v1/register");
          return;
        }

        toast.error("User profile not found. Please register first.");
        await supabase.auth.signOut();
        router.push("/auth/v1/register");
        return;
      }

      // Check if user has multiple accounts (approved or pending)
      if (allAccounts.length > 1) {
        // User has multiple accounts - store in session and redirect to role selection
        sessionStorage.setItem("multipleRoles", JSON.stringify(allAccounts));
        router.push("/auth/select-role");
        return;
      }

      // Single account - proceed based on its status
      const userAccount = allAccounts[0];

      // Check if it's a pending application
      if (userAccount.is_pending) {
        // Check if email is verified
        if (!userAccount.email_verified) {
          sessionStorage.setItem("pendingVerificationEmail", userAccount.email);
          toast.warning("Please verify your email first.");
          router.push("/auth/verify-email-pending");
          return;
        }

        // Email verified but waiting for approval
        const isAdminApplication = userAccount.role === "admin";
        const waitingPage = isAdminApplication ? "/auth/waiting-approval-admin" : "/auth/waiting-approval-business";
        const message = isAdminApplication
          ? "Your admin registration is awaiting approval."
          : "Your business application is awaiting admin approval.";

        toast.warning(message);
        router.push(waitingPage);
        return;
      }

      // Approved account - proceed with normal login
      if (userAccount.role === "admin") {
        applyRememberMe(data.remember ?? false);
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else if (userAccount.role === "business_owner") {
        if (!userAccount.is_approved) {
          toast.warning("Your business account is pending approval.");
          router.push("/auth/waiting-approval-business");
          return;
        }

        applyRememberMe(data.remember ?? false);
        toast.success(`Welcome back, ${userAccount.business_name}!`);
        router.push("/business/dashboard");
      } else {
        toast.error("Invalid account type.");
        await supabase.auth.signOut();
        return;
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Login failed.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="you@example.com" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="pr-10"
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="remember" render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="remember" />
              <FormLabel htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
                Remember me for 30 days
              </FormLabel>
            </div>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
              Forgot Password?
            </Link>
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-[#3D4127] hover:bg-[#636B2F] text-white">Login</Button>
      </form>
    </Form>
  );
}
