"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-2 text-gray-600">Manage your team members</p>
        </div>
        <Button>Add Staff Member</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>View and manage your staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <UserCog className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No staff members yet</p>
            <p className="text-sm mt-2">Add team members to help manage your business</p>
            <Button variant="outline" className="mt-4">Add Your First Staff Member</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
