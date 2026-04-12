"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, ArrowRight, Clock, CheckCircle, MailX, MailCheck } from "lucide-react";
import { toast } from "sonner";

interface RoleRecord {
  role: string;
  is_approved?: boolean;
  is_pending?: boolean;
  email_verified?: boolean;
  email?: string;
  business_name?: string;
  business_type?: string;
  [key: string]: unknown;
}

export default function SelectRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleRecord[]>([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const multipleRolesData = sessionStorage.getItem("multipleRoles");

      if (!multipleRolesData) {
        router.push("/auth/v1/login");
        return;
      }

      const rolesArray = JSON.parse(multipleRolesData);
      setRoles(rolesArray);
      setLoading(false);
    } catch (error) {
      console.error("Error loading roles:", error);
      router.push("/auth/v1/login");
    }
  };

  const handleRoleSelect = async (role: RoleRecord) => {
    try {
      // Check if this is a pending application
      if (role.is_pending) {
        // Check if email is verified
        if (!role.email_verified) {
          sessionStorage.setItem("pendingVerificationEmail", role.email ?? "");
          toast.warning("Please verify your email first.");
          router.push("/auth/verify-email-pending");
          return;
        }

        // Email verified but waiting for approval
        const isAdminApplication = role.role === "admin";
        const waitingPage = isAdminApplication ? "/auth/waiting-approval-admin" : "/auth/waiting-approval-business";
        const message = isAdminApplication
          ? "Your admin registration is awaiting approval."
          : "Your business application is awaiting admin approval.";

        toast.warning(message);
        router.push(waitingPage);
        return;
      }

      // Approved accounts
      if (role.role === "admin") {
        sessionStorage.removeItem("multipleRoles");
        toast.success("Welcome, Admin!");
        router.push("/admin/dashboard");
      } else if (role.role === "business_owner") {
        if (!role.is_approved) {
          toast.warning("Your business account is pending approval.");
          router.push("/auth/waiting-approval-business");
          return;
        }

        sessionStorage.removeItem("multipleRoles");
        toast.success(`Welcome back, ${role.business_name}!`);
        router.push("/business/dashboard");
      }
    } catch (error) {
      console.error("Error selecting role:", error);
      toast.error("Failed to select role");
    }
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Select Your Role
          </h1>
          <p className="text-lg text-gray-600">
            You have multiple accounts. Please choose which one to use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role, index) => (
            <Card
              key={index}
              className="shadow-lg border-2 hover:border-primary transition-all cursor-pointer"
              onClick={() => handleRoleSelect(role)}
            >
              <CardHeader className={role.role === "admin" ? "bg-gradient-to-r from-purple-50 to-indigo-50" : "bg-gradient-to-r from-green-50 to-blue-50"}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${role.role === "admin" ? "bg-purple-100" : "bg-green-100"} mb-4`}>
                  {role.role === "admin" ? (
                    <Shield className={`w-8 h-8 ${role.role === "admin" ? "text-purple-600" : "text-green-600"}`} />
                  ) : (
                    <Building2 className={`w-8 h-8 ${role.role === "admin" ? "text-purple-600" : "text-green-600"}`} />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {role.role === "admin" ? "Platform Admin" : role.business_name}
                </CardTitle>
                <CardDescription>
                  {role.role === "admin" ? "Administrative Access" : role.business_type}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {role.role === "admin" ? "Administrator" : "Business Owner"}
                    </p>
                  </div>
                  {role.role === "business_owner" && !role.is_pending && (
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                      <p className="font-medium text-gray-900">{role.business_type}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">
                      {role.is_pending ? (
                        !role.email_verified ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            <MailX className="w-3 h-3 mr-1" />
                            Email Not Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Awaiting Approval
                          </Badge>
                        )
                      ) : role.is_approved ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant={role.is_pending && !role.email_verified ? "outline" : role.role === "admin" ? "default" : "outline"}
                >
                  {role.is_pending && !role.email_verified ? (
                    <>Verify Email</>
                  ) : role.is_pending ? (
                    <>View Status</>
                  ) : (
                    <>Continue as {role.role === "admin" ? "Admin" : "Business Owner"}</>
                  )}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              sessionStorage.removeItem("multipleRoles");
              router.push("/auth/v1/login");
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
