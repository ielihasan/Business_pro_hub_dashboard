"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="mt-2 text-gray-600">Manage the services you offer</p>
        </div>
        <Button>Add Service</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Services</CardTitle>
          <CardDescription>Services offered to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Store className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No services configured</p>
            <p className="text-sm mt-2">Add the services you offer to your customers</p>
            <Button variant="outline" className="mt-4">Add Your First Service</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
