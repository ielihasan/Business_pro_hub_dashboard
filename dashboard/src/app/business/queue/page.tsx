"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  estimated_wait_time?: number;
  scanned_user?: ScannedUser;
  joined_at?: string;
  called_at?: string;
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

export default function QueueManagementPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    waiting: 0,
    serving: 0,
    completed: 0,
    cancelled: 0,
    avgWaitTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  // queueTypeFilter removed - queue_types table not available
  const [isQueueActive, setIsQueueActive] = useState(true);

  // Add customer dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_type: "",
    notes: "",
    priority: "normal",
  });

  // QR Code dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrJoinUrl, setQrJoinUrl] = useState<string>("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [selectedQueueTypeForQr, setSelectedQueueTypeForQr] = useState<string>("all");

  // Action dialogs
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Queue Types state
  const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
  const [queueTypeDialogOpen, setQueueTypeDialogOpen] = useState(false);
  const [editingQueueType, setEditingQueueType] = useState<QueueType | null>(null);
  const [savingQueueType, setSavingQueueType] = useState(false);
  const [newQueueType, setNewQueueType] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    estimated_service_time: 5,
    max_capacity: 50,
  });

  // Fetch business data
  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("admins")
          .select("id, business_name")
          .eq("id", user.id)
          .eq("role", "business_owner")
          .single();
        if (data) {
          setBusiness(data);
        }
      }
    };
    fetchBusiness();
  }, []);

  // Fetch queue types
  const fetchQueueTypes = useCallback(async (businessId: string) => {
    try {
      const res = await fetch(`/API/queue-types?business_id=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueTypes(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching queue types:", error);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!business?.id) return;

    try {
      setRefreshing(true);
      const url = `/API/queue?business_id=${business.id}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setQueueEntries(data.data || []);
        setStats(data.stats);
      } else {
        // If API fails, use mock data for demo
        loadMockData();
      }
    } catch (error) {
      console.error("Fetch queue error:", error);
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [business?.id, statusFilter]);

  const loadMockData = () => {
    setQueueEntries(getMockQueueData());
    setStats({
      total: 8,
      waiting: 4,
      serving: 1,
      completed: 2,
      cancelled: 1,
      avgWaitTime: 12,
    });
  };

  useEffect(() => {
    if (business?.id) {
      fetchQueue();
      fetchQueueTypes(business.id);
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    } else {
      // No business yet, load mock data for display
      setLoading(false);
      loadMockData();
    }
  }, [business?.id, fetchQueue, fetchQueueTypes]);

  const getMockQueueData = (): QueueEntry[] => {
    return [
      {
        id: "1",
        customer_name: "Ahmed Khan",
        customer_phone: "+92 300 1234567",
        service_type: "Haircut",
        priority: "normal",
        position: 1,
        status: "serving",
        joined_at: new Date(Date.now() - 25 * 60000).toISOString(),
        started_at: new Date(Date.now() - 5 * 60000).toISOString(),
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        id: "2",
        customer_name: "Fatima Ali",
        customer_phone: "+92 321 9876543",
        customer_email: "fatima@email.com",
        service_type: "Hair Color",
        priority: "normal",
        position: 2,
        status: "waiting",
        joined_at: new Date(Date.now() - 20 * 60000).toISOString(),
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      },
      {
        id: "3",
        customer_name: "Muhammad Usman",
        customer_phone: "+92 333 4567890",
        service_type: "Beard Trim",
        priority: "high",
        position: 3,
        status: "waiting",
        joined_at: new Date(Date.now() - 15 * 60000).toISOString(),
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: "4",
        customer_name: "Sara Ahmed",
        customer_phone: "+92 345 6789012",
        service_type: "Haircut",
        priority: "normal",
        position: 4,
        status: "waiting",
        joined_at: new Date(Date.now() - 10 * 60000).toISOString(),
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: "5",
        customer_name: "Bilal Hassan",
        customer_phone: "+92 312 3456789",
        service_type: "Full Service",
        priority: "normal",
        position: 5,
        status: "waiting",
        joined_at: new Date(Date.now() - 5 * 60000).toISOString(),
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
    ];
  };

  // Queue Type CRUD functions
  const saveQueueTypeRequest = async (): Promise<Response> => {
    if (editingQueueType) {
      return fetch(`/API/queue-types/${editingQueueType.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQueueType),
      });
    }
    return fetch("/API/queue-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newQueueType, business_id: business?.id }),
    });
  };

  const handleSaveQueueType = async () => {
    if (!newQueueType.name.trim()) {
      toast.error("Queue type name is required");
      return;
    }

    setSavingQueueType(true);
    try {
      const action = editingQueueType ? "update" : "create";
      const res = await saveQueueTypeRequest();

      if (res.ok) {
        toast.success(`Queue type ${action}d successfully!`);
        if (business?.id) fetchQueueTypes(business.id);
      } else {
        const error = await res.json();
        toast.error(error.error || `Failed to ${action} queue type`);
      }
      setQueueTypeDialogOpen(false);
      resetQueueTypeForm();
    } catch (error) {
      console.error("Error saving queue type:", error);
      toast.error("Failed to save queue type");
    } finally {
      setSavingQueueType(false);
    }
  };

  const handleDeleteQueueType = async (queueTypeId: string) => {
    if (!confirm("Are you sure you want to delete this queue type?")) return;

    try {
      const res = await fetch(`/API/queue-types/${queueTypeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Queue type deleted successfully!");
        if (business?.id) fetchQueueTypes(business.id);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete queue type");
      }
    } catch (error) {
      console.error("Error deleting queue type:", error);
      toast.error("Failed to delete queue type");
    }
  };

  const handleEditQueueType = (queueType: QueueType) => {
    setEditingQueueType(queueType);
    setNewQueueType({
      name: queueType.name,
      description: queueType.description || "",
      color: queueType.color,
      estimated_service_time: queueType.estimated_service_time,
      max_capacity: queueType.max_capacity,
    });
    setQueueTypeDialogOpen(true);
  };

  const resetQueueTypeForm = () => {
    setEditingQueueType(null);
    setNewQueueType({
      name: "",
      description: "",
      color: "#3B82F6",
      estimated_service_time: 5,
      max_capacity: 50,
    });
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

  const handleAddCustomer = async () => {
    if (!newCustomer.customer_name) {
      toast.error("Customer name is required");
      return;
    }

    try {
      setAddingCustomer(true);

      if (!business?.id) {
        // Demo mode - add locally
        const newEntry: QueueEntry = {
          id: `demo-${Date.now()}`,
          customer_name: newCustomer.customer_name,
          customer_phone: newCustomer.customer_phone,
          customer_email: newCustomer.customer_email,
          service_type: newCustomer.service_type,
          notes: newCustomer.notes,
          priority: newCustomer.priority,
          position: queueEntries.length + 1,
          status: "waiting",
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setQueueEntries([...queueEntries, newEntry]);
        setStats({
          ...stats,
          total: stats.total + 1,
          waiting: stats.waiting + 1,
        });
        toast.success(`Customer added! Position: #${newEntry.position}`);
        setAddDialogOpen(false);
        resetNewCustomer();
        return;
      }

      const res = await fetch("/API/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          customer_name: newCustomer.customer_name,
          customer_phone: newCustomer.customer_phone,
          customer_email: newCustomer.customer_email,
          service_type: newCustomer.service_type,
          notes: newCustomer.notes,
          priority: newCustomer.priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Customer added! Position: #${data.data.position}`);
      setAddDialogOpen(false);
      resetNewCustomer();
      fetchQueue();
    } catch (error: any) {
      toast.error(error.message || "Failed to add customer");
    } finally {
      setAddingCustomer(false);
    }
  };

  const resetNewCustomer = () => {
    setNewCustomer({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      service_type: "",
      notes: "",
      priority: "normal",
    });
  };

  const handleStatusChange = async (
    entry: QueueEntry,
    newStatus: "serving" | "completed" | "cancelled"
  ) => {
    try {
      if (!business?.id) {
        // Demo mode - update locally
        setQueueEntries((prev: QueueEntry[]) =>
          prev.map((e: QueueEntry) => (e.id === entry.id ? { ...e, status: newStatus } : e))
        );

        // Update stats
        const newStats = { ...stats };
        if (entry.status === "waiting") newStats.waiting--;
        if (entry.status === "serving") newStats.serving--;
        if (newStatus === "serving") newStats.serving++;
        if (newStatus === "completed") newStats.completed++;
        if (newStatus === "cancelled") newStats.cancelled++;
        setStats(newStats);

        toast.success(`Status updated to ${newStatus}`);
        return;
      }

      const res = await fetch(`/API/queue/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(`Status updated to ${newStatus}`);
      fetchQueue();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const buildJoinUrl = (queueTypeId?: string): string => {
    const businessId = business?.id || "demo-business";
    const base = `${window.location.origin}/join-queue/${businessId}`;
    return queueTypeId && queueTypeId !== "all"
      ? `${base}?queue_type=${queueTypeId}`
      : base;
  };

  const applyClientSideQr = async (joinUrl: string) => {
    setQrJoinUrl(joinUrl);
    const clientQr = await generateQrCodeClientSide(joinUrl);
    setQrCode(clientQr);
  };

  const handleGenerateQrCode = async (queueTypeId?: string) => {
    setLoadingQr(true);
    setSelectedQueueTypeForQr(queueTypeId || "all");
    const joinUrl = buildJoinUrl(queueTypeId);

    try {
      const businessId = business?.id || "demo-business";
      const apiUrl = `/API/queue/qrcode?business_id=${businessId}`;
      const res = await fetch(apiUrl);

      if (res.ok) {
        const data = await res.json();
        setQrCode(data.data.qr_code);
        setQrJoinUrl(data.data.join_url || joinUrl);
      } else {
        await applyClientSideQr(joinUrl);
      }
    } catch (error) {
      console.error("QR code error:", error);
      await applyClientSideQr(joinUrl);
    } finally {
      setQrDialogOpen(true);
      setLoadingQr(false);
    }
  };

  const copyJoinUrl = () => {
    navigator.clipboard.writeText(qrJoinUrl);
    toast.success("Link copied to clipboard");
  };

  const downloadQrCode = () => {
    if (!qrCode) {
      toast.error("QR code not available");
      return;
    }
    const link = document.createElement("a");
    const queueType = queueTypes.find((t: QueueType) => t.id === selectedQueueTypeForQr);
    const fileName = queueType
      ? `queue-qr-${queueType.name.toLowerCase().replace(/\s+/g, "-")}.png`
      : `queue-qr-${business?.id || "demo"}.png`;
    link.download = fileName;
    link.href = qrCode;
    link.click();
    toast.success("QR code downloaded!");
  };

  const shareQrCode = async () => {
    if (navigator.share) {
      try {
        const queueType = queueTypes.find((t: QueueType) => t.id === selectedQueueTypeForQr);
        await navigator.share({
          title: queueType ? `Join ${queueType.name} Queue` : "Join Our Queue",
          text: `Join the queue at ${business?.business_name || "our business"}`,
          url: qrJoinUrl,
        });
      } catch {
        copyJoinUrl();
      }
    } else {
      copyJoinUrl();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWaitTime = (createdAt: string) => {
    const minutes = Math.round(
      (Date.now() - new Date(createdAt).getTime()) / 60000
    );
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Waiting
          </Badge>
        );
      case "serving":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Play className="h-3 w-3 mr-1" />
            Serving
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return (
        <Badge variant="destructive" className="text-xs">
          High Priority
        </Badge>
      );
    }
    return null;
  };

  const filteredEntries =
    statusFilter === "all"
      ? queueEntries
      : queueEntries.filter((e: QueueEntry) => e.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your customer queue in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={isQueueActive}
              onCheckedChange={setIsQueueActive}
            />
            <Label className="text-sm">
              Queue {isQueueActive ? "Open" : "Closed"}
            </Label>
          </div>
          <Button variant="outline" onClick={() => handleGenerateQrCode()} disabled={loadingQr}>
            {loadingQr ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            QR Code
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Tabs for Queue and Queue Types */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="queue-types" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Queue Types
          </TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Today</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Waiting</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {stats.waiting}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Serving</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {stats.serving}
                    </p>
                  </div>
                  <Play className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-800">
                      {stats.completed}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700">Cancelled</p>
                    <p className="text-2xl font-bold text-red-800">
                      {stats.cancelled}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Avg Wait</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {stats.avgWaitTime}m
                    </p>
                  </div>
                  <Timer className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Current Queue</CardTitle>
                  <CardDescription>
                    Today's queue entries - auto refreshes every 30 seconds
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="serving">Serving</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchQueue}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Wait Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <Clock className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                              No customers in queue
                            </h3>
                            <p className="mt-2 text-gray-500">
                              Add customers or share your QR code to get started
                            </p>
                            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Customer to Queue
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries.map((entry: QueueEntry) => (
                          <TableRow
                            key={entry.id}
                            className={
                              entry.status === "serving" ? "bg-blue-50" : ""
                            }
                          >
                            <TableCell>
                              <div className="font-mono font-bold text-lg">
                                {String(entry.position).padStart(3, "0")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTime(entry.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                {entry.scanned_user?.avatar_url ? (
                                  <img
                                    src={entry.scanned_user.avatar_url}
                                    alt=""
                                    className="h-8 w-8 rounded-full object-cover mt-0.5"
                                  />
                                ) : entry.customer_id ? (
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                    <Users className="h-4 w-4 text-blue-600" />
                                  </div>
                                ) : null}
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {entry.scanned_user?.full_name || entry.customer_name}
                                  </span>
                                  {(entry.scanned_user?.phone_number || entry.customer_phone) && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {entry.scanned_user?.phone_number || entry.customer_phone}
                                    </span>
                                  )}
                                  {(entry.scanned_user?.email || entry.customer_email) && (
                                    <span className="text-xs text-gray-400">
                                      {entry.scanned_user?.email || entry.customer_email}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {entry.customer_id && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                        App User
                                      </Badge>
                                    )}
                                    {getPriorityBadge(entry.priority)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {entry.service_type || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {entry.status === "waiting" ||
                              entry.status === "serving" ? (
                                <span className="font-medium">
                                  {getWaitTime(entry.created_at)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(entry.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {entry.customer_id ? "App / QR" : "Walk-in"}
                              </Badge>
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
                                  {entry.status === "waiting" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(entry, "serving")
                                      }
                                    >
                                      <Play className="h-4 w-4 mr-2 text-blue-600" />
                                      Start Serving
                                    </DropdownMenuItem>
                                  )}
                                  {entry.status === "serving" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(entry, "completed")
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Mark Complete
                                    </DropdownMenuItem>
                                  )}
                                  {(entry.status === "waiting" ||
                                    entry.status === "serving") && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedEntry(entry);
                                        setCancelDialogOpen(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancel
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Types Tab */}
        <TabsContent value="queue-types" className="space-y-6">
          {/* QR Code Generation Section */}
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Generate QR Code</CardTitle>
                    <CardDescription className="text-base">
                      Create QR codes for customers to join your queue
                    </CardDescription>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {queueTypes.length > 0 && (
                    <Select value={selectedQueueTypeForQr} onValueChange={setSelectedQueueTypeForQr}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select queue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Queues</SelectItem>
                        {queueTypes.map((qt: QueueType) => (
                          <SelectItem key={qt.id} value={qt.id}>
                            {qt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="lg"
                    onClick={() => handleGenerateQrCode(selectedQueueTypeForQr)}
                    disabled={loadingQr}
                  >
                    {loadingQr ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <QrCode className="h-5 w-5 mr-2" />
                    )}
                    Generate QR Code
                  </Button>
                </div>
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
              {/* Mobile controls */}
              <div className="sm:hidden mt-4 space-y-3">
                {queueTypes.length > 0 && (
                  <Select value={selectedQueueTypeForQr} onValueChange={setSelectedQueueTypeForQr}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select queue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Queues</SelectItem>
                      {queueTypes.map((qt: QueueType) => (
                        <SelectItem key={qt.id} value={qt.id}>
                          {qt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  size="lg"
                  onClick={() => handleGenerateQrCode(selectedQueueTypeForQr)}
                  disabled={loadingQr}
                  className="w-full"
                >
                  {loadingQr ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-5 w-5 mr-2" />
                  )}
                  Generate QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Queue Types Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Queue Types
                  </CardTitle>
                  <CardDescription>
                    Manage different queues for your services (e.g., Haircut, Consultation)
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetQueueTypeForm();
                    setQueueTypeDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Queue Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {queueTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No queue types created yet</p>
                  <p className="text-sm mt-1">Create queue types to manage different services</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      resetQueueTypeForm();
                      setQueueTypeDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Queue Type
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {queueTypes.map((queueType: QueueType) => (
                    <div
                      key={queueType.id}
                      className="relative p-4 rounded-xl border-2 transition-all hover:shadow-md"
                      style={{ borderColor: queueType.color + "40", backgroundColor: queueType.color + "08" }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: queueType.color }}
                          >
                            {queueType.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{queueType.name}</h3>
                            <p className="text-sm text-gray-500">{queueType.description || "No description"}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditQueueType(queueType)}
                          >
                            <Edit2 className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteQueueType(queueType.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          ~{queueType.estimated_service_time} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Max {queueType.max_capacity}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleGenerateQrCode(queueType.id)}
                          disabled={loadingQr}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Add Customer to Queue
            </DialogTitle>
            <DialogDescription>
              Add a walk-in customer to the queue
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                placeholder="Enter customer name"
                value={newCustomer.customer_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setNewCustomer({
                    ...newCustomer,
                    customer_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_phone">Phone Number</Label>
              <Input
                id="customer_phone"
                placeholder="+92 300 1234567"
                value={newCustomer.customer_phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setNewCustomer({
                    ...newCustomer,
                    customer_phone: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                value={newCustomer.service_type}
                onValueChange={(value: string) =>
                  setNewCustomer({ ...newCustomer, service_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Haircut">Haircut</SelectItem>
                  <SelectItem value="Beard Trim">Beard Trim</SelectItem>
                  <SelectItem value="Hair Color">Hair Color</SelectItem>
                  <SelectItem value="Full Service">Full Service</SelectItem>
                  <SelectItem value="Printing">Printing</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newCustomer.priority}
                onValueChange={(value: string) =>
                  setNewCustomer({ ...newCustomer, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests..."
                value={newCustomer.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setNewCustomer({ ...newCustomer, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={addingCustomer}>
              {addingCustomer ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg leading-tight">Queue QR Code</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  Share this so customers can join your queue instantly
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row min-h-0">
            {/* Left — QR panel */}
            <div className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 sm:w-64 sm:shrink-0 border-b sm:border-b-0 sm:border-r">
              {qrCode ? (
                <>
                  <div className="bg-white rounded-xl shadow p-3 border">
                    <img
                      src={qrCode}
                      alt="Queue QR Code"
                      className="w-48 h-48 object-contain block"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Point camera to scan</p>
                </>
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl bg-white flex flex-col items-center justify-center gap-2">
                  {loadingQr ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-xs text-gray-400">Generating…</p>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-8 w-8 text-gray-300" />
                      <p className="text-xs text-gray-400">Loading QR…</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right — details */}
            <div className="flex flex-col gap-4 p-6 flex-1 min-w-0">
              {/* Live stats */}
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

              {/* Join link */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Join Link</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={qrJoinUrl}
                    readOnly
                    className="text-xs bg-gray-50 font-mono h-8 truncate"
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copyJoinUrl}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Steps */}
              <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">How it works</p>
                <div className="space-y-1.5">
                  {[
                    "Customer scans the QR code",
                    "They enter details or log in via app",
                    "Position tracked live on their phone",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs text-gray-600">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button variant="outline" size="sm" onClick={shareQrCode} className="flex-1">
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
                {qrCode && (
                  <Button variant="outline" size="sm" onClick={downloadQrCode} className="flex-1">
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Button>
                )}
                <Button size="sm" onClick={() => window.open(qrJoinUrl, "_blank")} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Queue Type Create/Edit Dialog */}
      <Dialog open={queueTypeDialogOpen} onOpenChange={(open: boolean) => {
        setQueueTypeDialogOpen(open);
        if (!open) resetQueueTypeForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingQueueType ? "Edit Queue Type" : "Create Queue Type"}
            </DialogTitle>
            <DialogDescription>
              {editingQueueType
                ? "Update the details of this queue type"
                : "Create a new queue type to manage different services"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Queue Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Haircut, Consultation, General"
                value={newQueueType.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewQueueType({ ...newQueueType, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this queue type"
                value={newQueueType.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewQueueType({ ...newQueueType, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color"
                    value={newQueueType.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewQueueType({ ...newQueueType, color: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={newQueueType.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewQueueType({ ...newQueueType, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_time">Est. Service Time (min)</Label>
                <Input
                  id="estimated_time"
                  type="number"
                  min={1}
                  value={newQueueType.estimated_service_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewQueueType({ ...newQueueType, estimated_service_time: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Max Capacity</Label>
              <Input
                id="max_capacity"
                type="number"
                min={1}
                value={newQueueType.max_capacity}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewQueueType({ ...newQueueType, max_capacity: parseInt(e.target.value) || 50 })}
              />
              <p className="text-sm text-gray-500">Maximum number of customers allowed in this queue</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQueueTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQueueType} disabled={savingQueueType}>
              {savingQueueType ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingQueueType ? "Update" : "Create"} Queue Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Cancel Queue Entry?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the queue entry for{" "}
              <strong>{selectedEntry?.customer_name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep in Queue</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedEntry) {
                  handleStatusChange(selectedEntry, "cancelled");
                }
                setCancelDialogOpen(false);
              }}
            >
              Cancel Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
