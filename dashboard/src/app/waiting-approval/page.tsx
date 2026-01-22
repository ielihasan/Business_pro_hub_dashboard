"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Clock, CheckCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WaitingApprovalPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApprovalStatus();

    // Poll every 30 seconds to check if approved
    const interval = setInterval(checkApprovalStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/v1/login");
        return;
      }

      const { data: profile } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setBusiness(profile);

        // If approved, redirect to business dashboard
        if (profile.is_approved) {
          router.push("/business/dashboard");
        }

        // If rejected, show rejection reason
        if (profile.rejection_reason) {
          // Handle rejection
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking status:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/v1/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Application Under Review</CardTitle>
          <CardDescription className="text-base">
            Your business registration is being reviewed by our admin team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Business Information */}
          {business && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">Submitted Information:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Business Name</p>
                  <p className="font-medium">{business.business_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business Type</p>
                  <p className="font-medium">{business.business_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Owner Name</p>
                  <p className="font-medium">{business.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{business.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Application Submitted</p>
                <p className="text-xs text-gray-500">
                  Your business registration has been successfully submitted
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-sm">Under Review</p>
                <p className="text-xs text-gray-500">
                  Our admin team is reviewing your application
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-40">
              <div className="mt-1">
                <CheckCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Approval</p>
                <p className="text-xs text-gray-500">
                  You'll get access to your business dashboard
                </p>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm text-blue-900">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
              <li>Our team will review your business information</li>
              <li>Review typically takes 24-48 hours</li>
              <li>You'll receive an email notification once approved</li>
              <li>After approval, you can access your business dashboard</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-center text-gray-600">
              Need help or have questions?
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </Button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
