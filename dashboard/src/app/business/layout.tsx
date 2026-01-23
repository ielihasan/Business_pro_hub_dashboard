"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Clock,
  Package,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  BarChart3,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface BusinessData {
  id: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  email: string;
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
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

      const { data: businessData, error } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !businessData) {
        toast.error("Business profile not found");
        router.push("/auth/v1/login");
        return;
      }

      if (businessData.role !== "business_owner") {
        toast.error("Access denied. Business owners only.");
        router.push("/auth/v1/login");
        return;
      }

      if (!businessData.is_approved) {
        toast.warning("Your business is pending approval");
        router.push("/waiting-approval");
        return;
      }

      setBusiness(businessData);
      setLoading(false);
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
    { name: "Queue Management", href: "/business/queue", icon: Clock },
    { name: "Orders", href: "/business/orders", icon: Package },
    { name: "Customers", href: "/business/customers", icon: Users },
    { name: "Staff", href: "/business/staff", icon: UserCog },
    { name: "Services", href: "/business/services", icon: Store },
    { name: "Business Hours", href: "/business/hours", icon: Calendar },
    { name: "Analytics", href: "/business/analytics", icon: BarChart3 },
    { name: "Settings", href: "/business/settings", icon: Settings },
  ];

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
          {/* Business Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Store className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold text-gray-900">Business Hub</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {business?.business_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{business?.business_type}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:text-primary hover:bg-primary/10"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{business?.business_name}</p>
                <p className="text-xs text-gray-500">{business?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
