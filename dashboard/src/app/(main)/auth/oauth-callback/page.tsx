"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Shield } from "lucide-react";

// Business Owner Additional Info Schema
const BusinessInfoSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.string().min(1, "Please select a business type"),
  businessAddress: z.string().min(5, "Address must be at least 5 characters"),
  businessPhone: z.string().min(10, "Valid phone number required"),
  businessDescription: z.string().optional(),
});

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "business" | null>(null);
  const [user, setUser] = useState<any>(null);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handled = useRef(false);

  const form = useForm<z.infer<typeof BusinessInfoSchema>>({
    resolver: zodResolver(BusinessInfoSchema),
    defaultValues: {
      businessName: "",
      businessType: "",
      businessAddress: "",
      businessPhone: "",
      businessDescription: "",
    },
  });

  useEffect(() => {
    loadBusinessTypes();

    // Listen for SIGNED_IN (fires after PKCE code exchange completes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
          if (!handled.current) {
            handled.current = true;
            subscription.unsubscribe();
            handleOAuthCallback(session);
          }
        }
      }
    );

    // Also check immediately for an already-active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !handled.current) {
        handled.current = true;
        subscription.unsubscribe();
        handleOAuthCallback(session);
      }
    });

    // Safety timeout
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        subscription.unsubscribe();
        router.push("/auth/v1/register");
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const loadBusinessTypes = () => {
    // business_types table was removed; use the canonical hardcoded list
    setBusinessTypes([
      { id: "1", name: "Coffee Shop" },
      { id: "2", name: "Restaurant" },
      { id: "3", name: "Retail Store" },
      { id: "4", name: "Clinic / Healthcare" },
      { id: "5", name: "Salon / Barbershop" },
      { id: "6", name: "Bank / Finance" },
      { id: "7", name: "Government Office" },
      { id: "8", name: "Pharmacy" },
      { id: "9", name: "Bakery" },
      { id: "10", name: "Other" },
    ]);
  };

  const handleOAuthCallback = async (session: any) => {
    try {
      if (!session) {
        toast.error("No authentication session found");
        router.push("/auth/v1/register");
        return;
      }

      // Get the intended role from session storage
      const pendingRole = sessionStorage.getItem("pendingOAuthRole") as "admin" | "business" | null;

      if (!pendingRole) {
        toast.error("Registration type not found");
        router.push("/auth/v1/register");
        return;
      }

      setRole(pendingRole);
      setUser(session.user);

      // Check if user already has an admin record for this specific role
      const { data: existingAdmins } = await supabase
        .from("admins")
        .select("*")
        .eq("id", session.user.id);

      if (existingAdmins && existingAdmins.length > 0) {
        // Check if they already have this specific role
        const hasRequestedRole = existingAdmins.some(
          (admin) => admin.role === (pendingRole === "admin" ? "admin" : "business_owner")
        );

        if (hasRequestedRole) {
          // User already has this role, redirect appropriately
          if (existingAdmins.length > 1) {
            // Multiple roles - go to role selection
            sessionStorage.setItem("multipleRoles", JSON.stringify(existingAdmins));
            router.push("/auth/select-role");
            return;
          } else {
            // Single role - direct login
            toast.success("Already registered! Logging in...");
            router.push(existingAdmins[0].role === "admin" ? "/admin/dashboard" : "/business/dashboard");
            return;
          }
        }
      }

      // Check if user has a pending application for this specific role
      const { data: existingApplications } = await supabase
        .from("business_applications")
        .select("*")
        .eq("user_id", session.user.id);

      if (existingApplications && existingApplications.length > 0) {
        const pendingRoleType = pendingRole === "admin" ? "Admin" : null;
        const hasPendingForRole = existingApplications.some(
          (app) => pendingRole === "admin" ? app.business_type === "Admin" : app.business_type !== "Admin"
        );

        if (hasPendingForRole) {
          // User has pending application for this role
          const isAdmin = pendingRole === "admin";
          toast.warning("Application already submitted for this role!");
          router.push(isAdmin ? "/auth/waiting-approval-admin" : "/auth/waiting-approval-business");
          return;
        }
      }

      // For admin role, we can directly create application (no additional info needed)
      if (pendingRole === "admin") {
        await createAdminApplication(session.user);
        return;
      }

      // For business role, show the form to collect additional info
      setLoading(false);
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      toast.error("Authentication failed");
      router.push("/auth/v1/register");
    }
  };

  const createAdminApplication = async (user: any) => {
    try {
      const { error } = await supabase
        .from("business_applications")
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
          email: user.email,
          business_name: "Platform Admin",
          business_type: "Admin",
          business_address: "N/A",
          business_phone: "N/A",
          business_description: "Platform Administrator",
          is_approved: false,
          is_rejected: false,
        });

      if (error) throw error;

      sessionStorage.removeItem("pendingOAuthRole");
      toast.success("Admin registration submitted! Awaiting approval.");
      router.push("/auth/waiting-approval-admin");
    } catch (error: any) {
      console.error("Error creating admin application:", error);
      toast.error("Failed to complete registration");
    }
  };

  const onSubmit = async (data: z.infer<typeof BusinessInfoSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("business_applications")
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
          email: user.email,
          business_name: data.businessName,
          business_type: data.businessType,
          business_address: data.businessAddress,
          business_phone: data.businessPhone,
          business_description: data.businessDescription || "",
          is_approved: false,
          is_rejected: false,
        });

      if (error) throw error;

      sessionStorage.removeItem("pendingOAuthRole");
      sessionStorage.setItem("lastRegisteredEmail", user.email);
      toast.success("Business registration submitted! Awaiting admin approval.");
      router.push("/auth/waiting-approval-business");
    } catch (error: any) {
      console.error("Error submitting business info:", error);
      toast.error("Failed to complete registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Completing your registration...</p>
        </div>
      </div>
    );
  }

  // Only show form for business owners
  if (role !== "business") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
            <Building2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Complete Your Business Registration</CardTitle>
          <CardDescription>
            We need a few more details about your business to complete your registration
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Signed in as:</strong> {user?.email}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Please provide your business information below
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My Coffee Shop" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type *</FormLabel>
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
                control={form.control}
                name="businessPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1 (555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main St, City, State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Complete Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
