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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session, User } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/utils";

// ── Address & phone data (keep in sync with register-form-new.tsx) ────────────
const COUNTRIES = [
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Other",
];

const COUNTRY_CODES: Record<string, string> = {
  Pakistan: "+92",
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  "United Kingdom": "+44",
  "United States": "+1",
  Canada: "+1",
  Australia: "+61",
  Other: "",
};

const STATE_CITIES: Record<string, string[]> = {
  Punjab: [
    "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Sialkot",
    "Bahawalpur", "Sargodha", "Sheikhupura", "Jhang", "Rahim Yar Khan", "Gujrat",
    "Kasur", "Sahiwal", "Okara", "Kharian", "Wazirabad", "Mandi Bahauddin",
    "Narowal", "Chiniot", "Hafizabad", "Chakwal", "Jhelum", "Khushab", "Bhakkar",
    "Layyah", "Muzaffargarh", "Vehari", "Pakpattan", "Khanewal", "Lodhran",
    "Nankana Sahib", "Toba Tek Singh", "Gojra", "Kamalia", "Daska", "Sambrial",
    "Pasrur", "Zafarwal", "Phalia", "Kot Addu", "Ahmedpur East", "Hasilpur",
    "Bahawalnagar", "Burewala", "Mailsi", "Renala Khurd", "Depalpur", "Chunian",
    "Ferozewala", "Muridke", "Wah Cantt", "Taxila", "Attock", "Kamoke",
    "Pattoki", "Bhalwal", "Jaranwala", "Sammundri", "Chichawatni", "Dipalpur",
    "Kot Momin", "Shahkot", "Tandlianwala", "Shakargarh", "Manga Mandi",
    "Talagang", "Gujar Khan", "Rawat", "Murree", "Fatehjang", "Hazro",
  ],
  Sindh: [
    "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas",
    "Khairpur", "Thatta", "Dadu", "Jacobabad", "Shikarpur", "Kandhkot",
    "Kashmore", "Ghotki", "Sanghar", "Umerkot", "Tando Adam", "Tando Allahyar",
    "Badin", "Matiari", "Jamshoro", "Naushahro Feroze", "Qambar", "Shahdadkot",
    "Kotri", "Mehrabpur", "Digri", "Mithi", "Islamkot", "Tharparkar",
    "Daharki", "Rohri", "Pano Aqil", "Gambat", "Ratodero", "Dokri",
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar", "Abbottabad", "Mardan", "Mingora", "Nowshera", "Dera Ismail Khan",
    "Kohat", "Mansehra", "Swabi", "Charsadda", "Haripur", "Battagram",
    "Hangu", "Karak", "Bannu", "Lakki Marwat", "Tank", "Shangla",
    "Chitral", "Dir", "Timergara", "Buner", "Malakand", "Topi",
    "Takht-i-Bahi", "Daggar", "Drosh", "Matta", "Kabal", "Bahrain",
    "Alpuri", "Thall", "Parachinar", "Dera Adam Khel",
  ],
  Balochistan: [
    "Quetta", "Gwadar", "Turbat", "Khuzdar", "Hub", "Chaman", "Zhob",
    "Dera Murad Jamali", "Loralai", "Sibi", "Mastung", "Kalat", "Kharan",
    "Panjgur", "Nushki", "Pishin", "Qila Saifullah", "Qila Abdullah",
    "Dalbandin", "Washuk", "Dera Allah Yar", "Usta Mohammad", "Jaffarabad",
    "Nasirabad", "Bolan", "Kohlu", "Barkhan", "Musakhel", "Ziarat",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
  "Gilgit-Baltistan": [
    "Gilgit", "Skardu", "Chilas", "Hunza", "Ghanche", "Ghizer",
    "Astore", "Diamer", "Nagar", "Khaplu", "Shigar",
  ],
  "Azad Jammu & Kashmir": [
    "Muzaffarabad", "Mirpur", "Rawalakot", "Kotli", "Bagh",
    "Bhimber", "Neelum", "Haveli", "Hattian Bala", "Poonch", "Sudhnoti",
  ],
};

const PAKISTAN_PROVINCES = Object.keys(STATE_CITIES);

const BUSINESS_TYPES = [
  "Coffee Shop", "Restaurant", "Retail Store", "Clinic / Healthcare",
  "Salon / Barbershop", "Bank / Finance", "Government Office",
  "Pharmacy", "Bakery", "Other",
];

// ── Schema ────────────────────────────────────────────────────────────────────
const BusinessInfoSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.string().min(1, "Please select a business type"),
  phoneCode: z.string().min(1, "Select a country code"),
  businessPhone: z.string().min(7, "Valid phone number required"),
  addressLine: z.string().min(3, "Street address is required"),
  country: z.string().min(2, "Country is required"),
  state: z.string().min(2, "State / Province is required"),
  city: z.string().min(2, "City is required"),
  businessDescription: z.string().optional(),
});

