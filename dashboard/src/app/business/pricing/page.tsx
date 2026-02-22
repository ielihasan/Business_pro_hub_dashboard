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
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  ArrowRight,
  ArrowLeft,
  Shield,
  Smartphone,
  Banknote,
  Users,
  BarChart3,
  MessageSquare,
  Palette,
  Headphones,
  Settings,
  Star,
  Gift,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

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
  transaction_id?: string;
}

// Payment method icons
const paymentMethodIcons: Record<string, any> = {
  card: CreditCard,
  jazzcash: Smartphone,
  easypaisa: Smartphone,
  bank: Banknote,
};

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
      "1 staff member",
      "Up to 100 customers",
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
      "Up to 500 customers",
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
      "Up to 2,000 customers",
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
      "API access",
    ],
    limitations: {
      queue_entries: -1,
      staff_members: -1,
      customers: -1,
    },
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [currentPlan, setCurrentPlan] = useState<Plan>(mockPlans[0]);
  const [subscription, setSubscription] = useState<Subscription>({
    plan_id: "free",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: null,
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Upgrade wizard state
  const [isUpgradeWizardOpen, setIsUpgradeWizardOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cancel dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

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
          .select("id, subscription_plan")
          .eq("id", user.id)
          .eq("role", "business_owner")
          .single();

        if (admin) {
          setBusinessId(admin.id);
          // Set current plan from admins table
          if (admin.subscription_plan) {
            const plan = mockPlans.find((p) => p.id === admin.subscription_plan);
            if (plan) {
              setCurrentPlan(plan);
              setSubscription((prev) => ({
                ...prev,
                plan_id: admin.subscription_plan,
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error getting business ID:", error);
      setLoading(false);
    }
  };

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/API/pricing?business_id=${businessId}`);
      const data = await res.json();

      if (data.data) {
        if (data.data.plans) setPlans(data.data.plans);
        if (data.data.subscription) setSubscription(data.data.subscription);
        if (data.data.current_plan) setCurrentPlan(data.data.current_plan);
        if (data.data.payments) setPayments(data.data.payments);
      }
    } catch (error: any) {
      console.error("Fetch pricing error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Validate payment form
  const validatePaymentForm = () => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === "card") {
      if (!cardName.trim()) newErrors.cardName = "Name is required";
      if (!cardNumber.replace(/\s/g, "") || cardNumber.replace(/\s/g, "").length < 16) {
        newErrors.cardNumber = "Valid card number is required";
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        newErrors.cardExpiry = "Valid expiry date is required";
      }
      if (!cardCvc || cardCvc.length < 3) {
        newErrors.cardCvc = "Valid CVC is required";
      }
    } else if (paymentMethod === "jazzcash" || paymentMethod === "easypaisa") {
      if (!mobileNumber || mobileNumber.length < 11) {
        newErrors.mobileNumber = "Valid mobile number is required (03XXXXXXXXX)";
      }
    } else if (paymentMethod === "bank") {
      if (!bankAccount.trim()) {
        newErrors.bankAccount = "Bank account number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Apply promo code
  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "WELCOME20") {
      setDiscount(20);
      setPromoApplied(true);
      toast.success("Promo code applied! 20% discount");
    } else if (promoCode.toUpperCase() === "FIRST50") {
      setDiscount(50);
      setPromoApplied(true);
      toast.success("Promo code applied! 50% discount");
    } else {
      toast.error("Invalid promo code");
    }
  };

  // Calculate final price
  const getFinalPrice = () => {
    if (!selectedPlan) return 0;
    const discountAmount = (selectedPlan.price * discount) / 100;
    return selectedPlan.price - discountAmount;
  };

  // Handle upgrade process
  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    if (wizardStep === 2 && selectedPlan.price > 0) {
      if (!validatePaymentForm()) return;
    }

    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
      return;
    }

    try {
      setProcessing(true);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // API call
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

      setPaymentSuccess(true);
      setWizardStep(4);

      // Update local state
      setCurrentPlan(selectedPlan);
      setSubscription({
        plan_id: selectedPlan.id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Add to payment history
      if (selectedPlan.price > 0) {
        const newPayment: Payment = {
          id: Date.now().toString(),
          amount: getFinalPrice(),
          currency: selectedPlan.currency,
          status: "completed",
          payment_method: paymentMethod,
          description: `${selectedPlan.name} Plan - Monthly Subscription`,
          created_at: new Date().toISOString(),
          transaction_id: `TXN-${Date.now()}`,
        };
        setPayments([newPayment, ...payments]);
      }

      toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade plan");
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);

      const res = await fetch(`/API/pricing?business_id=${businessId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setCurrentPlan(plans[0]);
      setSubscription({
        ...subscription,
        plan_id: "free",
        status: "active",
      });
      toast.success("Subscription cancelled. You are now on the Free plan.");
      setIsCancelDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setPaymentMethod("card");
    setProcessing(false);
    setPaymentSuccess(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardName("");
    setMobileNumber("");
    setBankAccount("");
    setErrors({});
    setPromoCode("");
    setPromoApplied(false);
    setDiscount(0);
  };

  const closeWizard = () => {
    setIsUpgradeWizardOpen(false);
    setTimeout(resetWizard, 300);
  };

  const openUpgradeWizard = (plan: Plan) => {
    setSelectedPlan(plan);
    resetWizard();
    setIsUpgradeWizardOpen(true);
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

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "free":
        return "from-gray-500 to-gray-600";
      case "starter":
        return "from-blue-500 to-blue-600";
      case "professional":
        return "from-blue-600 to-blue-700";
      case "enterprise":
        return "from-gray-800 to-black";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatCurrency = (amount: number) => {
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
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
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

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes("staff")) return <Users className="h-4 w-4" />;
    if (feature.toLowerCase().includes("analytics")) return <BarChart3 className="h-4 w-4" />;
    if (feature.toLowerCase().includes("sms") || feature.toLowerCase().includes("notification"))
      return <MessageSquare className="h-4 w-4" />;
    if (feature.toLowerCase().includes("brand")) return <Palette className="h-4 w-4" />;
    if (feature.toLowerCase().includes("support")) return <Headphones className="h-4 w-4" />;
    if (feature.toLowerCase().includes("integration") || feature.toLowerCase().includes("api"))
      return <Settings className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing & Plans</h1>
          <p className="mt-1 text-gray-600">
            Manage your subscription and unlock powerful features
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

      {/* Current Plan Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={cn("bg-gradient-to-r p-6 text-white", getPlanColor(currentPlan.id))}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                {getPlanIcon(currentPlan.id)}
              </div>
              <div>
                <p className="text-white/80 text-sm">Current Plan</p>
                <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
                <p className="text-white/80">{currentPlan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{formatCurrency(currentPlan.price)}</p>
              <p className="text-white/80">per month</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Billing Started</p>
                <p className="font-semibold">{formatDate(subscription.current_period_start)}</p>
              </div>
            </div>
            {subscription.current_period_end && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Renews On</p>
                  <p className="font-semibold">{formatDate(subscription.current_period_end)}</p>
                </div>
              </div>
            )}
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Receipt className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className="font-semibold">{daysRemaining} days</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-green-600 capitalize">{subscription.status}</p>
              </div>
            </div>
          </div>
          {currentPlan.id !== "free" && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Queue Entries</span>
              <span className="text-sm font-medium">
                {currentPlan.limitations.queue_entries === -1
                  ? "Unlimited"
                  : `${currentPlan.limitations.queue_entries}/month`}
              </span>
            </div>
            <Progress value={currentPlan.limitations.queue_entries === -1 ? 100 : 35} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">
              {currentPlan.limitations.queue_entries === -1 ? "No limits" : "35% used this month"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Staff Members</span>
              <span className="text-sm font-medium">
                {currentPlan.limitations.staff_members === -1
                  ? "Unlimited"
                  : `${currentPlan.limitations.staff_members} max`}
              </span>
            </div>
            <Progress value={currentPlan.limitations.staff_members === -1 ? 100 : 50} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">
              {currentPlan.limitations.staff_members === -1 ? "No limits" : "1 of " + currentPlan.limitations.staff_members + " used"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Customers</span>
              <span className="text-sm font-medium">
                {currentPlan.limitations.customers === -1
                  ? "Unlimited"
                  : `${currentPlan.limitations.customers} max`}
              </span>
            </div>
            <Progress value={currentPlan.limitations.customers === -1 ? 100 : 25} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">
              {currentPlan.limitations.customers === -1 ? "No limits" : "25 of " + currentPlan.limitations.customers + " used"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <Badge variant="outline" className="gap-1">
            <Gift className="h-3 w-3" />
            Use code WELCOME20 for 20% off
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-all duration-300 hover:shadow-xl",
                  plan.popular && "border-2 border-primary shadow-lg scale-105",
                  plan.id === currentPlan.id && "ring-2 ring-green-500"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-white shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                {plan.id === currentPlan.id && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge className="bg-green-500 text-white shadow-lg">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8 pb-4">
                  <div
                    className={cn(
                      "mx-auto p-4 rounded-full mb-3 bg-gradient-to-br text-white",
                      getPlanColor(plan.id)
                    )}
                  >
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="space-y-3">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">{getFeatureIcon(feature)}</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 6 && (
                      <li className="text-sm text-gray-500 pl-6">
                        +{plan.features.length - 6} more features
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  {plan.id === currentPlan.id ? (
                    <Button className="w-full" disabled variant="secondary">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : plan.price > currentPlan.price ? (
                    <Button className="w-full" onClick={() => openUpgradeWizard(plan)}>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openUpgradeWizard(plan)}
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
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>View your past transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-lg">No payment history</p>
              <p className="text-sm mt-1">Your payment transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const PaymentIcon = paymentMethodIcons[payment.payment_method] || CreditCard;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{payment.description}</TableCell>
                        <TableCell className="text-sm text-gray-500 font-mono">
                          {payment.transaction_id || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4 text-gray-400" />
                            <span className="capitalize">{payment.payment_method}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Wizard Dialog */}
      <Dialog open={isUpgradeWizardOpen} onOpenChange={closeWizard}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {wizardStep === 4 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Payment Successful!
                </>
              ) : (
                <>
                  {selectedPlan && getPlanIcon(selectedPlan.id)}
                  Upgrade to {selectedPlan?.name}
                </>
              )}
            </DialogTitle>
            {wizardStep !== 4 && (
              <DialogDescription>
                Step {wizardStep} of 3 -{" "}
                {wizardStep === 1
                  ? "Review Plan"
                  : wizardStep === 2
                  ? "Payment Details"
                  : "Confirm Order"}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Progress Steps */}
          {wizardStep !== 4 && (
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0",
                      step <= wizardStep
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {step < wizardStep ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2",
                        step < wizardStep ? "bg-primary" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Review Plan */}
          {wizardStep === 1 && selectedPlan && (
            <div className="space-y-3 sm:space-y-4">
              <Card className="bg-gray-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 sm:p-3 rounded-full bg-gradient-to-br text-white flex-shrink-0", getPlanColor(selectedPlan.id))}>
                        {getPlanIcon(selectedPlan.id)}
                      </div>
                      <div>
                        <p className="font-semibold text-base sm:text-lg">{selectedPlan.name} Plan</p>
                        <p className="text-xs sm:text-sm text-gray-500">{selectedPlan.description}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right pl-11 sm:pl-0">
                      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(selectedPlan.price)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">per month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">What you'll get:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {currentPlan.id !== "free" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-700">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                    Your current {currentPlan.name} plan will be replaced immediately.
                    {selectedPlan.price > currentPlan.price
                      ? " You'll be charged the difference."
                      : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment Details */}
          {wizardStep === 2 && selectedPlan && (
            <div className="space-y-3 sm:space-y-4">
              {selectedPlan.price === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Gift className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-500 mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Payment Required</h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    The Free plan doesn't require any payment information.
                  </p>
                </div>
              ) : (
                <>
                  {/* Promo Code */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyPromoCode}
                      disabled={promoApplied || !promoCode}
                      className="px-3"
                    >
                      {promoApplied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Percent className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs sm:text-sm text-green-600">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                      {discount}% discount applied!
                    </p>
                  )}

                  {/* Payment Method Selection */}
                  <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                    <TabsList className="grid grid-cols-4 w-full h-auto">
                      <TabsTrigger value="card" className="text-[10px] sm:text-xs px-1 sm:px-2 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Card</span>
                      </TabsTrigger>
                      <TabsTrigger value="jazzcash" className="text-[10px] sm:text-xs px-1 sm:px-2 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>JazzCash</span>
                      </TabsTrigger>
                      <TabsTrigger value="easypaisa" className="text-[10px] sm:text-xs px-1 sm:px-2 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                        <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>EasyPaisa</span>
                      </TabsTrigger>
                      <TabsTrigger value="bank" className="text-[10px] sm:text-xs px-1 sm:px-2 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                        <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Bank</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Card Payment Form */}
                    <TabsContent value="card" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Cardholder Name</Label>
                        <Input
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className={cn("text-sm h-9 sm:h-10", errors.cardName && "border-red-500")}
                        />
                        {errors.cardName && (
                          <p className="text-[10px] sm:text-xs text-red-500">{errors.cardName}</p>
                        )}
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Card Number</Label>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          className={cn("text-sm h-9 sm:h-10", errors.cardNumber && "border-red-500")}
                        />
                        {errors.cardNumber && (
                          <p className="text-[10px] sm:text-xs text-red-500">{errors.cardNumber}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm">Expiry Date</Label>
                          <Input
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            maxLength={5}
                            className={cn("text-sm h-9 sm:h-10", errors.cardExpiry && "border-red-500")}
                          />
                          {errors.cardExpiry && (
                            <p className="text-[10px] sm:text-xs text-red-500">{errors.cardExpiry}</p>
                          )}
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm">CVC</Label>
                          <Input
                            placeholder="123"
                            value={cardCvc}
                            onChange={(e) =>
                              setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                            }
                            maxLength={4}
                            className={cn("text-sm h-9 sm:h-10", errors.cardCvc && "border-red-500")}
                          />
                          {errors.cardCvc && (
                            <p className="text-[10px] sm:text-xs text-red-500">{errors.cardCvc}</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* JazzCash/EasyPaisa Form */}
                    <TabsContent value="jazzcash" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">JazzCash Mobile Number</Label>
                        <Input
                          placeholder="03XX XXXXXXX"
                          value={mobileNumber}
                          onChange={(e) =>
                            setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                          }
                          className={cn("text-sm h-9 sm:h-10", errors.mobileNumber && "border-red-500")}
                        />
                        {errors.mobileNumber && (
                          <p className="text-[10px] sm:text-xs text-red-500">{errors.mobileNumber}</p>
                        )}
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm text-blue-700">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                          You will receive a payment confirmation request on your JazzCash app.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="easypaisa" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">EasyPaisa Mobile Number</Label>
                        <Input
                          placeholder="03XX XXXXXXX"
                          value={mobileNumber}
                          onChange={(e) =>
                            setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                          }
                          className={cn("text-sm h-9 sm:h-10", errors.mobileNumber && "border-red-500")}
                        />
                        {errors.mobileNumber && (
                          <p className="text-[10px] sm:text-xs text-red-500">{errors.mobileNumber}</p>
                        )}
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm text-green-700">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                          You will receive a payment confirmation request on your EasyPaisa app.
                        </p>
                      </div>
                    </TabsContent>

                    {/* Bank Transfer Form */}
                    <TabsContent value="bank" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-xs sm:text-sm">Bank Account Number / IBAN</Label>
                        <Input
                          placeholder="PK00XXXX0000000000000000"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className={cn("text-sm h-9 sm:h-10", errors.bankAccount && "border-red-500")}
                        />
                        {errors.bankAccount && (
                          <p className="text-[10px] sm:text-xs text-red-500">{errors.bankAccount}</p>
                        )}
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm text-blue-700">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                          Bank transfers may take 1-2 business days to process.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirm Order */}
          {wizardStep === 3 && selectedPlan && (
            <div className="space-y-3 sm:space-y-4">
              <Card className="bg-gray-50">
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h4 className="font-semibold text-sm sm:text-base">Order Summary</h4>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>{selectedPlan.name} Plan (Monthly)</span>
                    <span>{formatCurrency(selectedPlan.price)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-{formatCurrency((selectedPlan.price * discount) / 100)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base sm:text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(getFinalPrice())}</span>
                  </div>
                </CardContent>
              </Card>

              {selectedPlan.price > 0 && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    Payment via{" "}
                    <span className="capitalize font-medium">{paymentMethod}</span>
                  </span>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-green-700">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Your subscription will start immediately after payment confirmation.
                  You can cancel anytime.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {wizardStep === 4 && selectedPlan && (
            <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-600">Welcome to {selectedPlan.name}!</h3>
                <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
                  Your subscription has been activated successfully.
                </p>
              </div>
              <Card className="bg-gray-50 text-left">
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium">{formatCurrency(getFinalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Next Billing</span>
                    <span className="font-medium">
                      {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row mt-4">
            {wizardStep === 4 ? (
              <Button onClick={closeWizard} className="w-full">
                Start Using {selectedPlan?.name}
              </Button>
            ) : (
              <>
                {wizardStep > 1 && (
                  <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)} className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleUpgrade}
                  disabled={processing}
                  className="flex-1 w-full sm:w-auto"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : wizardStep === 3 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Confirm & Pay {selectedPlan && selectedPlan.price > 0 ? formatCurrency(getFinalPrice()) : ""}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">Continue</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to cancel your {currentPlan.name} subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-red-800 mb-2 sm:mb-3 text-sm sm:text-base">You will lose access to:</h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {currentPlan.features
                  .filter((f) => !plans[0].features.includes(f))
                  .map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs sm:text-sm text-red-700">
                      <X className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">
                After cancellation, you will be moved to the Free plan with limited features.
                Your data will be preserved, and you can upgrade again at any time.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} className="w-full sm:w-auto">
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="w-full sm:w-auto"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">Cancel Subscription</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
