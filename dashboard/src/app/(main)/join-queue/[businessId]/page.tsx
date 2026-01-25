"use client";

import { useState, useEffect, use } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

interface QueueTicket {
  id: string;
  ticket_number: string;
  customer_name: string;
  position: number;
  status: string;
  business_name: string;
  estimated_wait_minutes: number;
  people_ahead: number;
}

export default function JoinQueuePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);

  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [businessName, setBusinessName] = useState("Business");
  const [queueClosed, setQueueClosed] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    service_type: "",
  });

  // Check if user already has a ticket (using localStorage)
  useEffect(() => {
    const savedTicket = localStorage.getItem(`queue_ticket_${businessId}`);
    if (savedTicket) {
      const ticketData = JSON.parse(savedTicket);
      // Check if ticket is still valid (same day)
      const ticketDate = ticketData.ticket_number?.split("-")[0]?.replace("Q", "");
      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      if (ticketDate === today) {
        setTicket(ticketData);
        setJoined(true);
        // Refresh status
        refreshTicketStatus(ticketData.ticket_number);
      } else {
        localStorage.removeItem(`queue_ticket_${businessId}`);
      }
    }
  }, [businessId]);

  const refreshTicketStatus = async (ticketNumber: string) => {
    try {
      const res = await fetch(`/API/queue/status?ticket=${ticketNumber}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setTicket(data.data);
        localStorage.setItem(
          `queue_ticket_${businessId}`,
          JSON.stringify(data.data)
        );
      }
    } catch (error) {
      console.error("Status refresh error:", error);
    }
  };

  const handleJoinQueue = async () => {
    if (!formData.customer_name || !formData.customer_phone) {
      toast.error("Please enter your name and phone number");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/API/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.data) {
          // User already in queue
          setTicket(data.data);
          setJoined(true);
          localStorage.setItem(
            `queue_ticket_${businessId}`,
            JSON.stringify(data.data)
          );
        }
        throw new Error(data.error);
      }

      setTicket(data.data);
      setJoined(true);
      localStorage.setItem(
        `queue_ticket_${businessId}`,
        JSON.stringify(data.data)
      );
      toast.success("Successfully joined the queue!");
    } catch (error: any) {
      if (error.message.includes("closed")) {
        setQueueClosed(true);
      }
      toast.error(error.message || "Failed to join queue");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = () => {
    localStorage.removeItem(`queue_ticket_${businessId}`);
    setJoined(false);
    setTicket(null);
    setFormData({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      service_type: "",
    });
  };

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
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Ticket Number */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Ticket Number</p>
              <div className="text-5xl font-bold text-blue-600 font-mono">
                {ticket.ticket_number.split("-")[1]}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {ticket.ticket_number}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              {ticket.status === "waiting" && (
                <Badge className="bg-yellow-100 text-yellow-700 text-lg px-4 py-2">
                  <Clock className="h-4 w-4 mr-2" />
                  Waiting
                </Badge>
              )}
              {ticket.status === "serving" && (
                <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2 animate-pulse">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Your Turn!
                </Badge>
              )}
              {ticket.status === "completed" && (
                <Badge className="bg-gray-100 text-gray-700 text-lg px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </Badge>
              )}
            </div>

            {/* Queue Info */}
            {ticket.status === "waiting" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-2xl font-bold text-gray-900">
                    {ticket.people_ahead}
                  </p>
                  <p className="text-sm text-gray-500">People Ahead</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-2xl font-bold text-gray-900">
                    ~{ticket.estimated_wait_minutes}
                  </p>
                  <p className="text-sm text-gray-500">Minutes Wait</p>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{ticket.customer_name}</span>
              </div>
            </div>

            {/* Instructions */}
            {ticket.status === "waiting" && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-700 text-center">
                  Please wait nearby. We'll notify you when it's almost your
                  turn!
                </p>
              </div>
            )}

            {ticket.status === "serving" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
                <p className="text-sm text-green-700 text-center font-semibold">
                  It's your turn! Please proceed to the counter.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => refreshTicketStatus(ticket.ticket_number)}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              {ticket.status === "waiting" && (
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Store className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join the Queue</CardTitle>
          <CardDescription>
            Enter your details to join the queue and skip the wait!
          </CardDescription>
        </CardHeader>
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
              We'll send you updates about your queue position
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service Type</Label>
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
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleJoinQueue}
            disabled={loading}
            className="w-full h-12 text-lg"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Ticket className="h-5 w-5 mr-2" />
                Join Queue
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By joining, you agree to receive notifications about your queue
            status
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
