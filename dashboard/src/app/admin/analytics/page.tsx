"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  CreditCard,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Mock data for demonstration - will be replaced with real Stripe data later
const mockRevenueData = [
  { month: "Jan", revenue: 4500, subscriptions: 12, transactions: 45 },
  { month: "Feb", revenue: 5200, subscriptions: 15, transactions: 52 },
  { month: "Mar", revenue: 4800, subscriptions: 14, transactions: 48 },
  { month: "Apr", revenue: 6100, subscriptions: 18, transactions: 61 },
  { month: "May", revenue: 7200, subscriptions: 22, transactions: 72 },
  { month: "Jun", revenue: 6800, subscriptions: 20, transactions: 68 },
  { month: "Jul", revenue: 8500, subscriptions: 25, transactions: 85 },
  { month: "Aug", revenue: 9200, subscriptions: 28, transactions: 92 },
  { month: "Sep", revenue: 8800, subscriptions: 26, transactions: 88 },
  { month: "Oct", revenue: 10500, subscriptions: 32, transactions: 105 },
  { month: "Nov", revenue: 11200, subscriptions: 35, transactions: 112 },
  { month: "Dec", revenue: 12500, subscriptions: 38, transactions: 125 },
];

const mockPayments = [
  {
    id: "pay_1",
    transaction_id: "txn_3L8K9mJ2eZvKYr2C",
    business_name: "Coffee Corner",
    business_email: "coffee@example.com",
    amount: 29.99,
    currency: "USD",
    status: "completed",
    payment_method: "card",
    card_last4: "4242",
    card_brand: "Visa",
    plan: "Basic",
    description: "Monthly subscription - Basic Plan",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "pay_2",
    transaction_id: "txn_4M9L0nK3fAwLZs3D",
    business_name: "Tech Solutions",
    business_email: "tech@example.com",
    amount: 99.99,
    currency: "USD",
    status: "completed",
    payment_method: "card",
    card_last4: "1234",
    card_brand: "Mastercard",
    plan: "Premium",
    description: "Monthly subscription - Premium Plan",
    created_at: "2024-01-14T14:22:00Z",
  },
  {
    id: "pay_3",
    transaction_id: "txn_5N0M1oL4gBxMAt4E",
    business_name: "Fitness Hub",
    business_email: "fitness@example.com",
    amount: 29.99,
    currency: "USD",
    status: "pending",
    payment_method: "card",
    card_last4: "5678",
    card_brand: "Visa",
    plan: "Basic",
    description: "Monthly subscription - Basic Plan",
    created_at: "2024-01-14T09:15:00Z",
  },
  {
    id: "pay_4",
    transaction_id: "txn_6O1N2pM5hCyNBu5F",
    business_name: "Beauty Studio",
    business_email: "beauty@example.com",
    amount: 99.99,
    currency: "USD",
    status: "completed",
    payment_method: "card",
    card_last4: "9012",
    card_brand: "Amex",
    plan: "Premium",
    description: "Monthly subscription - Premium Plan",
    created_at: "2024-01-13T16:45:00Z",
  },
  {
    id: "pay_5",
    transaction_id: "txn_7P2O3qN6iDzOCv6G",
    business_name: "Auto Service",
    business_email: "auto@example.com",
    amount: 29.99,
    currency: "USD",
    status: "failed",
    payment_method: "card",
    card_last4: "3456",
    card_brand: "Visa",
    plan: "Basic",
    description: "Monthly subscription - Basic Plan",
    created_at: "2024-01-13T11:30:00Z",
  },
  {
    id: "pay_6",
    transaction_id: "txn_8Q3P4rO7jEaPDw7H",
    business_name: "Pet Care Plus",
    business_email: "petcare@example.com",
    amount: 49.99,
    currency: "USD",
    status: "completed",
    payment_method: "card",
    card_last4: "7890",
    card_brand: "Mastercard",
    plan: "Standard",
    description: "Monthly subscription - Standard Plan",
    created_at: "2024-01-12T13:20:00Z",
  },
  {
    id: "pay_7",
    transaction_id: "txn_9R4Q5sP8kFbQEx8I",
    business_name: "Restaurant Delight",
    business_email: "restaurant@example.com",
    amount: 99.99,
    currency: "USD",
    status: "refunded",
    payment_method: "card",
    card_last4: "2468",
    card_brand: "Visa",
    plan: "Premium",
    description: "Monthly subscription - Premium Plan",
    created_at: "2024-01-11T08:45:00Z",
  },
  {
    id: "pay_8",
    transaction_id: "txn_0S5R6tQ9lGcRFy9J",
    business_name: "Dental Clinic",
    business_email: "dental@example.com",
    amount: 49.99,
    currency: "USD",
    status: "completed",
    payment_method: "card",
    card_last4: "1357",
    card_brand: "Visa",
    plan: "Standard",
    description: "Monthly subscription - Standard Plan",
    created_at: "2024-01-10T15:10:00Z",
  },
];

