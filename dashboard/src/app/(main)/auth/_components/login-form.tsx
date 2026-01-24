"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

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

  // ✅ Load last registered email
  const lastRegisteredEmail = typeof window !== "undefined" ? sessionStorage.getItem("lastRegisteredEmail") || "" : "";

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: lastRegisteredEmail, password: "", remember: false },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      if (!authData.user) throw new Error("Login failed");

      // Check admins table for role
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (adminError || !adminData) {
        // Check if user is in business_applications (pending approval)
        const { data: applicationData, error: appError } = await supabase
          .from("business_applications")
          .select("*")
          .eq("user_id", authData.user.id)
          .single();

        if (applicationData) {
          // User has a pending application
          if (applicationData.is_rejected) {
            toast.error(`Your application was rejected. Reason: ${applicationData.rejection_reason || 'Not specified'}`);
            await supabase.auth.signOut();
            return;
          }

          toast.warning("Your business application is awaiting admin approval.");
          router.push("/waiting-approval");
          return;
        }

        // User not found in either table
        toast.error("User profile not found. Please contact support.");
        await supabase.auth.signOut();
        return;
      }

      // Check role and approval status
      if (adminData.role === "admin") {
        // Admin - full access
        if (data.remember && authData.session) {
          await supabase.auth.setSession(authData.session);
        }

        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else if (adminData.role === "business_owner") {
        // Business Owner - check approval status
        if (!adminData.is_approved) {
          toast.warning("Your business account is pending approval.");
          router.push("/waiting-approval");
          return;
        }

        if (data.remember && authData.session) {
          await supabase.auth.setSession(authData.session);
        }

        toast.success(`Welcome back, ${adminData.business_name}!`);
        router.push("/business/dashboard");
      } else {
        toast.error("Invalid account type.");
        await supabase.auth.signOut();
        return;
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="you@example.com" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input {...field} type="password" placeholder="••••••••" autoComplete="current-password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="remember" render={({ field }) => (
          <FormItem className="flex items-center">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="remember" />
            <FormLabel htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
              Remember me for 30 days
            </FormLabel>
          </FormItem>
        )} />

        <Button type="submit" className="w-full">Login</Button>
      </form>
    </Form>
  );
}
