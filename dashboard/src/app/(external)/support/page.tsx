"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  ArrowLeft,
  Search,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  BookOpen,
  FileQuestion,
  Settings,
  CreditCard,
  Users,
  Shield,
  ChevronRight,
  Send,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const helpCategories = [
    { icon: BookOpen, title: "Getting Started", description: "Learn the basics of BusinessHub Pro", articles: 12 },
    { icon: Settings, title: "Account Settings", description: "Manage your account and preferences", articles: 8 },
    { icon: CreditCard, title: "Billing & Plans", description: "Subscription and payment help", articles: 15 },
    { icon: Users, title: "Queue Management", description: "Master your queue operations", articles: 20 },
    { icon: Shield, title: "Security & Privacy", description: "Keep your data safe", articles: 10 },
    { icon: FileQuestion, title: "Troubleshooting", description: "Solve common issues", articles: 25 },
  ];

  const faqs = [
    {
      question: "How do I get started with BusinessHub Pro?",
      answer: "Getting started is easy! Simply sign up for a free account, complete your business profile, and you can start managing your queue immediately. Our onboarding wizard will guide you through the setup process.",
    },
    {
      question: "Can I upgrade or downgrade my plan at any time?",
      answer: "Yes, you can change your plan at any time from your account settings. When upgrading, you'll have immediate access to new features. When downgrading, changes take effect at the start of your next billing cycle.",
    },
    {
      question: "How does the queue management system work?",
      answer: "Our queue management system allows customers to join your queue via QR code, web link, or in-person registration. You can track wait times, serve customers in order, and send notifications when it's their turn.",
    },
    {
      question: "Is my data secure with BusinessHub Pro?",
      answer: "Absolutely. We use bank-level encryption (AES-256) for all data, both in transit and at rest. We're SOC 2 compliant and regularly undergo security audits to ensure your data is protected.",
    },
    {
      question: "Can I integrate BusinessHub Pro with other tools?",
      answer: "Yes! Our Professional and Enterprise plans include API access for custom integrations. We also offer pre-built integrations with popular tools like Slack, Google Calendar, and more.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, JazzCash, EasyPaisa, and bank transfers. Enterprise customers can also request invoice-based billing.",
    },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success("Message sent successfully! We'll get back to you soon.");
    setContactForm({ name: "", email: "", subject: "", message: "" });
    setSubmitting(false);
  };

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
            <HelpCircle className="w-4 h-4 mr-2 inline" />
            Support Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How Can We Help You?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Find answers, get support, and make the most of BusinessHub Pro
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles..."
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section id="help-center" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Help Center</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our knowledge base to find answers quickly
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                      <category.icon className="h-6 w-6 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <CardTitle className="mt-4">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{category.articles} articles</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Quick answers to common questions
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="bg-white rounded-lg border px-6">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Can't find what you're looking for? Reach out to our support team
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your question..."
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email Support</h3>
                    <p className="text-gray-600">support@businessprohub.com</p>
                    <p className="text-sm text-gray-500">We reply within 24 hours</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Chat</h3>
                    <p className="text-gray-600">Available Mon-Fri, 9am-6pm PKT</p>
                    <p className="text-sm text-gray-500">Average response: 5 minutes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone Support</h3>
                    <p className="text-gray-600">+92 (42) 1234-5678</p>
                    <p className="text-sm text-gray-500">Enterprise customers only</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 text-white">
                <CardContent className="py-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5" />
                    <h3 className="font-semibold">Support Hours</h3>
                  </div>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM PKT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 2:00 PM PKT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