const planDistribution = [
  { name: "Free", value: 45, color: "#94a3b8" },
  { name: "Basic", value: 30, color: "#3b82f6" },
  { name: "Standard", value: 15, color: "#8b5cf6" },
  { name: "Premium", value: 10, color: "#f59e0b" },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#3b82f6",
  },
  subscriptions: {
    label: "Subscriptions",
    color: "#8b5cf6",
  },
  transactions: {
    label: "Transactions",
    color: "#10b981",
  },
};

interface Payment {
  id: string;
  transaction_id: string;
  business_name: string;
  business_email: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  card_last4: string;
  card_brand: string;
  plan: string;
  description: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter payments
  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.business_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;

    const matchesPlan =
      planFilter === "all" || payment.plan.toLowerCase() === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate stats
  const totalRevenue = mockPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalTransactions = mockPayments.length;
  const completedTransactions = mockPayments.filter(
    (p) => p.status === "completed"
  ).length;
  const pendingTransactions = mockPayments.filter(
    (p) => p.status === "pending"
  ).length;
  const failedTransactions = mockPayments.filter(
    (p) => p.status === "failed"
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
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
            <AlertCircle className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Payments</h1>
          <p className="mt-2 text-gray-600">
            Track revenue, subscriptions, and payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+12.5% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+8.2% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Successful Payments</p>
                <p className="text-2xl font-bold">{completedTransactions}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {((completedTransactions / totalTransactions) * 100).toFixed(1)}% success rate
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending / Failed</p>
                <p className="text-2xl font-bold">
                  {pendingTransactions} / {failedTransactions}
                </p>
                <p className="text-sm text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={mockRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Active subscriptions by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {planDistribution.map((plan) => (
                <div key={plan.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {plan.name}: {plan.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions & Subscriptions</CardTitle>
          <CardDescription>Monthly comparison of transactions and new subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <BarChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="transactions" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="subscriptions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Payment Records */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>
                All payment transactions from businesses
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              Stripe Integration Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by business, email, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
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
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Receipt className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        No payments found
                      </h3>
                      <p className="mt-2 text-gray-500">
                        Try adjusting your search or filter criteria
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-mono text-sm">{payment.transaction_id}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <CreditCard className="h-3 w-3" />
                            {payment.card_brand} •••• {payment.card_last4}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.business_name}</p>
                          <p className="text-sm text-gray-500">{payment.business_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.plan}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openViewDialog(payment)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Receipt className="h-4 w-4 mr-2" />
                              Download Receipt
                            </DropdownMenuItem>
                            {payment.status === "completed" && (
                              <DropdownMenuItem className="text-red-600">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Initiate Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Showing {filteredPayments.length} of {mockPayments.length} payments
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" className="w-9">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Complete transaction information
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6 py-4">
              {/* Transaction Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Transaction Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono">{selectedPayment.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{formatDate(selectedPayment.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Business Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Business Name</span>
                    <span className="font-medium">{selectedPayment.business_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span>{selectedPayment.business_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan</span>
                    <Badge variant="outline">{selectedPayment.plan}</Badge>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Payment Method
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method</span>
                    <span className="capitalize">{selectedPayment.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Card</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        {selectedPayment.card_brand} •••• {selectedPayment.card_last4}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Description
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p>{selectedPayment.description}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Receipt className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                {selectedPayment.status === "completed" && (
                  <Button variant="destructive" className="flex-1">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Initiate Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
