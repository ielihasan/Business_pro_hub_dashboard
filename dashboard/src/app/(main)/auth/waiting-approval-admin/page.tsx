"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Mail, Phone, HelpCircle, LogOut, Shield, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function WaitingApprovalAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/v1/login");
        return;
      }

      // Check if user has a pending admin application (filter by Admin type)
      const { data: applications, error } = await supabase
        .from("business_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_type", "Admin")
        .eq("is_approved", false)
        .eq("is_rejected", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !applications || applications.length === 0) {
        // No pending admin application found, check if already approved in admins table
        const { data: adminData } = await supabase
          .from("admins")
          .select("*")
          .eq("id", user.id)
          .eq("role", "admin")
          .single();

        if (adminData) {
          toast.success("Your admin account is already approved!");
          router.push("/admin/dashboard");
          return;
        }

        router.push("/auth/v1/login");
        return;
      }

      const application = applications[0];

      // Check if application is approved (shouldn't happen with the query above, but just in case)
      if (application.is_approved) {
        toast.success("Your admin registration has been approved!");
        router.push("/auth/v1/login");
        return;
      }

      // Check if application is rejected
      if (application.is_rejected) {
        toast.error(`Your registration was rejected. Reason: ${application.rejection_reason || 'Not specified'}`);
        router.push("/auth/v1/login");
        return;
      }

      setApplicationData(application);
      setLoading(false);
    } catch (error) {
      console.error("Error checking application status:", error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/v1/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4 relative">
            <Shield className="w-10 h-10 text-purple-600" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Registration Under Review
          </h1>
          <p className="text-lg text-gray-600">
            Your admin registration is being reviewed by our existing admin team
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6 border-2 shadow-lg border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 -z-10">
                <div className="h-full w-1/3 bg-purple-500 transition-all duration-500"></div>
              </div>

              {/* Step 1 - Registration Submitted */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center mb-3 shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Registration Submitted</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(applicationData?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Step 2 - Admin Review */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full bg-purple-100 border-4 border-purple-500 flex items-center justify-center mb-3 shadow-lg animate-pulse">
                  <UserCheck className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Admin Review</p>
                  <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-700">Pending Approval</Badge>
                </div>
              </div>

              {/* Step 3 - Admin Access */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-500">Admin Access</p>
                  <p className="text-xs text-gray-400 mt-1">Awaiting</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Registration Details */}
          <Card className="shadow-lg border-2 border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Your Admin Registration
              </CardTitle>
              <CardDescription>Details submitted for review</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600">Platform Administrator</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold text-gray-900">{applicationData?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{applicationData?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-medium text-gray-900">
                    {new Date(applicationData?.created_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="shadow-lg border-2 border-indigo-100">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-xl">What happens next?</CardTitle>
              <CardDescription>Admin approval process timeline</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Existing admin reviews your registration</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Verification of identity and authorization
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Review typically takes 24-48 hours</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Admin access requires careful verification
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email notification on approval</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Check {applicationData?.email} for updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Full admin dashboard access</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage businesses, users, and platform settings
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Security Notice</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Admin access grants full platform privileges. Your registration is being carefully reviewed to ensure security and authorization.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="mt-6 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              Need help or have questions?
            </CardTitle>
            <CardDescription>Our support team is here to assist you</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1 h-auto py-4 border-purple-200 hover:bg-purple-50" asChild>
              <a href="mailto:admin-support@businesshub.com" className="flex items-center justify-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-semibold">Admin Support</div>
                  <div className="text-xs text-muted-foreground">admin-support@businesshub.com</div>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="flex-1 h-auto py-4 border-purple-200 hover:bg-purple-50" asChild>
              <a href="tel:+1234567890" className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-semibold">Priority Support</div>
                  <div className="text-xs text-muted-foreground">+1 (234) 567-890</div>
                </div>
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={handleSignOut} className="text-gray-600 hover:text-gray-900">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Elixa Software Branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-medium text-gray-500">Elixa Software Private Limited</span>
          </p>
        </div>
      </div>
    </div>
  );
}
