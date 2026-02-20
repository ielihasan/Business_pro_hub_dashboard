"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  UserPlus,
  QrCode,
  RefreshCw,
  MoreHorizontal,
  Phone,
  Timer,
  Download,
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Share2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import QRCodeLib from "qrcode";

/* ─── Types ─────────────────────────────────────────────────── */
interface ScannedUser {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
}

interface QueueEntry {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
  service_type?: string;
  notes?: string;
  priority: string;
  position: number;
  status: "waiting" | "serving" | "completed" | "cancelled";
  scanned_user?: ScannedUser;
  joined_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
}

interface QueueStats {
  total: number;
  waiting: number;
  serving: number;
  completed: number;
  cancelled: number;
  avgWaitTime: number;
}

interface BusinessData {
  id: string;
  business_name: string;
}

interface QueueType {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  estimated_service_time: number;
  max_capacity: number;
  is_active: boolean;
}

/* ─── Pure helpers (outside component) ──────────────────────── */
function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function entriesForType(
  entries: QueueEntry[],
  queueTypeId: string | null,
  statusFilter: string
): QueueEntry[] {
  const matched = entries.filter((e) =>
    queueTypeId === null
      ? !e.service_type || !isUuid(e.service_type)
      : e.service_type === queueTypeId
  );
  return statusFilter === "all" ? matched : matched.filter((e) => e.status === statusFilter);
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getWaitTime(createdAt: string) {
  const min = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "waiting":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Waiting</Badge>;
    case "serving":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Play className="h-3 w-3 mr-1" />Serving</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

/* ─── QueueLane component (defined OUTSIDE page fn to avoid remount) */
interface QueueLaneProps {
  queueType: QueueType | null;
  entries: QueueEntry[];
  loadingQr: boolean;
  onGenerateQr: (queueTypeId?: string) => void;
  onAddCustomer: (queueTypeId?: string) => void;
  onStatusChange: (entry: QueueEntry, status: "serving" | "completed" | "cancelled") => void;
  onCancelClick: (entry: QueueEntry) => void;
}

function QueueLane({
  queueType, entries, loadingQr,
  onGenerateQr, onAddCustomer, onStatusChange, onCancelClick,
}: QueueLaneProps) {
  const waiting = entries.filter(e => e.status === "waiting").length;
  const serving = entries.filter(e => e.status === "serving").length;
  const color   = queueType?.color || "#6B7280";
  const name    = queueType?.name  || "General Queue";

  return (
    <Card className="overflow-hidden">
      {/* Lane header */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-3"
        style={{ backgroundColor: color + "18", borderBottom: `2px solid ${color}40` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ backgroundColor: color }}
          >
            {queueType ? queueType.name.charAt(0).toUpperCase() : <Users className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 leading-tight truncate">{name}</p>
            {queueType?.description && (
              <p className="text-xs text-gray-500 truncate">{queueType.description}</p>
            )}
          </div>
          {/* Mini stats */}
          <div className="hidden sm:flex items-center gap-2 ml-1 shrink-0">
            <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
              <Clock className="h-3 w-3 mr-1" />{waiting} waiting
            </Badge>
            {serving > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                <Play className="h-3 w-3 mr-1" />{serving} serving
              </Badge>
            )}
          </div>
        </div>

        {/* Lane actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm" variant="outline" className="h-8 text-xs gap-1"
            onClick={() => onGenerateQr(queueType?.id)}
            disabled={loadingQr}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">QR</span>
          </Button>
          <Button
            size="sm" className="h-8 text-xs gap-1 text-white"
            style={{ backgroundColor: color }}
            onClick={() => onAddCustomer(queueType?.id)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Entries */}
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <Users className="h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No customers yet</p>
            <p className="text-xs text-gray-400 max-w-[280px]">
              {queueType
                ? `Share the ${queueType.name} QR code or add a customer manually`
                : "Add a customer or share the general queue link"}
            </p>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="outline" className="text-xs h-7"
                onClick={() => onGenerateQr(queueType?.id)} disabled={loadingQr}>
                <QrCode className="h-3 w-3 mr-1" />QR Code
              </Button>
              <Button size="sm" className="text-xs h-7 text-white"
                style={{ backgroundColor: color }}
                onClick={() => onAddCustomer(queueType?.id)}>
                <UserPlus className="h-3 w-3 mr-1" />Add Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead className="w-[64px] pl-5">#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Wait</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className={entry.status === "serving" ? "bg-blue-50/60" : ""}>
                    <TableCell className="pl-5">
                      <div className="font-mono font-bold text-sm" style={{ color }}>
                        {String(entry.position).padStart(3, "0")}
                      </div>
                      <div className="text-[10px] text-gray-400">{formatTime(entry.created_at)}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.scanned_user?.avatar_url ? (
                          <img src={entry.scanned_user.avatar_url} alt=""
                            className="h-7 w-7 rounded-full object-cover shrink-0" />
                        ) : entry.customer_id ? (
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                        ) : null}
                        <div>
                          <p className="font-medium text-sm leading-tight">
                            {entry.scanned_user?.full_name || entry.customer_name}
                          </p>
                          {(entry.scanned_user?.phone_number || entry.customer_phone) && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {entry.scanned_user?.phone_number || entry.customer_phone}
                            </p>
                          )}
                          <div className="flex gap-1 mt-0.5">
                            {entry.customer_id && (
                              <Badge variant="secondary"
                                className="text-[9px] px-1 py-0 h-3.5 bg-blue-50 text-blue-700 border-blue-200">
                                App
                              </Badge>
                            )}
                            {entry.priority === "high" && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">High</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-sm">
                      {(entry.status === "waiting" || entry.status === "serving")
                        ? <span className="font-medium">{getWaitTime(entry.created_at)}</span>
                        : <span className="text-gray-400">—</span>}
                    </TableCell>

                    <TableCell>{getStatusBadge(entry.status)}</TableCell>

                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {entry.customer_id ? "App / QR" : "Walk-in"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {entry.status === "waiting" && (
                            <DropdownMenuItem onClick={() => onStatusChange(entry, "serving")}>
                              <Play className="h-4 w-4 mr-2 text-blue-600" />Start Serving
                            </DropdownMenuItem>
                          )}
                          {entry.status === "serving" && (
                            <DropdownMenuItem onClick={() => onStatusChange(entry, "completed")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />Mark Complete
                            </DropdownMenuItem>
                          )}
                          {(entry.status === "waiting" || entry.status === "serving") && (
                            <DropdownMenuItem
                              onClick={() => onCancelClick(entry)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function QueueManagementPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0, waiting: 0, serving: 0, completed: 0, cancelled: 0, avgWaitTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isQueueActive, setIsQueueActive] = useState(true);

  // Add customer dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    queue_type_id: "", notes: "", priority: "normal",
  });

  // QR picker (step 1) + QR display (step 2)
  const [qrPickerOpen, setQrPickerOpen] = useState(false);
  const [qrPickerSelection, setQrPickerSelection] = useState<string>("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrJoinUrl, setQrJoinUrl] = useState<string>("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [selectedQueueTypeForQr, setSelectedQueueTypeForQr] = useState<string>("all");

  // Cancel confirm
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Queue types
  const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
  const [queueTypeDialogOpen, setQueueTypeDialogOpen] = useState(false);
  const [editingQueueType, setEditingQueueType] = useState<QueueType | null>(null);
  const [savingQueueType, setSavingQueueType] = useState(false);
  const [newQueueType, setNewQueueType] = useState({
    name: "", description: "", color: "#3B82F6",
    estimated_service_time: 5, max_capacity: 50,
  });

  /* ── Fetch business */
  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("admins")
          .select("id, business_name")
          .eq("id", user.id).eq("role", "business_owner").single();
        if (data) setBusiness(data);
      }
    };
    fetchBusiness();
  }, []);

  /* ── Fetch queue types */
  const fetchQueueTypes = useCallback(async (businessId: string) => {
    try {
      const res = await fetch(`/API/queue-types?business_id=${businessId}`);
      if (res.ok) { const j = await res.json(); setQueueTypes(j.data ?? []); }
    } catch (err) { console.error("Error fetching queue types:", err); }
  }, []);

  /* ── Fetch ALL entries (split client-side per lane) */
  const fetchQueue = useCallback(async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const res = await fetch(`/API/queue?business_id=${business.id}&status=all`);
      const data = await res.json();
      if (res.ok) { setQueueEntries(data.data || []); setStats(data.stats); }
    } catch (err) { console.error("Fetch queue error:", err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [business?.id]);

  useEffect(() => {
    if (business?.id) {
      fetchQueue();
      fetchQueueTypes(business.id);
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [business?.id, fetchQueue, fetchQueueTypes]);

  /* ── Queue type CRUD */
  const handleSaveQueueType = async () => {
    if (!newQueueType.name.trim()) { toast.error("Queue type name is required"); return; }
    if (!business?.id) { toast.error("Business not loaded"); return; }
    setSavingQueueType(true);
    try {
      const isEditing = !!editingQueueType;
      const url = isEditing ? `/API/queue-types/${editingQueueType!.id}` : "/API/queue-types";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newQueueType, business_id: business.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Queue type ${isEditing ? "updated" : "created"}!`);
      await fetchQueueTypes(business.id);
      setQueueTypeDialogOpen(false);
      resetQueueTypeForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save queue type");
    } finally { setSavingQueueType(false); }
  };

  const handleDeleteQueueType = async (id: string) => {
    if (!confirm("Delete this queue type?")) return;
    if (!business?.id) return;
    try {
      const res = await fetch(`/API/queue-types/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Queue type deleted!");
      await fetchQueueTypes(business.id);
    } catch (err: any) { toast.error(err.message || "Failed to delete"); }
  };

  const handleEditQueueType = (qt: QueueType) => {
    setEditingQueueType(qt);
    setNewQueueType({ name: qt.name, description: qt.description || "", color: qt.color,
      estimated_service_time: qt.estimated_service_time, max_capacity: qt.max_capacity });
    setQueueTypeDialogOpen(true);
  };

  const resetQueueTypeForm = () => {
    setEditingQueueType(null);
    setNewQueueType({ name: "", description: "", color: "#3B82F6", estimated_service_time: 5, max_capacity: 50 });
  };

  /* ── Add customer */
  const openAddCustomer = useCallback((queueTypeId?: string) => {
    setNewCustomer({
      customer_name: "", customer_phone: "", customer_email: "",
      queue_type_id: queueTypeId || "", notes: "", priority: "normal",
    });
    setAddDialogOpen(true);
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomer.customer_name) { toast.error("Customer name is required"); return; }
    if (!newCustomer.customer_phone) { toast.error("Phone number is required"); return; }
    if (!business?.id) { toast.error("Business not loaded"); return; }
    try {
      setAddingCustomer(true);
      const res = await fetch("/API/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          customer_name: newCustomer.customer_name,
          customer_phone: newCustomer.customer_phone,
          customer_email: newCustomer.customer_email,
          queue_type_id: (newCustomer.queue_type_id && newCustomer.queue_type_id !== "__general__") ? newCustomer.queue_type_id : undefined,
          notes: newCustomer.notes,
          priority: newCustomer.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const qt = queueTypes.find(q => q.id === newCustomer.queue_type_id);
      toast.success(`Added to${qt ? ` ${qt.name}` : ""} queue — #${data.data.position}`);
      setAddDialogOpen(false);
      fetchQueue();
    } catch (err: any) {
      toast.error(err.message || "Failed to add customer");
    } finally { setAddingCustomer(false); }
  };

  /* ── Status change */
  const handleStatusChange = useCallback(async (
    entry: QueueEntry, newStatus: "serving" | "completed" | "cancelled"
  ) => {
    try {
      const res = await fetch(`/API/queue/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(`Status → ${newStatus}`);
      // optimistic update
      setQueueEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
    } catch (err: any) { toast.error(err.message || "Failed to update status"); }
  }, []);

  const handleCancelClick = useCallback((entry: QueueEntry) => {
    setSelectedEntry(entry);
    setCancelDialogOpen(true);
  }, []);

  /* ── QR helpers */
  const buildJoinUrl = (queueTypeId?: string) => {
    const bId = business?.id || "demo-business";
    const base = `${window.location.origin}/join-queue/${bId}`;
    return queueTypeId ? `${base}?queue_type=${queueTypeId}` : base;
  };

  const generateQrCodeClientSide = async (url: string) => {
    try {
      return await QRCodeLib.toDataURL(url, {
        errorCorrectionLevel: "H", margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" }, width: 400,
      });
    } catch { return null; }
  };

  const openQrPicker = () => { setQrPickerSelection(""); setQrPickerOpen(true); };

  const handleGenerateQrCode = useCallback(async (queueTypeId?: string) => {
    setLoadingQr(true);
    setSelectedQueueTypeForQr(queueTypeId || "all");
    const joinUrl = buildJoinUrl(queueTypeId);
    try {
      setQrCode(await generateQrCodeClientSide(joinUrl));
      setQrJoinUrl(joinUrl);
    } catch (e) { console.error(e); }
    finally { setQrDialogOpen(true); setLoadingQr(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  const copyJoinUrl = () => { navigator.clipboard.writeText(qrJoinUrl); toast.success("Link copied!"); };

  const downloadQrCode = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    const qt = queueTypes.find(t => t.id === selectedQueueTypeForQr);
    link.download = qt ? `queue-qr-${qt.name.toLowerCase().replace(/\s+/g, "-")}.png` : "queue-qr.png";
    link.href = qrCode; link.click();
    toast.success("QR downloaded!");
  };

  const shareQrCode = async () => {
    if (navigator.share) {
      try {
        const qt = queueTypes.find(t => t.id === selectedQueueTypeForQr);
        await navigator.share({
          title: qt ? `Join ${qt.name} Queue` : "Join Our Queue",
          text: `Join the queue at ${business?.business_name || "our business"}`,
          url: qrJoinUrl,
        });
        return;
      } catch { /* fallthrough */ }
    }
    copyJoinUrl();
  };

  const selectedQrQueueType = queueTypes.find(t => t.id === selectedQueueTypeForQr);

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
          <p className="mt-1 text-gray-500">Manage your customer queues in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={isQueueActive} onCheckedChange={setIsQueueActive} />
            <Label className="text-sm">Queue {isQueueActive ? "Open" : "Closed"}</Label>
          </div>
          <Button onClick={() => openAddCustomer()}>
            <UserPlus className="h-4 w-4 mr-2" />Add Customer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />Queue
            {stats.waiting > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-yellow-500 text-white rounded-full">
                {stats.waiting}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="queue-types" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />Queue Types
            {queueTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{queueTypes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ══ QUEUE TAB ══ */}
        <TabsContent value="queue" className="space-y-6">

          {/* Global stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-gray-500">Total Today</p><p className="text-2xl font-bold">{stats.total}</p></div>
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-yellow-700">Waiting</p><p className="text-2xl font-bold text-yellow-800">{stats.waiting}</p></div>
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-blue-700">Serving</p><p className="text-2xl font-bold text-blue-800">{stats.serving}</p></div>
                  <Play className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-green-700">Completed</p><p className="text-2xl font-bold text-green-800">{stats.completed}</p></div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-red-700">Cancelled</p><p className="text-2xl font-bold text-red-800">{stats.cancelled}</p></div>
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-purple-700">Avg Wait</p><p className="text-2xl font-bold text-purple-800">{stats.avgWaitTime}m</p></div>
                  <Timer className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status filter + refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-500">Show:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="serving">Serving</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchQueue} disabled={refreshing} className="h-8">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* One lane per queue type — always rendered (shows 0-customer empty state) */}
              {queueTypes.map(qt => (
                <QueueLane
                  key={qt.id}
                  queueType={qt}
                  entries={entriesForType(queueEntries, qt.id, statusFilter)}
                  loadingQr={loadingQr}
                  onGenerateQr={handleGenerateQrCode}
                  onAddCustomer={openAddCustomer}
                  onStatusChange={handleStatusChange}
                  onCancelClick={handleCancelClick}
                />
              ))}

              {/* General lane — always rendered */}
              <QueueLane
                key="general"
                queueType={null}
                entries={entriesForType(queueEntries, null, statusFilter)}
                loadingQr={loadingQr}
                onGenerateQr={handleGenerateQrCode}
                onAddCustomer={openAddCustomer}
                onStatusChange={handleStatusChange}
                onCancelClick={handleCancelClick}
              />

              {/* Prompt to create queue types if none exist */}
              {queueTypes.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <Layers className="h-10 w-10 text-gray-200" />
                    <div>
                      <p className="font-semibold text-gray-600">No queue types created yet</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-sm">
                        Go to <strong>Queue Types</strong> tab to create queues — each type gets its own lane, QR code, and customer list.
                      </p>
                    </div>
                    <Button variant="outline" size="sm"
                      onClick={() => document.querySelector<HTMLButtonElement>('[value="queue-types"]')?.click()}>
                      <Plus className="h-4 w-4 mr-2" />Create Queue Type
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ══ QUEUE TYPES TAB ══ */}
        <TabsContent value="queue-types" className="space-y-6">

          {/* QR card */}
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Generate QR Code</CardTitle>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Each queue type gets its own QR — customers scan and join instantly.
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={openQrPicker} disabled={loadingQr} className="hidden sm:flex">
                  {loadingQr ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <QrCode className="h-5 w-5 mr-2" />}
                  Generate QR
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
                  <div><p className="font-semibold text-gray-900">Easy Join</p><p className="text-sm text-gray-500">Customers scan &amp; join instantly</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <div className="p-2 bg-green-100 rounded-lg"><Clock className="h-5 w-5 text-green-600" /></div>
                  <div><p className="font-semibold text-gray-900">Real-time Updates</p><p className="text-sm text-gray-500">Live queue position tracking</p></div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <div className="p-2 bg-purple-100 rounded-lg"><Share2 className="h-5 w-5 text-purple-600" /></div>
                  <div><p className="font-semibold text-gray-900">Per-Queue QR</p><p className="text-sm text-gray-500">Separate QR per queue type</p></div>
                </div>
              </div>
              <Button size="lg" onClick={openQrPicker} disabled={loadingQr} className="sm:hidden mt-4 w-full">
                {loadingQr ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <QrCode className="h-5 w-5 mr-2" />}
                Generate QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Queue types grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Queue Types</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Each type appears as its own lane in the Queue tab with its own QR code
                  </p>
                </div>
                <Button onClick={() => { resetQueueTypeForm(); setQueueTypeDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />Add Queue Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {queueTypes.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Settings className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No queue types yet</p>
                  <p className="text-sm mt-1">Create one to manage different services with separate queues</p>
                  <Button className="mt-4" onClick={() => { resetQueueTypeForm(); setQueueTypeDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Create First Queue Type
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {queueTypes.map(qt => {
                    const laneEntries = entriesForType(queueEntries, qt.id, "all");
                    const waiting = laneEntries.filter(e => e.status === "waiting").length;
                    const serving = laneEntries.filter(e => e.status === "serving").length;
                    return (
                      <div key={qt.id}
                        className="relative p-4 rounded-xl border-2 transition-all hover:shadow-md"
                        style={{ borderColor: qt.color + "40", backgroundColor: qt.color + "08" }}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                              style={{ backgroundColor: qt.color }}>
                              {qt.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{qt.name}</h3>
                              <p className="text-xs text-gray-500">{qt.description || "No description"}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditQueueType(qt)}>
                              <Edit2 className="h-4 w-4 text-gray-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteQueueType(qt.id)}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />~{qt.estimated_service_time} min</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />Max {qt.max_capacity}</span>
                          <span className="text-yellow-600 font-medium">{waiting} waiting</span>
                          {serving > 0 && <span className="text-blue-600 font-medium">{serving} serving</span>}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs"
                            onClick={() => handleGenerateQrCode(qt.id)} disabled={loadingQr}
                            style={{ borderColor: qt.color + "60", color: qt.color }}>
                            <QrCode className="h-3.5 w-3.5 mr-1" />QR Code
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs"
                            onClick={() => openAddCustomer(qt.id)}>
                            <UserPlus className="h-3.5 w-3.5 mr-1" />Add Customer
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
      </Tabs>

      {/* ══ DIALOGS ══ */}

      {/* QR Picker */}
      <Dialog open={qrPickerOpen} onOpenChange={setQrPickerOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />Generate Queue QR Code
            </DialogTitle>
            <DialogDescription>
              Choose which queue this QR is for. Customers who scan it join that queue automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            <button onClick={() => setQrPickerSelection("general")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${qrPickerSelection === "general" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">General Queue</p>
                <p className="text-sm text-gray-500">No specific service — open to everyone</p>
              </div>
              {qrPickerSelection === "general" && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
            </button>

            {queueTypes.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm border border-dashed rounded-xl">
                <Layers className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No queue types yet — create one to generate a specific QR
              </div>
            ) : (
              queueTypes.filter(qt => qt.is_active).map(qt => (
                <button key={qt.id} onClick={() => setQrPickerSelection(qt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${qrPickerSelection === qt.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: qt.color }}>
                    {qt.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{qt.name}</p>
                    <p className="text-sm text-gray-500">{qt.description || `~${qt.estimated_service_time} min · Max ${qt.max_capacity}`}</p>
                  </div>
                  {qrPickerSelection === qt.id && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrPickerOpen(false)}>Cancel</Button>
            <Button disabled={!qrPickerSelection || loadingQr}
              onClick={() => { setQrPickerOpen(false); handleGenerateQrCode(qrPickerSelection === "general" ? undefined : qrPickerSelection); }}>
              {loadingQr ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              Generate QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Display */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: selectedQrQueueType ? selectedQrQueueType.color + "20" : "hsl(var(--primary)/0.1)" }}>
                <QrCode className="h-5 w-5" style={{ color: selectedQrQueueType?.color || "hsl(var(--primary))" }} />
              </div>
              <div>
                <DialogTitle className="text-lg leading-tight">
                  {selectedQrQueueType ? `QR Code — ${selectedQrQueueType.name}` : "General Queue QR Code"}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {selectedQrQueueType
                    ? `Customers scan to join the ${selectedQrQueueType.name} queue`
                    : "Customers scan to join the general queue"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r">
              {qrCode ? (
                <>
                  <div className="bg-white rounded-xl shadow p-3 border">
                    <img src={qrCode} alt="QR" className="w-48 h-48 object-contain block" />
                  </div>
                  {selectedQrQueueType && (
                    <Badge className="text-white text-xs" style={{ backgroundColor: selectedQrQueueType.color }}>
                      {selectedQrQueueType.name}
                    </Badge>
                  )}
                  <p className="text-xs text-gray-400">Point camera to scan</p>
                </>
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4 p-6 flex-1 min-w-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-blue-600 leading-none">{stats.waiting}</p>
                  <p className="text-[11px] text-blue-500 mt-1">In Queue</p>
                </div>
                <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-green-600 leading-none">{stats.completed}</p>
                  <p className="text-[11px] text-green-500 mt-1">Served Today</p>
                </div>
                <div className="rounded-lg bg-purple-50 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-purple-600 leading-none">~{stats.avgWaitTime}m</p>
                  <p className="text-[11px] text-purple-500 mt-1">Avg Wait</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Join Link</p>
                <div className="flex items-center gap-2">
                  <Input value={qrJoinUrl} readOnly className="text-xs bg-gray-50 font-mono h-8 truncate" />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copyJoinUrl}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">How it works</p>
                {["Customer scans the QR code", "They enter details or log in via app", "Position tracked live on their phone"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-xs text-gray-600">{s}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <Button variant="outline" size="sm" onClick={shareQrCode} className="flex-1"><Share2 className="h-4 w-4 mr-1.5" />Share</Button>
                {qrCode && <Button variant="outline" size="sm" onClick={downloadQrCode} className="flex-1"><Download className="h-4 w-4 mr-1.5" />Download</Button>}
                <Button size="sm" onClick={() => window.open(qrJoinUrl, "_blank")} className="flex-1"><ExternalLink className="h-4 w-4 mr-1.5" />Preview</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />Add Customer to Queue
            </DialogTitle>
            <DialogDescription>Add a walk-in customer manually</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Queue Type</Label>
              <Select value={newCustomer.queue_type_id}
                onValueChange={v => setNewCustomer(p => ({ ...p, queue_type_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select queue type (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__general__">General (no specific type)</SelectItem>
                  {queueTypes.filter(qt => qt.is_active).map(qt => (
                    <SelectItem key={qt.id} value={qt.id}>
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: qt.color }} />
                        {qt.name}
                        <span className="text-gray-400 text-xs">~{qt.estimated_service_time}min</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Customer Name *</Label>
              <Input placeholder="Enter customer name" value={newCustomer.customer_name}
                onChange={e => setNewCustomer(p => ({ ...p, customer_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Phone Number *</Label>
              <Input placeholder="+92 300 1234567" value={newCustomer.customer_phone}
                onChange={e => setNewCustomer(p => ({ ...p, customer_phone: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Email (optional)</Label>
              <Input type="email" placeholder="customer@email.com" value={newCustomer.customer_email}
                onChange={e => setNewCustomer(p => ({ ...p, customer_email: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={newCustomer.priority}
                onValueChange={v => setNewCustomer(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any special requests..." value={newCustomer.notes}
                onChange={e => setNewCustomer(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={addingCustomer}>
              {addingCustomer ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Queue Type Create/Edit */}
      <Dialog open={queueTypeDialogOpen}
        onOpenChange={open => { setQueueTypeDialogOpen(open); if (!open) resetQueueTypeForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingQueueType ? "Edit Queue Type" : "Create Queue Type"}</DialogTitle>
            <DialogDescription>
              {editingQueueType ? "Update this queue type" : "A new lane will appear in the Queue tab immediately after saving"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Queue Name *</Label>
              <Input placeholder="e.g., Haircut, Consultation, General"
                value={newQueueType.name}
                onChange={e => setNewQueueType(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this queue type"
                value={newQueueType.description}
                onChange={e => setNewQueueType(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={newQueueType.color}
                    onChange={e => setNewQueueType(p => ({ ...p, color: e.target.value }))}
                    className="w-12 h-10 rounded border cursor-pointer" />
                  <Input value={newQueueType.color}
                    onChange={e => setNewQueueType(p => ({ ...p, color: e.target.value }))}
                    className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Est. Service Time (min)</Label>
                <Input type="number" min={1} value={newQueueType.estimated_service_time}
                  onChange={e => setNewQueueType(p => ({ ...p, estimated_service_time: parseInt(e.target.value) || 5 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Capacity</Label>
              <Input type="number" min={1} value={newQueueType.max_capacity}
                onChange={e => setNewQueueType(p => ({ ...p, max_capacity: parseInt(e.target.value) || 50 }))} />
              <p className="text-xs text-gray-400">Maximum customers allowed in this queue at once</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQueueTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQueueType} disabled={savingQueueType}>
              {savingQueueType && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQueueType ? "Update" : "Create"} Queue Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />Cancel Queue Entry?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the entry for <strong>{selectedEntry?.customer_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep in Queue</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedEntry) handleStatusChange(selectedEntry, "cancelled");
                setCancelDialogOpen(false);
              }}>
              Cancel Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
