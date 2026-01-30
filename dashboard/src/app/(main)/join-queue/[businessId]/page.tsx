"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Users,
  Loader2,
  Store,
  Phone,
  User,
  Ticket,
  AlertCircle,
  RefreshCw,
  Bell,
  MapPin,
  Calendar,
  Hash,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

interface QueueTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_phone?: string;
  position: number;
  status: string;
  business_name: string;
  estimated_wait_minutes: number;
  people_ahead: number;
  service_type?: string;
  queue_type_id?: string;
  queue_type_name?: string;
  created_at?: string;
}

interface QueueInfo {
  current_serving: string | null;
  current_serving_number: string | null;
  total_waiting: number;
  avg_wait_time: number;
  business_name: string;
  is_open: boolean;
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

export default function JoinQueuePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const searchParams = useSearchParams();
  const queueTypeFromUrl = searchParams.get("queue_type");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [businessName, setBusinessName] = useState("Business");
  const [queueClosed, setQueueClosed] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Queue types state
  const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
  const [selectedQueueType, setSelectedQueueType] = useState<string>(queueTypeFromUrl || "");

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_type: "",
  });

  // Fetch queue types
  const fetchQueueTypes = useCallback(async () => {
    try {
      const res = await fetch(`/API/queue-types?business_id=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        const types = data.data || [];
        setQueueTypes(types);

        // If queue_type was provided in URL, validate it exists
        if (queueTypeFromUrl && types.length > 0) {
          const validType = types.find((t: QueueType) => t.id === queueTypeFromUrl);
          if (validType) {
            setSelectedQueueType(queueTypeFromUrl);
          } else {
            // Invalid queue type, let user choose
            setSelectedQueueType("");
          }
        } else if (types.length === 1 && types[0].id !== "default") {
          // Auto-select if only one queue type exists
          setSelectedQueueType(types[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching queue types:", error);
    }
  }, [businessId, queueTypeFromUrl]);

  // Fetch initial queue info
  const fetchQueueInfo = useCallback(async () => {
    try {
      let url = `/API/queue/info?business_id=${businessId}`;
      if (selectedQueueType && selectedQueueType !== "default") {
        url += `&queue_type_id=${selectedQueueType}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQueueInfo(data.data);
        setBusinessName(data.data.business_name || "Business");
        setQueueClosed(!data.data.is_open);
      }
    } catch (error) {
      console.error("Error fetching queue info:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [businessId, selectedQueueType]);

  // Refresh ticket status
  const refreshTicketStatus = useCallback(async (ticketNumber: string) => {
    try {
      const res = await fetch(`/API/queue/status?ticket=${ticketNumber}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setTicket(data.data);
        setQueueInfo(prev => prev ? {
          ...prev,
          current_serving: data.queue_info?.current_serving || prev.current_serving,
          current_serving_number: data.queue_info?.current_serving_number || prev.current_serving_number,
          total_waiting: data.queue_info?.total_waiting ?? prev.total_waiting,
        } : null);
        localStorage.setItem(
          `queue_ticket_${businessId}`,
          JSON.stringify(data.data)
        );
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Status refresh error:", error);
    }
  }, [businessId]);

  // Fetch queue types on mount
  useEffect(() => {
    fetchQueueTypes();
  }, [fetchQueueTypes]);

  // Check if user already has a ticket (using localStorage)
  useEffect(() => {
    fetchQueueInfo();

    // Build storage key with optional queue type
    const storageKey = selectedQueueType && selectedQueueType !== "default"
      ? `queue_ticket_${businessId}_${selectedQueueType}`
      : `queue_ticket_${businessId}`;

    const savedTicket = localStorage.getItem(storageKey);
    if (savedTicket) {
      const ticketData = JSON.parse(savedTicket);
      // Check if ticket is still valid (same day)
      const ticketNumber = ticketData.ticket_number || "";
      const ticketDateMatch = ticketNumber.match(/\d{8}/);
      const ticketDate = ticketDateMatch ? ticketDateMatch[0] : "";
      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      if (ticketDate === today && ticketData.status !== "completed" && ticketData.status !== "cancelled") {
        setTicket(ticketData);
        setJoined(true);
        // Refresh status
        refreshTicketStatus(ticketData.ticket_number);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [businessId, selectedQueueType, fetchQueueInfo, refreshTicketStatus]);

  // Set up real-time subscription for queue updates
  useEffect(() => {
    if (!joined || !ticket) return;

    // Subscribe to queue_entries table changes
    const channel = supabase
      .channel(`queue-updates-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          // Refresh ticket status when any queue entry changes
          if (ticket?.ticket_number) {
            refreshTicketStatus(ticket.ticket_number);
          }
        }
      )
      .subscribe();

    // Also set up auto-refresh every 15 seconds
    const refreshInterval = setInterval(() => {
      if (ticket?.ticket_number) {
        refreshTicketStatus(ticket.ticket_number);
      }
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [joined, ticket?.ticket_number, businessId, refreshTicketStatus]);

  const handleJoinQueue = async () => {
    if (!formData.customer_name || !formData.customer_phone) {
      toast.error("Please enter your name and phone number");
      return;
    }

    // Require queue type selection if multiple types exist
    if (queueTypes.length > 1 && !selectedQueueType) {
      toast.error("Please select a queue type");
      return;
    }

    const selectedType = queueTypes.find(t => t.id === selectedQueueType);

    try {
      setLoading(true);
      const res = await fetch("/API/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          ...formData,
          queue_type_id: selectedQueueType || undefined,
          queue_type_name: selectedType?.name || undefined,
        }),
      });

      const data = await res.json();

      // Build storage key with optional queue type
      const storageKey = selectedQueueType && selectedQueueType !== "default"
        ? `queue_ticket_${businessId}_${selectedQueueType}`
        : `queue_ticket_${businessId}`;

      if (!res.ok) {
        if (data.data) {
          // User already in queue
          setTicket(data.data);
          setJoined(true);
          localStorage.setItem(storageKey, JSON.stringify(data.data));
        }
        throw new Error(data.error);
      }

      setTicket(data.data);
      setJoined(true);
      localStorage.setItem(storageKey, JSON.stringify(data.data));
      toast.success("Successfully joined the queue!");

      // Refresh queue info
      fetchQueueInfo();
    } catch (error: any) {
      if (error.message.includes("closed")) {
        setQueueClosed(true);
      }
      toast.error(error.message || "Failed to join queue");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (ticket?.id) {
      try {
        await fetch(`/API/queue/${ticket.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
      } catch (error) {
        console.error("Error leaving queue:", error);
      }
    }
    // Build storage key with optional queue type
    const storageKey = ticket?.queue_type_id && ticket.queue_type_id !== "default"
      ? `queue_ticket_${businessId}_${ticket.queue_type_id}`
      : `queue_ticket_${businessId}`;
    localStorage.removeItem(storageKey);
    setJoined(false);
    setTicket(null);
    setFormData({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      service_type: "",
    });
    toast.success("You have left the queue");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading queue information...</p>
        </div>
      </div>
    );
  }

  if (queueClosed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Queue is Closed
            </h2>
            <p className="text-gray-500 text-center">
              This business's queue is currently closed. Please try again during
              business hours.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joined && ticket) {
    const ticketQueueType = queueTypes.find(t => t.id === ticket.queue_type_id);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 rounded-full p-4">
                <Ticket className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-2xl">Your Queue Ticket</CardTitle>
            <CardDescription className="text-blue-100">
              {ticket.business_name || businessName}
            </CardDescription>
            {(ticket.queue_type_name || ticketQueueType) && (
              <Badge
                className="mt-2 mx-auto"
                style={{
                  backgroundColor: ticketQueueType?.color || "#3B82F6",
                  color: "white"
                }}
              >
                <Layers className="h-3 w-3 mr-1" />
                {ticket.queue_type_name || ticketQueueType?.name}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Ticket Number - Large Display */}
            <div className="text-center bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Your Ticket Number</p>
              <div className="text-6xl font-bold text-blue-600 font-mono">
                {ticket.ticket_number.split("-")[1]}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {ticket.ticket_number}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              {ticket.status === "waiting" && (
                <Badge className="bg-yellow-100 text-yellow-700 text-lg px-6 py-3">
                  <Clock className="h-5 w-5 mr-2" />
                  Waiting in Queue
                </Badge>
              )}
              {ticket.status === "serving" && (
                <Badge className="bg-green-100 text-green-700 text-lg px-6 py-3 animate-pulse">
                  <Bell className="h-5 w-5 mr-2" />
                  It's Your Turn!
                </Badge>
              )}
              {ticket.status === "completed" && (
                <Badge className="bg-gray-100 text-gray-700 text-lg px-6 py-3">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Completed
                </Badge>
              )}
              {ticket.status === "cancelled" && (
                <Badge className="bg-red-100 text-red-700 text-lg px-6 py-3">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Cancelled
                </Badge>
              )}
            </div>

            {/* Current Serving Info */}
            {queueInfo?.current_serving_number && ticket.status === "waiting" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">Now Serving</p>
                <p className="text-3xl font-bold text-blue-700 font-mono">
                  {queueInfo.current_serving_number.split("-")[1] || queueInfo.current_serving_number}
                </p>
              </div>
            )}

            {/* Queue Info Grid */}
            {ticket.status === "waiting" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-bold text-gray-900">
                    {ticket.people_ahead}
                  </p>
                  <p className="text-sm text-gray-500">People Ahead</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-bold text-gray-900">
                    ~{ticket.estimated_wait_minutes}
                  </p>
                  <p className="text-sm text-gray-500">Minutes Wait</p>
                </div>
              </div>
            )}

            {/* Customer & Ticket Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{ticket.customer_name}</span>
              </div>
              {ticket.service_type && (
                <div className="flex items-center gap-3 text-sm">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{ticket.service_type}</span>
                </div>
              )}
              {ticket.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Joined at {formatTime(ticket.created_at)}</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            {ticket.status === "waiting" && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-700 text-center">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Please wait nearby. This page updates automatically!
                </p>
                <p className="text-xs text-blue-500 text-center mt-2">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
            )}

            {ticket.status === "serving" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-lg text-green-700 text-center font-bold animate-pulse">
                  Please proceed to the counter now!
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => ticket?.ticket_number && refreshTicketStatus(ticket.ticket_number)}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              {(ticket.status === "waiting") && (
                <Button
                  variant="ghost"
                  onClick={handleLeaveQueue}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Leave Queue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the selected queue type details
  const selectedTypeDetails = queueTypes.find(t => t.id === selectedQueueType);

  // Join Queue Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Store className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">{businessName}</CardTitle>
          <CardDescription>
            Join the queue and skip the wait!
          </CardDescription>
        </CardHeader>

        {/* Queue Type Selection - Show if multiple queue types exist */}
        {queueTypes.length > 1 && (
          <div className="px-6 pb-4">
            <Label className="text-sm font-medium mb-2 block">
              Select Queue <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {queueTypes.filter(t => t.is_active).map((queueType) => (
                <button
                  key={queueType.id}
                  onClick={() => setSelectedQueueType(queueType.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    selectedQueueType === queueType.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: queueType.color }}
                    >
                      {queueType.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{queueType.name}</p>
                      <p className="text-xs text-gray-500">~{queueType.estimated_service_time} min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show selected queue type info */}
        {selectedTypeDetails && selectedTypeDetails.description && (
          <div className="px-6 pb-2">
            <div
              className="p-3 rounded-lg border-l-4"
              style={{ borderColor: selectedTypeDetails.color, backgroundColor: selectedTypeDetails.color + "10" }}
            >
              <p className="text-sm text-gray-600">{selectedTypeDetails.description}</p>
            </div>
          </div>
        )}

        {/* Queue Status Info */}
        {queueInfo && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{queueInfo.total_waiting}</p>
                  <p className="text-xs text-gray-500">People Waiting</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">~{queueInfo.avg_wait_time}</p>
                  <p className="text-xs text-gray-500">Min Avg Wait</p>
                </div>
              </div>
              {queueInfo.current_serving_number && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500">Now Serving</p>
                  <p className="text-xl font-bold text-green-600 font-mono">
                    #{queueInfo.current_serving_number.split("-")[1] || queueInfo.current_serving_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+92 300 1234567"
                value={formData.customer_phone}
                onChange={(e) =>
                  setFormData({ ...formData, customer_phone: e.target.value })
                }
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500">
              We'll use this to identify your position in queue
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service Type (Optional)</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) =>
                setFormData({ ...formData, service_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
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

          <Button
            onClick={handleJoinQueue}
            disabled={loading || (queueTypes.length > 1 && !selectedQueueType)}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            style={selectedTypeDetails ? { backgroundColor: selectedTypeDetails.color } : {}}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Ticket className="h-5 w-5 mr-2" />
                {selectedTypeDetails
                  ? `Join ${selectedTypeDetails.name} Queue`
                  : "Join Queue Now"}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Your data is only used to manage your queue position
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
