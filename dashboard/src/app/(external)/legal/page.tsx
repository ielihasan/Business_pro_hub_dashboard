"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Store,
  ArrowLeft,
  Shield,
  FileText,
  Cookie,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

function LegalContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("privacy");

  useEffect(() => {
    if (tabParam && ["privacy", "terms", "cookies"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Business Pro Hub</span>
            </Link>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 text-center">
          <Badge className="mb-6 px-4 py-2 bg-gray-100 text-gray-700">
            <FileText className="w-4 h-4 mr-2 inline" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Legal Information
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our commitment to transparency and protecting your rights
          </p>
        </div>
      </section>

      {/* Legal Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="privacy" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </TabsTrigger>
                <TabsTrigger value="terms" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Terms of Service
                </TabsTrigger>
                <TabsTrigger value="cookies" className="flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  Cookie Policy
                </TabsTrigger>
              </TabsList>

              {/* Privacy Policy */}
              <TabsContent value="privacy">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Privacy Policy</CardTitle>
                    <CardDescription>Last updated: January 1, 2026</CardDescription>
                  </CardHeader>
                  <CardContent className="prose prose-gray max-w-none">
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h3>
                        <p className="text-gray-600">
                          Elixa Software Private Limited ("we," "our," or "us") operates the BusinessHub Pro platform.
                          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                          when you use our service.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Information We Collect</h3>
                        <p className="text-gray-600 mb-3">We collect information that you provide directly to us, including:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                          <li>Account information (name, email, phone number, business details)</li>
                          <li>Payment information (processed securely through our payment providers)</li>
                          <li>Usage data (how you interact with our platform)</li>
                          <li>Customer data that you input into the system</li>
                          <li>Communications with our support team</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Information</h3>
                        <p className="text-gray-600 mb-3">We use the information we collect to:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                          <li>Provide, maintain, and improve our services</li>
                          <li>Process transactions and send related information</li>
                          <li>Send technical notices, updates, and support messages</li>
                          <li>Respond to your comments and questions</li>
                          <li>Analyze usage patterns to improve user experience</li>
                          <li>Protect against fraudulent or illegal activity</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h3>
                        <p className="text-gray-600">
                          We implement industry-standard security measures to protect your data, including:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 mt-3">
                          <li>AES-256 encryption for data at rest and in transit</li>
                          <li>Regular security audits and penetration testing</li>
                          <li>Strict access controls and authentication</li>
                          <li>Secure data centers with 24/7 monitoring</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h3>
                        <p className="text-gray-600">
                          We retain your personal information for as long as your account is active or as needed
                          to provide you services. You can request deletion of your data at any time by contacting
                          our support team.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h3>
                        <p className="text-gray-600 mb-3">You have the right to:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                          <li>Access your personal data</li>
                          <li>Correct inaccurate data</li>
                          <li>Request deletion of your data</li>
                          <li>Object to processing of your data</li>
                          <li>Export your data in a portable format</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Contact Us</h3>
                        <p className="text-gray-600">
                          If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="text-gray-600 mt-3">
                          <strong>Email:</strong> privacy@elixasoftware.com<br />
                          <strong>Address:</strong> Elixa Software Private Limited, Lahore, Pakistan
                        </p>
                      </section>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Terms of Service */}
              <TabsContent value="terms">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Terms of Service</CardTitle>
                    <CardDescription>Last updated: January 1, 2026</CardDescription>
                  </CardHeader>
                  <CardContent className="prose prose-gray max-w-none">
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
                        <p className="text-gray-600">
                          By accessing or using BusinessHub Pro, you agree to be bound by these Terms of Service.
                          If you do not agree to these terms, please do not use our services.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Description of Service</h3>
                        <p className="text-gray-600">
                          BusinessHub Pro is a business management platform that provides queue management,
                          customer tracking, analytics, and related services. We reserve the right to modify,
                          suspend, or discontinue any part of the service at any time.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. User Accounts</h3>
                        <p className="text-gray-600 mb-3">When creating an account, you agree to:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                          <li>Provide accurate and complete information</li>
                          <li>Maintain the security of your account credentials</li>
                          <li>Promptly notify us of any unauthorized access</li>
                          <li>Accept responsibility for all activities under your account</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Acceptable Use</h3>
                        <p className="text-gray-600 mb-3">You agree not to:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                          <li>Use the service for any illegal purpose</li>
                          <li>Violate any applicable laws or regulations</li>
                          <li>Infringe on the rights of others</li>
                          <li>Transmit malicious code or interfere with the service</li>
                          <li>Attempt to gain unauthorized access to our systems</li>
                          <li>Use the service to send spam or unsolicited messages</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Payment Terms</h3>
                        <p className="text-gray-600">
                          Paid subscriptions are billed in advance on a monthly basis. All fees are non-refundable
                          except as required by law. We may change our prices with 30 days' notice. Failure to pay
                          may result in suspension or termination of your account.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Intellectual Property</h3>
                        <p className="text-gray-600">
                          The service and its original content, features, and functionality are owned by
                          Elixa Software Private Limited and are protected by international copyright, trademark,
                          and other intellectual property laws.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Limitation of Liability</h3>
                        <p className="text-gray-600">
                          To the maximum extent permitted by law, Elixa Software Private Limited shall not be
                          liable for any indirect, incidental, special, consequential, or punitive damages
                          resulting from your use of the service.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Termination</h3>
                        <p className="text-gray-600">
                          We may terminate or suspend your account at any time for violation of these terms.
                          You may also terminate your account at any time through your account settings or
                          by contacting support.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Governing Law</h3>
                        <p className="text-gray-600">
                          These terms shall be governed by the laws of Pakistan. Any disputes shall be
                          resolved in the courts of Lahore, Pakistan.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Contact</h3>
                        <p className="text-gray-600">
                          For questions about these Terms of Service, contact us at:
                        </p>
                        <p className="text-gray-600 mt-3">
                          <strong>Email:</strong> legal@elixasoftware.com
                        </p>
                      </section>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cookie Policy */}
              <TabsContent value="cookies">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Cookie Policy</CardTitle>
                    <CardDescription>Last updated: January 1, 2026</CardDescription>
                  </CardHeader>
                  <CardContent className="prose prose-gray max-w-none">
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. What Are Cookies</h3>
                        <p className="text-gray-600">
                          Cookies are small text files that are stored on your device when you visit a website.
                          They help websites remember your preferences and improve your experience.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Cookies</h3>
                        <p className="text-gray-600 mb-3">We use cookies to:</p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                          <li>Keep you signed in to your account</li>
                          <li>Remember your preferences and settings</li>
                          <li>Understand how you use our platform</li>
                          <li>Improve our services based on usage patterns</li>
                          <li>Provide personalized content and features</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Types of Cookies We Use</h3>

                        <div className="space-y-4 mt-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              Required for the website to function properly. Cannot be disabled.
                            </p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900">Functional Cookies</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              Remember your preferences like language and theme settings.
                            </p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              Help us understand how visitors interact with our platform.
                            </p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900">Performance Cookies</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              Collect information about how the website performs.
                            </p>
                          </div>
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Managing Cookies</h3>
                        <p className="text-gray-600">
                          You can control and manage cookies through your browser settings. Please note that
                          disabling certain cookies may affect the functionality of our platform. Most browsers
                          allow you to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 mt-3">
                          <li>View what cookies are stored</li>
                          <li>Delete individual or all cookies</li>
                          <li>Block cookies from specific sites</li>
                          <li>Block all cookies from being set</li>
                        </ul>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Third-Party Cookies</h3>
                        <p className="text-gray-600">
                          Some cookies on our platform are set by third-party services we use, such as analytics
                          providers and payment processors. These third parties have their own privacy policies
                          governing their use of cookies.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Updates to This Policy</h3>
                        <p className="text-gray-600">
                          We may update this Cookie Policy from time to time. We will notify you of any changes
                          by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Contact Us</h3>
                        <p className="text-gray-600">
                          If you have questions about our use of cookies, please contact us at:
                        </p>
                        <p className="text-gray-600 mt-3">
                          <strong>Email:</strong> privacy@elixasoftware.com
                        </p>
                      </section>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 mb-2">© 2026 Business Pro Hub. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            A product by <span className="font-medium">Elixa Software Private Limited</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      }
    >
      <LegalContent />
    </Suspense>
  );
}
