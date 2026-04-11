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
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Phone,
  Mail,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  UserPlus,
  TrendingUp,
  Repeat,
  CalendarDays,
  Filter,
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { resolveBusinessId } from "@/lib/resolve-business-id";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerVisit {
  date: string;
  service: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  total_visits: number;
  completed_visits: number;
  cancelled_visits: number;
  total_spent: number;
  first_visit: string;
  last_visit: string;
  services_used: string[];
  visit_history: CustomerVisit[];
}

interface CustomerStats {
  total_customers: number;
  new_customers_today: number;
  repeat_customers: number;
  total_visits: number;
}


export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    new_customers_today: 0,
    repeat_customers: 0,
    total_visits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("last_visit");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // View customer dialog
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Add customer dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) fetchCustomers();
  }, [businessId, sortBy, dateFrom, dateTo, page]);

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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const params = new URLSearchParams();
      params.append("business_id", businessId!);
      params.append("sort_by", sortBy);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      params.append("page", String(page));
      params.append("page_size", "20");

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.error || "Failed to load customers");

      const inner = json.data || {};
      const list: Customer[] = (inner.data || []).map((c: any) => ({
        id: c.customer_id || c.customer_phone || Math.random().toString(),
        name: c.customer_name || "Unknown",
        phone: c.customer_phone || "",
        email: c.customer_email,
        total_visits: c.visit_count || 1,
        completed_visits: c.completed_visits || 0,
        cancelled_visits: c.cancelled_visits || 0,
        total_spent: parseFloat(c.total_spent || 0),
        first_visit: c.first_visit || c.last_visit || new Date().toISOString(),
        last_visit: c.last_visit || new Date().toISOString(),
        services_used: c.services_used || [],
        visit_history: (c.visit_history || []).map((v: any) => ({
          date: v.date,
          service: v.service || "Queue Visit",
          status: v.status || "completed",
        })),
      }));
      setCustomers(list);
      setTotalCount(inner.total || 0);
      setTotalPages(inner.total_pages || 1);
      const s = inner.stats || {};
      setStats({
        total_customers: s.total_customers ?? inner.total ?? list.length,
        new_customers_today: s.new_customers_today ?? 0,
        repeat_customers: s.repeat_customers ?? list.filter((c) => c.total_visits > 1).length,
        total_visits: s.total_visits ?? list.reduce((sum, c) => sum + c.total_visits, 0),
      });
    } catch (error: any) {
      setApiError(error.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Please enter customer name and phone");
      return;
    }

    try {
      setSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ business_id: businessId, ...newCustomer }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      toast.success("Customer added successfully!");
      fetchCustomers();

      setNewCustomer({ name: "", phone: "", email: "", notes: "" });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVisitStatusBadge = (status: string) => {
    switch (status) {
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
      case "waiting":
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <Clock className="h-3 w-3 mr-1" />
            Waiting
          </Badge>
        );
      case "serving":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Serving
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCustomerTier = (visits: number) => {
    if (visits >= 10) return { label: "VIP", color: "bg-black text-white" };
    if (visits >= 5) return { label: "Regular", color: "bg-blue-100 text-blue-700" };
    if (visits > 1) return { label: "Returning", color: "bg-green-100 text-green-700" };
    return { label: "New", color: "bg-gray-100 text-gray-700" };
  };

  const getDaysSinceLastVisit = (lastVisit: string) => {
    const days = Math.floor(
      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-gray-600">
            Track customers who joined via QR code scanning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchCustomers()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setNewCustomer({ name: "", phone: "", email: "", notes: "" });
              setSubmitting(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Manually add a customer to your database
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Customer name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+92 300 1234567"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes about this customer..."
                    value={newCustomer.notes}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Add Customer
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
            <p className="text-sm font-medium text-red-800">Failed to load customers</p>
            <p className="text-xs text-red-600">{apiError}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => fetchCustomers()}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_customers}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.new_customers_today}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Repeat Customers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.repeat_customers}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Repeat className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_visits}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <QrCode className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[140px]"
                  placeholder="From"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[140px]"
                  placeholder="To"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_visit">Last Visit</SelectItem>
                  <SelectItem value="first_visit">First Visit</SelectItem>
                  <SelectItem value="visits">Most Visits</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Database</CardTitle>
          <CardDescription>
            Customers who joined your queue via QR code scanning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-1 min-w-[140px]">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-8 mx-4" />
                  <div className="flex gap-1 min-w-[120px]">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12 rounded-full ml-auto" />
                  <Skeleton className="h-7 w-7" />
                </div>
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try a different search term"
                  : "Customers will appear here when they scan your QR code"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const tier = getCustomerTier(customer.total_visits);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 rounded-full h-10 w-10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {customer.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <Badge className={`text-xs ${tier.color}`}>
                                {tier.label}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail className="h-3 w-3 text-gray-400" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">
                              {customer.total_visits}
                            </span>
                            <div className="text-xs text-gray-500">
                              <span className="text-green-600">
                                {customer.completed_visits} done
                              </span>
                              {customer.cancelled_visits > 0 && (
                                <span className="text-red-500 ml-1">
                                  {customer.cancelled_visits} cancelled
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-700">
                            {customer.total_spent > 0
                              ? `Rs. ${customer.total_spent.toLocaleString()}`
                              : <span className="text-gray-400">—</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {customer.services_used.slice(0, 2).map((service, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {customer.services_used.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{customer.services_used.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {getDaysSinceLastVisit(customer.last_visit)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(customer.last_visit)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.total_visits >= 10 && (
                            <Badge className="bg-black text-white">
                              <Star className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          )}
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
                                  setSelectedCustomer(customer);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                <History className="h-4 w-4 mr-2" />
                                Visit History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, totalCount)} of {totalCount} customers
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

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View customer information and visit history
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center">
                  <span className="text-primary text-2xl font-bold">
                    {selectedCustomer.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCustomerTier(selectedCustomer.total_visits).color}>
                      {getCustomerTier(selectedCustomer.total_visits).label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {selectedCustomer.total_visits} visits
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Customer since {formatDate(selectedCustomer.first_visit)}
                  </span>
                </div>
              </div>

              {/* Visit Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedCustomer.completed_visits}
                  </p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedCustomer.cancelled_visits}
                  </p>
                  <p className="text-xs text-gray-600">Cancelled</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedCustomer.services_used.length}
                  </p>
                  <p className="text-xs text-gray-600">Services</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-bold text-yellow-700">
                    {selectedCustomer.total_spent > 0
                      ? `Rs.${selectedCustomer.total_spent.toLocaleString()}`
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-600">Total Spent</p>
                </div>
              </div>

              {/* Services Used */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Services Used</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.services_used.map((service, i) => (
                    <Badge key={i} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Visit History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Visits</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCustomer.visit_history.map((visit, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{visit.service || "Queue Visit"}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(visit.date)}
                        </p>
                      </div>
                      {getVisitStatusBadge(visit.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
