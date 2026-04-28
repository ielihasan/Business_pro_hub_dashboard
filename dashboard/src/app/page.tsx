"use client";
/**
 * Landing Page — Redesigned
 * Images are served from /media/ (dashboard/public/media/).
 * All 10 assets are used strategically throughout the page.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  BellRing,
  Play,
  X,
  Menu,
  ChevronDown,
  Building2,
  Lightbulb,
  Coffee,
  Truck,
  MonitorSmartphone,
  Banknote,
  Lock,
  Sparkles,
} from "lucide-react";
import { ScrollProgress } from "@/components/ui/scroll-progress";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface StatItem {
  value: string;
  label: string;
  target: number;
  suffix: string;
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const stats: StatItem[] = [
  { value: "10K+",  label: "Active Businesses",  target: 10,    suffix: "K+" },
  { value: "500K+", label: "Customers Served",   target: 500,   suffix: "K+" },
  { value: "99.9%", label: "Uptime SLA",         target: 99.9,  suffix: "%"  },
  { value: "4.9/5", label: "Avg. Rating",        target: 4.9,   suffix: "/5" },
];

const bentoFeatures = [
  // Row 1 — all landscape images, uniform height
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Real-time dashboards with actionable insights, trends analysis, and performance forecasting to grow smarter.",
    image: "/media/advanced-analytics.jpg",          // 5000×3333 landscape
    objectPos: "center center",
    overlay: "from-black/80 via-black/40 to-transparent",
    colSpan: "lg:col-span-1",
    rowSpan: "",
  },
  {
    icon: Clock,
    title: "Smart Queue Engine",
    description:
      "AI-powered queue management that predicts wait times and optimises customer flow — automatically.",
    image: "/media/smart-queue-engine.jpg",           // 8000×6000 landscape
    objectPos: "center center",
    overlay: "from-[#3D4127]/85 via-[#3D4127]/40 to-transparent",
    colSpan: "lg:col-span-1",
    rowSpan: "",
  },
  {
    icon: BellRing,
    title: "Multi-Channel Notifications",
    description:
      "Automated SMS, email, and push alerts with custom templates. Keep customers informed at every step.",
    image: "/media/multi-channel-notifications.jpg",  // 4149×4149 square
    objectPos: "center center",
    overlay: "from-black/80 via-black/40 to-transparent",
    colSpan: "lg:col-span-1",
    rowSpan: "",
  },
  // Row 2 — Revenue Analytics spans 2 cols (portrait); Security fills right
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description:
      "Close the books faster with real-time revenue dashboards, period comparisons, and downloadable reports.",
    image: "/media/african-american-expert-closing-monthly-revenue-balance.jpg", // 3403×5104 portrait
    objectPos: "center top",
    overlay: "from-[#3D4127]/90 via-[#3D4127]/50 to-transparent",
    colSpan: "lg:col-span-2",
    rowSpan: "",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "Bank-level encryption, SOC 2 compliance, and comprehensive data protection baked in from day one.",
    image: "/media/enterprise-grade-security.jpg",    // 6067×3467 landscape
    objectPos: "center center",
    overlay: "from-black/85 via-black/45 to-transparent",
    colSpan: "lg:col-span-1",
    rowSpan: "",
  },
  // Row 3 — Mobile-First (portrait) + QR (dark accent card)
  {
    icon: Smartphone,
    title: "Mobile-First Platform",
    description:
      "Native iOS & Android apps plus a fully responsive dashboard — manage your business from anywhere.",
    image: "/media/mobile-first-platform.jpg",        // 4002×6000 portrait
    objectPos: "center top",
    overlay: "from-[#636B2F]/90 via-[#636B2F]/45 to-transparent",
    colSpan: "lg:col-span-1",
    rowSpan: "",
  },
];

const industries = [
  {
    name: "Cafés & Restaurants",
    description: "Cut front-of-house chaos and seat more covers daily.",
    icon: Coffee,
    image: "/media/business-people-drinking-some-beverage.jpg",
    tint: "from-[#3D4127]/70 via-[#3D4127]/30 to-transparent",
  },
  {
    name: "Logistics & Teams",
    description: "Coordinate large teams and streamline dispatch queues.",
    icon: Truck,
    image: "/media/transportation-map-planning-meeting-team.jpg",
    tint: "from-black/70 via-black/30 to-transparent",
  },
  {
    name: "Tech & Innovation",
    description: "Future-ready features designed for fast-moving companies.",
    icon: MonitorSmartphone,
    image: "/media/woman-having-fun-with-vr-headset.jpg",
    tint: "from-[#636B2F]/70 via-[#636B2F]/30 to-transparent",
  },
  {
    name: "Corporate Offices",
    description: "Manage visitor flow, reception queues, and meeting rooms.",
    icon: Building2,
    image: "/media/pc-keyboard-mouse-table.jpg",
    tint: "from-black/70 via-black/30 to-transparent",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Coffee Shop Owner",
    content:
      "Business Pro Hub transformed how we manage our morning rush. Queue times are down 40% and customers keep coming back.",
    rating: 5,
    initial: "S",
  },
  {
    name: "Michael Chen",
    role: "Print Shop Manager",
    content:
      "The analytics helped us optimise staffing and increase customer satisfaction dramatically — ROI was instant.",
    rating: 5,
    initial: "M",
  },
  {
    name: "Emily Rodriguez",
    role: "Clinic Administrator",
    content:
      "Patient wait times reduced significantly. Our staff loves how intuitive it is. Setup took under an hour.",
    rating: 5,
    initial: "E",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Your Account",
    body: "Sign up in under 2 minutes. No credit card required. Choose your plan and get instant access to your dashboard.",
  },
  {
    num: "02",
    title: "Configure Your Queue",
    body: "Add your services, set operating hours, customise notifications, and generate your QR code — all in one place.",
  },
  {
    num: "03",
    title: "Start Serving Smarter",
    body: "Share your QR code. Customers join remotely. Watch real-time analytics and delight every visitor.",
  },
];

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function CountUpStat({
  target,
  suffix,
}: {
  target: number;
  suffix: string;
  index: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    const steps = 60;
    const duration = 2000;
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

  const display =
    suffix === "%" || suffix === "/5"
      ? count.toFixed(1)
      : Math.floor(count);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
      {display}{suffix}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled] = useState(false);

  /* Supabase password-reset redirect */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && hash.includes("access_token")) {
      window.location.replace("/auth/reset-password" + hash);
    }
  }, []);

  /* Header shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Active nav section */
  useEffect(() => {
    const ids = ["features", "testimonials", "pricing"];
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (hit.length > 0) setActiveSection(hit[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { label: "Features",     id: "features"     },
    { label: "Testimonials", id: "testimonials" },
    { label: "Pricing",      id: "pricing"      },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <motion.div
      className="min-h-screen bg-white text-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <ScrollProgress height={3} position="below-header" headerHeight={73} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <motion.header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#1a1e0d]/98 backdrop-blur-md shadow-lg border-b border-white/10"
            : "bg-[#1a1e0d]/85 backdrop-blur-sm border-b border-white/5"
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="#"
            onClick={scrollToTop}
            className="flex items-center gap-3 cursor-pointer"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="h-10 w-10 rounded-xl bg-[#3D4127] flex items-center justify-center shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">
                Business Pro Hub
              </span>
              <p className="text-xs hidden sm:block text-white/50">
                Smart Queue Management
              </p>
            </div>
          </motion.a>

          {/* Desktop nav */}
          <motion.nav
            className="flex items-center gap-1"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {navLinks.map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => handleSmoothScroll(e, id)}
                className={`hidden md:block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? "text-[#D4DE95] bg-[#D4DE95]/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </a>
            ))}

            <div className="hidden md:flex items-center gap-2 ml-3">
              <Link href="/auth/v1/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium text-sm text-white/80 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/v1/register">
                <Button
                  size="sm"
                  className="bg-[#3D4127] hover:bg-[#636B2F] text-white shadow-lg font-medium"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </button>
          </motion.nav>
        </div>
      </motion.header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden sticky top-[65px] z-40 bg-white/97 backdrop-blur-md border-b border-gray-100 shadow-xl px-5 py-4 flex flex-col"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex flex-col mb-4">
            {navLinks.map(({ label, id }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  handleSmoothScroll(e, id);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between px-3 py-3 rounded-xl text-gray-700 hover:text-[#3D4127] hover:bg-[#D4DE95]/20 font-medium transition-all"
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

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      {/*
       * Background: modern-business-building-scenery-touching-sky.jpg
       * 4000×5000 portrait — cover-cropped, center-anchored
       */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden -mt-[65px]">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/media/modern-business-building-scenery-touching-sky.jpg"
            alt="Modern business district skyline"
            className="w-full h-full object-cover object-center"
          />
          {/* Multi-layer overlay: darkens base, adds brand tint at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-[#1a1e0d]/80" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#3D4127]/30 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Badge className="mb-8 px-5 py-2 bg-white/10 text-white border-white/25 backdrop-blur-sm text-sm font-medium gap-2">
              <Zap className="w-3.5 h-3.5 text-[#D4DE95]" />
              Trusted by 10,000+ businesses worldwide
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold text-white leading-[1.08] mb-7 tracking-tight"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            Transform Your
            <br />
            <span className="text-[#D4DE95]">Customer Experience</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            The most advanced queue management platform. Reduce wait times by{" "}
            <span className="text-white font-semibold">40%</span>, increase customer
            satisfaction, and scale your operations effortlessly.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          >
            <Link href="/auth/v1/register">
              <Button
                size="lg"
                className="h-14 px-10 text-base font-semibold bg-[#D4DE95] text-[#2a2e10] hover:bg-white shadow-2xl transition-all duration-200"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-base font-semibold border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
              onClick={() => setIsDemoOpen(true)}
            >
              <Play className="mr-2 h-5 w-5 fill-white" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
          >
            {["No credit card required", "14-day free trial", "Cancel anytime"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D4DE95]" />
                <span>{t}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50 cursor-pointer"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          onClick={() => {
            document
              .getElementById("stats")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <motion.section
        id="stats"
        className="bg-[#3D4127] py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <CountUpStat
                  target={stat.target}
                  suffix={stat.suffix}
                  index={i}
                />
                <div className="text-[#D4DE95] font-medium text-sm mt-2 tracking-wide uppercase">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      {/*
       * Right image: work-desk-with-computer-cup-with-pens-pencils-against-white-wall.jpg
       * 6924×4616 — bright, clean, modern desk
       */}
      <section className="py-24 bg-[#f7f7f4] overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge className="mb-5 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-sm">
                How It Works
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Up and running
                <br />
                <span className="text-[#636B2F]">in minutes.</span>
              </h2>
              <p className="text-lg text-gray-500 mb-12 leading-relaxed max-w-lg">
                No complex setup. No IT team needed. Three simple steps and
                you&apos;re serving smarter customers from day one.
              </p>

              <div className="space-y-8">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-5"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#3D4127] flex items-center justify-center shadow-lg">
                      <span className="text-[#D4DE95] font-extrabold text-sm">
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 leading-relaxed text-sm">
                        {step.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/auth/v1/register">
                  <Button className="bg-[#3D4127] hover:bg-[#636B2F] text-white h-12 px-8 font-semibold shadow-lg">
                    Get Started — It&apos;s Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Image side */}
            <motion.div
              className="relative"
              initial={{ x: 40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Decorative bg blob */}
              <div className="absolute -inset-4 bg-[#D4DE95]/20 rounded-3xl -z-10 rotate-2" />
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                <img
                  src="/media/work-desk-with-computer-cup-with-pens-pencils-against-white-wall.jpg"
                  alt="Clean modern work desk setup"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#D4DE95] flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-[#3D4127]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Average setup time</p>
                  <p className="text-base font-bold text-gray-900">Under 5 minutes</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ────────────────────────────────────────── */}
      {/*
       * Row 1 (3 × 1-col):  advanced-analytics.jpg (5000×3333)
       *                      smart-queue-engine.jpg (8000×6000)
       *                      multi-channel-notifications.jpg (4149×4149)
       * Row 2 (2-col + 1):  african-american-expert… (3403×5104 portrait, 2-col)
       *                      enterprise-grade-security.jpg (6067×3467)
       * Row 3 (1-col + 2):  mobile-first-platform.jpg (4002×6000 portrait)
       *                      QR Check-In — dark accent card (no photo, 2-col)
       */}
      <section
        id="features"
        className="py-24 bg-white scroll-mt-20 overflow-hidden"
      >
        <div className="container mx-auto px-6">
          {/* Section heading */}
          <motion.div
            className="text-center mb-16"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <Badge className="mb-5 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-sm">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Everything you need,
              <br />
              <span className="text-[#636B2F]">in one platform.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Comprehensive tools designed to streamline operations and delight
              every customer — from day one.
            </p>
          </motion.div>

          {/* ── ROW 1: three equal landscape cards ── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            {bentoFeatures.slice(0, 3).map((f, i) => (
              <motion.div
                key={i}
                className="relative rounded-2xl overflow-hidden min-h-[280px] group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.09 }}
              >
                {/* Photo */}
                <img
                  src={f.image!}
                  alt={f.title}
                  className={`absolute inset-0 w-full h-full object-cover object-${f.objectPos.includes("top") ? "top" : "center"} group-hover:scale-105 transition-transform duration-700`}
                />
                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${f.overlay}`} />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── ROW 2: Revenue Analytics (2-col) + Security (1-col) ── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            {/* Revenue Analytics — portrait image, 2 cols wide */}
            <motion.div
              className="md:col-span-2 relative rounded-2xl overflow-hidden min-h-[320px] group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <img
                src={bentoFeatures[3].image!}
                alt={bentoFeatures[3].title}
                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${bentoFeatures[3].overlay}`} />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                {(() => { const Icon = bentoFeatures[3].icon; return (
                  <div className="h-11 w-11 rounded-xl bg-[#D4DE95]/20 border border-[#D4DE95]/35 backdrop-blur-sm flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-[#D4DE95]" />
                  </div>
                ); })()}
                <h3 className="text-xl font-bold text-white mb-2">{bentoFeatures[3].title}</h3>
                <p className="text-white/65 text-sm leading-relaxed max-w-lg">{bentoFeatures[3].description}</p>
              </div>
            </motion.div>

            {/* Enterprise-Grade Security — 1 col */}
            <motion.div
              className="relative rounded-2xl overflow-hidden min-h-[320px] group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.14 }}
            >
              <img
                src={bentoFeatures[4].image!}
                alt={bentoFeatures[4].title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${bentoFeatures[4].overlay}`} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {(() => { const Icon = bentoFeatures[4].icon; return (
                  <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                ); })()}
                <h3 className="text-lg font-bold text-white mb-1.5">{bentoFeatures[4].title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{bentoFeatures[4].description}</p>
              </div>
            </motion.div>
          </div>

          {/* ── ROW 3: Mobile-First Platform (full-width) ── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <motion.div
              className="relative rounded-2xl overflow-hidden min-h-[300px] group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <img
                src={bentoFeatures[5].image!}
                alt={bentoFeatures[5].title}
                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${bentoFeatures[5].overlay}`} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {(() => { const Icon = bentoFeatures[5].icon; return (
                  <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                ); })()}
                <h3 className="text-lg font-bold text-white mb-1.5">{bentoFeatures[5].title}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{bentoFeatures[5].description}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ─────────────────────────────────────────────────── */}
      {/*
       * 4 photo cards:
       * 1. business-people-drinking-some-beverage.jpg         — Cafés & Restaurants
       * 2. transportation-map-planning-meeting-team.jpg       — Logistics & Teams
       * 3. woman-having-fun-with-vr-headset.jpg               — Tech & Innovation
       * 4. pc-keyboard-mouse-table.jpg                        — Corporate Offices
       */}
      <section className="py-24 bg-[#f7f7f4] overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <Badge className="mb-5 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-sm">
              Industries
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Built for your
              <br />
              <span className="text-[#636B2F]">kind of business.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              From single-chair barbers to enterprise campuses — Business Pro
              Hub adapts to how you work.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-default"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img
                  src={ind.image}
                  alt={ind.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                />
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${ind.tint}`}
                />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center mb-3">
                    <ind.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {ind.name}
                  </h3>
                  <p className="text-white/65 text-sm leading-snug">
                    {ind.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INNOVATION STRIP ───────────────────────────────────────────── */}
      {/*
       * Background: bulb-with-black-background.jpg — 7000×4000, dark with glowing bulb
       */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/media/bulb-with-black-background.jpg"
            alt="Innovation light bulb"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Lightbulb className="h-10 w-10 text-[#D4DE95] mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
              &ldquo;Great businesses don&apos;t make customers wait —
              <br />
              <span className="text-[#D4DE95]">they make every second count.&rdquo;</span>
            </h2>
            <p className="text-white/55 text-base leading-relaxed">
              Business Pro Hub was built on a single belief: your customers&apos;
              time is your most valuable currency. Every feature we build starts
              from that principle.
            </p>
          </div>
        </div>
      </section>

      {/* ── NIGHT WORK SPLIT ───────────────────────────────────────────── */}
      {/*
       * Image: open-laptop-with-glowing-screen-notepad-table-night.jpg
       * 5472×3648 — top-view night laptop, moody atmosphere
       */}
      <section className="bg-[#111217] py-24 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              className="relative order-last lg:order-first"
              initial={{ x: -40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute -inset-3 rounded-3xl bg-[#D4DE95]/5 blur-xl" />
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video">
                <img
                  src="/media/open-laptop-with-glowing-screen-notepad-table-night.jpg"
                  alt="Laptop glowing at night — manage from anywhere"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* Floating stat */}
              <div className="absolute -top-5 -right-5 bg-[#3D4127] rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[#D4DE95]" />
                <div>
                  <p className="text-white/60 text-xs">Wait time reduction</p>
                  <p className="text-white font-extrabold text-lg">− 40%</p>
                </div>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge className="mb-5 px-4 py-2 bg-white/8 text-[#D4DE95] border-[#D4DE95]/30 text-sm">
                Manage from Anywhere
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
                Your business,
                <br />
                <span className="text-[#D4DE95]">always in your hands.</span>
              </h2>
              <p className="text-white/55 text-lg leading-relaxed mb-8">
                Whether you&apos;re at your desk, on the floor, or across the
                city — Business Pro Hub gives you full visibility and control
                in real time.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  { icon: Smartphone,  text: "Native iOS & Android apps" },
                  { icon: TrendingUp,  text: "Live queue metrics & alerts" },
                  { icon: BellRing,    text: "Push notifications to staff & customers" },
                  { icon: Lock,        text: "Secure role-based access control" },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#D4DE95]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#D4DE95]" />
                    </div>
                    <span className="text-white/75 text-sm">{text}</span>
                  </li>
                ))}
              </ul>

              <Link href="/auth/v1/register">
                <Button className="bg-[#D4DE95] text-[#2a2e10] hover:bg-white h-12 px-8 font-semibold shadow-lg">
                  Try It Free Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section
        id="testimonials"
        className="py-24 bg-white scroll-mt-20 overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-14"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <Badge className="mb-5 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-sm">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Loved by business owners
              <br />
              <span className="text-[#636B2F]">worldwide.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Join thousands of businesses already transforming their customer experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="relative bg-[#f7f7f4] rounded-2xl p-8 flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {/* Quote mark */}
                <span className="absolute top-6 right-7 text-6xl text-[#D4DE95] font-serif leading-none select-none">
                  &ldquo;
                </span>

                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star
                      key={si}
                      className="h-4 w-4 text-[#636B2F] fill-[#636B2F]"
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-base leading-relaxed flex-1 italic mb-6">
                  {t.content}
                </p>

                <div className="flex items-center gap-3 pt-5 border-t border-gray-200">
                  <div className="h-11 w-11 rounded-full bg-[#3D4127] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Avatar strip */}
          <motion.div
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex -space-x-3">
              {["S", "M", "E", "J", "A"].map((letter, i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full bg-[#3D4127] border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-700 font-semibold">
                Join 10,000+ satisfied business owners
              </p>
              <p className="text-xs text-gray-400">
                Average rating 4.9/5 from verified customers
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-24 bg-[#f7f7f4] scroll-mt-20 overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55 }}
          >
            <Badge className="mb-5 px-4 py-2 bg-[#D4DE95]/40 text-[#3D4127] border-[#BAC095] text-sm">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-4">
              No hidden fees. No surprises. Upgrade or downgrade at any time.
            </p>
            {/* Promo */}
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-5 py-2 text-sm font-medium">
              <span>🎉</span>
              Use code{" "}
              <span className="font-bold bg-amber-100 px-2 py-0.5 rounded tracking-wide">
                WELCOME20
              </span>{" "}
              for 20% off
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {/* Free */}
            <motion.div
              className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-7 flex flex-col hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <div className="absolute -top-3 left-5">
                <span className="bg-gray-100 text-gray-500 border border-gray-200 text-xs font-semibold px-3 py-1 rounded-full">
                  Current
                </span>
              </div>
              <div className="mb-5 pt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Free</h3>
                <p className="text-gray-400 text-sm mb-4">Perfect for getting started</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">Rs. 0</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {["Up to 50 queue entries/month", "Basic queue management", "QR code generation", "Email support", "1 staff member", "Up to 100 customers"].map(
                  (f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Button disabled className="w-full h-10 bg-gray-100 text-gray-400 cursor-not-allowed text-sm font-semibold border border-gray-200">
                Current Plan
              </Button>
            </motion.div>

            {/* Starter — Most Popular */}
            <motion.div
              className="relative bg-[#3D4127] rounded-2xl border-2 border-[#3D4127] shadow-2xl p-7 flex flex-col lg:scale-105 ring-4 ring-[#D4DE95]/20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#D4DE95] text-[#2a2e10] text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  ★ MOST POPULAR
                </span>
              </div>
              <div className="mb-5 pt-3">
                <div className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-md px-2.5 py-1 text-xs font-semibold mb-3">
                  ⚠️ Don&apos;t lose this deal!
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Starter</h3>
                <p className="text-white/50 text-sm mb-4">For small businesses</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">Rs. 2,999</span>
                  <span className="text-white/50 text-sm">/month</span>
                </div>
                <p className="text-white/40 text-xs line-through mb-1">Rs. 4,999/month</p>
                <p className="text-[#D4DE95] text-xs font-semibold">💰 Save Rs. 24,000/year</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 text-white/80 rounded-lg px-3 py-2 text-xs font-medium mb-5">
                <span className="text-[#D4DE95]">●</span> +847 businesses chose this month
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {["Up to 500 queue entries/month", "Advanced queue management", "QR code generation", "Priority email support", "Basic analytics", "Up to 3 staff members"].map(
                  (f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <CheckCircle className="h-4 w-4 text-[#D4DE95] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Link href="/auth/v1/register">
                <Button className="w-full h-10 bg-[#D4DE95] text-[#2a2e10] hover:bg-white font-bold text-sm shadow-lg">
                  Upgrade Now
                </Button>
              </Link>
            </motion.div>

            {/* Professional */}
            <motion.div
              className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-7 flex flex-col hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.14 }}
            >
              <div className="mb-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Professional</h3>
                <p className="text-gray-400 text-sm mb-4">For growing businesses</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">Rs. 5,999</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-gray-400 text-xs line-through mb-1">Rs. 9,999/month</p>
                <p className="text-green-600 text-xs font-semibold">💰 Save Rs. 48,000/year</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {["Unlimited queue entries", "Advanced queue management", "QR code generation", "24/7 priority support", "Advanced analytics & reports", "Up to 10 staff members"].map(
                  (f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-[#3D4127] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  )
                )}
                <li className="text-xs text-gray-400 pl-6">+3 more features</li>
              </ul>
              <Link href="/auth/v1/register">
                <Button variant="outline" className="w-full h-10 border-2 border-gray-200 hover:border-[#3D4127] hover:text-[#3D4127] font-semibold text-sm">
                  Upgrade Now
                </Button>
              </Link>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-7 flex flex-col hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div className="mb-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Enterprise</h3>
                <p className="text-gray-400 text-sm mb-4">For large organizations</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">Rs. 14,999</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-gray-400 text-xs line-through mb-1">Rs. 24,999/month</p>
                <p className="text-green-600 text-xs font-semibold">💰 Save Rs. 120,000/year</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {["Everything in Professional", "Unlimited staff members", "Unlimited customers", "Dedicated account manager", "Custom integrations", "White-label solution"].map(
                  (f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-[#3D4127] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  )
                )}
                <li className="text-xs text-gray-400 pl-6">+3 more features</li>
              </ul>
              <Link href="/auth/v1/register">
                <Button variant="outline" className="w-full h-10 border-2 border-gray-200 hover:border-[#3D4127] hover:text-[#3D4127] font-semibold text-sm">
                  Upgrade Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA with IMAGE BACKGROUND ──────────────────────────────────── */}
      {/*
       * Background: laptop-computer-mouse-cup-coffee-cookies-black-background.jpg
       * 5472×3648 — dark moody laptop on black
       */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/media/laptop-computer-mouse-cup-coffee-cookies-black-background.jpg"
            alt="Laptop on dark background — get started"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/75" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3D4127]/20 via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-6 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-7 px-5 py-2 bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-[#D4DE95] inline" />
              Get Started in Minutes
            </Badge>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Ready to transform
              <br />
              <span className="text-[#D4DE95]">your business?</span>
            </h2>

            <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join 10,000+ businesses already optimising their operations with
              Business Pro Hub. Your first 14 days are completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/v1/register">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-bold bg-[#D4DE95] text-[#2a2e10] hover:bg-white shadow-2xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/v1/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-base font-semibold border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-white/40 text-sm">
              {["14-day free trial", "No credit card needed", "Setup in 5 minutes"].map(
                (t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-[#111217] border-t border-white/5 pt-12 pb-7">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-[#3D4127] flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white text-base">Business Pro Hub</span>
              </div>
              <p className="text-sm text-white/40 mb-3 leading-relaxed max-w-xs">
                The most advanced queue management platform trusted by thousands
                of businesses worldwide.
              </p>
              <p className="text-xs text-white/30 mb-1">
                A product by{" "}
                <a
                  href="https://elixasoftware.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 font-medium hover:text-[#D4DE95] transition-colors"
                >
                  Elixa Software Private Limited
                </a>
              </p>
              {/* Contact */}
              <div className="space-y-1.5 mb-5">
                <a
                  href="mailto:hello.elixa@gmail.com"
                  className="flex items-center gap-2 text-xs text-white/35 hover:text-[#D4DE95] transition-colors"
                >
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  hello.elixa@gmail.com
                </a>
                <a
                  href="tel:+923472681862"
                  className="flex items-center gap-2 text-xs text-white/35 hover:text-[#D4DE95] transition-colors"
                >
                  <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +92 347 268 1862
                </a>
              </div>
              {/* Social */}
              <div className="flex gap-2">
                {[
                  { href: "https://github.com/elixasoftware", title: "GitHub", d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
                  { href: "https://instagram.com/elixasoftware", title: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                  { href: "https://linkedin.com/company/elixasoftware", title: "LinkedIn", d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                  { href: "https://x.com/elixasoftware", title: "X / Twitter", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { href: "https://facebook.com/elixasoftware", title: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                ].map(({ href, title, d }) => (
                  <a
                    key={title}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={title}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-[#D4DE95]/20 text-white/35 hover:text-[#D4DE95] flex items-center justify-center transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white/60 font-semibold mb-4 text-xs uppercase tracking-widest">
                Product
              </h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Features",     href: "#features",      external: false },
                  { label: "Pricing",      href: "#pricing",       external: false },
                  { label: "Testimonials", href: "#testimonials",  external: false },
                  { label: "Demo",         href: null,             external: false },
                ].map(({ label, href }) => (
                  <li key={label}>
                    {label === "Demo" ? (
                      <button
                        onClick={() => setIsDemoOpen(true)}
                        className="text-white/40 hover:text-[#D4DE95] transition-colors"
                      >
                        Demo
                      </button>
                    ) : (
                      <a
                        href={href!}
                        className="text-white/40 hover:text-[#D4DE95] transition-colors"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white/60 font-semibold mb-4 text-xs uppercase tracking-widest">
                Company
              </h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "About Elixa", href: "https://elixasoftware.tech/about" },
                  { label: "Services",    href: "https://elixasoftware.tech/services" },
                  { label: "Contact",     href: "https://elixasoftware.tech/contact" },
                  { label: "Projects",    href: "https://elixasoftware.tech/projects" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-[#D4DE95] transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white/60 font-semibold mb-4 text-xs uppercase tracking-widest">
                Support
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="https://elixasoftware.tech/help" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4DE95] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="https://elixasoftware.tech/contact" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4DE95] transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/legal?tab=privacy" className="text-white/40 hover:text-[#D4DE95] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal?tab=terms" className="text-white/40 hover:text-[#D4DE95] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/25">
              &copy; 2026 Business Pro Hub. All rights reserved. &mdash; A product by{" "}
              <a
                href="https://elixasoftware.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4DE95] transition-colors"
              >
                Elixa Software Private Limited
              </a>
            </p>
            <div className="flex gap-6 text-xs text-white/25">
              <Link href="/legal?tab=privacy" className="hover:text-[#D4DE95] transition-colors">Privacy</Link>
              <Link href="/legal?tab=terms"   className="hover:text-[#D4DE95] transition-colors">Terms</Link>
              <Link href="/legal?tab=cookies" className="hover:text-[#D4DE95] transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── DEMO MODAL ─────────────────────────────────────────────────── */}
      {isDemoOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setIsDemoOpen(false)}
        >
          <motion.div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/UhjPdHN2jlA?autoplay=1&rel=0&modestbranding=1"
                title="Business Pro Hub Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
