"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Search,
  Filter,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface ApprovedBusiness {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  business_description: string;
  created_at: string;
  approved_at: string;
  subscription_plan: string;
}

export default function ApprovedBusinessesPage() {
  const [businesses, setBusinesses] = useState<ApprovedBusiness[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<ApprovedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<ApprovedBusiness | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchApprovedBusinesses();
    fetchBusinessTypes();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [searchQuery, typeFilter, businesses]);

  const fetchApprovedBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("role", "business_owner")
        .eq("is_approved", true)
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
      setFilteredBusinesses(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching approved businesses:", error);
      setLoading(false);
    }
  };

  const fetchBusinessTypes = async () => {
    try {
      const { data } = await supabase
        .from("business_types")
        .select("name")
        .eq("is_active", true)
        .order("name");

      if (data) {
        setBusinessTypes(data.map(t => t.name));
      }
    } catch (error) {
      console.error("Error fetching business types:", error);
    }
  };

  const filterBusinesses = () => {
    let filtered = businesses;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.business_name.toLowerCase().includes(query) ||
          b.full_name.toLowerCase().includes(query) ||
          b.email.toLowerCase().includes(query) ||
          b.business_type.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((b) => b.business_type === typeFilter);
    }

    setFilteredBusinesses(filtered);
  };

  const openDetails = (business: ApprovedBusiness) => {
    setSelectedBusiness(business);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approved Businesses</h1>
          <p className="mt-2 text-gray-600">
            View and manage all approved businesses on the platform
          </p>
        </div>
        <Badge className="text-lg px-4 py-2">
          {businesses.length} Active
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, owner, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Business Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Filter by type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Types</SelectItem>
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredBusinesses.length} of {businesses.length} businesses
          </div>
        </CardContent>
      </Card>

      {/* Businesses Grid */}
      {filteredBusinesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || typeFilter !== "all" ? "No Results Found" : "No Approved Businesses"}
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchQuery || typeFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Approved businesses will appear here once you approve them"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{business.business_name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline">{business.business_type}</Badge>
                    </CardDescription>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate">{business.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{business.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{business.business_phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{business.business_address}</span>
                  </div>
                </div>

                {/* Subscription */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Plan:</span>
                    <Badge variant="secondary" className="capitalize">
                      {business.subscription_plan || "Free"}
                    </Badge>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Approved on{" "}
                      {new Date(business.approved_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openDetails(business)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Business Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedBusiness?.business_name}</DialogTitle>
            <DialogDescription>
              Complete business information and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="space-y-6 py-4">
              {/* Owner Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Owner Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{selectedBusiness.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedBusiness.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedBusiness.business_phone}</span>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Business Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Business Type:</span>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedBusiness.business_type}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="mt-1 text-gray-900">{selectedBusiness.business_address}</p>
                  </div>
                  {selectedBusiness.business_description && (
                    <div>
                      <span className="text-gray-500">Description:</span>
                      <p className="mt-1 text-gray-900 leading-relaxed">
                        {selectedBusiness.business_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription & Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Account Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <Badge className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Approved
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Subscription Plan:</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedBusiness.subscription_plan || "Free"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Registered:</span>
                    <span className="text-gray-900">
                      {new Date(selectedBusiness.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Approved:</span>
                    <span className="text-gray-900">
                      {new Date(selectedBusiness.approved_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Owner
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
