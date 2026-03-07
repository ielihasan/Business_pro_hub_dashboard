"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  CreditCard,
  ShoppingBag,
  Activity,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────── Types ──────────────────────────────── */

interface Business {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string | null;
  business_phone: string | null;
  business_description: string | null;
  is_active: boolean;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  approved_at: string | null;
  created_at: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;           // platform earns FROM business
  customerRevenue: number;   // business earns FROM customers
}

interface RecentQueue {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  service_type: string | null;
  status: string;
  position: number | null;
  priority: string | null;
  created_at: string;
  completed_at: string | null;
}

interface RecentPayment {
  id: string;
  plan_id: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  // Queue / activity
  totalQueues: number;
  todayQueues: number;
  queueByStatus: Record<string, number>;
  customersServed: number;
  totalCustomers: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;

  // Platform ← Business (subscription payments)
  platformRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;

  // Business ← Customers (queue + order revenue)
  customerRevenue: number;
  customerQueueRevenue: number;
  customerOrderRevenue: number;

  // Services
  activeServices: number;
  totalServices: number;

  // Charts & lists
  monthlyRevenue: MonthlyRevenue[];
  recentQueues: RecentQueue[];
  recentPayments: RecentPayment[];
  services: ServiceItem[];
}

interface BusinessDetail {
  business: Business;
  stats: Stats;
}

/* ──────────────────────────── Helpers ───────────────────────────────── */

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-yellow-100 text-yellow-700",
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 2999,
  professional: 5999,
  enterprise: 14999,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  waiting: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  called: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

