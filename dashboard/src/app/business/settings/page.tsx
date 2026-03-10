"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building2, Mail, Phone, MapPin, Camera, Upload, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessData, setBusinessData] = useState({
    business_name: "",
    business_type: "",
    business_address: "",
    business_phone: "",
    business_description: "",
    email: "",
  });
  const [currentPlanName, setCurrentPlanName] = useState<string>("—");

  // Map plan IDs returned by the pricing API to display names
  const PLAN_NAMES: Record<string, string> = {
    starter:      "Starter",
    professional: "Professional",
    enterprise:   "Enterprise",
  };

  const fetchBusinessData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${window.location.origin}/API/settings/profile`, {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to load profile");

      const json = await res.json();
      const data = json.data;

      setBusinessData({
        business_name: data.business_name || "",
        business_type: data.business_type || "",
        business_address: data.business_address || "",
        business_phone: data.business_phone || "",
        business_description: data.business_description || "",
        email: data.email || "",
      });
      setAvatarUrl(data.avatar_url ?? null);

      // Fetch current subscription plan from pricing API
      try {
        const pricingRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/pricing?business_id=${session.user.id}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (pricingRes.ok) {
          const pricingJson = await pricingRes.json();
          const planId: string = pricingJson?.data?.current_plan ?? "";
          setCurrentPlanName(PLAN_NAMES[planId.toLowerCase()] ?? planId ?? "Free");
        }
      } catch {
        // Pricing fetch failed — keep default "—"
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
      toast.error("Failed to load business settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${window.location.origin}/API/settings/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          business_name: businessData.business_name,
          business_address: businessData.business_address,
          business_phone: businessData.business_phone,
          business_description: businessData.business_description,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update settings");
      }

      toast.success("Business settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  // --- Avatar helpers ---

  const saveAvatarUrl = async (url: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const res = await fetch(`${window.location.origin}/API/settings/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ avatar_url: url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to save avatar URL");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target) return;
    // Reset so the same file can be re-selected
    (e.target as HTMLInputElement).value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WebP or GIF images are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2 MB");
      return;
    }

    try {
      setAvatarUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      // Delete old avatar file if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/object/public/avatars/")[1];
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Save to DB
      await saveAvatarUrl(publicUrl);
      setAvatarUrl(publicUrl);
      window.dispatchEvent(
        new CustomEvent("business-avatar-updated", { detail: { avatar_url: publicUrl } })
      );
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!avatarUrl) return;
    try {
      setAvatarUploading(true);
      const oldPath = avatarUrl.split("/object/public/avatars/")[1];
      if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      await saveAvatarUrl(null);
      setAvatarUrl(null);
      window.dispatchEvent(
        new CustomEvent("business-avatar-updated", { detail: { avatar_url: null } })
      );
      toast.success("Profile photo removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <Skeleton className="h-6 w-40" />
          {/* Avatar skeleton */}
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                <Skeleton className="h-4 w-56" />
              </div>
            ))}
          </div>
        </div>
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

          {/* Profile Photo */}
          <div className="flex items-center gap-5">
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Business profile photo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white text-2xl font-semibold select-none">
                  {businessData.business_name?.charAt(0)?.toUpperCase() || "B"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Upload photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info + buttons */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-900">Profile Photo</p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP or GIF · Max 2 MB</p>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {avatarUploading ? "Uploading…" : "Upload Photo"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
            />
          </div>

          <Separator />

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
            <span className="text-sm font-medium">{currentPlanName}</span>
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
