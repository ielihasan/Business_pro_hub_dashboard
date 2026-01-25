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

// Mock data for demo
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Ali Hassan",
    phone: "+92 300 1234567",
    email: "ali.hassan@example.com",
    total_visits: 8,
    completed_visits: 7,
    cancelled_visits: 1,
    first_visit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    last_visit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    services_used: ["Haircut", "Beard Trim", "Hair Color"],
    visit_history: [
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), service: "Haircut", status: "completed" },
      { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), service: "Beard Trim", status: "completed" },
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), service: "Hair Color", status: "completed" },
    ],
  },
  {
    id: "2",
    name: "Ahmed Khan",
    phone: "+92 321 7654321",
    email: "ahmed.khan@example.com",
    total_visits: 5,
    completed_visits: 5,
    cancelled_visits: 0,
    first_visit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    last_visit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    services_used: ["Full Service", "Haircut"],
    visit_history: [
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), service: "Full Service", status: "completed" },
      { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), service: "Haircut", status: "completed" },
    ],
  },
  {
    id: "3",
    name: "Usman Ali",
    phone: "+92 333 9876543",
    total_visits: 3,
    completed_visits: 2,
    cancelled_visits: 1,
    first_visit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_visit: new Date().toISOString(),
    services_used: ["Haircut", "Beard Trim"],
    visit_history: [
      { date: new Date().toISOString(), service: "Haircut", status: "waiting" },
      { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), service: "Beard Trim", status: "completed" },
    ],
  },
  {
    id: "4",
    name: "Bilal Malik",
    phone: "+92 345 1122334",
    email: "bilal@example.com",
    total_visits: 1,
    completed_visits: 1,
    cancelled_visits: 0,
    first_visit: new Date().toISOString(),
    last_visit: new Date().toISOString(),
    services_used: ["Haircut"],
    visit_history: [
      { date: new Date().toISOString(), service: "Haircut", status: "completed" },
    ],
  },
  {
    id: "5",
    name: "Farhan Ahmed",
    phone: "+92 312 5566778",
    total_visits: 12,
    completed_visits: 11,
    cancelled_visits: 1,
    first_visit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    last_visit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    services_used: ["Haircut", "Beard Trim", "Full Service", "Hair Treatment"],
    visit_history: [
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), service: "Full Service", status: "completed" },
      { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), service: "Haircut", status: "completed" },
      { date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), service: "Hair Treatment", status: "completed" },
    ],
  },
];

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
  const [useMockData, setUseMockData] = useState(false);

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
    if (businessId) {
      fetchCustomers();
    }
  }, [businessId, sortBy, dateFrom, dateTo]);

  const getBusinessId = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .eq("role", "business_owner")
          .single();

        if (admin) {
          setBusinessId(admin.id);
        }
      }
    } catch (error) {
      console.error("Error getting business ID:", error);
      setUseMockData(true);
      loadMockData();
    }
  };

  const loadMockData = () => {
    setCustomers(mockCustomers);
    setStats({
      total_customers: mockCustomers.length,
      new_customers_today: mockCustomers.filter((c) => {
        const today = new Date().toISOString().split("T")[0];
        return c.first_visit.startsWith(today);
      }).length,
      repeat_customers: mockCustomers.filter((c) => c.total_visits > 1).length,
      total_visits: mockCustomers.reduce((sum, c) => sum + c.total_visits, 0),
    });
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("business_id", businessId!);
      params.append("sort_by", sortBy);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const res = await fetch(`/API/customers?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      if (data.data && data.data.length > 0) {
        setCustomers(data.data);
        setStats(data.stats);
        setUseMockData(false);
      } else {
        setUseMockData(true);
        loadMockData();
      }
    } catch (error: any) {
      console.error("Fetch customers error:", error);
      setUseMockData(true);
      loadMockData();
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

      if (useMockData) {
        // Demo mode
        const newEntry: Customer = {
          id: Date.now().toString(),
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          total_visits: 0,
          completed_visits: 0,
          cancelled_visits: 0,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          services_used: [],
          visit_history: [],
        };
        setCustomers([newEntry, ...customers]);
        setStats({
          ...stats,
          total_customers: stats.total_customers + 1,
          new_customers_today: stats.new_customers_today + 1,
        });
        toast.success("Customer added successfully!");
      } else {
        const res = await fetch("/API/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: businessId,
            ...newCustomer,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error);
        }

        toast.success("Customer added successfully!");
        fetchCustomers();
      }

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
          <Badge className="bg-yellow-100 text-yellow-700">
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
    if (visits >= 10) return { label: "VIP", color: "bg-purple-100 text-purple-700" };
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
            onClick={() => (useMockData ? loadMockData() : fetchCustomers())}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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

      {/* Demo Mode Banner */}
      {useMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Mode</p>
            <p className="text-xs text-yellow-600">
              Showing sample data. Customers are automatically added when they scan your QR code.
            </p>
          </div>
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
                <p className="text-2xl font-bold text-purple-600">
                  {stats.repeat_customers}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Repeat className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Visits</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.total_visits}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <QrCode className="h-5 w-5 text-amber-600" />
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                            <Badge className="bg-purple-100 text-purple-700">
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
              <div className="grid grid-cols-3 gap-4">
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