function formatCurrency(v: number) {
  return `Rs. ${Number(v).toLocaleString("en-PK")}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ────────────────────── Revenue Flow Card ───────────────────────────── */

function FlowCard({
  direction,
  from,
  to,
  amount,
  sub,
  icon,
  color,
}: {
  direction: "in" | "out";
  from: string;
  to: string;
  amount: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {direction === "in" ? (
                <ArrowDownLeft className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {from} → {to}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{amount}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────── Stat Card ─────────────────────────────────── */

function StatCard({
  title,
  value,
  icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────── Skeleton ────────────────────────────────── */

function SkeletonPage() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );
}

/* ───────────────────────────── Main Page ────────────────────────────── */

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181";

      const res = await fetch(`${apiUrl}/api/admin/businesses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to load business (${res.status})`);
      }

      const json = await res.json();
      setData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load business";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <SkeletonPage />;

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Business not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const { business, stats } = data;

  /* Service UUID → name lookup (queue.service_type stores the service UUID) */
  const serviceNameMap: Record<string, string> = Object.fromEntries(
    stats.services.map((s) => [s.id, s.name])
  );

  /** Resolve a service_type UUID to a human-readable name */
  const resolveService = (serviceType: string | null): string => {
    if (!serviceType) return "—";
    const name = serviceNameMap[serviceType];
    if (name) return name;
    // If it looks like a UUID, don't expose it raw
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(serviceType) ? "Unknown Service" : serviceType;
  };

  /* Revenue bar chart — dual bars per month */
  const maxBar = Math.max(
    ...stats.monthlyRevenue.flatMap((m) => [
      Number(m.revenue) || 0,
      Number(m.customerRevenue) || 0,
    ]),
    1
  );

  /* Queue status breakdown */
  const queueStatusEntries = Object.entries(stats.queueByStatus).sort(
    (a, b) => b[1] - a[1]
  );
  const totalStatusCount = queueStatusEntries.reduce((s, [, v]) => s + v, 0);

  const planPrice = PLAN_PRICES[business.subscription_plan] || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Back ──────────────────────────────────────────────────── */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Businesses
      </Button>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {business.business_name}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{business.business_type}</Badge>
            <Badge
              className={
                PLAN_COLORS[business.subscription_plan] ||
                "bg-gray-100 text-gray-700"
              }
            >
              {PLAN_LABELS[business.subscription_plan] || business.subscription_plan}
              {planPrice > 0 && ` · ${formatCurrency(planPrice)}/mo`}
            </Badge>
            <Badge
              className={
                business.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {business.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-500 shrink-0">
          Member since {formatDate(business.created_at)}
        </p>
      </div>

      {/* ── Revenue Flow ───────────────────────────────────────────
           Two sides: what the platform gets FROM the business,
           and what the business gets FROM its customers           */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Revenue Flow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Platform ← Business */}
          <FlowCard
            direction="in"
            from="Business"
            to="Platform"
            amount={formatCurrency(stats.platformRevenue)}
            sub={`${stats.successfulPayments} subscription payment${stats.successfulPayments !== 1 ? "s" : ""} · ${stats.pendingPayments} pending`}
            icon={<TrendingDown className="h-5 w-5" />}
            color="border-blue-400"
          />

          {/* Business ← Customers */}
          <FlowCard
            direction="out"
            from="Customers"
            to="Business"
            amount={formatCurrency(stats.customerRevenue)}
            sub={`Queue: ${formatCurrency(stats.customerQueueRevenue)} · Orders: ${formatCurrency(stats.customerOrderRevenue)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="border-green-400"
          />
        </div>
      </div>

      {/* ── Activity Stats ────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Activity
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Queues"
            value={stats.totalQueues}
            icon={<Activity className="h-5 w-5" />}
            sub={`${stats.todayQueues} today`}
          />
          <StatCard
            title="Customers Served"
            value={stats.customersServed}
            icon={<Users className="h-5 w-5" />}
            sub={`${stats.totalCustomers} walk-in records`}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <StatCard
            title="Services"
            value={`${stats.activeServices} / ${stats.totalServices}`}
            icon={<Layers className="h-5 w-5" />}
            sub="active / total"
          />
        </div>
      </div>

      {/* ── Business Info + Dual Revenue Chart ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Business Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Business Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Owner</p>
                <p className="font-medium">{business.full_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium break-all">{business.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Phone</p>
                <p className="font-medium">{business.business_phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Address</p>
                <p className="font-medium">{business.business_address || "—"}</p>
              </div>
            </div>
            {business.business_description && (
              <div className="pt-2 border-t">
                <p className="text-gray-500 text-xs mb-1">Description</p>
                <p className="text-gray-700 leading-relaxed">
                  {business.business_description}
                </p>
              </div>
            )}

            {/* Subscription block */}
            <div className="pt-3 border-t space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                <Star className="h-3 w-3" /> Subscription
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Plan</span>
                <Badge
                  className={
                    PLAN_COLORS[business.subscription_plan] ||
                    "bg-gray-100 text-gray-700"
                  }
                >
                  {PLAN_LABELS[business.subscription_plan] || business.subscription_plan}
                </Badge>
              </div>
              {planPrice > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Monthly fee</span>
                  <span className="font-medium">{formatCurrency(planPrice)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="font-medium capitalize">
                  {business.subscription_status || "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Expires</span>
                <span className="font-medium">
                  {formatDate(business.subscription_expires_at)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Approved on</span>
                <span className="font-medium">{formatDate(business.approved_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dual Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <TrendingUp className="h-4 w-4" />
              Monthly Revenue (Last 6 Months)
            </CardTitle>
            {/* Legend */}
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                Platform revenue (from business)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="h-2.5 w-2.5 rounded-sm bg-green-500" />
                Business revenue (from customers)
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.every(
              (m) => Number(m.revenue) === 0 && Number(m.customerRevenue) === 0
            ) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No revenue recorded yet
              </div>
            ) : (
              <>
                <div className="flex items-end gap-4" style={{ height: "180px" }}>
                  {stats.monthlyRevenue.map((item, index) => {
                    const platRev = Number(item.revenue) || 0;
                    const custRev = Number(item.customerRevenue) || 0;
                    const platH = maxBar > 0 ? Math.max((platRev / maxBar) * 140, platRev > 0 ? 6 : 2) : 2;
                    const custH = maxBar > 0 ? Math.max((custRev / maxBar) * 140, custRev > 0 ? 6 : 2) : 2;
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                      >
                        <div className="w-full flex gap-1 items-end justify-center" style={{ height: "145px" }}>
                          {/* Platform bar (blue) */}
                          <div className="flex-1 flex flex-col items-center justify-end h-full">
                            {platRev > 0 && (
                              <span className="text-[9px] text-blue-600 mb-0.5 leading-none text-center">
                                {formatCurrency(platRev)}
                              </span>
                            )}
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all duration-500"
                              style={{ height: `${platH}px` }}
                            />
                          </div>
                          {/* Customer bar (green) */}
                          <div className="flex-1 flex flex-col items-center justify-end h-full">
                            {custRev > 0 && (
                              <span className="text-[9px] text-green-600 mb-0.5 leading-none text-center">
                                {formatCurrency(custRev)}
                              </span>
                            )}
                            <div
                              className="w-full bg-green-500 rounded-t transition-all duration-500"
                              style={{ height: `${custH}px` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 border-t pt-2">
                  {stats.monthlyRevenue.map((item, index) => (
                    <div key={index} className="flex-1 text-center">
                      <span className="text-xs text-gray-500">{item.month}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Queue Status + Services ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Queue Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Queue Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queueStatusEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No queue entries yet
              </p>
            ) : (
              <div className="space-y-3">
                {queueStatusEntries.map(([status, count]) => {
                  const pct =
                    totalStatusCount > 0
                      ? Math.round((count / totalStatusCount) * 100)
                      : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <Badge
                          className={
                            STATUS_COLORS[status] || "bg-gray-100 text-gray-700"
                          }
                        >
                          {status.replace("_", " ")}
                        </Badge>
                        <span className="text-gray-600 font-medium">
                          {count}{" "}
                          <span className="text-gray-400 font-normal">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-black h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Services / Queue Types
              <span className="ml-2 font-normal text-gray-400">
                (what business charges customers per visit)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No services configured
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Price / Visit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.services.map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell className="font-medium">{svc.name}</TableCell>
                      <TableCell className="font-semibold text-green-700">
                        {formatCurrency(svc.price)}
                      </TableCell>
                      <TableCell>
                        {svc.is_active ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Queue Activity ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Activity className="h-4 w-4" />
            Recent Queue Activity
            <span className="font-normal text-gray-400 ml-1">(last 5 entries)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentQueues.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No queue activity yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentQueues.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      {q.customer_name}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {q.customer_phone || "—"}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {resolveService(q.service_type)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {q.position != null ? `#${q.position}` : "—"}
                    </TableCell>
                    <TableCell>
                      {q.priority ? (
                        <Badge
                          className={
                            q.priority === "vip"
                              ? "bg-yellow-100 text-yellow-700"
                              : q.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-600"
                          }
                        >
                          {q.priority}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">normal</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          STATUS_COLORS[q.status] || "bg-gray-100 text-gray-700"
                        }
                      >
                        {q.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {formatDateTime(q.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Subscription Payments (Platform ← Business) ───────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <CreditCard className="h-4 w-4" />
            Subscription Payments
            <span className="font-normal text-gray-400 ml-1">
              — what this business pays the platform
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Payment status summary */}
          <div className="flex gap-4 mb-4 pb-4 border-b">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-semibold">{stats.successfulPayments}</span>
              <span className="text-gray-400">paid</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{stats.pendingPayments}</span>
              <span className="text-gray-400">pending</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-semibold">{stats.failedPayments}</span>
              <span className="text-gray-400">failed</span>
            </div>
          </div>

          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No payments recorded
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium capitalize">
                      {p.plan_id || "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700">
                      {formatCurrency(Number(p.amount))}
                    </TableCell>
                    <TableCell className="text-gray-500 capitalize text-sm">
                      {p.payment_method || "—"}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs font-mono">
                      {p.transaction_id ? (
                        <span className="flex items-center gap-1 group">
                          <span title={p.transaction_id}>
                            {p.transaction_id.slice(0, 16)}…
                          </span>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy transaction ID"
                            onClick={() => {
                              navigator.clipboard.writeText(p.transaction_id!);
                              toast.success("Transaction ID copied");
                            }}
                          >
                            <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.status === "completed" ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        ) : p.status === "failed" ? (
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                        <Badge
                          className={
                            PAYMENT_STATUS_COLORS[p.status] ||
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {p.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">
                      {formatDate(p.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Orders Breakdown ──────────────────────────────────────── */}
      {Object.keys(stats.ordersByStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              Orders Breakdown
              <span className="font-normal text-gray-400 ml-1">
                — what customers ordered from this business
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3"
                >
                  <span className="text-lg font-bold text-gray-900">
                    {count}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">
                    {status}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-green-50 rounded-lg px-4 py-3 border border-green-100">
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(stats.customerOrderRevenue)}
                </span>
                <span className="text-sm text-green-600">total earned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t">
        <Calendar className="h-3.5 w-3.5" />
        <span>Last updated: {new Date().toLocaleString("en-PK")}</span>
      </div>
    </div>
  );
}
