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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
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
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold">
                {admin?.full_name?.charAt(0) || "A"}
              </div>
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
                {navigation.find(item => item.href === pathname)?.name || "Admin Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{admin?.full_name}</p>
                <p className="text-xs text-gray-400">{admin?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-semibold">
                {admin?.full_name?.charAt(0) || "A"}
              </div>
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
