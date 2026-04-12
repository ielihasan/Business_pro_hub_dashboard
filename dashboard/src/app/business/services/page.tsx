"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Store,
  Clock,
  Users,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Banknote,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CheckCircle,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { getErrorMessage } from "@/lib/utils";
import { resolveBusinessId } from "@/lib/resolve-business-id";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────── */
interface QueueType {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  color: string;
  estimated_service_time: number;
  max_capacity: number;
  is_active: boolean;
  price?: number;
}

interface QueueEntry {
  id: string;
  service_type?: string;
  status: string;
}

interface ServiceRevenue {
  service_id: string | null;
  service_name: string;
  color: string;
  total_booked: number;
  completed_revenue: number;
  advance_collected: number;
  payment_outstanding: number;
  total_visits: number;
  paid_visits: number;
  completed_count: number;
  avg_booking_value: number;
}

interface RevenueSummary {
  total_booked: number;
  completed_revenue: number;
  advance_collected: number;
  payment_outstanding: number;
  total_visits: number;
  paid_visits: number;
  completed_count: number;
}

interface DailyTrend {
  date: string;
  day: string;
  booked: number;
  advance: number;
}

interface RecentTransaction {
  id: string;
  ticket_no: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  advance_paid: number;
  payment_left: number;
  status: string;
  created_at: string;
}

interface RevenueData {
  summary: RevenueSummary;
  by_service: ServiceRevenue[];
  daily_trend: DailyTrend[];
  recent_transactions: RecentTransaction[];
}

