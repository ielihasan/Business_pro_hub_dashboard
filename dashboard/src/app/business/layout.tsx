"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Clock,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  CreditCard,
  Calendar,
  Shield,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";

const API = process.env.NEXT_PUBLIC_API_URL;

interface BusinessData {
  id: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  email: string;
  avatar_url?: string | null;
}

// Navigation items available to all roles
const fullNavigation = [
  { name: "Dashboard",        href: "/business/dashboard", icon: LayoutDashboard, staffAllowed: true  },
  { name: "Queue Management", href: "/business/queue",     icon: Clock,            staffAllowed: true  },
  { name: "Customers",        href: "/business/customers", icon: Users,            staffAllowed: true  },
  { name: "Staff",            href: "/business/staff",     icon: UserCog,          staffAllowed: false }, // owner only
  { name: "Services",         href: "/business/services",  icon: Store,            staffAllowed: true  },
  { name: "Business Hours",   href: "/business/hours",     icon: Calendar,         staffAllowed: true  },
  { name: "Pricing & Plans",  href: "/business/pricing",   icon: CreditCard,       staffAllowed: false }, // owner only
  { name: "Settings",         href: "/business/settings",  icon: Settings,         staffAllowed: false }, // owner only
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [staffName, setStaffName] = useState<string | null>(null);
  // Tracks when checkAuth() redirected from a restricted page (loading stays true
  // until pathname changes, then we call setLoading(false) to show the dashboard).
  const redirectingFromRestricted = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Sync avatar changes from the settings page without a full reload
  useEffect(() => {
    const handleAvatarUpdate = (e: Event) => {
      const { avatar_url } = (e as CustomEvent<{ avatar_url: string | null }>).detail;
      setBusiness((prev) => prev ? { ...prev, avatar_url } : prev);
    };
    window.addEventListener("business-avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("business-avatar-updated", handleAvatarUpdate);
  }, []);

  // Redirect staff away from restricted pages when navigating directly by URL
  useEffect(() => {
    if (!loading && isStaff) {
      const restrictedRoutes = fullNavigation
        .filter((item) => !item.staffAllowed)
        .map((item) => item.href);
      const isRestricted = restrictedRoutes.some(
        (route) => pathname === route || pathname?.startsWith(route + "/")
      );
      if (isRestricted) {
        toast.warning("This page is not accessible for staff accounts.");
        router.push("/business/dashboard");
      }
    }
  }, [isStaff, loading, pathname]);

  // When a restricted-page redirect (from checkAuth) completes, the pathname
  // changes to /business/dashboard — release the loading state so the layout renders.
  useEffect(() => {
    if (redirectingFromRestricted.current) {
      redirectingFromRestricted.current = false;
      setLoading(false);
    }
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.push("/auth/v1/login");
        return;
      }

      // ── 1. Check if user is a business owner ─────────────────────────────
      const { data: adminRecords, error } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .eq("role", "business_owner");

      if (!error && adminRecords && adminRecords.length > 0) {
        const businessData = adminRecords[0];
        if (!businessData.is_approved) {
          toast.warning("Your business is pending approval");
          router.push("/auth/waiting-approval-business");
          return;
        }
        setBusiness(businessData);
        setIsStaff(false);
        setLoading(false);
        return;
      }

      // ── 2. Check if user is a staff member ───────────────────────────────
      const token = session?.access_token;
      if (token) {
        try {
          const res = await fetch(`${API}/api/staff/me?auth_user_id=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (json.success && json.data) {
            const staffData = json.data;
            if (!staffData.is_active) {
              toast.error("Your staff account has been deactivated. Contact your manager.");
              router.push("/auth/v1/login");
              return;
            }

            // Fetch the business details for the staff's business
            const { data: bizRecords } = await supabase
              .from("admins")
              .select("*")
              .eq("id", staffData.business_id)
              .eq("role", "business_owner")
              .single();

            setBusiness(bizRecords ?? {
              id: staffData.business_id,
              business_name: "Business",
              business_type: "",
              business_address: "",
              business_phone: "",
              email: "",
            });
            setIsStaff(true);
            setStaffName(staffData.full_name);

            // Redirect staff away from restricted pages before rendering
            const restrictedRoutes = fullNavigation
              .filter((item) => !item.staffAllowed)
              .map((item) => item.href);
            const currentPath = window.location.pathname;
            const isRestricted = restrictedRoutes.some(
              (route) => currentPath === route || currentPath.startsWith(route + "/")
            );
            if (isRestricted) {
              // Mark redirect in-flight so useEffect([pathname]) calls setLoading(false)
              // when the dashboard route activates (same layout instance stays mounted).
              redirectingFromRestricted.current = true;
              toast.warning("This page is not accessible for staff accounts.");
              router.push("/business/dashboard");
              return; // Keep loading=true (skeleton) until pathname changes
            }

            setLoading(false);
            return;
          }
        } catch {
          // Staff lookup failed — fall through to error
        }
      }

      // ── 3. Not business owner or staff ───────────────────────────────────
      toast.error("Access denied — not a business account");
      router.push("/auth/v1/login");
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/auth/v1/login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/auth/v1/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar skeleton — matches the white sidebar with black header */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white">
          {/* Header bar */}
          <div className="flex items-center h-16 px-6 bg-[#3D4127]">
            <Skeleton className="h-5 w-5 mr-2 bg-white/20" />
            <Skeleton className="h-5 w-28 bg-white/20" />
          </div>
          {/* Business details row */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {/* Nav items — 8 links */}
          <nav className="flex-1 p-4 space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </nav>
          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          {/* Branding */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <Skeleton className="h-3 w-36 mx-auto" />
          </div>
        </aside>

        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Black top bar */}
          <header className="h-16 bg-black flex items-center justify-between px-6">
            <Skeleton className="h-5 w-6 bg-white/20 lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block space-y-1">
                <Skeleton className="h-3.5 w-28 bg-white/20" />
                <Skeleton className="h-3 w-36 bg-white/20" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
            </div>
          </header>
          {/* Page content area */}
          <main className="flex-1 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Filter navigation based on role
  const navigation = fullNavigation.filter((item) => !isStaff || item.staffAllowed);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Business Info - B/W Theme */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-black">
            <div className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-white" />
              <h1 className="text-lg font-bold text-white">Business Hub</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Business Details */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {business?.avatar_url ? (
                <img
                  src={business.avatar_url}
                  alt={business.business_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3D4127] flex items-center justify-center text-white font-semibold flex-shrink-0 select-none">
                  {business?.business_name?.charAt(0).toUpperCase() || "B"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {business?.business_name}
                </p>
                {isStaff ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500 truncate">{staffName}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 truncate">{business?.business_type}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation - B/W Theme */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start transition-colors ${
                          isActive
                            ? "bg-[#3D4127] text-white hover:bg-[#3D4127] hover:text-white"
                            : "text-gray-700 hover:bg-[#3D4127] hover:text-white"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Staff role badge */}
            {isStaff && (
              <div className="mt-4 px-2 py-2 rounded-md bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Staff Account</span>
                </div>
                <p className="text-xs text-amber-600 mt-0.5 leading-tight">
                  Some features are restricted.
                </p>
              </div>
            )}
          </nav>

          {/* Logout - B/W Theme */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-[#3D4127] hover:text-white transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>

          {/* Elixa Software Branding */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-[10px] text-gray-400 text-center">
              Powered by <span className="font-medium text-gray-500">Elixa Software</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar - B/W Theme */}
        <header className="sticky top-0 z-30 h-16 bg-black border-b border-gray-800">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <p className="text-sm font-medium text-white leading-none">
                  {isStaff ? staffName : business?.business_name}
                </p>
                {isStaff ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-medium">
                    <Shield className="h-2.5 w-2.5" />
                    Staff Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#636B2F]/30 border border-[#BAC095]/50 text-[#D4DE95] text-[10px] font-medium">
                    <Crown className="h-2.5 w-2.5" />
                    Business Owner · Full Access
                  </span>
                )}
              </div>
              {business?.avatar_url && !isStaff ? (
                <img
                  src={business.avatar_url}
                  alt={business.business_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#BAC095] flex items-center justify-center text-[#3D4127] font-semibold flex-shrink-0 select-none">
                  {isStaff
                    ? (staffName?.charAt(0).toUpperCase() || "S")
                    : (business?.business_name?.charAt(0).toUpperCase() || "B")}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
