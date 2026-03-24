"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase-client";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { registerUser } from "@/actions/auth/register";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [showBizPass,     setShowBizPass]     = useState(false);
  const [showBizConfirm,  setShowBizConfirm]  = useState(false);
  const [showAdminPass,   setShowAdminPass]   = useState(false);
  const [showAdminConfirm,setShowAdminConfirm]= useState(false);

  // Static business types (business_types table was removed)
  useState(() => {
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
      const result = await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: "admin",
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Registration submitted! Please check your email to verify your account.");

      // Store email for verification page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingVerificationEmail", data.email);
        sessionStorage.setItem("lastRegisteredEmail", data.email);
      }

      // Redirect to email verification pending page
      router.push("/auth/verify-email-pending");
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
      const resolvedType =
        data.businessType === "Other"
          ? customBusinessType.trim() || "Other"
          : data.businessType;

      const result = await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: "business_owner",
        businessData: {
          businessName: data.businessName,
          businessType: resolvedType,
          businessAddress: data.businessAddress,
          businessPhone: data.businessPhone,
          businessDescription: data.businessDescription || "",
        },
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Registration submitted! Please check your email to verify your account.");

      // Store email for verification page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingVerificationEmail", data.email);
        sessionStorage.setItem("lastRegisteredEmail", data.email);
      }

      // Redirect to email verification pending page
      router.push("/auth/verify-email-pending");
    } catch (err: any) {
      toast.error(err.message || "Business registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Handler
  const handleGoogleSignIn = async (role: "admin" | "business") => {
    setIsGoogleLoading(true);
    try {
      // Store the intended role in session storage for later use
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingOAuthRole", role);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/oauth-callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "admin" | "business")} className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-11">
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
                  <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} type={showBizPass ? "text" : "password"} placeholder="Min. 6 characters" className="pr-10" />
                    </FormControl>
                    <button type="button" onClick={() => setShowBizPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showBizPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password <span className="text-red-500">*</span></FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} type={showBizConfirm ? "text" : "password"} placeholder="Repeat your password" className="pr-10" />
                    </FormControl>
                    <button type="button" onClick={() => setShowBizConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showBizConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Business Type <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); if (val !== "Other") setCustomBusinessType(""); }} defaultValue={field.value}>
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
                  {field.value === "Other" && (
                    <Input
                      placeholder="Enter your business type"
                      value={customBusinessType}
                      onChange={(e) => setCustomBusinessType(e.target.value)}
                      className="mt-2"
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Phone <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Business Address <span className="text-red-500">*</span></FormLabel>
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

            <Button type="submit" className="w-full bg-black hover:bg-gray-900 text-white" disabled={isLoading || isGoogleLoading}>
              {isLoading ? "Registering..." : "Register Business"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading || isGoogleLoading}
              onClick={() => handleGoogleSignIn("business")}
            >
              {isGoogleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
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
                  <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} type={showAdminPass ? "text" : "password"} placeholder="Min. 6 characters" className="pr-10" />
                    </FormControl>
                    <button type="button" onClick={() => setShowAdminPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showAdminPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={adminForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password <span className="text-red-500">*</span></FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} type={showAdminConfirm ? "text" : "password"} placeholder="Repeat your password" className="pr-10" />
                    </FormControl>
                    <button type="button" onClick={() => setShowAdminConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showAdminConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-black hover:bg-gray-900 text-white" disabled={isLoading || isGoogleLoading}>
              {isLoading ? "Registering..." : "Register as Admin"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading || isGoogleLoading}
              onClick={() => handleGoogleSignIn("admin")}
            >
              {isGoogleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
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
