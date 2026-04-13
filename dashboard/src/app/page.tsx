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
  X,
  Menu
} from "lucide-react";
import { ScrollProgress } from "@/components/ui/scroll-progress";

export default function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Supabase password-reset emails redirect to the Site URL (this page) with
  // the recovery token in the hash.  Catch it and forward to the reset page.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && hash.includes("access_token")) {
      window.location.replace("/auth/reset-password" + hash);
    }
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const sections = ['features', 'testimonials', 'pricing'];
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (intersecting.length > 0) {
          setActiveSection(intersecting[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Clock,
      title: "Smart Queue System",
      description: "Advanced AI-powered queue management that predicts wait times and optimizes customer flow automatically.",
      color: "bg-[#3D4127]"
    },
    {
      icon: Users,
      title: "Customer Intelligence",
      description: "Deep customer insights with behavior analytics, preferences tracking, and personalized engagement tools.",
      color: "bg-[#4a5130]"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards with actionable insights, trends analysis, and performance forecasting.",
      color: "bg-[#636B2F]"
    },
    {
      icon: BellRing,
      title: "Smart Notifications",
      description: "Multi-channel alerts via SMS, email, and push notifications with customizable templates.",
      color: "bg-[#3D4127]"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, SOC 2 compliance, and comprehensive data protection protocols.",
      color: "bg-[#4a5130]"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Fully responsive design with native mobile apps for iOS and Android platforms.",
      color: "bg-[#636B2F]"
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
            <motion.a
              href="#"
              onClick={scrollToTop}
              className="flex items-center space-x-3 cursor-pointer"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="h-10 w-10 rounded-xl bg-[#3D4127] flex items-center justify-center shadow-lg"
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
            </motion.a>
            <motion.nav
              className="flex items-center space-x-1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Nav links — hidden on mobile */}
              {[
                { label: 'Features', id: 'features' },
                { label: 'Testimonials', id: 'testimonials' },
                { label: 'Pricing', id: 'pricing' },
              ].map(({ label, id }) => (
                <motion.a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => handleSmoothScroll(e, id)}
                  className={`hidden md:block px-4 pb-1.5 pt-2 transition-all duration-300 cursor-pointer text-sm border-b-2
                    ${activeSection === id
                      ? 'text-[#3D4127] font-semibold border-[#636B2F]'
                      : 'text-gray-500 font-medium border-transparent hover:text-gray-900 hover:border-gray-300'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                </motion.a>
              ))}
              {/* Action buttons — always visible */}
              <div className="md:ml-4 flex items-center space-x-2">
                <Link href="/auth/v1/login" className="hidden md:block">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="font-medium text-sm px-3">Sign In</Button>
                  </motion.div>
                </Link>
                <Link href="/auth/v1/register" className="hidden md:block">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-[#3D4127] hover:bg-[#636B2F] shadow-lg text-white text-sm px-3">
                      Get Started Free
                    </Button>
                  </motion.div>
                </Link>
                {/* Hamburger — mobile only */}
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </motion.nav>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden sticky top-[73px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xl px-5 py-5 flex flex-col"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col mb-4">
            {[
              { label: 'Features', id: 'features' },
              { label: 'Testimonials', id: 'testimonials' },
              { label: 'Pricing', id: 'pricing' },
            ].map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => { handleSmoothScroll(e, id); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-between px-3 py-3 rounded-xl text-gray-700 hover:text-[#3D4127] hover:bg-[#D4DE95]/20 font-medium transition-all duration-150"
              >
                {label}
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
            <Link href="/auth/v1/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full h-11 font-medium border-gray-200 hover:border-[#3D4127] hover:text-[#3D4127]">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/v1/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full h-11 bg-[#3D4127] hover:bg-[#636B2F] text-white font-medium shadow-md">
                Get Started Free
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

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
              <Badge className="mb-6 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-[16px] text-center leading-snug whitespace-normal max-w-[220px] sm:max-w-none">
                <Zap className="w-4 h-4 mr-1.5 inline flex-shrink-0" />
                <span>Trusted by 10,000+<br className="sm:hidden" /> businesses worldwide</span>
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
              <span className="text-[#3D4127]">
                Customer Experience
              </span>
            </motion.h1>

            <p className="text-[18px] md:text-[20px] text-gray-600 mb-10 max-w-3xl mx-auto leading-[1.6]">
              The most advanced queue management platform. Reduce wait times by <span className="font-semibold text-gray-900">40%</span>,
              increase customer satisfaction, and scale your operations effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link href="/auth/v1/register">
                <Button size="lg" className="text-[20px] px-10 py-6 bg-[#3D4127] hover:bg-[#636B2F] shadow-xl text-white h-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-[20px] px-10 py-6 border-2 h-auto hover:bg-gray-50 shadow-lg"
                onClick={() => setIsDemoOpen(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-[16px] text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#636B2F]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#636B2F]" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#636B2F]" />
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
      <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50 scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-[16px]">
              Features
            </Badge>
            <h2 className="text-[32px] md:text-[40px] font-bold mb-6 leading-[1.3]">
              <span className="text-gray-900">
                Everything You Need
              </span>
              <br />
              <span className="text-[#636B2F]">
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
      <section id="testimonials" className="py-24 bg-white scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-[16px]">
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

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 transition-shadow duration-300 hover:shadow-2xl h-full flex flex-col">
                <CardContent className="pt-8 pb-8 flex flex-col flex-1">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-[#636B2F] fill-[#636B2F]" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-[16px] md:text-[18px] leading-[1.6] mb-8 italic flex-1">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="h-12 w-12 rounded-full bg-[#3D4127] flex items-center justify-center text-white font-bold text-[18px]">
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
      <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-[16px]">
              Available Plans
            </Badge>
            <h2 className="text-[32px] md:text-[40px] font-bold mb-4 leading-[1.3] text-gray-900">
              Simple, Transparent Pricing
            </h2>
            {/* Promo code banner */}
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-5 py-2 text-[14px] font-medium mt-2">
              <span className="text-base">🎉</span>
              Use code <span className="font-bold bg-amber-100 px-2 py-0.5 rounded ml-1 mr-1 tracking-wide">WELCOME20</span> for 20% off
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">

            {/* Free Plan */}
            <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl bg-white transition-shadow duration-300 relative flex flex-col">
              <div className="absolute -top-3 left-4">
                <Badge className="px-3 py-1 bg-gray-100 text-gray-600 border-gray-300 text-[12px] font-semibold">
                  Current
                </Badge>
              </div>
              <CardHeader className="pb-4 pt-8">
                <div className="space-y-2">
                  <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Free</CardTitle>
                  <p className="text-gray-500 text-[13px] leading-[1.5]">Perfect for getting started</p>
                  <div className="pt-1">
                    <span className="text-[32px] md:text-[34px] font-bold text-gray-900">Rs. 0</span>
                    <span className="text-gray-500 ml-1 text-[13px]">/month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-5">
                <ul className="space-y-2.5 flex-1">
                  {["Up to 50 queue entries/month", "Basic queue management", "QR code generation", "Email support", "1 staff member", "Up to 100 customers"].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-[13px] leading-[1.5]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button disabled size="lg" className="w-full h-10 font-semibold text-[14px] bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 mt-auto">
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Starter Plan - Most Popular */}
            <Card className="border-2 border-[#3D4127] shadow-2xl md:scale-105 bg-gradient-to-br from-white to-gray-50 relative ring-4 ring-[#BAC095]/40 transition-all duration-300 flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                <Badge className="px-4 py-1.5 bg-[#3D4127] text-white border-0 shadow-lg text-[12px] font-bold whitespace-nowrap">
                  ★ MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="pb-4 pt-9">
                <div className="space-y-2">
                  {/* Urgency badge */}
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md px-2.5 py-1 text-[12px] font-semibold">
                    ⚠️ Don&apos;t lose this deal!
                  </div>
                  <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Starter</CardTitle>
                  <p className="text-gray-500 text-[13px] leading-[1.5]">For small businesses</p>
                  <div className="pt-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-gray-400 line-through">Rs. 4,999/month</span>
                    </div>
                    <div>
                      <span className="text-[32px] md:text-[34px] font-bold text-gray-900">Rs. 2,999</span>
                      <span className="text-gray-500 ml-1 text-[13px]">/month</span>
                    </div>
                    <p className="text-green-600 text-[12px] font-semibold">💰 Save Rs. 24,000/year</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#3D4127] text-white rounded-md px-2.5 py-1.5 text-[12px] font-medium">
                    <span className="text-[#D4DE95]">●</span> +847 businesses chose this month
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-5">
                <ul className="space-y-2.5 flex-1">
                  {["Up to 500 queue entries/month", "Advanced queue management", "QR code generation", "Priority email support", "Basic analytics", "Up to 3 staff members"].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-[#3D4127] mt-0.5 shrink-0" />
                      <span className="text-gray-700 font-medium text-[13px] leading-[1.5]">{feature}</span>
                    </li>
                  ))}
                  <li className="text-[12px] text-gray-500 pl-6">+1 more features</li>
                </ul>
                <Link href="/auth/v1/register" className="mt-auto">
                  <Button size="lg" className="w-full h-10 bg-[#3D4127] hover:bg-[#636B2F] shadow-lg font-semibold text-white text-[14px]">
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl bg-white transition-shadow duration-300 flex flex-col">
              <CardHeader className="pb-4">
                <div className="space-y-2">
                  <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Professional</CardTitle>
                  <p className="text-gray-500 text-[13px] leading-[1.5]">For growing businesses</p>
                  <div className="pt-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-gray-400 line-through">Rs. 9,999/month</span>
                    </div>
                    <div>
                      <span className="text-[32px] md:text-[34px] font-bold text-gray-900">Rs. 5,999</span>
                      <span className="text-gray-500 ml-1 text-[13px]">/month</span>
                    </div>
                    <p className="text-green-600 text-[12px] font-semibold">💰 Save Rs. 48,000/year</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-5">
                <ul className="space-y-2.5 flex-1">
                  {["Unlimited queue entries", "Advanced queue management", "QR code generation", "24/7 priority support", "Advanced analytics & reports", "Up to 10 staff members"].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-700 mt-0.5 shrink-0" />
                      <span className="text-gray-700 text-[13px] leading-[1.5]">{feature}</span>
                    </li>
                  ))}
                  <li className="text-[12px] text-gray-500 pl-6">+3 more features</li>
                </ul>
                <Link href="/auth/v1/register" className="mt-auto">
                  <Button variant="outline" size="lg" className="w-full border-2 h-10 font-semibold hover:bg-gray-50 text-[14px]">
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-gray-200 shadow-xl hover:shadow-2xl bg-white transition-shadow duration-300 flex flex-col">
              <CardHeader className="pb-4">
                <div className="space-y-2">
                  <CardTitle className="text-[22px] md:text-[24px] leading-[1.3]">Enterprise</CardTitle>
                  <p className="text-gray-500 text-[13px] leading-[1.5]">For large organizations</p>
                  <div className="pt-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-gray-400 line-through">Rs. 24,999/month</span>
                    </div>
                    <div>
                      <span className="text-[32px] md:text-[34px] font-bold text-gray-900">Rs. 14,999</span>
                      <span className="text-gray-500 ml-1 text-[13px]">/month</span>
                    </div>
                    <p className="text-green-600 text-[12px] font-semibold">💰 Save Rs. 120,000/year</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-5">
                <ul className="space-y-2.5 flex-1">
                  {["Everything in Professional", "Unlimited staff members", "Unlimited customers", "Dedicated account manager", "Custom integrations", "White-label solution"].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-700 mt-0.5 shrink-0" />
                      <span className="text-gray-700 text-[13px] leading-[1.5]">{feature}</span>
                    </li>
                  ))}
                  <li className="text-[12px] text-gray-500 pl-6">+3 more features</li>
                </ul>
                <Link href="/auth/v1/register" className="mt-auto">
                  <Button variant="outline" size="lg" className="w-full border-2 h-10 font-semibold hover:bg-gray-50 text-[14px]">
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-[#3D4127] overflow-hidden">
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
      <footer className="bg-white border-t border-gray-200 pt-10 pb-6">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#3D4127] flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Business Pro Hub</span>
              </div>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed max-w-xs">
                The most advanced queue management platform trusted by thousands of businesses worldwide.
              </p>
              <p className="text-xs text-gray-400 mb-1">
                A product by{" "}
                <a href="https://elixasoftware.tech" target="_blank" rel="noopener noreferrer"
                   className="text-gray-500 font-medium hover:text-[#3D4127] transition-colors">
                  Elixa Software Private Limited
                </a>
              </p>
              {/* Contact info */}
              <div className="space-y-1 mb-4">
                <a href="mailto:hello.elixa@gmail.com"
                   className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#3D4127] transition-colors">
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  hello.elixa@gmail.com
                </a>
                <a href="tel:+923472681862"
                   className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#3D4127] transition-colors">
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  +92 347 268 1862
                </a>
              </div>
              {/* Social icons */}
              <div className="flex gap-2">
                <a href="https://github.com/elixasoftware" target="_blank" rel="noopener noreferrer" title="GitHub"
                   className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#D4DE95]/40 text-gray-500 hover:text-[#3D4127] flex items-center justify-center transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="https://instagram.com/elixasoftware" target="_blank" rel="noopener noreferrer" title="Instagram"
                   className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#D4DE95]/40 text-gray-500 hover:text-[#3D4127] flex items-center justify-center transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://linkedin.com/company/elixasoftware" target="_blank" rel="noopener noreferrer" title="LinkedIn"
                   className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#D4DE95]/40 text-gray-500 hover:text-[#3D4127] flex items-center justify-center transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://x.com/elixasoftware" target="_blank" rel="noopener noreferrer" title="X / Twitter"
                   className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#D4DE95]/40 text-gray-500 hover:text-[#3D4127] flex items-center justify-center transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://facebook.com/elixasoftware" target="_blank" rel="noopener noreferrer" title="Facebook"
                   className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#D4DE95]/40 text-gray-500 hover:text-[#3D4127] flex items-center justify-center transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-gray-900 font-semibold mb-3 text-xs uppercase tracking-wider">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-500 hover:text-[#3D4127] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-500 hover:text-[#3D4127] transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="text-gray-500 hover:text-[#3D4127] transition-colors">Testimonials</a></li>
                <li><button onClick={() => setIsDemoOpen(true)} className="text-gray-500 hover:text-[#3D4127] transition-colors">Demo</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-gray-900 font-semibold mb-3 text-xs uppercase tracking-wider">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://elixasoftware.tech/about" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#3D4127] transition-colors">About Elixa</a></li>
                <li><a href="https://elixasoftware.tech/services" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#3D4127] transition-colors">Services</a></li>
                <li><a href="https://elixasoftware.tech/contact" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#3D4127] transition-colors">Contact</a></li>
                <li><a href="https://elixasoftware.tech/projects" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#3D4127] transition-colors">Projects</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-gray-900 font-semibold mb-3 text-xs uppercase tracking-wider">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://elixasoftware.tech/help" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#3D4127] transition-colors">Help Center</a></li>
                <li><a href="https://elixasoftware.tech/contact" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#3D4127] transition-colors">Contact Us</a></li>
                <li><Link href="/legal?tab=privacy" className="text-gray-500 hover:text-[#3D4127] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal?tab=terms" className="text-gray-500 hover:text-[#3D4127] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-400">&copy; 2026 Business Pro Hub. All rights reserved. &mdash; A product by <a href="https://elixasoftware.tech" target="_blank" rel="noopener noreferrer" className="hover:text-[#3D4127] transition-colors">Elixa Software Private Limited</a></p>
            <div className="flex gap-6 text-xs text-gray-400">
              <Link href="/legal?tab=privacy" className="hover:text-[#3D4127] transition-colors">Privacy</Link>
              <Link href="/legal?tab=terms" className="hover:text-[#3D4127] transition-colors">Terms</Link>
              <Link href="/legal?tab=cookies" className="hover:text-[#3D4127] transition-colors">Cookies</Link>
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
