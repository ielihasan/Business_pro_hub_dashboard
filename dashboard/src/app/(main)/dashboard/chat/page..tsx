"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";

export default function FinanceLayout({ children }: { children?: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <AppSidebar className="flex-shrink-0" />

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          {/* Sidebar Toggle Button */}
          <SidebarTrigger asChild>
            <Button variant="outline" size="sm">
              Toggle Sidebar
            </Button>
          </SidebarTrigger>

          <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-100">
            Page Not Found
          </h1>

          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
