"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  ArrowLeft,
  Users,
  Target,
  Heart,
  Lightbulb,
  Building2,
  Globe,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Download,
  ExternalLink,
  Code2,
  Smartphone,
  LayoutDashboard,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CompanyPage() {
  const values = [
    {
      icon: Target,
      title: "Innovation",
      description:
        "We constantly push boundaries to deliver cutting-edge solutions that transform businesses.",
    },
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Every decision we make is guided by what's best for our customers and their success.",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "We believe in the power of teamwork and building strong relationships with our partners.",
    },
    {
      icon: Lightbulb,
      title: "Excellence",
      description:
        "We strive for excellence in everything we do, from code quality to customer support.",
    },
  ];

  const team = [
    {
      name: "Leadership Team",
      count: "5+ members",
      description: "Experienced professionals driving our vision",
    },
    {
      name: "Engineering",
      count: "20+ engineers",
      description: "Building robust and scalable solutions",
    },
    {
      name: "Design",
      count: "8+ designers",
      description: "Creating beautiful and intuitive experiences",
    },
    {
      name: "Support",
      count: "15+ specialists",
      description: "Ensuring customer success 24/7",
    },
  ];

  const coreTeam = [
    {
      name: "Ali Hassan",
      role: "Backend & Business Logic Lead",
      regNo: "22021519-076",
      icon: Code2,
      responsibilities: [
        "Database schema design and management (Supabase/PostgreSQL)",
        "API development and integration (Next.js API routes)",
        "Authentication and authorization implementation",
        "Real-time features (Supabase Realtime)",
        "Payment integration (Stripe/local providers)",
        "Email service integration (Resend)",
        "Server-side business logic",
        "Data security and encryption",
        "Performance optimization (queries, caching)",
        "Deployment and DevOps setup",
      ],
    },
    {
      name: "Meera Shahzadi",
      role: "Mobile Development & UX Lead",
      regNo: "22021519-060",
      icon: Smartphone,
      responsibilities: [
        "React Native / Expo mobile app development",
        "Customer-facing mobile features",
        "Push notifications implementation",
        "Mobile UI/UX design and prototyping",
        "QR code scanning functionality",
        "Offline capability and sync",
        "App Store / Play Store deployment",
        "Mobile-specific performance optimization",
        "Cross-platform testing",
        "User experience research and testing",
      ],
    },
    {
      name: "Rimsha Naeem",
      role: "Web Frontend & Analytics Lead",
      regNo: "22021519-066",
      icon: LayoutDashboard,
      responsibilities: [
        "Next.js frontend development",
        "Dashboard UI components (shadcn/ui)",
        "Data visualization and charts (Recharts)",
        "Responsive design implementation",
        "State management (React hooks, context)",
        "Form handling and validation",
        "Landing page and marketing pages",
        "Analytics dashboard development",
        "Frontend performance optimization",
        "Accessibility compliance (WCAG)",
      ],
    },
  ];

  const openPositions = [
    {
      title: "Senior Full Stack Developer",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      location: "Lahore, Pakistan",
      type: "Full-time",
    },
    {
      title: "Customer Success Manager",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "DevOps Engineer",
      location: "Karachi, Pakistan",
      type: "Full-time",
    },
  ];

  const pressReleases = [
    {
      title: "Elixa Software Launches BusinessHub Pro 2.0",
      date: "January 2026",
    },
    { title: "Company Raises Series A Funding", date: "November 2025" },
    {
      title: "BusinessHub Pro Reaches 10,000 Customers",
      date: "September 2025",
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
              <span className="text-xl font-bold text-gray-900">
                Business Pro Hub
              </span>
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

      {/* About Section */}
      <section
        id="about"
        className="py-20 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gray-100 text-gray-700">
              <Building2 className="w-4 h-4 mr-2 inline" />
              About Us
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Elixa Software
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Elixa Software Private Limited is a leading software development
              company dedicated to creating innovative solutions that help
              businesses thrive in the digital age. BusinessHub Pro is our
              flagship product, designed to revolutionize how businesses manage
              their operations.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  2023
                </div>
                <p className="text-gray-600">Founded</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">50+</div>
                <p className="text-gray-600">Team Members</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  10,000+
                </div>
                <p className="text-gray-600">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-7 w-7 text-gray-900" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the talented people behind BusinessHub Pro
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {team.map((dept, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <div className="text-2xl font-bold text-gray-900">
                    {dept.count}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{dept.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 px-4 py-2 bg-gray-900 text-white">
              <Users className="w-4 h-4 mr-2 inline" />
              Project Team
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet the Core Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The talented individuals driving BusinessHub Pro development
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {coreTeam.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow border-2 hover:border-gray-900">
                  <CardHeader className="text-center pb-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <member.icon className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <CardDescription className="text-base font-medium text-gray-700">
                      {member.role}
                    </CardDescription>
                    <Badge variant="outline" className="mt-2 w-fit mx-auto">
                      Reg# {member.regNo}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Key Responsibilities:
                    </p>
                    <ul className="space-y-2">
                      {member.responsibilities.map((resp, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section id="blog" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              From Our Blog
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Insights, tips, and updates from our team
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "10 Ways to Reduce Customer Wait Times",
                category: "Tips",
                date: "Jan 15, 2026",
              },
              {
                title: "The Future of Queue Management",
                category: "Industry",
                date: "Jan 10, 2026",
              },
              {
                title: "How to Boost Customer Satisfaction",
                category: "Guide",
                date: "Jan 5, 2026",
              },
            ].map((post, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <Badge variant="outline" className="w-fit">
                    {post.category}
                  </Badge>
                  <CardTitle className="text-lg mt-2">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{post.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline">
              View All Posts
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're always looking for talented individuals to join our growing
              team
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {position.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-gray-600 mb-4">
              Don't see a position that fits? We'd still love to hear from you!
            </p>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Send Your Resume
            </Button>
          </div>
        </div>
      </section>

      {/* Press Kit Section */}
      <section id="press" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Press & Media
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Download our press kit and stay updated with our latest news
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Press Kit</CardTitle>
                <CardDescription>
                  Download our brand assets, logos, and company information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Press Kit (ZIP)
                </Button>
              </CardContent>
            </Card>

            <h3 className="text-xl font-semibold mb-4">
              Recent Press Releases
            </h3>
            <div className="space-y-4">
              {pressReleases.map((release, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {release.title}
                        </h4>
                        <p className="text-sm text-gray-500">{release.date}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Get In Touch</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Have questions about our company or products? We'd love to hear from
            you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:hello.elixa@gmail.com">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                hello.elixa@gmail.com
              </Button>
            </a>
            <a
              href="https://elixasoftware.tech"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
              >
                <Globe className="h-4 w-4 mr-2" />
                elixasoftware.tech
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-50 border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Business Pro Hub</p>
              <p className="text-xs text-gray-400 mb-2">A product by <a href="https://elixasoftware.tech" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-500 hover:text-gray-700">Elixa Software Private Limited</a></p>
              <div className="flex flex-col gap-1">
                <a href="mailto:hello.elixa@gmail.com" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">✉ hello.elixa@gmail.com</a>
                <a href="tel:+923472681862" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">📞 +92 347 268 1862</a>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex gap-2">
                {[
                  { href: "https://github.com/elixasoftware", label: "GitHub", path: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
                  { href: "https://instagram.com/elixasoftware", label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                  { href: "https://linkedin.com/company/elixasoftware", label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                  { href: "https://x.com/elixasoftware", label: "X / Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { href: "https://facebook.com/elixasoftware", label: "Facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                     className="h-8 w-8 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors shadow-sm">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d={s.path}/></svg>
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-400">© 2026 Business Pro Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
