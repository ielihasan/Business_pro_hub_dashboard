"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Clock, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardStats {
  totalBusinesses: number;
  pendingBusinesses: number;
  approvedBusinesses: number;
  totalCustomers: number;
  activeQueues: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

interface RecentBusiness {
  id: string;
  business_name: string;
  business_type: string;
  full_name: string;
  email: string;
  created_at: string;
  is_approved: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    pendingBusinesses: 0,
    approvedBusinesses: 0,
    totalCustomers: 0,
    activeQueues: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181";

      // ── 1. Spring Boot platform stats (bypasses Supabase RLS) ──────────
      const [statsRes, bizResult, recentResult] = await Promise.all([
        fetch(`${apiUrl}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // Approved businesses count — admins table is RLS-friendly for admin role
        supabase
          .from("admins")
          .select("id, is_approved")
          .eq("role", "business_owner"),
        // Recent 5 registrations
        supabase
          .from("admins")
          .select("id, business_name, business_type, full_name, email, created_at, is_approved")
          .eq("role", "business_owner")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // ── 2. Parse Spring Boot stats ─────────────────────────────────────
      if (statsRes.ok) {
        const json = await statsRes.json();
        const d = json.data ?? json; // ApiResponse wrapper or raw object

        // Pending businesses = not yet in businesses table → from admins
        const allBiz = bizResult.data || [];
        const pendingBusinesses = allBiz.filter((b) => !b.is_approved).length;
        const approvedBusinesses = allBiz.filter((b) => b.is_approved).length;

        setStats({
          totalBusinesses: Number(d.totalBusinesses ?? 0),
          pendingBusinesses,
          approvedBusinesses,
          totalCustomers: Number(d.totalCustomers ?? 0),
          activeQueues: Number(d.activeQueues ?? 0),
          totalOrders: Number(d.totalOrders ?? 0),
          pendingOrders: Number(d.pendingOrders ?? 0),
          completedOrders: Number(d.completedOrders ?? 0),
        });
      } else {
        // Fallback — use only Supabase admins data if backend is offline
        const allBiz = bizResult.data || [];
        const pendingBusinesses = allBiz.filter((b) => !b.is_approved).length;
        const approvedBusinesses = allBiz.filter((b) => b.is_approved).length;
        setStats((prev) => ({
          ...prev,
          totalBusinesses: allBiz.length,
          pendingBusinesses,
          approvedBusinesses,
        }));
      }

      // ── 3. Recent businesses ───────────────────────────────────────────
      setRecentBusinesses((recentResult.data as RecentBusiness[]) || []);
    } catch (error) {
      console.warn("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page heading */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Stat cards — 3 across */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        {/* Two panel row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">
          Monitor your platform performance and manage business registrations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Businesses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Businesses
            </CardTitle>
            <Building2 className="h-5 w-5 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-gray-700 font-medium">+{stats.approvedBusinesses}</span> approved
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Approvals
            </CardTitle>
            <Clock className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingBusinesses}</div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Platform users
            </p>
          </CardContent>
        </Card>

        {/* Active Queues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Queues
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeQueues}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/businesses/pending" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Review Pending Businesses
                {stats.pendingBusinesses > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pendingBusinesses}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/businesses/approved" className="block">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="mr-2 h-4 w-4" />
                View All Businesses
              </Button>
            </Link>
            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Business Registrations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Business Registrations</CardTitle>
            <CardDescription>Latest businesses that joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBusinesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No business registrations yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {business.business_name}
                        </p>
                        <Badge variant={business.is_approved ? "default" : "secondary"}>
                          {business.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {business.business_type} • {business.full_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(business.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!business.is_approved && (
                      <Link href="/admin/businesses/pending">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="font-semibold">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-gray-600">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-gray-700">{stats.completedOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="font-semibold text-gray-700">{stats.approvedBusinesses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-gray-600">{stats.pendingBusinesses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approval Rate</span>
              <span className="font-semibold">
                {stats.totalBusinesses > 0
                  ? Math.round((stats.approvedBusinesses / stats.totalBusinesses) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Queues</span>
              <span className="font-semibold text-black">{stats.activeQueues}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Customers</span>
              <span className="font-semibold">{stats.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Businesses</span>
              <span className="font-semibold">{stats.totalBusinesses}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
