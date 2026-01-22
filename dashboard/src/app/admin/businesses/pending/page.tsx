"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PendingBusiness {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  business_description: string;
  created_at: string;
}

export default function PendingBusinessesPage() {
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<PendingBusiness | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const fetchPendingBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("role", "business_owner")
        .eq("is_approved", false)
        .is("rejection_reason", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending businesses:", error);
      toast.error("Failed to load pending businesses");
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedBusiness) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("admins")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", selectedBusiness.id);

      if (error) throw error;

      toast.success(`${selectedBusiness.business_name} has been approved!`);
      setSelectedBusiness(null);
      setActionType(null);
      fetchPendingBusinesses();
    } catch (error) {
      console.error("Error approving business:", error);
      toast.error("Failed to approve business");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBusiness || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("admins")
        .update({
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedBusiness.id);

      if (error) throw error;

      toast.success(`${selectedBusiness.business_name} has been rejected`);
      setSelectedBusiness(null);
      setActionType(null);
      setRejectionReason("");
      fetchPendingBusinesses();
    } catch (error) {
      console.error("Error rejecting business:", error);
      toast.error("Failed to reject business");
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (business: PendingBusiness, type: "approve" | "reject") => {
    setSelectedBusiness(business);
    setActionType(type);
  };

  const closeDialog = () => {
    setSelectedBusiness(null);
    setActionType(null);
    setRejectionReason("");
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
          <h1 className="text-3xl font-bold text-gray-900">Pending Business Approvals</h1>
          <p className="mt-2 text-gray-600">
            Review and approve business registrations waiting for your approval
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {businesses.length} Pending
        </Badge>
      </div>

      {/* Pending businesses list */}
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600 text-center max-w-md">
              There are no pending business registrations at the moment. You'll see new applications here as they come in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{business.business_name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline">{business.business_type}</Badge>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Owner Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Owner Information</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{business.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>{business.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{business.business_phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{business.business_address}</span>
                    </div>
                  </div>
                </div>

                {/* Business Description */}
                {business.business_description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {business.business_description}
                    </p>
                  </div>
                )}

                {/* Registration Date */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Registered on {new Date(business.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => openDialog(business, "approve")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => openDialog(business, "reject")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Confirmation Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Business Registration
            </DialogTitle>
            <DialogDescription>
              You are about to approve this business registration. The owner will gain access to their dashboard.
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="py-4 space-y-2">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Business:</span> {selectedBusiness.business_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Owner:</span> {selectedBusiness.full_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Type:</span> {selectedBusiness.business_type}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Reject Business Registration
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this business registration. The owner will be notified.
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="py-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Business:</span> {selectedBusiness.business_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Owner:</span> {selectedBusiness.full_name}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
