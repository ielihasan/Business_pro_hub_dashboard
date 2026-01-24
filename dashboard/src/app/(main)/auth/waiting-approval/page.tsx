"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Mail, Phone, HelpCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function WaitingApprovalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

      // Check if user has a pending application
      const { data: application, error } = await supabase
        .from("business_applications")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !application) {
        // No application found, redirect to login
        router.push("/auth/v1/login");
        return;
      }

      // Check if application is approved
      if (application.is_approved) {
        toast.success("Your application has been approved!");
        router.push("/auth/v1/login");
        return;
      }

      // Check if application is rejected
      if (application.is_rejected) {
        toast.error(`Your application was rejected. Reason: ${application.rejection_reason || 'Not specified'}`);
        router.push("/auth/v1/login");
        return;
      }

      // Application is still pending
      setApplicationData(application);
      setIsAdmin(application.business_type === "Admin");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
            <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isAdmin ? "Admin Registration Under Review" : "Application Under Review"}
          </h1>
          <p className="text-lg text-gray-600">
            {isAdmin
              ? "Your admin registration is being reviewed by our existing admin team"
              : "Your business registration is being reviewed by our admin team"}
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 -z-10">
                <div className="h-full w-1/3 bg-blue-500 transition-all duration-500"></div>
              </div>

              {/* Step 1 - Application Submitted */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-3 shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Application Submitted</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(applicationData?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Step 2 - Under Review */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-blue-500 flex items-center justify-center mb-3 shadow-lg animate-pulse">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Under Review</p>
                  <Badge variant="secondary" className="mt-1">In Progress</Badge>
                </div>
              </div>

              {/* Step 3 - Approval */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-500">Approval</p>
                  <p className="text-xs text-gray-400 mt-1">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Application Details */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-xl">
                {isAdmin ? "Your Admin Registration" : "Your Application"}
              </CardTitle>
              <CardDescription>Details submitted for review</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{applicationData?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{applicationData?.email}</p>
              </div>
              {!isAdmin && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="font-medium text-gray-900">{applicationData?.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <Badge variant="outline">{applicationData?.business_type}</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* What Happens Next */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="text-xl">What happens next?</CardTitle>
              <CardDescription>Timeline and next steps</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {isAdmin ? "Admin team reviews your registration" : "Our team reviews your business information"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Verification of details and eligibility
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Review typically takes 24-48 hours</p>
                    <p className="text-sm text-gray-500 mt-1">
                      We'll process your application as quickly as possible
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">You'll receive an email notification</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Check {applicationData?.email} for updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {isAdmin ? "Access to admin dashboard" : "Access to your business dashboard"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Full access granted after approval
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="mt-6 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="w-5 h-5" />
              Need help or have questions?
            </CardTitle>
            <CardDescription>Our support team is here to assist you</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1 h-auto py-4" asChild>
              <a href="mailto:support@businesshub.com" className="flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Email Support</div>
                  <div className="text-xs text-muted-foreground">support@businesshub.com</div>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="flex-1 h-auto py-4" asChild>
              <a href="tel:+1234567890" className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Call Us</div>
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
      </div>
    </div>
  );
}
