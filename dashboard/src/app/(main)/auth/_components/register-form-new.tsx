"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Admin Registration Schema
const AdminFormSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Business Owner Registration Schema
const BusinessOwnerFormSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
    businessName: z.string().min(2, "Business name is required"),
    businessType: z.string().min(1, "Please select a business type"),
    businessAddress: z.string().min(5, "Address must be at least 5 characters"),
    businessPhone: z.string().min(10, "Valid phone number required"),
    businessDescription: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function RegisterFormNew() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "business">("business");
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);

  // Load business types on mount
  useState(() => {
    const loadBusinessTypes = async () => {
      const { data } = await supabase
        .from("business_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (data) setBusinessTypes(data);
    };
    loadBusinessTypes();
  });

  // Admin Form
  const adminForm = useForm<z.infer<typeof AdminFormSchema>>({
    resolver: zodResolver(AdminFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Business Owner Form
  const businessForm = useForm<z.infer<typeof BusinessOwnerFormSchema>>({
    resolver: zodResolver(BusinessOwnerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      businessType: "",
      businessAddress: "",
      businessPhone: "",
      businessDescription: "",
    },
  });

  // Admin Registration Handler
  const onAdminSubmit = async (data: z.infer<typeof AdminFormSchema>) => {
    setIsLoading(true);
    try {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin + "/auth/v1/login",
          data: { name: data.fullName, role: "admin" },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Registration failed");

      const userId = signUpData.user.id;

      // Create admin record directly
      const { error: adminError } = await supabase
        .from("admins")
        .insert({
          id: userId,
          full_name: data.fullName,
          email: data.email,
          role: "admin",
          is_approved: true, // Admins are auto-approved
        });

      if (adminError) throw adminError;

      toast.success("Admin registration successful! Please confirm your email.");

      // Store email for login page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastRegisteredEmail", data.email);
      }

      router.push("/auth/v1/login");
    } catch (err: any) {
      toast.error(err.message || "Admin registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Business Owner Registration Handler
  const onBusinessSubmit = async (data: z.infer<typeof BusinessOwnerFormSchema>) => {
    setIsLoading(true);
    try {
      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin + "/auth/v1/login",
          data: { name: data.fullName, role: "business_owner" },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Registration failed");

      const userId = signUpData.user.id;

      // Wait briefly to ensure auth user is fully created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create business application record
      const { error: applicationError } = await supabase
        .from("business_applications")
        .insert({
          user_id: userId,
          full_name: data.fullName,
          email: data.email,
          business_name: data.businessName,
          business_type: data.businessType,
          business_address: data.businessAddress,
          business_phone: data.businessPhone,
          business_description: data.businessDescription || "",
          is_approved: false,
          is_rejected: false,
        });

      if (applicationError) {
        console.error("Application insert error:", applicationError);
        throw applicationError;
      }

      toast.success("Business registration submitted! Awaiting admin approval.");

      // Store email for login page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastRegisteredEmail", data.email);
      }

      router.push("/waiting-approval");
    } catch (err: any) {
      toast.error(err.message || "Business registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "admin" | "business")} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="business">Business Owner</TabsTrigger>
        <TabsTrigger value="admin">Platform Admin</TabsTrigger>
      </TabsList>

      {/* Business Owner Registration */}
      <TabsContent value="business" className="mt-6">
        <Form {...businessForm}>
          <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4">
            <FormField
              control={businessForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="you@business.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Coffee Shop" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+1 (555) 123-4567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main St, City, State" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your business..."
                      className="h-20 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register Business"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your application will be reviewed by our admin team
            </p>
          </form>
        </Form>
      </TabsContent>

      {/* Admin Registration */}
      <TabsContent value="admin" className="mt-6">
        <Form {...adminForm}>
          <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
            <FormField
              control={adminForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Admin Name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={adminForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="admin@businesshub.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={adminForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={adminForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register as Admin"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Admin accounts have full platform access
            </p>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
