"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Download,
  Eye,
  Building2,
  Users,
  Receipt,
  BarChart3,
  PieChart,
  ArrowDownRight,
  Loader2,
  Sparkles,
  Zap,
  Crown,
  AlertCircle,
  Smartphone,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

interface Payment {
  id: string;
  business_id: string;
  business_name: string;
  business_email: string;
  owner_name: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  transaction_id: string;
  created_at: string;
}

interface Stats {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  planDistribution: Record<string, number>;
  monthlyRevenue: { month: string; revenue: number; transactions: number }[];
}

interface Subscription {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
  plan_details: { name: string; price: number };
}

const paymentMethodIcons: Record<string, any> = {
  card: CreditCard,
  jazzcash: Smartphone,
  easypaisa: Smartphone,
  bank: Banknote,
  free: Sparkles,
};

const planIcons: Record<string, any> = {
  free: Sparkles,
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
};

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

export default function AnalyticsPaymentsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Payment details dialog
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPayments();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, planFilter, page]);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments?type=stats`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (data.error) throw new Error(data.error);
      setStats(data.data?.stats ?? null);
    } catch (error: any) {
      console.error("Stats error:", error);
      toast.error("Failed to load statistics");
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (planFilter !== "all") params.append("plan", planFilter);
      if (search) params.append("search", search);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments?${params}`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (data.error) throw new Error(data.error);

      setPayments(Array.isArray(data.data?.payments) ? data.data.payments : []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Payments error:", error);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments?type=subscriptions`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (data.error) throw new Error(data.error);
      setSubscriptions(Array.isArray(data.data?.subscriptions) ? data.data.subscriptions : []);
    } catch (error: any) {
      console.error("Subscriptions error:", error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchPayments();
  };

  const handleRefresh = () => {
    fetchStats();
    fetchPayments();
    fetchSubscriptions();
    toast.success("Data refreshed");
  };

  const handleExport = () => {
    const headers = ["Date", "Business", "Email", "Plan", "Amount", "Method", "Status", "Transaction ID"];
    const rows = payments.map((p) => [
      new Date(p.created_at).toLocaleDateString(),
      p.business_name,
      p.business_email,
      p.plan_name,
      `Rs. ${p.amount}`,
      p.payment_method,
      p.status,
      p.transaction_id || "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Payments exported to CSV");
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <ArrowDownRight className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanBadge = (planId: string) => {
    const PlanIcon = planIcons[planId] || Sparkles;
    const colorClass = planColors[planId] || planColors.free;
    const planName = planId.charAt(0).toUpperCase() + planId.slice(1);

    return (
      <Badge className={`${colorClass} hover:${colorClass}`}>
        <PlanIcon className="h-3 w-3 mr-1" />
        {planName}
      </Badge>
    );
  };

  const revenueChange = stats?.monthlyRevenue && stats.monthlyRevenue.length >= 2
    ? ((stats.monthlyRevenue[stats.monthlyRevenue.length - 1].revenue -
        stats.monthlyRevenue[stats.monthlyRevenue.length - 2].revenue) /
        (stats.monthlyRevenue[stats.monthlyRevenue.length - 2].revenue || 1)) *
      100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Payments</h1>
          <p className="mt-1 text-gray-600">
            Monitor revenue, subscriptions, and payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
                {revenueChange !== 0 && (
                  <div className="flex items-center mt-2 text-sm">
                    {revenueChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={revenueChange > 0 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(revenueChange).toFixed(1)}% from last month
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalTransactions || 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">All time</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Successful Payments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.successfulPayments || 0}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {stats?.totalTransactions
                    ? ((stats.successfulPayments / stats.totalTransactions) * 100).toFixed(1)
                    : 0}
                  % success rate
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending/Failed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending / Failed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {(stats?.pendingPayments || 0) + (stats?.failedPayments || 0)}
                </p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-yellow-600">{stats?.pendingPayments || 0} pending</span>
                  <span className="text-red-600">{stats?.failedPayments || 0} failed</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between h-48 gap-2">
                  {stats.monthlyRevenue.map((item, index) => {
                    const maxRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.revenue));
                    const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs text-gray-500 mb-1">
                            {formatCurrency(item.revenue)}
                          </span>
                          <div
                            className="w-full bg-black rounded-t transition-all duration-500"
                            style={{ height: `${Math.max(height, 5)}%`, minHeight: "8px" }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 mt-2">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-black rounded" />
                    <span>Revenue</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <BarChart3 className="h-12 w-12 mb-2 text-gray-300" />
                <p>No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Plan Distribution
            </CardTitle>
            <CardDescription>Active subscriptions by plan</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.planDistribution ? (
              <div className="space-y-4">
                {Object.entries(stats.planDistribution).map(([plan, count]) => {
                  const total = Object.values(stats.planDistribution).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  const PlanIcon = planIcons[plan] || Sparkles;

                  return (
                    <div key={plan} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <PlanIcon className="h-4 w-4" />
                          <span className="capitalize font-medium">{plan}</span>
                        </div>
                        <span className="text-gray-600">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            plan === "free"
                              ? "bg-gray-400"
                              : plan === "starter"
                              ? "bg-blue-500"
                              : plan === "professional"
                              ? "bg-purple-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Separator className="my-4" />
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Businesses</span>
                  <span>{Object.values(stats.planDistribution).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <PieChart className="h-12 w-12 mb-2 text-gray-300" />
                <p>No subscription data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Payments and Subscriptions */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Payment Transactions
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Business Subscriptions
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Payment Transactions</CardTitle>
                  <CardDescription>All payment records from businesses</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by business, email, transaction..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-lg">No payment records found</p>
                  <p className="text-sm mt-1">
                    Payment transactions will appear here when businesses upgrade their plans
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Business</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => {
                          const PaymentIcon = paymentMethodIcons[payment.payment_method] || CreditCard;
                          return (
                            <TableRow key={payment.id}>
                              <TableCell className="text-sm text-gray-600">
                                {formatDate(payment.created_at)}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{payment.business_name}</p>
                                  <p className="text-xs text-gray-500">{payment.business_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{getPlanBadge(payment.plan_id)}</TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <PaymentIcon className="h-4 w-4 text-gray-400" />
                                  <span className="capitalize text-sm">{payment.payment_method}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(payment.status)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setIsDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Business Subscriptions</CardTitle>
              <CardDescription>Current subscription status of all businesses</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-lg">No businesses found</p>
                  <p className="text-sm mt-1">
                    Business subscriptions will appear here when businesses are approved
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Current Plan</TableHead>
                        <TableHead>Monthly Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Member Since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.business_name || "N/A"}</p>
                              <p className="text-xs text-gray-500">{sub.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.full_name}</TableCell>
                          <TableCell>{getPlanBadge(sub.subscription_plan || "free")}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(sub.plan_details?.price || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                sub.subscription_status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {sub.subscription_status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.subscription_expires_at
                              ? formatDate(sub.subscription_expires_at)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(sub.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Transaction information</DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                {getStatusBadge(selectedPayment.status)}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-sm">{selectedPayment.transaction_id || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Business</span>
                  <span className="font-medium">{selectedPayment.business_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span>{selectedPayment.business_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Owner</span>
                  <span>{selectedPayment.owner_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  {getPlanBadge(selectedPayment.plan_id)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="capitalize">{selectedPayment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span>{formatDateTime(selectedPayment.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="text-right text-sm">{selectedPayment.description}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
