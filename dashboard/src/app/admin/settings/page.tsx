"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Construction } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure platform-wide settings and preferences
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-center max-w-md">
            Platform settings and configuration options will be available in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
