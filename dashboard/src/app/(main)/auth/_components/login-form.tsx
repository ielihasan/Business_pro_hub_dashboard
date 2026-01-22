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

      // Check admins table
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (adminError || !adminData || adminData.role !== "admin") {
        toast.error("You are not authorized as admin.");
        return;
      }

      // Persist session if "remember" checked
      if (data.remember && authData.session) {
        await supabase.auth.setSession(authData.session);
      }

      toast.success("Login successful!");
      router.push("/dashboard");
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
