"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Check,
  X,
  Loader2,
  RefreshCw,
  Crown,
  Zap,
  Building2,
  Sparkles,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limitations: {
    queue_entries: number;
    staff_members: number;
    customers: number;
  };
  popular?: boolean;
}

interface Subscription {
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  created_at: string;
}

// Mock data for demo
const mockPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    currency: "PKR",
    interval: "month",
    features: [
      "Up to 50 queue entries/month",
      "Basic queue management",
      "QR code generation",
      "Email support",
    ],
    limitations: {
      queue_entries: 50,
      staff_members: 1,
      customers: 100,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small businesses",
    price: 2999,
    currency: "PKR",
    interval: "month",
    features: [
      "Up to 500 queue entries/month",
      "Advanced queue management",
      "QR code generation",
      "Priority email support",
      "Basic analytics",
      "Up to 3 staff members",
    ],
    limitations: {
      queue_entries: 500,
      staff_members: 3,
      customers: 500,
    },
    popular: true,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses",
    price: 5999,
    currency: "PKR",
    interval: "month",
    features: [
      "Unlimited queue entries",
      "Advanced queue management",
      "QR code generation",
      "24/7 priority support",
      "Advanced analytics & reports",
      "Up to 10 staff members",
      "SMS notifications",
      "Custom branding",
    ],
    limitations: {
      queue_entries: -1,
      staff_members: 10,
      customers: 2000,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 14999,
    currency: "PKR",
    interval: "month",
    features: [
      "Everything in Professional",
      "Unlimited staff members",
      "Unlimited customers",
      "Dedicated account manager",
      "Custom integrations",
      "White-label solution",
      "SLA guarantee",
      "On-premise option",
    ],
    limitations: {
      queue_entries: -1,
      staff_members: -1,
      customers: -1,
    },
  },
];

const mockPayments: Payment[] = [
  {
    id: "1",
    amount: 2999,
    currency: "PKR",
    status: "completed",
    payment_method: "card",
    description: "Starter Plan - Monthly Subscription",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    amount: 2999,
    currency: "PKR",
    status: "completed",
    payment_method: "card",
    description: "Starter Plan - Monthly Subscription",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    amount: 0,
    currency: "PKR",
    status: "completed",
    payment_method: "free",
    description: "Free Plan - Initial Subscription",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [currentPlan, setCurrentPlan] = useState<Plan>(mockPlans[1]); // Starter as demo
  const [subscription, setSubscription] = useState<Subscription>({
    plan_id: "starter",
    status: "active",
    current_period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Upgrade dialog
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [upgrading, setUpgrading] = useState(false);

  // Cancel dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchPricingData();
    }
  }, [businessId]);

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
      setLoading(false);
    }
  };

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/API/pricing?business_id=${businessId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      if (data.data) {
        if (data.data.plans) setPlans(data.data.plans);
        if (data.data.subscription) setSubscription(data.data.subscription);
        if (data.data.current_plan) setCurrentPlan(data.data.current_plan);
        if (data.data.payments) setPayments(data.data.payments);
        setUseMockData(false);
      } else {
        setUseMockData(true);
      }
    } catch (error: any) {
      console.error("Fetch pricing error:", error);
      setUseMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setUpgrading(true);

      if (useMockData) {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setCurrentPlan(selectedPlan);
        setSubscription({
          ...subscription,
          plan_id: selectedPlan.id,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        if (selectedPlan.price > 0) {
          setPayments([
            {
              id: Date.now().toString(),
              amount: selectedPlan.price,
              currency: selectedPlan.currency,
              status: "completed",
              payment_method: paymentMethod,
              description: `${selectedPlan.name} Plan - Monthly Subscription`,
              created_at: new Date().toISOString(),
            },
            ...payments,
          ]);
        }
        toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
      } else {
        const res = await fetch("/API/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: businessId,
            plan_id: selectedPlan.id,
            payment_method: paymentMethod,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error);
        }

        toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
        fetchPricingData();
      }

      setIsUpgradeDialogOpen(false);
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade plan");
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);

      if (useMockData) {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCurrentPlan(plans[0]); // Free plan
        setSubscription({
          ...subscription,
          plan_id: "free",
          status: "active",
        });
        toast.success("Subscription cancelled. You are now on the Free plan.");
      } else {
        const res = await fetch(`/API/pricing?business_id=${businessId}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error);
        }

        toast.success("Subscription cancelled. You are now on the Free plan.");
        fetchPricingData();
      }

      setIsCancelDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return <Sparkles className="h-6 w-6" />;
      case "starter":
        return <Zap className="h-6 w-6" />;
      case "professional":
        return <Crown className="h-6 w-6" />;
      case "enterprise":
        return <Building2 className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = "PKR") => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const daysRemaining = subscription.current_period_end
    ? Math.ceil(
        (new Date(subscription.current_period_end).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing & Plans</h1>
          <p className="mt-1 text-gray-600">
            Manage your subscription and view payment history
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchPricingData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Demo Mode Banner */}
      {useMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Mode</p>
            <p className="text-xs text-yellow-600">
              Showing sample data. Connect to database for real subscription info.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                {getPlanIcon(currentPlan.id)}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan: {currentPlan.name}
                  {currentPlan.id !== "free" && (
                    <Badge className="bg-primary/20 text-primary">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription>{currentPlan.description}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(currentPlan.price)}
              </p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Billing Period</p>
                <p className="font-medium">
                  {formatDate(subscription.current_period_start)}
                  {subscription.current_period_end &&
                    ` - ${formatDate(subscription.current_period_end)}`}
                </p>
              </div>
            </div>
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className="font-medium">{daysRemaining} days</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Receipt className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Next Payment</p>
                <p className="font-medium">
                  {currentPlan.price > 0
                    ? formatCurrency(currentPlan.price)
                    : "Free"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        {currentPlan.id !== "free" && (
          <CardFooter className="border-t pt-4">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-lg"
                    : "border-gray-200"
                } ${plan.id === currentPlan.id ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <div
                    className={`mx-auto p-3 rounded-full mb-2 ${
                      plan.id === currentPlan.id
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.id === currentPlan.id ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price > currentPlan.price ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsUpgradeDialogOpen(true);
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsUpgradeDialogOpen(true);
                      }}
                    >
                      Switch Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View your past transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No payment history</p>
              <p className="text-sm mt-1">Your payments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{payment.payment_method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPlan && selectedPlan.price > currentPlan.price
                ? "Upgrade Your Plan"
                : "Switch Plan"}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan &&
                `You are about to ${
                  selectedPlan.price > currentPlan.price ? "upgrade" : "switch"
                } to the ${selectedPlan.name} plan.`}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      {getPlanIcon(selectedPlan.id)}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedPlan.name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedPlan.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {formatCurrency(selectedPlan.price)}
                    </p>
                    <p className="text-sm text-gray-500">per month</p>
                  </div>
                </div>
              </div>

              {selectedPlan.price > 0 && (
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                      <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  {selectedPlan.price > 0
                    ? `You will be charged ${formatCurrency(selectedPlan.price)} immediately. Your next billing date will be ${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}.`
                    : "You will be switched to the Free plan immediately."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {selectedPlan && selectedPlan.price > currentPlan.price
                ? "Confirm Upgrade"
                : "Confirm Switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your {currentPlan.name} subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">
                You will lose access to:
              </h4>
              <ul className="space-y-1">
                {currentPlan.features
                  .filter((f) => !plans[0].features.includes(f))
                  .map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-red-700">
                      <X className="h-4 w-4" />
                      {feature}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                After cancellation, you will be moved to the Free plan with limited
                features. You can upgrade again at any time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
