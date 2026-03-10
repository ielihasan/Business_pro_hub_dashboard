"use client";

import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { resolveBusinessId } from "@/lib/resolve-business-id";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  total_amount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  notes?: string;
  created_at: string;
  updated_at?: string;
}

interface OrderStats {
  today_orders: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  today_revenue: number;
}


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    today_orders: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    today_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    notes: "",
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { name: "", quantity: 1, price: 0 },
  ]);

  useEffect(() => {
    getBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) fetchOrders();
  }, [businessId, statusFilter, page]);

  const getBusinessId = async () => {
    try {
      const id = await resolveBusinessId();
      if (id) {
        setBusinessId(id);
      } else {
        setApiError("Not authenticated");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error getting business ID:", error);
      setApiError("Failed to load business data");
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const params = new URLSearchParams();
      params.append("business_id", businessId!);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", String(page));
      params.append("page_size", "20");

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load orders");

      const inner = json.data || {};
      const list: Order[] = inner.data || [];
      setOrders(list);
      setTotalCount(inner.total || 0);
      setTotalPages(inner.total_pages || 1);
      setStats(calculateStats(list));
    } catch (error: any) {
      setApiError(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderList: Order[]): OrderStats => {
    return {
      today_orders: orderList.length,
      pending: orderList.filter((o) => o.status === "pending").length,
      processing: orderList.filter((o) => o.status === "processing").length,
      completed: orderList.filter((o) => o.status === "completed").length,
      cancelled: orderList.filter((o) => o.status === "cancelled").length,
      today_revenue: orderList
        .filter((o) => o.status === "completed" && o.payment_status === "paid")
        .reduce((sum, o) => sum + o.total_amount, 0),
    };
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_phone) {
      toast.error("Please enter customer name and phone");
      return;
    }

    const validItems = orderItems.filter((item) => item.name && item.price > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      setSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          business_id: businessId,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          customer_email: newOrder.customer_email || undefined,
          items: validItems,
          total_amount: calculateTotal(),
          notes: newOrder.notes || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      toast.success("Order created successfully!");
      fetchOrders();

      // Reset form
      setNewOrder({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        notes: "",
      });
      setOrderItems([{ name: "", quantity: 1, price: 0 }]);
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleUpdatePayment = async (
    orderId: string,
    paymentStatus: Order["payment_status"]
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ payment_status: paymentStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }

      toast.success(`Payment marked as ${paymentStatus}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error);
      }

      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete order");
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: Order["payment_status"]) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
      case "unpaid":
        return <Badge className="bg-red-100 text-red-700">Unpaid</Badge>;
      case "refunded":
        return <Badge className="bg-gray-100 text-gray-700">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    return matchesSearch;
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-gray-600">
            Manage customer orders and track payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOrders()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Add a new customer order with items and details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customer_name"
                        placeholder="Customer name"
                        value={newOrder.customer_name}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            customer_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customer_phone"
                        placeholder="+92 300 1234567"
                        value={newOrder.customer_phone}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            customer_phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email (Optional)</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      placeholder="customer@example.com"
                      value={newOrder.customer_email}
                      onChange={(e) =>
                        setNewOrder({
                          ...newOrder,
                          customer_email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Order Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 space-y-2">
                          <Label>Item Name</Label>
                          <Input
                            placeholder="Service or product name"
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="w-20 space-y-2">
                          <Label>Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <div className="w-28 space-y-2">
                          <Label>Price (Rs.)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          disabled={orderItems.length === 1}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-end">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">Total: </span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions..."
                    value={newOrder.notes}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateOrder} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load orders</p>
            <p className="text-xs text-red-600">{apiError}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => fetchOrders()}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.today_orders}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-700">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.processing}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.cancelled}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs. {stats.today_revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                View and manage today's customer orders
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-7 w-7" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first order to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.order_number.split("-").pop()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-gray-500">
                            {order.customer_phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.slice(0, 2).map((item, i) => (
                            <span key={i}>
                              {item.name}
                              {item.quantity > 1 && ` x${item.quantity}`}
                              {i < Math.min(order.items.length - 1, 1) && ", "}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-gray-400">
                              {" "}
                              +{order.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatTime(order.created_at)}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            {order.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(order.id, "processing")
                                }
                              >
                                <Loader2 className="h-4 w-4 mr-2" />
                                Start Processing
                              </DropdownMenuItem>
                            )}
                            {order.status === "processing" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(order.id, "completed")
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            {(order.status === "pending" ||
                              order.status === "processing") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(order.id, "cancelled")
                                }
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Payment</DropdownMenuLabel>
                            {order.payment_status === "unpaid" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdatePayment(order.id, "paid")
                                }
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {order.payment_status === "paid" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdatePayment(order.id, "refunded")
                                }
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Refund Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, totalCount)} of {totalCount} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Status & Payment */}
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedOrder.status)}
                {getPaymentBadge(selectedOrder.payment_status)}
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Customer</h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.customer_phone}
                  </p>
                  {selectedOrder.customer_email && (
                    <p className="text-sm text-gray-600">
                      {selectedOrder.customer_email}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Items</h4>
                <div className="bg-gray-50 p-3 rounded-lg divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between py-2 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(selectedOrder.total_amount)}
                </span>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-sm text-gray-500">
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
