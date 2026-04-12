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
import { Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Clock, AlertCircle, MailCheck, MailX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";

interface PendingBusiness {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string;
  business_type: string;
  business_address: string;
  business_phone: string;
  business_description: string;
  created_at: string;
  email_verified: boolean;
  email_verified_at: string | null;
}

export default function PendingBusinessesPage() {
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<PendingBusiness | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "remove" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const fetchPendingBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("business_applications")
        .select("*")
        .eq("is_approved", false)
        .eq("is_rejected", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
      setLoading(false);
    } catch (error) {
      console.warn("Pending businesses API unavailable, backend may be offline");
      toast.error("Failed to load pending businesses");
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedBusiness) return;

    // Optimistic UI — instantly remove from list, assume success
    const optimisticSnapshot = businesses;
    const isAdminApplication = selectedBusiness.business_type === "Admin";
    const approvalMessage = isAdminApplication
      ? `Admin ${selectedBusiness.full_name} has been approved!`
      : `${selectedBusiness.business_name} has been approved!`;

    setBusinesses((prev) => prev.filter((b) => b.id !== selectedBusiness.id));
    closeDialog();
    toast.success(approvalMessage);

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      // Route through Spring Boot backend — bypasses RLS, handles admin + business record creation
      const approveRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/approve/${selectedBusiness.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!approveRes.ok) {
        const errBody = await approveRes.json().catch(() => ({}));
        throw new Error(errBody?.error || errBody?.message || "Failed to approve business");
      }

      // Send approval notification email (fire-and-forget)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-approval-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedBusiness.email,
          fullName: selectedBusiness.full_name,
          businessName: isAdminApplication ? undefined : selectedBusiness.business_name,
          isApproved: true,
        }),
      }).catch(() => {});
    } catch (error: unknown) {
      // Revert optimistic update on failure
      setBusinesses(optimisticSnapshot);
      console.error("Error approving business:", error);
      toast.error(getErrorMessage(error) || "Failed to approve business");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBusiness || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    // Optimistic UI — instantly remove from list, assume success
    const optimisticSnapshot = businesses;
    const rejectedBusiness = selectedBusiness;
    const reason = rejectionReason;

    setBusinesses((prev) => prev.filter((b) => b.id !== rejectedBusiness.id));
    closeDialog();
    toast.success(`${rejectedBusiness.business_name} has been rejected`);

    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("business_applications")
        .update({
          is_rejected: true,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id,
        })
        .eq("id", rejectedBusiness.id);

      if (error) throw error;

      // Send rejection notification email (fire-and-forget)
      const isAdminApplication = rejectedBusiness.business_type === "Admin";
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-approval-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: rejectedBusiness.email,
          fullName: rejectedBusiness.full_name,
          businessName: isAdminApplication ? undefined : rejectedBusiness.business_name,
          isApproved: false,
          rejectionReason: reason,
        }),
      }).catch(() => {});
    } catch (error) {
      // Revert optimistic update on failure
      setBusinesses(optimisticSnapshot);
      console.error("Error rejecting business:", error);
      toast.error("Failed to reject business");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedBusiness) return;

    // Optimistic UI — instantly remove from list, assume success
    const optimisticSnapshot = businesses;
    const removedBusiness = selectedBusiness;

    setBusinesses((prev) => prev.filter((b) => b.id !== removedBusiness.id));
    closeDialog();
    toast.success(`Application for ${removedBusiness.business_name || removedBusiness.full_name} removed`);

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/application/${removedBusiness.id}`,
        {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${session?.access_token}` },
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to remove application");
      }
    } catch (error: unknown) {
      // Revert optimistic update on failure
      setBusinesses(optimisticSnapshot);
      toast.error(getErrorMessage(error) || "Failed to remove application");
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (business: PendingBusiness, type: "approve" | "reject" | "remove") => {
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
      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-52" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        {/* Application cards grid — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 space-y-4">
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-44" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              {/* Info rows */}
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
              {/* Description */}
              <Skeleton className="h-12 w-full rounded-md" />
              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="mt-2 text-gray-600">
            Review and approve business and admin registrations waiting for your approval
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
            <CheckCircle className="h-16 w-16 text-gray-700 mb-4" />
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
                    <CardDescription className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{business.business_type}</Badge>
                      {business.business_type === "Admin" && (
                        <Badge variant="default">Admin Registration</Badge>
                      )}
                      {business.email_verified ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
                          <MailCheck className="h-3 w-3" />
                          Email Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
                          <MailX className="h-3 w-3" />
                          Awaiting Verification
                        </Badge>
                      )}
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
                  {business.email_verified ? (
                    <>
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
                    </>
                  ) : (
                    <div className="flex gap-3 flex-1">
                      <div className="flex-1 text-center py-2 px-4 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          Waiting for email verification
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDialog(business, "remove")}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
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
              <CheckCircle className="h-5 w-5 text-black" />
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

      {/* Remove Unverified Application Dialog */}
      <Dialog open={actionType === "remove"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove Application
            </DialogTitle>
            <DialogDescription>
              This will permanently delete the application and the associated user account. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBusiness && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Business:</span> {selectedBusiness.business_name || "—"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Owner:</span> {selectedBusiness.full_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {selectedBusiness.email}
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Email has not been verified yet
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={processing}>
              {processing ? "Removing..." : "Remove Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Confirmation Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-700" />
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
