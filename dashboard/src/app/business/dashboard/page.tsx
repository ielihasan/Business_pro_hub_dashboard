"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Package, CheckCircle, Star, QrCode, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BusinessStats {
  activeQueues: number;
  totalQueuesToday: number;
  completedToday: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalStaff: number;
  averageRating: number;
  totalRevenue: number;
}

interface RecentQueue {
  id: string;
  customer_name: string;
  service_type: string;
  status: string;
  position: number;
  joined_at: string;
  created_at: string;
}

export default function BusinessDashboardPage() {
  const [stats, setStats] = useState<BusinessStats>({
    activeQueues: 0,
    totalQueuesToday: 0,
    completedToday: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    totalStaff: 0,
    averageRating: 0,
    totalRevenue: 0,
  });
  const [recentQueues, setRecentQueues] = useState<RecentQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setBusinessId(user.id);
    };
    init();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!businessId) return;
    try {
      const today = new Date().toISOString().split("T")[0];

      // Query queue entries and orders directly from Supabase (no Spring Boot needed)
      const [{ data: queueEntries }, { data: orders }] = await Promise.all([
        supabase.from("queues").select("*").eq("business_id", businessId),
        supabase.from("orders").select("*").eq("business_id", businessId),
      ]);

      // Queue stats
      const rawEntries: any[] = queueEntries || [];

      const activeQueues = rawEntries.filter(
        (q) => q.status === "waiting" || q.status === "in_progress" || q.status === "serving"
      ).length;
      const totalQueuesToday = rawEntries.filter(
        (q) => (q.joined_at || q.created_at || "").startsWith(today)
      ).length;
      const completedToday = rawEntries.filter(
        (q) => q.status === "completed" && (q.completed_at || "").startsWith(today)
      ).length;
      const uniqueCustomers = new Set(rawEntries.map((q) => q.customer_id).filter(Boolean));

      const recent = [...rawEntries]
        .sort((a, b) => new Date(b.joined_at || b.created_at).getTime() - new Date(a.joined_at || a.created_at).getTime())
        .slice(0, 5);
      setRecentQueues(recent);

      setStats((prev) => ({
        ...prev,
        activeQueues,
        totalQueuesToday,
        completedToday,
        totalCustomers: uniqueCustomers.size,
      }));

      // Orders stats
      const ordersArr: any[] = orders || [];
      const totalOrders = ordersArr.length;
      const pendingOrders = ordersArr.filter((o) => o.status === "pending" || o.status === "processing").length;
      const completedOrders = ordersArr.filter((o) => o.status === "completed").length;
      const totalRevenue = ordersArr.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      setStats((prev) => ({ ...prev, totalOrders, pendingOrders, completedOrders, totalRevenue }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [businessId, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-gray-100 text-gray-800";
      case "in_progress":
      case "serving": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor your business performance and manage daily operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Queues</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeQueues}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">+{stats.totalQueuesToday}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            <Package className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.totalOrders} total orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">Unique customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
            <Star className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Management CTA */}
      <Card className="border-2 border-gray-200 bg-gray-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-black rounded-xl">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Queue Management</CardTitle>
                <CardDescription className="text-base">
                  Manage your queues, generate QR codes, and create queue types
                </CardDescription>
              </div>
            </div>
            <Link href="/business/queue">
              <Button size="lg" className="hidden sm:flex bg-black hover:bg-gray-800 text-white">
                Go to Queue Management
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{stats.activeQueues} Active</p>
                <p className="text-sm text-gray-500">Customers waiting</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{stats.completedToday} Completed</p>
                <p className="text-sm text-gray-500">Served today</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="p-2 bg-gray-100 rounded-lg">
                <QrCode className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">QR Codes</p>
                <p className="text-sm text-gray-500">Generate & share</p>
              </div>
            </div>
          </div>
          <Link href="/business/queue">
            <Button size="lg" className="w-full mt-4 sm:hidden bg-black hover:bg-gray-800 text-white">
              Go to Queue Management
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common business tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/business/queue">
              <Button variant="outline" className="w-full justify-start hover:bg-black hover:text-white transition-colors">
                <QrCode className="mr-2 h-4 w-4" />
                Manage Queue & QR Codes
                {stats.activeQueues > 0 && (
                  <Badge variant="default" className="ml-auto">{stats.activeQueues}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/business/orders">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                View Orders
                {stats.pendingOrders > 0 && (
                  <Badge className="ml-auto bg-red-100 text-red-700 border-0">{stats.pendingOrders}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/business/customers">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Customer Database
              </Button>
            </Link>
            <Link href="/business/services">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="mr-2 h-4 w-4" />
                Manage Services
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Queue Activity</CardTitle>
                <CardDescription>Latest customers in your queue</CardDescription>
              </div>
              <Link href="/business/queue">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentQueues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No queue activity yet</p>
                <p className="text-sm mt-1">Customers will appear here when they join your queue</p>
                <Link href="/business/queue">
                  <Button className="mt-4 bg-black hover:bg-gray-800 text-white">
                    <QrCode className="h-4 w-4 mr-2" />
                    Set Up Your Queue
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQueues.map((queue) => (
                  <div
                    key={queue.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{queue.customer_name}</p>
                        <Badge className={getStatusColor(queue.status)}>{queue.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {queue.service_type || "General service"} · Position #{queue.position}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(queue.joined_at || queue.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Link href="/business/queue">
                      <Button size="sm" variant="outline">Manage</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Queues</span>
              <span className="font-semibold">{stats.totalQueuesToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{stats.completedToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Now</span>
              <span className="font-semibold text-blue-600">{stats.activeQueues}</span>
            </div>
          </CardContent>
        </Card>

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
              <span className="font-semibold text-green-600">{stats.completedOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Staff</span>
              <span className="font-semibold">{stats.totalStaff}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customers</span>
              <span className="font-semibold">{stats.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rating</span>
              <span className="font-semibold">
                {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} ⭐` : "No ratings yet"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
