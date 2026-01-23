"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessData, setBusinessData] = useState({
    business_name: "",
    business_type: "",
    business_address: "",
    business_phone: "",
    business_description: "",
    email: "",
  });

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setBusinessData({
        business_name: data.business_name || "",
        business_type: data.business_type || "",
        business_address: data.business_address || "",
        business_phone: data.business_phone || "",
        business_description: data.business_description || "",
        email: data.email || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business data:", error);
      toast.error("Failed to load business settings");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("admins")
        .update({
          business_name: businessData.business_name,
          business_address: businessData.business_address,
          business_phone: businessData.business_phone,
          business_description: businessData.business_description,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Business settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="mt-2 text-gray-600">Manage your business profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="business_name"
                className="pl-10"
                value={businessData.business_name}
                onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type</Label>
            <Input
              id="business_type"
              value={businessData.business_type}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Contact admin to change business type</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="business_phone"
                className="pl-10"
                value={businessData.business_phone}
                onChange={(e) => setBusinessData({ ...businessData, business_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="business_address"
                className="pl-10"
                value={businessData.business_address}
                onChange={(e) => setBusinessData({ ...businessData, business_address: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                className="pl-10 bg-gray-50"
                value={businessData.email}
                disabled
              />
            </div>
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_description">Business Description</Label>
            <Textarea
              id="business_description"
              value={businessData.business_description}
              onChange={(e) => setBusinessData({ ...businessData, business_description: e.target.value })}
              placeholder="Tell customers about your business..."
              className="h-24"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={fetchBusinessData}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View your account status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Account Status</span>
            <span className="text-sm font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Subscription Plan</span>
            <span className="text-sm font-medium">Free</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Business Type</span>
            <span className="text-sm font-medium">{businessData.business_type}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
