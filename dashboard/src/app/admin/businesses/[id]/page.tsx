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
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Star,
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
  revenue: number;
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
  totalQueues: number;
  todayQueues: number;
  queueByStatus: Record<string, number>;
  totalCustomers: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  activeServices: number;
  totalServices: number;
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

/* ──────────────────────────── Sub-components ────────────────────────── */

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

function SkeletonPage() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-72" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
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

  /* Revenue bar chart */
  const maxRevenue = Math.max(
    ...stats.monthlyRevenue.map((m) => Number(m.revenue) || 0),
    1
  );

  /* Queue status breakdown */
  const queueStatusEntries = Object.entries(stats.queueByStatus).sort(
    (a, b) => b[1] - a[1]
  );
  const totalStatusCount = queueStatusEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Back + Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              {PLAN_LABELS[business.subscription_plan] ||
                business.subscription_plan}
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
        <p className="text-sm text-gray-500">
          Member since {formatDate(business.created_at)}
        </p>
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Queues"
          value={stats.totalQueues}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Today's Queues"
          value={stats.todayQueues}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<CreditCard className="h-5 w-5" />}
          sub={`${stats.successfulPayments} payments`}
        />
        <StatCard
          title="Orders"
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

      {/* ── Business Info + Revenue Chart ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Business Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
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

            {/* Subscription */}
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
                  {PLAN_LABELS[business.subscription_plan] ||
                    business.subscription_plan}
                </Badge>
              </div>
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
                <span className="text-gray-500">Approved</span>
                <span className="font-medium">
                  {formatDate(business.approved_at)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <TrendingUp className="h-4 w-4" />
              Revenue Overview (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.every((m) => Number(m.revenue) === 0) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No revenue recorded yet
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3" style={{ height: "180px" }}>
                  {stats.monthlyRevenue.map((item, index) => {
                    const rev = Number(item.revenue) || 0;
                    const barH =
                      maxRevenue > 0
                        ? Math.max((rev / maxRevenue) * 140, rev > 0 ? 6 : 2)
                        : 2;
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                      >
                        <span className="text-xs text-gray-500 mb-1 text-center leading-tight">
                          {rev > 0 ? formatCurrency(rev) : ""}
                        </span>
                        <div
                          className="w-full bg-black rounded-t transition-all duration-500"
                          style={{ height: `${barH}px` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-2 border-t pt-2">
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
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
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
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              STATUS_COLORS[status] ||
                              "bg-gray-100 text-gray-700"
                            }
                          >
                            {status.replace("_", " ")}
                          </Badge>
                        </div>
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
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Services / Queue Types
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
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.services.map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell className="font-medium">{svc.name}</TableCell>
                      <TableCell>{formatCurrency(svc.price)}</TableCell>
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
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Activity className="h-4 w-4" />
            Recent Queue Activity
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
                  <TableHead>Position</TableHead>
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
                    <TableCell className="text-gray-500">
                      {q.customer_phone || "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {q.service_type || "—"}
                    </TableCell>
                    <TableCell>
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
                        "—"
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

      {/* ── Recent Payments ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <CreditCard className="h-4 w-4" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
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
                    <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell className="text-gray-500 capitalize">
                      {p.payment_method || "—"}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs font-mono">
                      {p.transaction_id
                        ? p.transaction_id.slice(0, 16) + "..."
                        : "—"}
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

      {/* ── Orders Summary ────────────────────────────────────────── */}
      {Object.keys(stats.ordersByStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              Orders Breakdown
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Footer spacing ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          Last updated: {new Date().toLocaleString("en-PK")}
        </span>
      </div>
    </div>
  );
}
