"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Package, CheckCircle, TrendingUp, AlertCircle, DollarSign, Star, QrCode, Download, Copy, ExternalLink, Loader2, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import QRCodeLib from "qrcode";

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

  // QR Code state
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrJoinUrl, setQrJoinUrl] = useState<string>("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [businessName, setBusinessName] = useState<string>("");

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

  // Generate QR code client-side
  const generateQrCodeClientSide = async (url: string): Promise<string | null> => {
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        errorCorrectionLevel: "H" as const,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 400,
      });
      return qrDataUrl;
    } catch (error) {
      console.error("Client-side QR generation error:", error);
      return null;
    }
  };

  // QR Code generation function
  const handleGenerateQrCode = async () => {
    try {
      setLoadingQr(true);

      const currentBusinessId = businessId || "demo-business";
      const baseUrl = window.location.origin;
      const joinUrl = `${baseUrl}/join-queue/${currentBusinessId}`;

      // Try API first
      const res = await fetch(`/API/queue/qrcode?business_id=${currentBusinessId}`);

      if (res.ok) {
        const data = await res.json();
        setQrCode(data.data.qr_code);
        setQrJoinUrl(data.data.join_url);
        setBusinessName(data.data.business_name || "Your Business");
      } else {
        // Fallback - generate QR code client-side
        setQrJoinUrl(joinUrl);
        const clientQr = await generateQrCodeClientSide(joinUrl);
        setQrCode(clientQr);
        setBusinessName("Your Business");
      }
      setQrDialogOpen(true);
    } catch (error) {
      console.error("QR code error:", error);
      const baseUrl = window.location.origin;
      const joinUrl = `${baseUrl}/join-queue/${businessId || "demo-business"}`;
      setQrJoinUrl(joinUrl);
      // Generate QR code client-side as fallback
      const clientQr = await generateQrCodeClientSide(joinUrl);
      setQrCode(clientQr);
      setQrDialogOpen(true);
    } finally {
      setLoadingQr(false);
    }
  };

  const copyJoinUrl = () => {
    navigator.clipboard.writeText(qrJoinUrl);
    toast.success("Queue link copied to clipboard!");
  };

  const downloadQrCode = () => {
    if (!qrCode) {
      toast.error("QR code not available");
      return;
    }
    const link = document.createElement("a");
    link.download = `queue-qr-${businessId || "business"}.png`;
    link.href = qrCode;
    link.click();
    toast.success("QR code downloaded!");
  };

  const shareQrCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join My Queue",
          text: `Join the queue at ${businessName || "our business"}`,
          url: qrJoinUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copyJoinUrl();
      }
    } else {
      copyJoinUrl();
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

      {/* QR Code Start Queue Section */}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Start Your Queue</CardTitle>
                <CardDescription className="text-base">
                  Generate QR code for customers to join your queue instantly
                </CardDescription>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleGenerateQrCode}
              disabled={loadingQr}
              className="hidden sm:flex"
            >
              {loadingQr ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-5 w-5 mr-2" />
              )}
              Generate QR Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Easy Join</p>
                <p className="text-sm text-gray-500">Customers scan & join instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Real-time Updates</p>
                <p className="text-sm text-gray-500">Live queue position tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Share2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Share Anywhere</p>
                <p className="text-sm text-gray-500">Print, display, or share online</p>
              </div>
            </div>
          </div>
          {/* Mobile button */}
          <Button
            size="lg"
            onClick={handleGenerateQrCode}
            disabled={loadingQr}
            className="w-full mt-4 sm:hidden"
          >
            {loadingQr ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <QrCode className="h-5 w-5 mr-2" />
            )}
            Generate QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common business tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-primary border-primary/50 hover:bg-primary/5"
              onClick={handleGenerateQrCode}
              disabled={loadingQr}
            >
              {loadingQr ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Generate Queue QR Code
            </Button>
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

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <QrCode className="h-6 w-6 text-primary" />
              Queue QR Code
            </DialogTitle>
            <DialogDescription>
              Customers can scan this QR code to join your queue instantly
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Current Queue Stats */}
            <div className="w-full grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.activeQueues}</p>
                <p className="text-xs text-gray-500">In Queue</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
                <p className="text-xs text-gray-500">Served Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">~5 min</p>
                <p className="text-xs text-gray-500">Avg Wait</p>
              </div>
            </div>

            {/* QR Code */}
            {qrCode ? (
              <div className="border-4 border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
                <img
                  src={qrCode}
                  alt="Queue QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
            ) : (
              <div className="border-4 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 w-64 h-64 flex flex-col items-center justify-center">
                {loadingQr ? (
                  <>
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-sm text-gray-500 text-center">
                      Generating QR code...
                    </p>
                  </>
                ) : (
                  <>
                    <QrCode className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500 text-center">
                      Click Generate to create QR
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Join URL */}
            <div className="w-full space-y-2">
              <label className="text-sm font-medium text-gray-700">Queue Join Link</label>
              <div className="flex items-center gap-2">
                <Input
                  value={qrJoinUrl}
                  readOnly
                  className="text-sm bg-gray-50"
                />
                <Button variant="outline" size="icon" onClick={copyJoinUrl} title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 w-full">
              <p className="text-sm text-blue-700 text-center">
                <span className="font-semibold">How it works:</span> Customers scan → Enter details → Get ticket number → Track their position in real-time
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={shareQrCode} className="w-full sm:w-auto">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {qrCode && (
              <Button variant="outline" onClick={downloadQrCode} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            )}
            <Button
              onClick={() => window.open(qrJoinUrl, "_blank")}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Join Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
