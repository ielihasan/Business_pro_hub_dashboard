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
  ChevronRight,
  ArrowLeft,
  Banknote,
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
  estimated_revenue?: number;
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
  price?: number;
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
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100"><Clock className="h-3 w-3 mr-1" />Waiting</Badge>;
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

/* ─── QueueLane — compact row only ──────────────────────────── */
interface QueueLaneProps {
  queueType: QueueType | null;
  entries: QueueEntry[];
  isActive: boolean;
  onToggleActive: (queueTypeId: string | null, newValue: boolean) => void;
  onOpen: (laneId: string) => void;
}

function QueueLane({ queueType, entries, isActive, onToggleActive, onOpen }: QueueLaneProps) {
  const waiting = entries.filter(e => e.status === "waiting").length;
  const serving = entries.filter(e => e.status === "serving").length;
  const total   = entries.length;
  const color   = isActive ? (queueType?.color || "#6B7280") : "#9CA3AF";
  const name    = queueType?.name || "General Queue";
  const laneId  = queueType?.id ?? "general";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-white cursor-pointer select-none
        hover:bg-gray-50 transition-colors ${!isActive ? "opacity-60" : ""}`}
      onClick={() => onOpen(laneId)}
    >
      {/* Color avatar */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: color }}
      >
        {queueType ? queueType.name.charAt(0).toUpperCase() : <Users className="h-3.5 w-3.5" />}
      </div>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-gray-900 truncate">{name}</span>
          {!isActive && (
            <Badge className="bg-gray-100 text-gray-400 border-0 text-[10px] px-1 py-0 h-3.5 shrink-0">Closed</Badge>
          )}
        </div>
        {queueType?.description && (
          <p className="text-xs text-gray-400 truncate">{queueType.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-gray-500 tabular-nums">
          <span className="font-semibold text-gray-800">{waiting}</span> waiting
        </span>
        {serving > 0 && (
          <span className="text-xs text-blue-600 tabular-nums font-medium">· {serving} serving</span>
        )}
        {total > 0 && (
          <span className="text-[11px] text-gray-400 hidden sm:inline">/ {total} total</span>
        )}
      </div>

      {/* Toggle — stops propagation so it doesn't open the detail view */}
      <div
        className="shrink-0"
        onClick={e => { e.stopPropagation(); onToggleActive(queueType?.id ?? null, !isActive); }}
      >
        <Switch
          checked={isActive}
          onCheckedChange={v => onToggleActive(queueType?.id ?? null, v)}
          className="scale-75 data-[state=checked]:bg-green-500"
        />
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </div>
  );
}

/* ─── QueueDetail — full-screen detail view ─────────────────── */
interface QueueDetailProps {
  queueType: QueueType | null;
  entries: QueueEntry[];
  loadingQr: boolean;
  isActive: boolean;
  statusFilter: string;
  onBack: () => void;
  onToggleActive: (queueTypeId: string | null, newValue: boolean) => void;
  onGenerateQr: (queueTypeId?: string) => void;
  onAddCustomer: (queueTypeId?: string) => void;
  onStatusChange: (entry: QueueEntry, status: "serving" | "completed" | "cancelled") => void;
  onCancelClick: (entry: QueueEntry) => void;
  onEditEntry: (entry: QueueEntry) => void;
  onDeleteEntry: (entry: QueueEntry) => void;
}

function QueueDetail({
  queueType, entries, loadingQr, isActive, statusFilter,
  onBack, onToggleActive, onGenerateQr, onAddCustomer,
  onStatusChange, onCancelClick, onEditEntry, onDeleteEntry,
}: QueueDetailProps) {
  const waiting = entries.filter(e => e.status === "waiting").length;
  const serving = entries.filter(e => e.status === "serving").length;
  const color   = isActive ? (queueType?.color || "#6B7280") : "#9CA3AF";
  const name    = queueType?.name || "General Queue";

  const visibleEntries = statusFilter === "all"
    ? entries
    : entries.filter(e => e.status === statusFilter);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 px-0 py-3 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-600 hover:text-gray-900 px-2 shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">All Queues</span>
          </Button>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs shrink-0"
              style={{ backgroundColor: color }}
            >
              {queueType ? queueType.name.charAt(0).toUpperCase() : <Users className="h-3 w-3" />}
            </div>
            <span className="font-semibold text-gray-900 text-sm truncate">{name}</span>
            {!isActive && (
              <Badge className="bg-gray-200 text-gray-500 border-0 text-[10px] px-1.5 py-0 h-4 shrink-0">Closed</Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white cursor-pointer"
            onClick={() => onToggleActive(queueType?.id ?? null, !isActive)}
          >
            <Switch
              checked={isActive}
              onCheckedChange={v => onToggleActive(queueType?.id ?? null, v)}
              className="scale-75 data-[state=checked]:bg-green-500"
            />
            <span className={`text-[11px] font-medium hidden sm:inline ${isActive ? "text-green-600" : "text-gray-400"}`}>
              {isActive ? "Open" : "Closed"}
            </span>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
            onClick={() => onGenerateQr(queueType?.id)}
            disabled={loadingQr || !isActive}>
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">QR</span>
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1 text-white"
            style={{ backgroundColor: color }}
            onClick={() => onAddCustomer(queueType?.id)}
            disabled={!isActive}>
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Customer</span>
          </Button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex items-center gap-4 py-3 text-sm border-b">
        <span className="text-gray-500">
          <span className="font-semibold text-gray-900">{waiting}</span> waiting
        </span>
        {serving > 0 && (
          <span className="text-blue-600 font-medium">{serving} serving</span>
        )}
        <span className="text-gray-400 text-xs">{entries.length} total today</span>
        {queueType && (
          <span className="text-gray-400 text-xs hidden sm:inline">
            ~{queueType.estimated_service_time} min · max {queueType.max_capacity}
          </span>
        )}
      </div>

      {/* ── Customer table ── */}
      <div className="flex-1 overflow-y-auto">
        {visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
            <Users className="h-12 w-12 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No customers yet</p>
            <p className="text-xs text-gray-400 max-w-[280px]">
              {queueType
                ? `Share the ${queueType.name} QR code or add a customer manually`
                : "Add a customer or share the general queue link"}
            </p>
            <div className="flex gap-2 mt-2">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60">
                <TableHead className="w-[64px] pl-4">#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Wait</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.map((entry) => (
                <TableRow key={entry.id} className={entry.status === "serving" ? "bg-blue-50/60" : ""}>
                  <TableCell className="pl-4">
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
                        <DropdownMenuItem onClick={() => onEditEntry(entry)}>
                          <Edit2 className="h-4 w-4 mr-2 text-gray-600" />Edit Details
                        </DropdownMenuItem>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteEntry(entry)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function QueueManagementPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0, waiting: 0, serving: 0, completed: 0, cancelled: 0, avgWaitTime: 0, estimated_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [generalQueueActive, setGeneralQueueActive] = useState(true);

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

  // Edit entry
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<QueueEntry | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "",
    notes: "", priority: "normal", queue_type_id: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete entry
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<QueueEntry | null>(null);

  // Open lane (null = list view, "general" or uuid = detail view)
  const [openLaneId, setOpenLaneId] = useState<string | null>(null);

  // Queue types
  const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
  const [queueTypeDialogOpen, setQueueTypeDialogOpen] = useState(false);
  const [editingQueueType, setEditingQueueType] = useState<QueueType | null>(null);
  const [savingQueueType, setSavingQueueType] = useState(false);
  const [newQueueType, setNewQueueType] = useState({
    name: "", description: "", color: "#3B82F6",
    estimated_service_time: 5, max_capacity: 50, price: 0,
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue-types?business_id=${businessId}`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      if (res.ok) { const j = await res.json().catch(() => ({})); setQueueTypes(j.data ?? []); }
    } catch (err) { console.error("Error fetching queue types:", err); }
  }, []);

  /* ── Fetch ALL entries (split client-side per lane) */
  const fetchQueue = useCallback(async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue?business_id=${business.id}&status=all`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const resp = await res.json().catch(() => ({}));
      const inner = resp.data || {};
      if (res.ok) {
        // inner.data = List<Queue> entities (DB statuses); map in_progress/called → serving
        const rawEntries: any[] = inner.data || [];
        const mapped = rawEntries.map((e: any) => ({
          ...e,
          status: e.status === "in_progress" || e.status === "called" ? "serving" : e.status,
        }));
        setQueueEntries(mapped);
        setStats(inner.stats);
      }
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
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${editingQueueType!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      toast.success("Queue type deleted!");
      await fetchQueueTypes(business.id);
    } catch (err: any) { toast.error(err.message || "Failed to delete"); }
  };

  const handleEditQueueType = (qt: QueueType) => {
    setEditingQueueType(qt);
    setNewQueueType({ name: qt.name, description: qt.description || "", color: qt.color,
      estimated_service_time: qt.estimated_service_time, max_capacity: qt.max_capacity, price: qt.price ?? 0 });
    setQueueTypeDialogOpen(true);
  };

  const resetQueueTypeForm = () => {
    setEditingQueueType(null);
    setNewQueueType({ name: "", description: "", color: "#3B82F6", estimated_service_time: 5, max_capacity: 50, price: 0 });
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
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
      const data = await res.json().catch(() => ({}));
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error); }
      toast.success(`Status → ${newStatus}`);
      // optimistic update
      setQueueEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: newStatus } : e));
    } catch (err: any) { toast.error(err.message || "Failed to update status"); }
  }, []);

  const handleCancelClick = useCallback((entry: QueueEntry) => {
    setSelectedEntry(entry);
    setCancelDialogOpen(true);
  }, []);

  /* ── Edit queue entry */
  const handleEditEntryOpen = useCallback((entry: QueueEntry) => {
    setEditingEntry(entry);
    setEditForm({
      customer_name: entry.customer_name || "",
      customer_phone: entry.customer_phone || "",
      customer_email: entry.customer_email || "",
      notes: entry.notes || "",
      priority: entry.priority || "normal",
      queue_type_id: (entry.service_type && isUuid(entry.service_type)) ? entry.service_type : "__general__",
    });
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    if (!editForm.customer_name.trim()) { toast.error("Customer name is required"); return; }
    if (!editForm.customer_phone.trim()) { toast.error("Phone number is required"); return; }
    try {
      setSavingEdit(true);
      const body: Record<string, unknown> = {
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.trim(),
        customer_email: editForm.customer_email.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        priority: editForm.priority,
        service_type: (editForm.queue_type_id && editForm.queue_type_id !== "__general__")
          ? editForm.queue_type_id
          : null,
      };
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error); }
      toast.success("Queue entry updated!");
      setEditDialogOpen(false);
      setEditingEntry(null);
      fetchQueue();
    } catch (err: any) {
      toast.error(err.message || "Failed to update entry");
    } finally { setSavingEdit(false); }
  };

  /* ── Delete queue entry */
  const handleDeleteEntryClick = useCallback((entry: QueueEntry) => {
    setDeletingEntry(entry);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue/${deletingEntry.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error); }
      toast.success(`Removed ${deletingEntry.customer_name} from queue`);
      // optimistic remove
      setQueueEntries(prev => prev.filter(e => e.id !== deletingEntry.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete entry");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingEntry(null);
    }
  };

  /* ── Toggle queue open/closed */
  const handleToggleQueueType = useCallback(async (queueTypeId: string | null, newValue: boolean) => {
    // General queue — local state only (no DB record)
    if (queueTypeId === null) {
      setGeneralQueueActive(newValue);
      toast.success(`General queue ${newValue ? "opened" : "closed"}`);
      return;
    }
    // Named queue type — optimistic update then persist via API
    setQueueTypes(prev =>
      prev.map(qt => qt.id === queueTypeId ? { ...qt, is_active: newValue } : qt)
    );
    try {
      const qt = queueTypes.find(q => q.id === queueTypeId);
      if (!qt) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${queueTypeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          name: qt.name,
          description: qt.description,
          color: qt.color,
          estimated_service_time: qt.estimated_service_time,
          max_capacity: qt.max_capacity,
          is_active: newValue,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      toast.success(`${qt.name} queue ${newValue ? "opened" : "closed"}`);
    } catch (err: any) {
      // Revert optimistic update on failure
      setQueueTypes(prev =>
        prev.map(qt => qt.id === queueTypeId ? { ...qt, is_active: !newValue } : qt)
      );
      toast.error(err.message || "Failed to update queue status");
    }
  }, [queueTypes]);

  /* ── QR helpers */
  const buildJoinUrl = (queueTypeId?: string, price?: number) => {
    const bId = business?.id || "demo-business";
    const base = `${window.location.origin}/join-queue/${bId}`;
    if (!queueTypeId) return base;
    const priceParam = price && price > 0 ? `&price=${price}` : "";
    return `${base}?queue_type=${queueTypeId}${priceParam}`;
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
    const qt = queueTypes.find(q => q.id === queueTypeId);
    const joinUrl = buildJoinUrl(queueTypeId, qt?.price);
    try {
      setQrCode(await generateQrCodeClientSide(joinUrl));
      setQrJoinUrl(joinUrl);
    } catch (e) { console.error(e); }
    finally { setQrDialogOpen(true); setLoadingQr(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, queueTypes]);

  const copyJoinUrl = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(qrJoinUrl).then(() => toast.success("Link copied!")).catch(() => fallbackCopy(qrJoinUrl));
    } else {
      fallbackCopy(qrJoinUrl);
    }
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      toast.success("Link copied!");
    } catch {
      toast.error("Copy failed — please copy the link manually.");
    }
    document.body.removeChild(ta);
  };

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
      </div>

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
              <div className="p-2 bg-blue-100 rounded-lg"><Share2 className="h-5 w-5 text-blue-600" /></div>
              <div><p className="font-semibold text-gray-900">Per-Queue QR</p><p className="text-sm text-gray-500">Separate QR per queue type</p></div>
            </div>
          </div>
          <Button size="lg" onClick={openQrPicker} disabled={loadingQr} className="sm:hidden mt-4 w-full">
            {loadingQr ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <QrCode className="h-5 w-5 mr-2" />}
            Generate QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />Queue
            {stats.waiting > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-gray-600 text-white rounded-full">
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
        <TabsContent value="queue" className="space-y-4">

          {openLaneId ? (
            /* ── Full-screen detail view ── */
            (() => {
              const isGeneral = openLaneId === "general";
              const qt = isGeneral ? null : queueTypes.find(q => q.id === openLaneId) ?? null;
              const laneEntries = entriesForType(queueEntries, isGeneral ? null : openLaneId, "all");
              const isActive = isGeneral ? generalQueueActive : (qt?.is_active ?? true);
              return (
                <QueueDetail
                  queueType={qt}
                  entries={laneEntries}
                  loadingQr={loadingQr}
                  isActive={isActive}
                  statusFilter={statusFilter}
                  onBack={() => setOpenLaneId(null)}
                  onToggleActive={handleToggleQueueType}
                  onGenerateQr={handleGenerateQrCode}
                  onAddCustomer={openAddCustomer}
                  onStatusChange={handleStatusChange}
                  onCancelClick={handleCancelClick}
                  onEditEntry={handleEditEntryOpen}
                  onDeleteEntry={handleDeleteEntryClick}
                />
              );
            })()
          ) : (
            /* ── Compact list view ── */
            <>
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
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-gray-600">Waiting</p><p className="text-2xl font-bold text-gray-900">{stats.waiting}</p></div>
                      <Clock className="h-6 w-6 text-gray-500" />
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
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-blue-700">Avg Wait</p><p className="text-2xl font-bold text-blue-800">{stats.avgWaitTime}m</p></div>
                      <Timer className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50 col-span-2 sm:col-span-1">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-700">Est. Revenue</p>
                        <p className="text-2xl font-bold text-emerald-800">
                          Rs.{Number(stats.estimated_revenue ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <Banknote className="h-6 w-6 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter + refresh */}
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

              {/* Queue list */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <div className="p-2 space-y-1">
                    {queueTypes.map(qt => (
                      <QueueLane
                        key={qt.id}
                        queueType={qt}
                        entries={entriesForType(queueEntries, qt.id, "all")}
                        isActive={qt.is_active}
                        onToggleActive={handleToggleQueueType}
                        onOpen={setOpenLaneId}
                      />
                    ))}
                    <QueueLane
                      key="general"
                      queueType={null}
                      entries={entriesForType(queueEntries, null, "all")}
                      isActive={generalQueueActive}
                      onToggleActive={handleToggleQueueType}
                      onOpen={setOpenLaneId}
                    />
                  </div>

                  {queueTypes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center border-t">
                      <Layers className="h-8 w-8 text-gray-200" />
                      <div>
                        <p className="font-semibold text-gray-600 text-sm">No queue types created yet</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                          Go to <strong>Queue Types</strong> tab to create queues — each gets its own row, QR code, and customer list.
                        </p>
                      </div>
                      <Button variant="outline" size="sm"
                        onClick={() => document.querySelector<HTMLButtonElement>('[value="queue-types"]')?.click()}>
                        <Plus className="h-4 w-4 mr-2" />Create Queue Type
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ══ QUEUE TYPES TAB ══ */}
        <TabsContent value="queue-types" className="space-y-6">

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
                          {(qt.price ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <Banknote className="h-3.5 w-3.5" />Rs.{Number(qt.price).toLocaleString()}
                            </span>
                          )}
                          <span className="text-gray-600 font-medium">{waiting} waiting</span>
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
        <DialogContent className="sm:max-w-[420px] max-h-[90dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />Generate Queue QR Code
            </DialogTitle>
            <DialogDescription>
              Choose which queue this QR is for. Customers who scan it join that queue automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
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
          <DialogFooter className="px-6 py-4 border-t shrink-0">
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
        <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden max-h-[90dvh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
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
          <div className="flex flex-col sm:flex-row flex-1 overflow-y-auto">
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
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-blue-600 leading-none">~{stats.avgWaitTime}m</p>
                  <p className="text-[11px] text-blue-500 mt-1">Avg Wait</p>
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
        <DialogContent className="sm:max-w-[480px] max-h-[90dvh] flex flex-col p-0 gap-0">
          {/* Pinned header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />Add Customer to Queue
            </DialogTitle>
            <DialogDescription>Add a walk-in customer manually</DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 grid gap-4">
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

          {/* Pinned footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
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
        <DialogContent className="sm:max-w-[500px] max-h-[90dvh] flex flex-col p-0 gap-0">
          {/* Pinned header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{editingQueueType ? "Edit Queue Type" : "Create Queue Type"}</DialogTitle>
            <DialogDescription>
              {editingQueueType ? "Update this queue type" : "A new lane will appear in the Queue tab immediately after saving"}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
            <div className="space-y-2">
              <Label>Price per Item (Rs.)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs.</span>
                <Input type="number" min={0} step={0.01} value={newQueueType.price}
                  onChange={e => setNewQueueType(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  className="pl-10" placeholder="0.00" />
              </div>
              <p className="text-xs text-gray-400">Charge per customer/item — used to estimate queue revenue</p>
            </div>
          </div>

          {/* Pinned footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setQueueTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQueueType} disabled={savingQueueType}>
              {savingQueueType && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQueueType ? "Update" : "Create"} Queue Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Queue Entry */}
      <Dialog open={editDialogOpen} onOpenChange={open => { setEditDialogOpen(open); if (!open) setEditingEntry(null); }}>
        <DialogContent className="sm:max-w-[480px] max-h-[90dvh] flex flex-col p-0 gap-0">
          {/* Pinned header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-gray-700" />Edit Queue Entry
            </DialogTitle>
            <DialogDescription>
              Update details for <strong>{editingEntry?.customer_name}</strong>
              {editingEntry && (
                <span className="ml-1 font-mono text-xs text-gray-400">
                  — #{String(editingEntry.position).padStart(3, "0")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 grid gap-4">
            {/* Queue Type */}
            <div className="grid gap-2">
              <Label>Queue Type</Label>
              <Select value={editForm.queue_type_id}
                onValueChange={v => setEditForm(p => ({ ...p, queue_type_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select queue type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__general__">General (no specific type)</SelectItem>
                  {queueTypes.map(qt => (
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

            {/* Name */}
            <div className="grid gap-2">
              <Label>Customer Name *</Label>
              <Input placeholder="Enter customer name" value={editForm.customer_name}
                onChange={e => setEditForm(p => ({ ...p, customer_name: e.target.value }))} />
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label>Phone Number *</Label>
              <Input placeholder="+92 300 1234567" value={editForm.customer_phone}
                onChange={e => setEditForm(p => ({ ...p, customer_phone: e.target.value }))} />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label>Email (optional)</Label>
              <Input type="email" placeholder="customer@email.com" value={editForm.customer_email}
                onChange={e => setEditForm(p => ({ ...p, customer_email: e.target.value }))} />
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={editForm.priority}
                onValueChange={v => setEditForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any special requests..." value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            {/* Read-only info */}
            {editingEntry && (
              <div className="rounded-lg border bg-gray-50 px-4 py-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry Info</p>
                <div className="flex gap-6 text-xs text-gray-600">
                  <span><span className="font-medium">Position:</span> #{String(editingEntry.position).padStart(3, "0")}</span>
                  <span><span className="font-medium">Status:</span> {editingEntry.status}</span>
                  <span><span className="font-medium">Joined:</span> {formatTime(editingEntry.created_at)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pinned footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit2 className="h-4 w-4 mr-2" />}
              Save Changes
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

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={open => { setDeleteDialogOpen(open); if (!open) setDeletingEntry(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />Delete Queue Entry?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deletingEntry?.customer_name}</strong>
              {deletingEntry && (
                <span className="font-mono text-xs text-gray-500">
                  {" "}(#{String(deletingEntry.position).padStart(3, "0")})
                </span>
              )}{" "}
              from the queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Entry</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteEntry}
            >
              <Trash2 className="h-4 w-4 mr-2" />Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
