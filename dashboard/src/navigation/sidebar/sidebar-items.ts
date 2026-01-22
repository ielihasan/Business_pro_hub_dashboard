//import Home from "@/app/(external)/page";
import {
  ShoppingBag,
  Forklift,
  Mail,
  MessageSquare,
  Calendar,
  Kanban,
  Activity,
  ClipboardList,
  ReceiptText,
  Users,
  MessageCircle,
  Lock,
  Fingerprint,
  SquareArrowUpRight,
  LayoutDashboard,
  ChartBar,
  User,
  Printer,
  Banknote,
  Home,
  Gauge,
  GraduationCap,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: any;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: any;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// Sidebar items for admin dashboard
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    // Main admin section
    // label: "Dashboards", // Uncomment if you want a group label
    items: [
      {
        title: "Home",
        url: "/dashboard/default",
        icon: Home,
      },
      {
        title: "User Management",
        url: "/dashboard/crm",
        icon: Users,
      },
      {
        title: "Business Management",
        url: "/dashboard/Business Managment",
        icon: ClipboardList,
      },
      {
        title: "Finance Management",
        url: "/dashboard/finance",
        icon: Banknote,
      },
      {
  title: "Analytics",
  url: "/dashboard/analytics",
  icon: ChartBar, // lucide-react se ChartBar icon
},


      /*
      {
        title: "Chat",
        url: "/main/dashboard/chat", // ✅ Correct route to your chat page
        icon: MessageSquare,
        // comingSoon: true, // Uncomment if you want to hide temporarily
      },
      */
    ],
  },
  {
    id: 2,
    label: "Support",
    // Niche group for auxiliary items like Feedback
    items: [
      {
        title: "Feedback",
        url: "/main/dashboard/MessageCircle", // ✅ Route to Feedback page
        icon: MessageCircle,
        // comingSoon: true, // Uncomment if needed
      },
    ],
  },
  /*
  {
    id: 2,
    label: "Pages",
    items: [
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", newTab: true },
          { title: "Login v2", url: "/auth/v2/login", newTab: true },
          { title: "Register v1", url: "/auth/v1/register", newTab: true },
          { title: "Register v2", url: "/auth/v2/register", newTab: true },
        ],
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar,
        comingSoon: true,
      },
      {
        title: "Kanban",
        url: "/kanban",
        icon: Kanban,
        comingSoon: true,
      },
    ],
  },
  */
  /*
  {
    id: 3,
    label: "Misc",
    items: [
      {
        title: "Others",
        url: "/others",
        icon: SquareArrowUpRight,
        comingSoon: true,
      },
    ],
  },
  */
];
