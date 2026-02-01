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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function CompanyPage() {
  const values = [
    {
      icon: Target,
      title: "Innovation",
      description: "We constantly push boundaries to deliver cutting-edge solutions that transform businesses.",
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Every decision we make is guided by what's best for our customers and their success.",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe in the power of teamwork and building strong relationships with our partners.",
    },
    {
      icon: Lightbulb,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from code quality to customer support.",
    },
  ];

  const team = [
    { name: "Leadership Team", count: "5+ members", description: "Experienced professionals driving our vision" },
    { name: "Engineering", count: "20+ engineers", description: "Building robust and scalable solutions" },
    { name: "Design", count: "8+ designers", description: "Creating beautiful and intuitive experiences" },
    { name: "Support", count: "15+ specialists", description: "Ensuring customer success 24/7" },
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
      regNo: "22021519-069",
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
    { title: "Senior Full Stack Developer", location: "Remote", type: "Full-time" },
    { title: "Product Designer", location: "Lahore, Pakistan", type: "Full-time" },
    { title: "Customer Success Manager", location: "Remote", type: "Full-time" },
    { title: "DevOps Engineer", location: "Karachi, Pakistan", type: "Full-time" },
  ];

  const pressReleases = [
    { title: "Elixa Software Launches BusinessHub Pro 2.0", date: "January 2026" },
    { title: "Company Raises Series A Funding", date: "November 2025" },
    { title: "BusinessHub Pro Reaches 10,000 Customers", date: "September 2025" },
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

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-gray-50 to-white">
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
              Elixa Software Private Limited is a leading software development company dedicated to creating
              innovative solutions that help businesses thrive in the digital age. BusinessHub Pro is our
              flagship product, designed to revolutionize how businesses manage their operations.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">2023</div>
                <p className="text-gray-600">Founded</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">50+</div>
                <p className="text-gray-600">Team Members</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">10,000+</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
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
                    <CardDescription className="text-base">{value.description}</CardDescription>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the talented people behind BusinessHub Pro
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {team.map((dept, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <div className="text-2xl font-bold text-gray-900">{dept.count}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet the Core Team</h2>
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
                    <p className="text-sm font-semibold text-gray-700 mb-3">Key Responsibilities:</p>
                    <ul className="space-y-2">
                      {member.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">From Our Blog</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Insights, tips, and updates from our team
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "10 Ways to Reduce Customer Wait Times", category: "Tips", date: "Jan 15, 2026" },
              { title: "The Future of Queue Management", category: "Industry", date: "Jan 10, 2026" },
              { title: "How to Boost Customer Satisfaction", category: "Guide", date: "Jan 5, 2026" },
            ].map((post, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">{post.category}</Badge>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Join Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're always looking for talented individuals to join our growing team
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{position.title}</h3>
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
                  <Button variant="outline" size="sm">Apply Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-gray-600 mb-4">Don't see a position that fits? We'd still love to hear from you!</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Press & Media</h2>
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

            <h3 className="text-xl font-semibold mb-4">Recent Press Releases</h3>
            <div className="space-y-4">
              {pressReleases.map((release, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{release.title}</h4>
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
            Have questions about our company or products? We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:contact@elixasoftware.com">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                <Mail className="h-4 w-4 mr-2" />
                contact@elixasoftware.com
              </Button>
            </a>
            <a href="https://elixasoftware.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-gray-900 transition-colors">
                <Globe className="h-4 w-4 mr-2" />
                elixasoftware.com
              </Button>
            </a>
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
