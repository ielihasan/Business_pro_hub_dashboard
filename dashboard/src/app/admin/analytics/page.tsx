"use client";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Construction } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="mt-2 text-gray-600">
          View comprehensive analytics and insights about platform performance
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-center max-w-md">
            Analytics dashboard with charts and insights will be available in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
