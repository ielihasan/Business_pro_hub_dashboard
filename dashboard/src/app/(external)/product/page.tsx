"use client";

import { useState } from "react";
import Link from "next/link";
import { ElixaFooter } from "@/components/elixa-footer";
import { motion } from "framer-motion";
import {
  Store,
  Clock,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  BellRing,
  ArrowLeft,
  CheckCircle,
  Play,
  Zap,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_VIDEO_ID = "UhjPdHN2jlA";

export default function ProductPage() {
  const [showVideo, setShowVideo] = useState(false);
  const features = [
    {
      icon: Clock,
      title: "Smart Queue System",
      description: "Advanced AI-powered queue management that predicts wait times and optimizes customer flow automatically.",
    },
    {
      icon: Users,
      title: "Customer Intelligence",
      description: "Deep customer insights with behavior analytics, preferences tracking, and personalized engagement tools.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards with actionable insights, trends analysis, and performance forecasting.",
    },
    {
      icon: BellRing,
      title: "Smart Notifications",
      description: "Multi-channel alerts via SMS, email, and push notifications with customizable templates.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, SOC 2 compliance, and comprehensive data protection protocols.",
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Fully responsive design with native mobile apps for iOS and Android platforms.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Coffee Shop Owner",
      content: "Business Pro Hub transformed how we manage our morning rush. Queue times are down 40%!",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Print Shop Manager",
      content: "The analytics helped us optimize staffing and increase customer satisfaction dramatically.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Clinic Administrator",
      content: "Patient wait times reduced significantly. Our staff loves how easy it is to use!",
      rating: 5,
    },
  ];

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
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 text-center">
          <Badge className="mb-6 px-4 py-2 bg-gray-100 text-gray-700">
            <Zap className="w-4 h-4 mr-2 inline" />
            Product Overview
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to<br />Manage Your Business
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            BusinessHub Pro is a comprehensive platform designed to streamline your operations,
            delight your customers, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/v1/register">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => setShowVideo(true)}>
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your business efficiently
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your business needs
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: "Free", price: "Rs. 0", features: ["50 queue entries/month", "1 staff member", "Email support"] },
              { name: "Starter", price: "Rs. 2,999", features: ["500 queue entries/month", "3 staff members", "Basic analytics"], popular: true },
              { name: "Professional", price: "Rs. 5,999", features: ["Unlimited entries", "10 staff members", "Advanced analytics"] },
              { name: "Enterprise", price: "Rs. 14,999", features: ["Everything unlimited", "Dedicated support", "Custom integrations"] },
            ].map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? "border-2 border-gray-900 shadow-xl" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className={plan.popular ? "pt-8" : ""}>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/v1/register">
                    <Button className={`w-full mt-6 ${plan.popular ? "bg-gray-900" : ""}`} variant={plan.popular ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trusted by thousands of businesses worldwide
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-white to-gray-50">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">See It In Action</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Watch our product demo to see how BusinessHub Pro can transform your business operations.
          </p>
          <div
            className="max-w-4xl mx-auto bg-gray-800 rounded-2xl aspect-video flex items-center justify-center cursor-pointer group"
            onClick={() => setShowVideo(true)}
          >
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mx-auto mb-4 transition-colors">
                <Play className="h-10 w-10 text-white ml-1" />
              </div>
              <p className="text-gray-400">Click to play demo video</p>
            </div>
          </div>
        </div>
      </section>

      <ElixaFooter />

      {/* Video Modal */}
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1`}
              title="Business Pro Hub Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
