"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Construction } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage platform users and customer accounts
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-center max-w-md">
            User management features will be available in the next phase of development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
