"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Package, CheckCircle, TrendingUp, AlertCircle, DollarSign, Star } from "lucide-react";
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
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get current business user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setBusinessId(user.id);

      // Fetch queue statistics
      const { data: queues } = await supabase
        .from("queues")
        .select("*")
        .eq("business_id", user.id);

      const today = new Date().toISOString().split('T')[0];
      const activeQueues = queues?.filter(q => q.status === "waiting" || q.status === "in_progress").length || 0;
      const totalQueuesToday = queues?.filter(q => q.joined_at?.startsWith(today)).length || 0;
      const completedToday = queues?.filter(q => q.status === "completed" && q.completed_at?.startsWith(today)).length || 0;

      // Fetch order statistics
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", user.id);

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending" || o.status === "processing").length || 0;
      const completedOrders = orders?.filter(o => o.status === "completed").length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      // Fetch unique customers
      const uniqueCustomers = new Set(queues?.map(q => q.customer_id).filter(Boolean));
      const totalCustomers = uniqueCustomers.size;

      // Fetch staff count
      const { count: staffCount } = await supabase
        .from("staff")
        .select("*", { count: "exact", head: true })
        .eq("business_id", user.id)
        .eq("is_active", true);

      // Fetch average rating
      const { data: feedback } = await supabase
        .from("feedback")
        .select("rating")
        .eq("business_id", user.id);

      const averageRating = feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
        : 0;

      setStats({
        activeQueues,
        totalQueuesToday,
        completedToday,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCustomers,
        totalStaff: staffCount || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue,
      });

      // Fetch recent queues
      const { data: recentQueueData } = await supabase
        .from("queues")
        .select("*")
        .eq("business_id", user.id)
        .order("joined_at", { ascending: false })
        .limit(5);

      setRecentQueues(recentQueueData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        {/* Active Queues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Queues
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeQueues}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">+{stats.totalQueuesToday}</span> today
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
            <Package className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalOrders} total orders
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Customers
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Unique customers
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Rating
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Customer satisfaction
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
            <CardDescription>Common business tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/business/queue">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Manage Queue
                {stats.activeQueues > 0 && (
                  <Badge variant="default" className="ml-auto">
                    {stats.activeQueues}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/business/orders">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                View Orders
                {stats.pendingOrders > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pendingOrders}
                  </Badge>
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

        {/* Recent Queue Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Queue Activity</CardTitle>
            <CardDescription>Latest customers in your queue</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQueues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No queue activity yet</p>
                <p className="text-sm mt-1">Customers will appear here when they join your queue</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQueues.map((queue) => (
                  <div
                    key={queue.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {queue.customer_name}
                        </p>
                        <Badge className={getStatusColor(queue.status)}>
                          {queue.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {queue.service_type || "General service"} • Position #{queue.position}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(queue.joined_at).toLocaleString()}
                      </p>
                    </div>
                    <Link href="/business/queue">
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
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
              <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
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
