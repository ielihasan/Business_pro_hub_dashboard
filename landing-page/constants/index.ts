import {
  people01,
  people02,
  people03,
  facebook,
  instagram,
  linkedin,
  twitter,
  airbnb,
  binance,
  coinbase,
  dropbox,
  send,
  shield,
  star,
} from "@/public/assets";

export const navLinks = [
  {
    id: "home",
    title: "Home",
  },
  {
    id: "features",
    title: "Features",
  },
  {
    id: "product",
    title: "Product",
  },
  {
    id: "clients",
    title: "Clients",
  },
];

export const features = [
  {
    id: "feature-1",
    icon: star,
    title: "Smart Queue Management",
    content:
      "Intelligently manage customer queues with AI-powered flow optimization, automated check-ins, and real-time status updates.",
  },
  {
    id: "feature-2",
    icon: shield,
    title: "Secure Operations",
    content:
      "Enterprise-grade security ensures safe data handling, protected customer information, and compliance with industry standards.",
  },
  {
    id: "feature-3",
    icon: send,
    title: "Quick Service",
    content:
      "Real-time notifications and automated workflows reduce wait times and improve customer satisfaction with efficient service delivery.",
  },
];

export const feedback = [
  {
    id: "feedback-1",
    content:
      "BusinessHub Pro has completely transformed how we manage customer flow. The AI-powered queue system reduced our wait times by 60%!",
    name: "Sarah Ahmed",
    title: "Retail Store Manager",
    img: people01,
  },
  {
    id: "feedback-2",
    content:
      "The real-time analytics dashboard is brilliant! We can now optimize staff allocation and improve customer satisfaction significantly.",
    name: "Ali Hassan",
    title: "Operations Director",
    img: people02,
  },
  {
    id: "feedback-3",
    content:
      "As a business owner, this platform helps us provide excellent customer service while managing high traffic efficiently. The ROI has been remarkable!",
    name: "Dr. Fatima Khan",
    title: "Clinic Owner",
    img: people03,
  },
];

export const stats = [
  {
    id: "stats-1",
    title: "Active Businesses",
    value: "3800+",
  },
  {
    id: "stats-2",
    title: "Locations",
    value: "230+",
  },
  {
    id: "stats-3",
    title: "Customers Served",
    value: "50K+",
  },
];

export const footerLinks = [
  {
    id: "footerLinks-1",
    title: "Useful Links",
    links: [
      {
        name: "Features",
        link: "https://www.businesshubpro.com/features/",
      },
      {
        name: "How it Works",
        link: "https://www.businesshubpro.com/how-it-works/",
      },
      {
        name: "Mobile App",
        link: "https://www.businesshubpro.com/mobile-app/",
      },
      {
        name: "Admin Dashboard",
        link: "https://www.businesshubpro.com/admin/",
      },
      {
        name: "Terms & Services",
        link: "https://www.businesshubpro.com/terms-and-services/",
      },
    ],
  },
  {
    id: "footerLinks-2",
    title: "Community",
    links: [
      {
        name: "Help Center",
        link: "https://www.businesshubpro.com/help-center/",
      },
      {
        name: "Business Partners",
        link: "https://www.businesshubpro.com/partners/",
      },
      {
        name: "Feedback",
        link: "https://www.businesshubpro.com/feedback/",
      },
      {
        name: "Blog",
        link: "https://www.businesshubpro.com/blog/",
      },
      {
        name: "Updates",
        link: "https://www.businesshubpro.com/updates/",
      },
    ],
  },
  {
    id: "footerLinks-3",
    title: "Partner",
    links: [
      {
        name: "Our Partners",
        link: "https://www.businesshubpro.com/our-partners/",
      },
      {
        name: "Become a Business Partner",
        link: "https://www.businesshubpro.com/become-a-partner/",
      },
    ],
  },
];

export const socialMedia = [
  {
    id: "social-media-1",
    icon: instagram,
    link: "https://www.instagram.com/",
  },
  {
    id: "social-media-2",
    icon: facebook,
    link: "https://www.facebook.com/",
  },
  {
    id: "social-media-3",
    icon: twitter,
    link: "https://www.twitter.com/",
  },
  {
    id: "social-media-4",
    icon: linkedin,
    link: "https://www.linkedin.com/",
  },
];

export const clients = [
  {
    id: "client-1",
    logo: airbnb,
  },
  {
    id: "client-2",
    logo: binance,
  },
  {
    id: "client-3",
    logo: coinbase,
  },
  {
    id: "client-4",
    logo: dropbox,
  },
];
