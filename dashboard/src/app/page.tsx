"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Clock,
  Users,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
  Store,
  Smartphone,
  Globe,
  MessageSquare,
  Calendar,
  BellRing,
  Play,
  X
} from "lucide-react";
import { ScrollProgress } from "@/components/ui/scroll-progress";

export default function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 76; // Height of sticky header + progress bar below (73 + 3)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: Clock,
      title: "Smart Queue System",
      description: "Advanced AI-powered queue management that predicts wait times and optimizes customer flow automatically.",
      color: "bg-gray-800"
    },
    {
      icon: Users,
      title: "Customer Intelligence",
      description: "Deep customer insights with behavior analytics, preferences tracking, and personalized engagement tools.",
      color: "bg-gray-700"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards with actionable insights, trends analysis, and performance forecasting.",
      color: "bg-gray-600"
    },
    {
      icon: BellRing,
      title: "Smart Notifications",
      description: "Multi-channel alerts via SMS, email, and push notifications with customizable templates.",
      color: "bg-gray-800"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, SOC 2 compliance, and comprehensive data protection protocols.",
      color: "bg-gray-700"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Fully responsive design with native mobile apps for iOS and Android platforms.",
      color: "bg-gray-600"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Businesses", target: 10, suffix: "K+" },
    { value: "500K+", label: "Customers Served", target: 500, suffix: "K+" },
    { value: "99.9%", label: "Uptime", target: 99.9, suffix: "%" },
    { value: "4.9/5", label: "Rating", target: 4.9, suffix: "/5" }
  ];

  const CountUpStat = ({ target, suffix, index }: { target: number; suffix: string; index: number }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    useEffect(() => {
      if (!isInView) return;

      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = target / steps;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setCount(Math.min(increment * currentStep, target));
        } else {
          setCount(target);
          clearInterval(timer);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, [isInView, target]);

    const displayValue = suffix === "%" || suffix === "/5"
      ? count.toFixed(1)
      : Math.floor(count);

    return (
      <div ref={ref} className="text-[36px] md:text-[48px] font-bold text-gray-900 mb-3 leading-[1.2]">
        {displayValue}{suffix}
      </div>
    );
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Coffee Shop Owner",
      content: "Business Pro Hub transformed how we manage our morning rush. Queue times are down 40%!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Print Shop Manager",
      content: "The analytics helped us optimize staffing and increase customer satisfaction dramatically.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Clinic Administrator",
      content: "Patient wait times reduced significantly. Our staff loves how easy it is to use!",
      rating: 5
    }
  ];

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Scroll Progress Indicator - Below Header */}
      <ScrollProgress height={3} position="below-header" headerHeight={73} />

      {/* Header */}
      <motion.header
        className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Store className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  Business Pro Hub
                </span>
                <p className="text-xs text-gray-500 hidden sm:block">Smart Queue Management</p>
              </div>
            </motion.div>
            <motion.nav
              className="hidden md:flex items-center space-x-1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.a
                href="#features"
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Features
              </motion.a>
              <motion.a
                href="#testimonials"
                onClick={(e) => handleSmoothScroll(e, 'testimonials')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Testimonials
              </motion.a>
              <motion.a
                href="#pricing"
                onClick={(e) => handleSmoothScroll(e, 'pricing')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Pricing
              </motion.a>
              <div className="ml-4 flex items-center space-x-3">
                <Link href="/auth/v1/login">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="font-medium">Sign In</Button>
                  </motion.div>
                </Link>
                <Link href="/auth/v1/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-gray-900 hover:bg-gray-800 shadow-lg text-white">
                      Get Started Free
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="absolute inset-0 bg-grid-gray-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="container relative mx-auto px-6 py-16 md:py-20 lg:py-24">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Badge className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 border-gray-200 text-[16px]">
                <Zap className="w-4 h-4 mr-1.5 inline" />
                Trusted by 10,000+ businesses worldwide
              </Badge>
            </motion.div>

            <motion.h1
              className="text-[32px] md:text-[48px] font-bold mb-6 leading-[1.2]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-gray-900">
                Transform Your
              </span>
              <br />
              <span className="text-gray-600">
                Customer Experience
              </span>
            </motion.h1>

            <p className="text-[18px] md:text-[20px] text-gray-600 mb-10 max-w-3xl mx-auto leading-[1.6]">
              The most advanced queue management platform. Reduce wait times by <span className="font-semibold text-gray-900">40%</span>,
              increase customer satisfaction, and scale your operations effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link href="/auth/v1/register">
                <Button size="lg" className="text-[20px] px-10 py-6 bg-gray-900 hover:bg-gray-800 shadow-xl text-white h-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-[20px] px-10 py-6 border-2 h-auto hover:bg-gray-50"
                onClick={() => setIsDemoOpen(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-[16px] text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-700" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-700" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-700" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-16 bg-white border-y border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <CountUpStat target={stat.target} suffix={stat.suffix} index={index} />
                <motion.div
                  className="text-gray-600 font-medium text-[16px] md:text-[18px]"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 border-gray-200 text-[16px]">
              Features
            </Badge>
            <h2 className="text-[32px] md:text-[40px] font-bold mb-6 leading-[1.3]">
              <span className="text-gray-900">
                Everything You Need
              </span>
              <br />
              <span className="text-gray-600">
                In One Platform
              </span>
            </h2>
            <p className="text-[18px] md:text-[20px] text-gray-600 max-w-3xl mx-auto leading-[1.6]">
              Comprehensive tools designed to streamline operations and delight your customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-2xl bg-white group relative overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative">
                  <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-[20px] md:text-[22px] mb-3 text-gray-900 leading-[1.3]">{feature.title}</CardTitle>
                  <CardDescription className="text-[16px] md:text-[18px] leading-[1.6] text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 border-gray-200 text-[16px]">
              Testimonials
            </Badge>
            <h2 className="text-[32px] md:text-[40px] font-bold mb-6 leading-[1.3]">
              <span className="text-gray-900">
                Trusted by Industry Leaders
              </span>
            </h2>
            <p className="text-[18px] md:text-[20px] text-gray-600 max-w-2xl mx-auto leading-[1.6]">
              Join thousands of businesses transforming their customer experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 transition-shadow duration-300 hover:shadow-2xl">
                <CardContent className="pt-8 pb-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-gray-700 fill-gray-700" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-[16px] md:text-[18px] leading-[1.6] mb-8 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-[18px]">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-[16px]">{testimonial.name}</p>
                      <p className="text-[16px] text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 border-gray-200 text-[16px]">
              Pricing
            </Badge>
            <h2 className="text-[32px] md:text-[40px] font-bold mb-6 leading-[1.3]">
              <span className="text-gray-900">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-[18px] md:text-[20px] text-gray-600 max-w-2xl mx-auto leading-[1.6]">
              Start free, scale as you grow. No hidden fees or surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free Plan */}
          <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl bg-white transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="space-y-3">
                <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Free</CardTitle>
                <div>
                  <span className="text-[32px] md:text-[36px] font-bold text-gray-900">Rs. 0</span>
                  <span className="text-gray-600 ml-1 text-[14px]">/month</span>
                </div>
                <p className="text-gray-600 text-[14px] md:text-[15px] leading-[1.6]">Perfect for getting started</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3">
                {["Up to 50 queue entries/month", "Basic queue management", "QR code generation", "Email support", "1 staff member"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-gray-700 text-[14px] leading-[1.5]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/v1/register">
                <Button variant="outline" size="lg" className="w-full border-2 h-11 font-semibold hover:bg-gray-50 text-[15px]">
                  Start Free
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Starter Plan - Most Popular */}
          <Card className="border-2 border-gray-900 shadow-2xl md:scale-105 bg-gradient-to-br from-white to-gray-50 relative ring-4 ring-gray-200 transition-all duration-300">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="px-4 py-1.5 bg-gray-900 text-white border-0 shadow-lg text-[13px] font-bold whitespace-nowrap">
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="pb-6 pt-8">
              <div className="space-y-3">
                <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Starter</CardTitle>
                <div>
                  <span className="text-[32px] md:text-[36px] font-bold text-gray-900">Rs. 2,999</span>
                  <span className="text-gray-600 ml-1 text-[14px]">/month</span>
                </div>
                <p className="text-gray-600 text-[14px] md:text-[15px] leading-[1.6]">For small businesses</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3">
                {["Up to 500 queue entries/month", "Advanced queue management", "Priority email support", "Basic analytics", "Up to 3 staff members"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <CheckCircle className="h-4 w-4 text-gray-900" />
                    </div>
                    <span className="text-gray-700 font-medium text-[14px] leading-[1.5]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/v1/register">
                <Button size="lg" className="w-full h-11 bg-gray-900 hover:bg-gray-800 shadow-lg font-semibold text-white text-[15px]">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl bg-white transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="space-y-3">
                <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Professional</CardTitle>
                <div>
                  <span className="text-[32px] md:text-[36px] font-bold text-gray-900">Rs. 5,999</span>
                  <span className="text-gray-600 ml-1 text-[14px]">/month</span>
                </div>
                <p className="text-gray-600 text-[14px] md:text-[15px] leading-[1.6]">For growing businesses</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3">
                {["Unlimited queue entries", "24/7 priority support", "Advanced analytics", "Up to 10 staff members", "SMS notifications", "Custom branding"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="text-gray-700 text-[14px] leading-[1.5]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/v1/register">
                <Button variant="outline" size="lg" className="w-full border-2 h-11 font-semibold hover:bg-gray-50 text-[15px]">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl bg-white transition-shadow duration-300">
            <CardHeader className="pb-6">
              <div className="space-y-3">
                <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Enterprise</CardTitle>
                <div>
                  <span className="text-[32px] md:text-[36px] font-bold text-gray-900">Rs. 14,999</span>
                  <span className="text-gray-600 ml-1 text-[14px]">/month</span>
                </div>
                <p className="text-gray-600 text-[14px] md:text-[15px] leading-[1.6]">For large organizations</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3">
                {["Everything in Professional", "Unlimited staff members", "Dedicated account manager", "Custom integrations", "API access", "White-label solution"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <CheckCircle className="h-4 w-4 text-gray-700" />
                    </div>
                    <span className="text-gray-700 text-[14px] leading-[1.5]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/v1/register">
                <Button variant="outline" size="lg" className="w-full border-2 h-11 font-semibold hover:bg-gray-50 text-[15px]">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Sales
                </Button>
              </Link>
            </CardContent>
          </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]"></div>
        <div className="container relative mx-auto px-6 text-center">
          <Badge className="mb-6 px-6 py-2 bg-white/10 text-white border-white/20 backdrop-blur-sm text-[16px]">
            <Zap className="w-4 h-4 mr-2 inline" />
            Get Started in Minutes
          </Badge>

          <h2 className="text-[32px] md:text-[48px] font-bold text-white mb-6 leading-[1.2]">
            Ready to Transform<br />Your Business?
          </h2>

          <p className="text-[18px] md:text-[20px] text-gray-300 mb-12 max-w-3xl mx-auto leading-[1.6]">
            Join 10,000+ businesses already optimizing their operations with Business Pro Hub
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/v1/register">
              <Button size="lg" variant="secondary" className="text-[20px] px-10 py-6 bg-white text-gray-900 hover:bg-gray-100 shadow-2xl font-semibold h-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/v1/login">
              <Button size="lg" variant="outline" className="text-[20px] px-10 py-6 border-2 border-gray-300 text-gray-900 bg-white hover:bg-gray-100 h-auto font-semibold">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Setup in 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <Store className="h-6 w-6 text-gray-900" />
                </div>
                <span className="text-xl font-bold text-white">Business Pro Hub</span>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed max-w-sm">
                The most advanced queue management platform trusted by thousands of businesses worldwide.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                A product by <span className="text-gray-300 font-medium">Elixa Software Private Limited</span>
              </p>
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="h-10 w-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="h-10 w-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition-colors cursor-pointer">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors cursor-pointer">Testimonials</a></li>
                <li><button onClick={() => setIsDemoOpen(true)} className="hover:text-white transition-colors cursor-pointer">Demo</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/company#about" className="hover:text-white transition-colors">About Elixa Software</Link></li>
                <li><Link href="/company#blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/company#careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/company#press" className="hover:text-white transition-colors">Press Kit</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Support</h3>
              <ul className="space-y-3">
                <li><Link href="/support#help-center" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/support#contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/legal?tab=privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal?tab=terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500">
                  &copy; 2026 Business Pro Hub. All rights reserved.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Developed by <span className="text-gray-400">Elixa Software Private Limited</span>
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="/legal?tab=privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/legal?tab=terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/legal?tab=cookies" className="hover:text-white transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Video Dialog */}
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black border-gray-800 overflow-hidden [&>button]:hidden">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-lg">BusinessHub Pro Demo</DialogTitle>
              {/* Custom Close Button */}
              <button
                onClick={() => setIsDemoOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </DialogHeader>
          <div className="relative aspect-video bg-gray-900">
            {/* Placeholder for demo video - replace with actual video embed */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center mb-6 hover:bg-white/20 transition-colors cursor-pointer">
                <Play className="h-12 w-12 text-white ml-1" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Product Demo Video</h3>
              <p className="text-gray-400 text-center max-w-md px-4">
                See how BusinessHub Pro can transform your business operations with smart queue management and real-time analytics.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">40%</div>
                  <div className="text-sm text-gray-400">Reduced Wait Times</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">10K+</div>
                  <div className="text-sm text-gray-400">Active Businesses</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">4.9/5</div>
                  <div className="text-sm text-gray-400">Customer Rating</div>
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <Link href="/auth/v1/register">
                  <Button className="bg-white text-black hover:bg-gray-100">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-black transition-colors"
                  onClick={() => setIsDemoOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-900 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              A product by <span className="text-gray-400 font-medium">Elixa Software Private Limited</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
