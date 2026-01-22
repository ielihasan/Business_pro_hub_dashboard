"use client";

import { PrinterIcon } from "lucide-react";
import { Briefcase } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { APP_CONFIG } from "@/config/app-config";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="bg-white dark:bg-gray-900">
      {/* Header */}
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="
                !bg-black 
                !text-white 
                !shadow-[0_6px_6px_rgba(0,0,0,0.25)] 
                !px-5 !py-5
                !rounded-lg 
                !cursor-default 
                hover:!bg-black 
                focus:!bg-black 
                transition-none
              "
            >
              <a className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-white" />
                <span className="text-lg font-semibold tracking-wide">
                  {APP_CONFIG.name}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="pt-4">
        <NavMain items={sidebarItems} />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 pt-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
