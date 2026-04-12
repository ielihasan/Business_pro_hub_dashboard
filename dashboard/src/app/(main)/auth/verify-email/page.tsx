"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ArrowRight, Store, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getErrorMessage } from "@/lib/utils";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "already_verified">("loading");
  const [message, setMessage] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isAdminApplication, setIsAdminApplication] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to verify email");
        return;
      }

      if (data.alreadyVerified) {
        setStatus("already_verified");
        setMessage("Your email has already been verified");
        setIsAdminApplication(data.isAdminApplication || false);
      } else {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        setBusinessName(data.businessName || "");
        setIsAdminApplication(data.isAdminApplication || false);
      }
    } catch (error: unknown) {
      setStatus("error");
      setMessage(getErrorMessage(error) || "An error occurred during verification");
    }
  };

  const handleContinue = () => {
    if (isAdminApplication) {
      router.push("/auth/waiting-approval-admin");
    } else {
      router.push("/auth/waiting-approval-business");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Status Icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {status === "loading" && (
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-gray-600 animate-spin" />
                </div>
              )}
              {(status === "success" || status === "already_verified") && (
                <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              )}
              {status === "error" && (
                <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              )}
            </motion.div>

            <CardTitle className="text-2xl font-bold text-gray-900">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "already_verified" && "Already Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {message}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Content */}
            {(status === "success" || status === "already_verified") && (
              <>
                {businessName && !isAdminApplication && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600 mb-1">Business Name</p>
                    <p className="font-semibold text-green-800">{businessName}</p>
                  </div>
                )}
                {isAdminApplication && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">Application Type</p>
                    <p className="font-semibold text-blue-800">Platform Administrator</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-gray-600 text-sm">
                        <span className="line-through">Email verification</span>
                        <span className="text-green-600 ml-2">Complete</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Your application is now under admin review
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-gray-600 text-xs font-bold">3</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Once approved, you'll receive an email notification
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleContinue} className="w-full bg-gray-900 hover:bg-gray-800">
                  View Application Status
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {/* Error Content */}
            {status === "error" && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    {message === "Verification token has expired. Please request a new verification email."
                      ? "Your verification link has expired. Please request a new one."
                      : "We couldn't verify your email. The link may be invalid or expired."}
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/auth/verify-email-pending" className="block">
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Request New Verification Email
                    </Button>
                  </Link>

                  <Link href="/auth/v1/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {/* Loading Content */}
            {status === "loading" && (
              <div className="text-center py-4">
                <p className="text-gray-500">Please wait while we verify your email...</p>
              </div>
            )}

            {/* Elixa Software Branding */}
            <div className="text-center pt-4 border-t">
              <p className="text-[10px] text-gray-400">
                Powered by <span className="font-medium text-gray-500">Elixa Software Private Limited</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
          <Card className="border-0 shadow-2xl w-full max-w-lg">
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
