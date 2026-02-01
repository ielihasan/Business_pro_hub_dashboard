"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  CreditCard,
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
  const pathname = usePathname();
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

      const { data: adminRecords, error } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .eq("role", "business_owner");

      if (error || !adminRecords || adminRecords.length === 0) {
        toast.error("Business profile not found, come back to login page");
        router.push("/auth/v1/login");
        return;
      }

      // Get the first business_owner record (should only be one per user)
      const businessData = adminRecords[0];

      if (!businessData.is_approved) {
        toast.warning("Your business is pending approval");
        router.push("/auth/waiting-approval-business");
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
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
    { name: "Pricing & Plans", href: "/business/pricing", icon: CreditCard },
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
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold">
                {business?.business_name?.charAt(0).toUpperCase() || "B"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {business?.business_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{business?.business_type}</p>
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
                            ? "bg-black text-white hover:bg-black hover:text-white"
                            : "text-gray-700 hover:bg-black hover:text-white"
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
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{business?.business_name}</p>
                <p className="text-xs text-gray-400">{business?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-semibold">
                {business?.business_name?.charAt(0).toUpperCase() || "B"}
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