type BusinessInfoValues = z.infer<typeof BusinessInfoSchema>;

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "business" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const handled = useRef(false);

  const form = useForm<BusinessInfoValues>({
    resolver: zodResolver(BusinessInfoSchema),
    defaultValues: {
      businessName: "",
      businessType: "",
      phoneCode: "Pakistan",
      businessPhone: "",
      addressLine: "",
      country: "Pakistan",
      state: "",
      city: "",
      businessDescription: "",
    },
  });

  const selectedCountry = form.watch("country");
  const selectedState = form.watch("state");
  const isPakistan = selectedCountry === "Pakistan";
  const cities = isPakistan && selectedState ? (STATE_CITIES[selectedState] ?? []) : [];

  useEffect(() => {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !handled.current) {
        handled.current = true;
        subscription.unsubscribe();
        handleOAuthCallback(session);
      }
    });

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

  const handleOAuthCallback = async (session: Session | null) => {
    try {
      if (!session) {
        toast.error("No authentication session found");
        router.push("/auth/v1/register");
        return;
      }

      const pendingRole = sessionStorage.getItem("pendingOAuthRole") as "admin" | "business" | null;

      if (!pendingRole) {
        toast.error("Registration type not found");
        router.push("/auth/v1/register");
        return;
      }

      setRole(pendingRole);
      setUser(session.user);

      const { data: existingAdmins } = await supabase
        .from("admins")
        .select("*")
        .eq("id", session.user.id);

      if (existingAdmins && existingAdmins.length > 0) {
        const hasRequestedRole = existingAdmins.some(
          (admin) => admin.role === (pendingRole === "admin" ? "admin" : "business_owner")
        );
        if (hasRequestedRole) {
          if (existingAdmins.length > 1) {
            sessionStorage.setItem("multipleRoles", JSON.stringify(existingAdmins));
            router.push("/auth/select-role");
            return;
          } else {
            toast.success("Already registered! Logging in...");
            router.push(existingAdmins[0].role === "admin" ? "/admin/dashboard" : "/business/dashboard");
            return;
          }
        }
      }

      const { data: existingApplications } = await supabase
        .from("business_applications")
        .select("*")
        .eq("user_id", session.user.id);

      if (existingApplications && existingApplications.length > 0) {
        const roleApp = existingApplications.find(
          (app) => pendingRole === "admin" ? app.business_type === "Admin" : app.business_type !== "Admin"
        );
        if (roleApp) {
          if (roleApp.is_rejected) {
            const reason = roleApp.rejection_reason || "No reason provided";
            toast.warning(`Your previous application was rejected: "${reason}". Please resubmit your details below.`);
            await supabase.from("business_applications").delete().eq("id", roleApp.id);
          } else {
            toast.warning("Your application is already under review. Please wait for admin approval.");
            router.push(pendingRole === "admin" ? "/auth/waiting-approval-admin" : "/auth/waiting-approval-business");
            return;
          }
        }
      }

      if (pendingRole === "admin") {
        await createAdminApplication(session.user);
        return;
      }

      setLoading(false);
    } catch (error: unknown) {
      console.error("OAuth callback error:", getErrorMessage(error));
      toast.error("Authentication failed");
      router.push("/auth/v1/register");
    }
  };

  const createAdminApplication = async (user: User) => {
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
          email_verified: true,
        });

      if (error) throw error;

      sessionStorage.removeItem("pendingOAuthRole");
      toast.success("Admin registration submitted! Awaiting approval.");
      router.push("/auth/waiting-approval-admin");
    } catch (error: unknown) {
      console.error("Error creating admin application:", getErrorMessage(error));
      toast.error("Failed to complete registration");
    }
  };

  const onSubmit = async (data: BusinessInfoValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const phoneWithCode = `${COUNTRY_CODES[data.phoneCode] ?? ""}${data.businessPhone}`.trim();
      const businessAddress = [data.addressLine, data.city, data.state, data.country]
        .filter(Boolean).join(", ");

      const { error } = await supabase
        .from("business_applications")
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
          email: user.email,
          business_name: data.businessName,
          business_type: data.businessType,
          business_address: businessAddress,
          address_line: data.addressLine,
          city: data.city,
          state: data.state,
          country: data.country,
          business_phone: phoneWithCode,
          business_description: data.businessDescription || "",
          is_approved: false,
          is_rejected: false,
          email_verified: true,
        });

      if (error) throw error;

      sessionStorage.removeItem("pendingOAuthRole");
      sessionStorage.setItem("lastRegisteredEmail", user.email ?? "");
      toast.success("Business registration submitted! Awaiting admin approval.");
      router.push("/auth/waiting-approval-business");
    } catch (error: unknown) {
      console.error("Error submitting business info:", getErrorMessage(error));
      toast.error("Failed to complete registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Completing your registration...</p>
        </div>
      </div>
    );
  }

  if (role !== "business") return null;

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
            <p className="text-sm text-blue-700 mt-1">Please provide your business information below</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Business Name */}
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

              {/* Business Type */}
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
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone — country code + number */}
              <FormItem>
                <FormLabel>Business Phone *</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="phoneCode"
                    render={({ field }) => (
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          // sync country if different
                          if (COUNTRIES.includes(val) && val !== form.getValues("country")) {
                            form.setValue("country", val);
                            form.setValue("state", "");
                            form.setValue("city", "");
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-28 shrink-0">
                            <SelectValue>
                              {COUNTRY_CODES[field.value] || field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {COUNTRY_CODES[c]} {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessPhone"
                    render={({ field }) => (
                      <FormControl>
                        <Input {...field} placeholder="3001234567" className="flex-1" />
                      </FormControl>
                    )}
                  />
                </div>
                <FormMessage>{form.formState.errors.businessPhone?.message || form.formState.errors.phoneCode?.message}</FormMessage>
              </FormItem>

              {/* Address Line */}
              <FormField
                control={form.control}
                name="addressLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street no., Building, Area" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("phoneCode", val);
                        form.setValue("state", "");
                        form.setValue("city", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* State / Province */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province *</FormLabel>
                    {isPakistan ? (
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("city", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAKISTAN_PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="State / Province" />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    {isPakistan ? (
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!selectedState}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || (selectedState ? "Type or select city…" : "Select province first")}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Type city name…" />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup>
                                {cities.map((c) => (
                                  <CommandItem
                                    key={c}
                                    value={c}
                                    onSelect={() => {
                                      field.onChange(c);
                                      setCityOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", field.value === c ? "opacity-100" : "opacity-0")} />
                                    {c}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <FormControl>
                        <Input {...field} placeholder="City" />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Description */}
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