/* ─── Component ─────────────────────────────────────────────── */
export default function ServicesRevenuePage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQueueType, setEditingQueueType] = useState<QueueType | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    estimated_service_time: 5,
    max_capacity: 50,
    price: 0,
  });

  /* ── Init */
  useEffect(() => {
    resolveBusinessId().then(id => {
      if (id) setBusinessId(id);
      else setLoading(false);
    });
  }, []);

  /* ── Fetch queue types */
  const fetchQueueTypes = useCallback(async () => {
    if (!businessId) return;
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types?business_id=${businessId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setQueueTypes(j.data ?? []);
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  /* ── Fetch live queue entries */
  const fetchEntries = useCallback(async () => {
    if (!businessId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/queue?business_id=${businessId}&status=all`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setQueueEntries(j.data?.data ?? []);
      }
    } catch { /* silent */ }
  }, [businessId]);

  /* ── Fetch revenue data */
  const fetchRevenue = useCallback(async () => {
    if (!businessId) return;
    setRevenueLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/revenue?business_id=${businessId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setRevenueData(j.data ?? null);
      }
    } catch { /* silent */ }
    finally { setRevenueLoading(false); }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      fetchQueueTypes();
      fetchEntries();
      fetchRevenue();
    }
  }, [businessId, fetchQueueTypes, fetchEntries, fetchRevenue]);

  const handleRefresh = () => {
    fetchQueueTypes();
    fetchEntries();
    fetchRevenue();
    toast.success("Refreshed");
  };

  /* ── CRUD helpers */
  const resetForm = () => {
    setEditingQueueType(null);
    setForm({ name: "", description: "", color: "#3B82F6", estimated_service_time: 5, max_capacity: 50, price: 0 });
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (qt: QueueType) => {
    setEditingQueueType(qt);
    setForm({
      name: qt.name,
      description: qt.description ?? "",
      color: qt.color,
      estimated_service_time: qt.estimated_service_time,
      max_capacity: qt.max_capacity,
      price: qt.price ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Service name is required"); return; }
    if (!businessId) return;
    setSaving(true);
    try {
      const isEditing = !!editingQueueType;
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${editingQueueType!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...form, business_id: businessId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Service ${isEditing ? "updated" : "created"}!`);
      setDialogOpen(false);
      resetForm();
      fetchQueueTypes();
      fetchRevenue();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => setDeleteTarget({ id, name });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || "Failed to delete service");
      toast.success("Service deleted!");
      setDeleteTarget(null);
      fetchQueueTypes();
      fetchRevenue();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Live count helpers */
  const countForType = (qtId: string, status: string) =>
    queueEntries.filter(e => e.service_type === qtId && e.status === status).length;

  const fmt = (n: number) => `Rs. ${Number(n || 0).toLocaleString()}`;

  /* ── Trend change % */
  const trendPct = (() => {
    if (!revenueData?.daily_trend || revenueData.daily_trend.length < 2) return null;
    const trend = revenueData.daily_trend;
    const last = Number(trend[trend.length - 1].booked);
    const prev = Number(trend[trend.length - 2].booked);
    if (prev === 0) return last > 0 ? 100 : 0;
    return ((last - prev) / prev) * 100;
  })();

  /* ── Skeleton */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    );
  }

  /* ── Render ── */
  const summary = revenueData?.summary;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services &amp; Revenue</h1>
          <p className="mt-1 text-gray-500">
            Manage your services and track revenue per queue type
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Add Service
          </Button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-green-700">Total Booked</p>
              <div className="p-1.5 bg-green-200 rounded-lg">
                <Banknote className="h-4 w-4 text-green-700" />
              </div>
            </div>
            {revenueLoading
              ? <Skeleton className="h-8 w-28 mt-1" />
              : <p className="text-2xl font-bold text-green-800">{fmt(summary?.total_booked ?? 0)}</p>}
            <p className="text-xs text-green-600 mt-1">All paid queue entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-blue-700">Completed Revenue</p>
              <div className="p-1.5 bg-blue-200 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
            </div>
            {revenueLoading
              ? <Skeleton className="h-8 w-24 mt-1" />
              : <p className="text-2xl font-bold text-blue-800">{fmt(summary?.completed_revenue ?? 0)}</p>}
            {!revenueLoading && trendPct !== null && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${trendPct >= 0 ? "text-green-600" : "text-red-500"}`}>
                {trendPct >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trendPct).toFixed(1)}% vs yesterday
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-amber-700">Advance Collected</p>
              <div className="p-1.5 bg-amber-200 rounded-lg">
                <CreditCard className="h-4 w-4 text-amber-700" />
              </div>
            </div>
            {revenueLoading
              ? <Skeleton className="h-8 w-20 mt-1" />
              : <p className="text-2xl font-bold text-amber-800">{fmt(summary?.advance_collected ?? 0)}</p>}
            <p className="text-xs text-amber-600 mt-1">From all active queues</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-purple-700">Outstanding</p>
              <div className="p-1.5 bg-purple-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-purple-700" />
              </div>
            </div>
            {revenueLoading
              ? <Skeleton className="h-8 w-20 mt-1" />
              : <p className="text-2xl font-bold text-purple-800">{fmt(summary?.payment_outstanding ?? 0)}</p>}
            <p className="text-xs text-purple-600 mt-1">Remaining for active customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Store className="h-4 w-4" />Services
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />Revenue Details
          </TabsTrigger>
        </TabsList>

        {/* ═══ SERVICES TAB ═══ */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-5 w-5" />Your Services
              </CardTitle>
              <p className="text-sm text-gray-500">
                Each service gets its own queue lane and QR code in Queue Management
              </p>
            </CardHeader>
            <CardContent>
              {queueTypes.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <Store className="h-14 w-14 mx-auto mb-4 text-gray-200" />
                  <p className="text-lg font-medium text-gray-600">No services configured</p>
                  <p className="text-sm mt-2 max-w-xs mx-auto">
                    Add services you offer — each gets its own queue lane and QR code
                  </p>
                  <Button className="mt-5" onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />Add Your First Service
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {queueTypes.map(qt => {
                    const waiting = countForType(qt.id, "waiting");
                    const serving = countForType(qt.id, "in_progress") + countForType(qt.id, "serving");
                    // Revenue for this service from the revenue data
                    const svcRev = revenueData?.by_service.find(s => s.service_id === qt.id);
                    return (
                      <div
                        key={qt.id}
                        className="relative p-4 rounded-xl border-2 transition-all hover:shadow-md"
                        style={{ borderColor: qt.color + "40", backgroundColor: qt.color + "08" }}
                      >
                        {!qt.is_active && (
                          <Badge className="absolute top-3 right-3 bg-gray-100 text-gray-400 border-0 text-[10px]">
                            Inactive
                          </Badge>
                        )}

                        <div className="flex items-start justify-between pr-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                              style={{ backgroundColor: qt.color }}
                            >
                              {qt.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{qt.name}</h3>
                              <p className="text-xs text-gray-500">{qt.description || "No description"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />~{qt.estimated_service_time} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />Max {qt.max_capacity}
                          </span>
                          {(qt.price ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <Banknote className="h-3.5 w-3.5" />Rs.{Number(qt.price).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex gap-2 flex-wrap">
                          {waiting > 0 && (
                            <Badge className="bg-gray-100 text-gray-700 text-[11px]">{waiting} waiting</Badge>
                          )}
                          {serving > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 text-[11px]">{serving} serving</Badge>
                          )}
                          {waiting === 0 && serving === 0 && (
                            <Badge className="bg-green-50 text-green-600 text-[11px]">Queue clear</Badge>
                          )}
                        </div>

                        {/* Mini revenue strip */}
                        {svcRev && Number(svcRev.total_booked) > 0 && (
                          <div className="mt-3 pt-3 border-t border-dashed flex items-center justify-between text-xs"
                               style={{ borderColor: qt.color + "40" }}>
                            <span className="text-gray-500 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {svcRev.paid_visits} paid visits
                            </span>
                            <span className="font-semibold text-green-700">
                              {fmt(Number(svcRev.total_booked))}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm" variant="outline" className="flex-1 text-xs"
                            onClick={() => openEdit(qt)}
                            style={{ borderColor: qt.color + "60", color: qt.color }}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />Edit
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(qt.id, qt.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ REVENUE TAB ═══ */}
        <TabsContent value="revenue" className="space-y-6">

          {revenueLoading ? (
            /* ── Revenue skeleton — mirrors exact layout so tab feels instant ── */
            <div className="space-y-6 animate-pulse">
              {/* Chart card skeleton */}
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
                {/* Fake area chart */}
                <div className="relative h-[200px] flex items-end gap-3 pt-6">
                  {[55, 70, 45, 80, 60, 90, 65].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-emerald-100 to-emerald-50"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                  {/* Y-axis ghost */}
                  <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between">
                    {[3, 2, 1, 0].map(i => <Skeleton key={i} className="h-2.5 w-10" />)}
                  </div>
                </div>
                {/* X labels */}
                <div className="flex gap-3 border-t pt-2">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                    <div key={d} className="flex-1 flex justify-center">
                      <Skeleton className="h-2.5 w-7" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Table card skeleton */}
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <div className="space-y-0 divide-y">
                  {/* Header row */}
                  <div className="flex gap-4 py-3">
                    {[140, 80, 100, 80, 110, 90, 100].map((w, i) => (
                      <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
                    ))}
                  </div>
                  {/* Data rows */}
                  {Array.from({ length: 4 }).map((_, row) => (
                    <div key={row} className="flex items-center gap-4 py-3.5">
                      <div className="flex items-center gap-2" style={{ width: 140 }}>
                        <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-2.5 w-14" />
                        </div>
                      </div>
                      {[80, 100, 80, 110, 90, 100].map((w, i) => (
                        <Skeleton key={i} className="h-3 rounded ml-auto" style={{ width: w }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 3 cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-7 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-2.5 w-48" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 14-Day Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />14-Day Revenue Trend
                  </CardTitle>
                  <p className="text-sm text-gray-500">Daily booked revenue and advance collected over the last 14 days</p>
                </CardHeader>
                <CardContent>
                  {revenueData?.daily_trend && revenueData.daily_trend.some(d => Number(d.booked) > 0 || Number(d.advance) > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={revenueData.daily_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bookedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="advanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => v >= 1000 ? `Rs.${(v / 1000).toFixed(0)}k` : `Rs.${v}`}
                          width={60}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [fmt(value), name === "booked" ? "Total Booked" : "Advance"]}
                          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="booked"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#bookedGradient)"
                          dot={{ r: 3, fill: "#10b981" }}
                          activeDot={{ r: 5 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="advance"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fill="url(#advanceGradient)"
                          dot={{ r: 3, fill: "#f59e0b" }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <BarChart3 className="h-10 w-10 mb-2 text-gray-200" />
                      <p className="text-sm">No revenue data yet — complete some queue entries to see the trend</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Per-Service Revenue Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />Revenue by Service
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Breakdown of earned revenue, advance collected, and outstanding per queue lane
                  </p>
                </CardHeader>
                <CardContent>
                  {!revenueData?.by_service || revenueData.by_service.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Banknote className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p>No revenue data available yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead className="text-right">Paid Visits</TableHead>
                            <TableHead className="text-right">Total Booked</TableHead>
                            <TableHead className="text-right">Completed</TableHead>
                            <TableHead className="text-right">Advance Collected</TableHead>
                            <TableHead className="text-right">Outstanding</TableHead>
                            <TableHead className="text-right">Avg / Visit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData.by_service.map((svc, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                                    style={{ backgroundColor: svc.color }}
                                  >
                                    {svc.service_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-900">{svc.service_name}</p>
                                    <p className="text-xs text-gray-400">{svc.total_visits} total visits</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1 text-sm">
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  <span>{svc.paid_visits}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-700">
                                {fmt(Number(svc.total_booked))}
                              </TableCell>
                              <TableCell className="text-right text-blue-700">
                                {Number(svc.completed_revenue) > 0
                                  ? fmt(Number(svc.completed_revenue))
                                  : <span className="text-gray-400 text-xs">—</span>}
                              </TableCell>
                              <TableCell className="text-right text-amber-700">
                                {fmt(Number(svc.advance_collected))}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(svc.payment_outstanding) > 0 ? (
                                  <span className="text-red-600 font-medium">
                                    {fmt(Number(svc.payment_outstanding))}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-gray-600 text-sm">
                                {Number(svc.avg_booking_value) > 0
                                  ? fmt(Number(svc.avg_booking_value))
                                  : <span className="text-gray-400">—</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Totals row */}
                          {summary && (
                            <TableRow className="bg-gray-50 font-semibold border-t-2">
                              <TableCell className="text-gray-700">Total</TableCell>
                              <TableCell className="text-right text-gray-700">{summary.paid_visits}</TableCell>
                              <TableCell className="text-right text-green-700">{fmt(Number(summary.total_booked))}</TableCell>
                              <TableCell className="text-right text-blue-700">
                                {Number(summary.completed_revenue) > 0 ? fmt(Number(summary.completed_revenue)) : "—"}
                              </TableCell>
                              <TableCell className="text-right text-amber-700">{fmt(Number(summary.advance_collected))}</TableCell>
                              <TableCell className="text-right text-red-600">
                                {Number(summary.payment_outstanding) > 0 ? fmt(Number(summary.payment_outstanding)) : "—"}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional info cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Completed Visits</p>
                        <p className="text-2xl font-bold text-gray-900">{summary?.completed_count ?? 0}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Paid visits with status = completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Store className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Active Services</p>
                        <p className="text-2xl font-bold text-gray-900">{queueTypes.filter(q => q.is_active).length}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Of {queueTypes.length} total configured services</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Banknote className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Avg per Paid Visit</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary && (summary.paid_visits ?? 0) > 0
                            ? fmt(Math.round(Number(summary.total_booked) / summary.paid_visits))
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Average booking value across paid visits</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              {revenueData?.recent_transactions && revenueData.recent_transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-5 w-5" />Recent Transactions
                    </CardTitle>
                    <p className="text-sm text-gray-500">Last {revenueData.recent_transactions.length} paid queue entries</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Advance</TableHead>
                            <TableHead className="text-right">Left</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData.recent_transactions.map((txn, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs font-semibold text-gray-700">
                                #{txn.ticket_no}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium">{txn.customer_name || "—"}</p>
                                <p className="text-xs text-gray-400">{txn.customer_phone || ""}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: txn.service_color }}
                                  />
                                  <span className="text-sm">{txn.service_name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-700 text-sm">
                                {fmt(Number(txn.total_price))}
                              </TableCell>
                              <TableCell className="text-right text-amber-700 text-sm">
                                {Number(txn.advance_paid) > 0 ? fmt(Number(txn.advance_paid)) : <span className="text-gray-400">—</span>}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {Number(txn.payment_left) > 0
                                  ? <span className="text-red-600 font-medium">{fmt(Number(txn.payment_left))}</span>
                                  : <span className="text-gray-400">—</span>}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-[10px] capitalize ${
                                    txn.status === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                                    txn.status === "cancelled" ? "bg-red-100 text-red-600 border-red-200" :
                                    txn.status === "waiting"   ? "bg-blue-100 text-blue-700 border-blue-200" :
                                    "bg-gray-100 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {txn.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {txn.created_at ? new Date(txn.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric" }) : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{editingQueueType ? "Edit Service" : "Create Service"}</DialogTitle>
            <DialogDescription>
              {editingQueueType
                ? "Update this service's details"
                : "A new queue lane will appear in Queue Management immediately after saving"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input
                placeholder="e.g., Haircut, Latte, Consultation"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this service"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color" value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Est. Service Time (min)</Label>
                <Input
                  type="number" min={1} value={form.estimated_service_time}
                  onChange={e => setForm(p => ({ ...p, estimated_service_time: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Capacity</Label>
              <Input
                type="number" min={1} value={form.max_capacity}
                onChange={e => setForm(p => ({ ...p, max_capacity: parseInt(e.target.value) || 50 }))}
              />
              <p className="text-xs text-gray-400">Maximum customers allowed in this queue at once</p>
            </div>
            <div className="space-y-2">
              <Label>Price per Item (Rs.)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs.</span>
                <Input
                  type="number" min={0} step={0.01} value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  className="pl-10" placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-400">Used for revenue tracking and customer invoice estimation</p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQueueType ? "Update" : "Create"} Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
