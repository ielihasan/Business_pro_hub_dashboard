"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Lock,
  Bell,
  Settings,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Building2,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { getErrorMessage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

interface SystemSettings {
  auto_approve_businesses: boolean;
  require_email_verification: boolean;
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  default_subscription_plan: string;
  notification_email: string;
  support_email: string;
  max_businesses_per_plan: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  auto_approve_businesses: false,
  require_email_verification: true,
  maintenance_mode: false,
  allow_new_registrations: true,
  default_subscription_plan: "free",
  notification_email: "",
  support_email: "",
  max_businesses_per_plan: {
    free: 1,
    starter: 3,
    professional: 10,
    enterprise: -1,
  },
};

export default function AdminSettingsPage() {
  // Profile state
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [systemLoading, setSystemLoading] = useState(true);
  const [systemSaving, setSystemSaving] = useState(false);

  // Confirmation dialogs
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);

  // Get auth token
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
    fetchSystemSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const token = await getAuthToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Use Next.js API route directly — works without Spring Boot and returns avatar_url
      const res = await fetch(`${window.location.origin}/API/settings/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      setProfile(data.data);
      setProfileForm({
        full_name: data.data.full_name || "",
        email: data.data.email || "",
      });
      setAvatarUrl(data.data.avatar_url || null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to fetch profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      setSystemLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/system`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data) {
        setSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...data.data });
      }
    } catch (error: unknown) {
      console.warn("Settings API unavailable, backend may be offline");
    } finally {
      setSystemLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      const token = await getAuthToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Use Next.js API route directly — works without Spring Boot
      const res = await fetch(`${window.location.origin}/API/settings/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      setProfile(data.data);
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // --- Avatar helpers ---

  const saveAvatarUrl = async (url: string | null) => {
    const token = await getAuthToken();
    if (!token) throw new Error("Not authenticated");
    // Use the Next.js API route directly (service-role key, bypasses Spring Boot)
    const res = await fetch(`${window.location.origin}/API/settings/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      window.dispatchEvent(new CustomEvent("admin-avatar-updated", { detail: { avatar_url: publicUrl } }));
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!avatarUrl) return;
    try {
      setAvatarUploading(true);
      // Delete from storage
      const oldPath = avatarUrl.split("/object/public/avatars/")[1];
      if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      // Clear in DB
      await saveAvatarUrl(null);
      setAvatarUrl(null);
      window.dispatchEvent(new CustomEvent("admin-avatar-updated", { detail: { avatar_url: null } }));
      toast.success("Profile photo removed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Failed to remove photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  // --- Password ---

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordForm.current_password) {
      toast.error("Current password is required");
      return;
    }
    if (!passwordForm.new_password) {
      toast.error("New password is required");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setPasswordSaving(true);
      const token = await getAuthToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      // Clear password form
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      toast.success("Password changed successfully");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSystemSettingsSave = async () => {
    try {
      setSystemSaving(true);
      const token = await getAuthToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/system`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(systemSettings),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      toast.success("System settings updated successfully");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to update system settings");
    } finally {
      setSystemSaving(false);
    }
  };

  const toggleMaintenanceMode = (checked: boolean) => {
    if (checked) {
      setMaintenanceDialogOpen(true);
    } else {
      setSystemSettings({ ...systemSettings, maintenance_mode: false });
    }
  };

  const toggleRegistrations = (checked: boolean) => {
    if (!checked) {
      setRegistrationDialogOpen(true);
    } else {
      setSystemSettings({ ...systemSettings, allow_new_registrations: true });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and platform settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-black" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="space-y-4">
                  {/* Avatar skeleton */}
                  <div className="flex items-center gap-5">
                    <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-8 w-28" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Account Info Banner */}
                  {profile && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {profile.role}
                        </Badge>
                        {profile.is_approved ? (
                          <Badge className="bg-gray-100 text-gray-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-600">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Account created: {formatDate(profile.created_at)}
                      </p>
                      {profile.updated_at && (
                        <p className="text-sm text-gray-500">
                          Last updated: {formatDate(profile.updated_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Avatar Section */}
                  <div className="flex items-center gap-5">
                    {/* Avatar preview */}
                    <div className="relative flex-shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile photo"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white text-2xl font-semibold select-none">
                          {profileForm.full_name?.charAt(0)?.toUpperCase() || "A"}
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

                  {/* Profile Form */}
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        placeholder="Enter your full name"
                        value={profileForm.full_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, full_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, email: e.target.value })
                        }
                      />
                      <p className="text-sm text-gray-500">
                        Changing your email will require re-verification
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleProfileSave} disabled={profileSaving}>
                      {profileSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-black" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          current_password: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          new_password: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Password must be at least 6 characters
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirm_password: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePasswordChange} disabled={passwordSaving}>
                  {passwordSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-black" />
                Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  Use a strong password with a mix of letters, numbers, and symbols
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  Never share your password with anyone
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  Change your password regularly (every 90 days recommended)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  Don't use the same password across multiple accounts
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-black" />
                Business Settings
              </CardTitle>
              <CardDescription>
                Configure how businesses interact with the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                      <Skeleton className="h-6 w-10 rounded-full" />
                    </div>
                  ))}
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-approve Businesses</Label>
                      <p className="text-sm text-gray-500">
                        Automatically approve new business registrations
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.auto_approve_businesses}
                      onCheckedChange={(checked) =>
                        setSystemSettings({
                          ...systemSettings,
                          auto_approve_businesses: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-gray-500">
                        Users must verify their email before accessing features
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.require_email_verification}
                      onCheckedChange={(checked) =>
                        setSystemSettings({
                          ...systemSettings,
                          require_email_verification: checked,
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label>Default Subscription Plan</Label>
                    <Select
                      value={systemSettings.default_subscription_plan}
                      onValueChange={(value) =>
                        setSystemSettings({
                          ...systemSettings,
                          default_subscription_plan: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Default plan assigned to new businesses
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Plan Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-black" />
                Plan Limits
              </CardTitle>
              <CardDescription>
                Set maximum businesses allowed per subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Free Plan</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={systemSettings.max_businesses_per_plan.free}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          max_businesses_per_plan: {
                            ...systemSettings.max_businesses_per_plan,
                            free: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">-1 = unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Starter Plan</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={systemSettings.max_businesses_per_plan.starter}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          max_businesses_per_plan: {
                            ...systemSettings.max_businesses_per_plan,
                            starter: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">-1 = unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Professional Plan</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={systemSettings.max_businesses_per_plan.professional}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          max_businesses_per_plan: {
                            ...systemSettings.max_businesses_per_plan,
                            professional: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">-1 = unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Enterprise Plan</Label>
                    <Input
                      type="number"
                      min="-1"
                      value={systemSettings.max_businesses_per_plan.enterprise}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          max_businesses_per_plan: {
                            ...systemSettings.max_businesses_per_plan,
                            enterprise: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">-1 = unlimited</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-black" />
                Contact Settings
              </CardTitle>
              <CardDescription>
                Configure notification and support email addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="notification_email">Notification Email</Label>
                    <Input
                      id="notification_email"
                      type="email"
                      placeholder="notifications@example.com"
                      value={systemSettings.notification_email}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          notification_email: e.target.value,
                        })
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Receive system notifications at this email
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      placeholder="support@example.com"
                      value={systemSettings.support_email}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          support_email: e.target.value,
                        })
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Displayed to users for support inquiries
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                These settings can significantly affect platform operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-6 w-10 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">
                        Temporarily disable access for all non-admin users
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenance_mode}
                      onCheckedChange={toggleMaintenanceMode}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-0.5">
                      <Label>Allow New Registrations</Label>
                      <p className="text-sm text-gray-500">
                        Enable or disable new user registrations
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.allow_new_registrations}
                      onCheckedChange={toggleRegistrations}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save System Settings Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSystemSettingsSave}
              disabled={systemSaving || systemLoading}
              size="lg"
            >
              {systemSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save System Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Maintenance Mode Confirmation Dialog */}
      <AlertDialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              Enable Maintenance Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will temporarily disable access to the platform for all non-admin users.
              Users will see a maintenance page until you disable this mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-black hover:bg-gray-800"
              onClick={() => {
                setSystemSettings({ ...systemSettings, maintenance_mode: true });
                setMaintenanceDialogOpen(false);
              }}
            >
              Enable Maintenance Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable Registrations Confirmation Dialog */}
      <AlertDialog open={registrationDialogOpen} onOpenChange={setRegistrationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              Disable New Registrations?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent any new users from registering on the platform.
              Existing users will still be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-black hover:bg-gray-800"
              onClick={() => {
                setSystemSettings({ ...systemSettings, allow_new_registrations: false });
                setRegistrationDialogOpen(false);
              }}
            >
              Disable Registrations
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
