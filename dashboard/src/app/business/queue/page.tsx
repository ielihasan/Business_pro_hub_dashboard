"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

interface QueueEntry {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  service_type?: string;
  notes?: string;
  priority: string;
  position: number;
  status: "waiting" | "serving" | "completed" | "cancelled";
  joined_via?: string;
  created_at: string;
  served_at?: string;
  completed_at?: string;
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

  // Action dialogs
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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

  const fetchQueue = useCallback(async () => {
    if (!business?.id) return;

    try {
      setRefreshing(true);
      const res = await fetch(
        `/API/queue?business_id=${business.id}&status=${statusFilter}`
      );
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
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    } else {
      // No business yet, load mock data for display
      setLoading(false);
      loadMockData();
    }
  }, [business?.id, fetchQueue]);

  const getMockQueueData = (): QueueEntry[] => {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    return [
      {
        id: "1",
        ticket_number: `Q${today}-001`,
        customer_name: "Ahmed Khan",
        customer_phone: "+92 300 1234567",
        service_type: "Haircut",
        priority: "normal",
        position: 1,
        status: "serving",
        joined_via: "qr_code",
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
        served_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: "2",
        ticket_number: `Q${today}-002`,
        customer_name: "Fatima Ali",
        customer_phone: "+92 321 9876543",
        customer_email: "fatima@email.com",
        service_type: "Hair Color",
        priority: "normal",
        position: 2,
        status: "waiting",
        joined_via: "walk_in",
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      },
      {
        id: "3",
        ticket_number: `Q${today}-003`,
        customer_name: "Muhammad Usman",
        customer_phone: "+92 333 4567890",
        service_type: "Beard Trim",
        priority: "high",
        position: 3,
        status: "waiting",
        joined_via: "qr_code",
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: "4",
        ticket_number: `Q${today}-004`,
        customer_name: "Sara Ahmed",
        customer_phone: "+92 345 6789012",
        service_type: "Haircut",
        priority: "normal",
        position: 4,
        status: "waiting",
        joined_via: "qr_code",
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: "5",
        ticket_number: `Q${today}-005`,
        customer_name: "Bilal Hassan",
        customer_phone: "+92 312 3456789",
        service_type: "Full Service",
        priority: "normal",
        position: 5,
        status: "waiting",
        joined_via: "walk_in",
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: "6",
        ticket_number: `Q${today}-006`,
        customer_name: "Ayesha Malik",
        service_type: "Haircut",
        priority: "normal",
        position: 6,
        status: "completed",
        joined_via: "walk_in",
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        served_at: new Date(Date.now() - 45 * 60000).toISOString(),
        completed_at: new Date(Date.now() - 35 * 60000).toISOString(),
      },
      {
        id: "7",
        ticket_number: `Q${today}-007`,
        customer_name: "Imran Shah",
        service_type: "Beard Trim",
        priority: "normal",
        position: 7,
        status: "completed",
        joined_via: "walk_in",
        created_at: new Date(Date.now() - 90 * 60000).toISOString(),
        served_at: new Date(Date.now() - 75 * 60000).toISOString(),
        completed_at: new Date(Date.now() - 65 * 60000).toISOString(),
      },
      {
        id: "8",
        ticket_number: `Q${today}-008`,
        customer_name: "Zainab Qureshi",
        service_type: "Hair Color",
        priority: "normal",
        position: 8,
        status: "cancelled",
        joined_via: "walk_in",
        created_at: new Date(Date.now() - 50 * 60000).toISOString(),
      },
    ];
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
        const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
        const newEntry: QueueEntry = {
          id: `demo-${Date.now()}`,
          ticket_number: `Q${today}-${(queueEntries.length + 1).toString().padStart(3, "0")}`,
          customer_name: newCustomer.customer_name,
          customer_phone: newCustomer.customer_phone,
          customer_email: newCustomer.customer_email,
          service_type: newCustomer.service_type,
          notes: newCustomer.notes,
          priority: newCustomer.priority,
          position: queueEntries.length + 1,
          status: "waiting",
          joined_via: "walk_in",
          created_at: new Date().toISOString(),
        };
        setQueueEntries([...queueEntries, newEntry]);
        setStats({
          ...stats,
          total: stats.total + 1,
          waiting: stats.waiting + 1,
        });
        toast.success(`Customer added! Ticket: ${newEntry.ticket_number}`);
        setAddDialogOpen(false);
        resetNewCustomer();
        return;
      }

      const res = await fetch("/API/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          ...newCustomer,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Customer added! Ticket: ${data.data.ticket_number}`);
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
        setQueueEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: newStatus } : e))
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

  const handleGenerateQrCode = async () => {
    try {
      setLoadingQr(true);

      const businessId = business?.id || "demo-business";
      const baseUrl = window.location.origin;
      const joinUrl = `${baseUrl}/join-queue/${businessId}`;

      const res = await fetch(`/API/queue/qrcode?business_id=${businessId}`);

      if (res.ok) {
        const data = await res.json();
        setQrCode(data.data.qr_code);
        setQrJoinUrl(data.data.join_url);
      } else {
        // Fallback - still show the URL
        setQrJoinUrl(joinUrl);
        // Create a simple QR placeholder
        setQrCode(null);
      }
      setQrDialogOpen(true);
    } catch (error) {
      console.error("QR code error:", error);
      const businessId = business?.id || "demo-business";
      setQrJoinUrl(`${window.location.origin}/join-queue/${businessId}`);
      setQrDialogOpen(true);
    } finally {
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
    link.download = `queue-qr-${business?.id || "demo"}.png`;
    link.href = qrCode;
    link.click();
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
      : queueEntries.filter((e) => e.status === statusFilter);

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
          <Button variant="outline" onClick={handleGenerateQrCode} disabled={loadingQr}>
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
                    <TableHead className="w-[100px]">Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Wait Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined Via</TableHead>
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
                    filteredEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className={
                          entry.status === "serving" ? "bg-blue-50" : ""
                        }
                      >
                        <TableCell>
                          <div className="font-mono font-bold text-lg">
                            {entry.ticket_number.split("-")[1]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(entry.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {entry.customer_name}
                            </span>
                            {entry.customer_phone && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {entry.customer_phone}
                              </span>
                            )}
                            {getPriorityBadge(entry.priority)}
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
                            {entry.joined_via === "qr_code"
                              ? "QR Code"
                              : "Walk-in"}
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
                onChange={(e) =>
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
                onChange={(e) =>
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
                onValueChange={(value) =>
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
                onValueChange={(value) =>
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
                onChange={(e) =>
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Queue QR Code
            </DialogTitle>
            <DialogDescription>
              Share this QR code for customers to join your queue
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCode ? (
              <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                <img
                  src={qrCode}
                  alt="Queue QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>
            ) : (
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 bg-gray-50 w-72 h-72 flex flex-col items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 text-center">
                  QR Code will be generated when connected to database
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 w-full">
              <Input value={qrJoinUrl} readOnly className="text-sm" />
              <Button variant="outline" size="icon" onClick={copyJoinUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 w-full">
              <p className="text-sm text-blue-700 text-center">
                Customers can scan this QR code with their phone camera or your mobile app to join the queue instantly
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
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
              Open Join Page
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
