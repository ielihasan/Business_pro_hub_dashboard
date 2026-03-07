"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Pending Businesses", href: "/admin/businesses/pending", icon: Clock },
  { name: "Approved Businesses", href: "/admin/businesses/approved", icon: CheckCircle },
  { name: "Admin Management", href: "/admin/users", icon: Users },
  { name: "Analytics & Payments", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Sync avatar changes from the settings page without a full reload
  useEffect(() => {
    const handleAvatarUpdate = (e: Event) => {
      const { avatar_url } = (e as CustomEvent<{ avatar_url: string | null }>).detail;
      setAdmin((prev: any) => prev ? { ...prev, avatar_url } : prev);
    };
    window.addEventListener("admin-avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("admin-avatar-updated", handleAvatarUpdate);
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/v1/login");
        return;
      }

      const { data: adminRecords } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .eq("role", "admin");

      if (!adminRecords || adminRecords.length === 0) {
        router.push("/auth/v1/login");
        return;
      }

      // Get the first admin record (should only be one per user)
      const adminData = adminRecords[0];

      setAdmin(adminData);
      setLoading(false);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/auth/v1/login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/v1/login");
  };

  /** Resolve a human-readable title from the current pathname */
  const getPageTitle = (path: string): string => {
    // Exact match first
    const exact = navigation.find((item) => item.href === path);
    if (exact) return exact.name;
    // Business detail page — /admin/businesses/<uuid>
    if (/^\/admin\/businesses\/[^/]+$/.test(path) &&
        path !== "/admin/businesses/pending" &&
        path !== "/admin/businesses/approved") {
      return "Business Details";
    }
    // Prefix match (e.g. sub-pages)
    const prefix = navigation.find((item) => path?.startsWith(item.href + "/"));
    if (prefix) return prefix.name;
    return "Admin Dashboard";
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar skeleton — white sidebar with black header */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white">
          {/* Black header */}
          <div className="flex items-center h-16 px-6 bg-black">
            <Skeleton className="h-5 w-28 bg-white/20" />
          </div>
          {/* Admin info */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          {/* Nav items — 6 links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
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

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Black top bar */}
          <header className="h-16 bg-black flex items-center justify-between px-4 lg:px-8">
            <Skeleton className="h-5 w-6 bg-white/20 lg:hidden" />
            <div className="hidden lg:block">
              <Skeleton className="h-5 w-32 bg-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <Skeleton className="h-3.5 w-24 bg-white/20" />
                <Skeleton className="h-3 w-32 bg-white/20" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
            </div>
          </header>
          {/* Page content */}
          <main className="flex-1 p-6 overflow-auto space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-6 space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-black">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <button
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Admin info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {admin?.avatar_url ? (
                <img
                  src={admin.avatar_url}
                  alt={admin.full_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold flex-shrink-0 select-none">
                  {admin?.full_name?.charAt(0) || "A"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {admin?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {admin?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - B/W Theme */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-black hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-white" : ""
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout - B/W Theme */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-black hover:text-white transition-colors"
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
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - B/W Theme */}
        <header className="sticky top-0 z-30 h-16 bg-black border-b border-gray-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4 text-gray-300 hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {getPageTitle(pathname ?? "")}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{admin?.full_name}</p>
                <p className="text-xs text-gray-400">{admin?.email}</p>
              </div>
              {admin?.avatar_url ? (
                <img
                  src={admin.avatar_url}
                  alt={admin.full_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-semibold flex-shrink-0 select-none">
                  {admin?.full_name?.charAt(0) || "A"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
