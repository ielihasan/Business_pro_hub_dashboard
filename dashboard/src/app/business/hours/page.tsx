"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  Save,
  Loader2,
  RefreshCw,
  Coffee,
  Sun,
  Moon,
  Trash2,
  CalendarOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { resolveBusinessId } from "@/lib/resolve-business-id";
import { getErrorMessage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DayHours {
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  break_start: string;
  break_end: string;
}

interface SpecialHour {
  id?: string;
  date: string;
  is_closed: boolean;
  open_time: string;
  close_time: string;
  reason: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30", "00:00",
];

// Default business hours
const getDefaultHours = (): DayHours[] => {
  return DAYS_OF_WEEK.map((day) => ({
    day_of_week: day.value,
    day_name: day.label,
    is_open: day.value >= 1 && day.value <= 6, // Mon-Sat open by default
    open_time: "09:00",
    close_time: "18:00",
    break_start: "",
    break_end: "",
  }));
};

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<DayHours[]>(getDefaultHours());
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Special hours dialog
  const [isSpecialDialogOpen, setIsSpecialDialogOpen] = useState(false);
  const [newSpecialHour, setNewSpecialHour] = useState<SpecialHour>({
    date: "",
    is_closed: true,
    open_time: "09:00",
    close_time: "18:00",
    reason: "",
  });

  useEffect(() => {
    getBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchBusinessHours();
    }
  }, [businessId]);

  const getBusinessId = async () => {
    try {
      const id = await resolveBusinessId();
      if (id) {
        setBusinessId(id);
      } else {
        setUseMockData(true);
        setLoading(false);
      }
    } catch {
      setUseMockData(true);
      setLoading(false);
    }
  };

  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business-hours?business_id=${businessId}`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to load business hours");
      }

      if (data.data.weekly_hours && data.data.weekly_hours.length > 0) {
        // Map database hours to our format
        const mappedHours = DAYS_OF_WEEK.map((day) => {
          const dbHour = data.data.weekly_hours.find(
            (h: Record<string, unknown>) => h.day_of_week === day.value
          );
          if (dbHour) {
            return {
              day_of_week: dbHour.day_of_week,
              day_name: day.label,
              is_open: dbHour.is_open,
              open_time: dbHour.open_time || "09:00",
              close_time: dbHour.close_time || "18:00",
              break_start: dbHour.break_start || "",
              break_end: dbHour.break_end || "",
            };
          }
          return {
            day_of_week: day.value,
            day_name: day.label,
            is_open: false,
            open_time: "09:00",
            close_time: "18:00",
            break_start: "",
            break_end: "",
          };
        });
        setHours(mappedHours);
      }

      // Backend returns "special" key; fall back to "special_hours" for compatibility
      const specialData = data.data.special ?? data.data.special_hours ?? [];
      setSpecialHours(specialData.map((s: Record<string, unknown>) => ({
        ...s,
        is_closed: s.is_closed !== undefined ? s.is_closed : !s.is_open,
      })));

      setUseMockData(false);
    } catch (error: unknown) {
      console.warn("Business hours API unavailable, using mock data");
      setUseMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayOfWeek: number) => {
    setHours(
      hours.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, is_open: !h.is_open } : h
      )
    );
    setHasChanges(true);
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "open_time" | "close_time" | "break_start" | "break_end",
    value: string
  ) => {
    setHours(
      hours.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
    setHasChanges(true);
  };

  const handleSaveHours = async () => {
    try {
      setSaving(true);

      if (useMockData) {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Business hours saved successfully!");
        setHasChanges(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          business_id: businessId,
          weekly_hours: hours.map((h) => ({
            day_of_week: h.day_of_week,
            is_open: h.is_open,
            open_time: h.is_open ? h.open_time : null,
            close_time: h.is_open ? h.close_time : null,
            break_start: h.break_start || null,
            break_end: h.break_end || null,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to save business hours");
      }

      toast.success("Business hours saved successfully!");
      setHasChanges(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to save hours");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialHour = async () => {
    if (!newSpecialHour.date) {
      toast.error("Please select a date");
      return;
    }

    if (!newSpecialHour.is_closed && (!newSpecialHour.open_time || !newSpecialHour.close_time)) {
      toast.error("Please set open and close times");
      return;
    }

    try {
      if (useMockData) {
        // Demo mode
        const newEntry: SpecialHour = {
          ...newSpecialHour,
          id: Date.now().toString(),
        };
        setSpecialHours([...specialHours, newEntry]);
        toast.success("Special hours added!");
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business-hours`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
          body: JSON.stringify({
            business_id: businessId,
            special_hours: [newSpecialHour],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || "Failed to add special hours");
        }

        toast.success("Special hours added!");
        fetchBusinessHours();
      }

      setNewSpecialHour({
        date: "",
        is_closed: true,
        open_time: "09:00",
        close_time: "18:00",
        reason: "",
      });
      setIsSpecialDialogOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to add special hours");
    }
  };

  const handleDeleteSpecialHour = async (id: string) => {
    try {
      if (useMockData) {
        setSpecialHours(specialHours.filter((h) => h.id !== id));
        toast.success("Special hours removed!");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business-hours?special_id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to remove special hours");
      }

      toast.success("Special hours removed!");
      fetchBusinessHours();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to delete special hours");
    }
  };

  const applyQuickSetting = (setting: "standard" | "extended" | "weekend_off") => {
    let newHours: DayHours[];

    switch (setting) {
      case "standard":
        newHours = hours.map((h) => ({
          ...h,
          is_open: h.day_of_week >= 1 && h.day_of_week <= 5,
          open_time: "09:00",
          close_time: "17:00",
          break_start: "13:00",
          break_end: "14:00",
        }));
        break;
      case "extended":
        newHours = hours.map((h) => ({
          ...h,
          is_open: true,
          open_time: "08:00",
          close_time: "22:00",
          break_start: "",
          break_end: "",
        }));
        break;
      case "weekend_off":
        newHours = hours.map((h) => ({
          ...h,
          is_open: h.day_of_week >= 1 && h.day_of_week <= 5,
          open_time: h.open_time,
          close_time: h.close_time,
        }));
        break;
      default:
        return;
    }

    setHours(newHours);
    setHasChanges(true);
    toast.success("Hours updated! Don't forget to save.");
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTodayStatus = () => {
    const today = new Date().getDay();
    const todayHours = hours.find((h) => h.day_of_week === today);

    // Check for special hours today
    const todayStr = new Date().toISOString().split("T")[0];
    const specialToday = specialHours.find((s) => s.date === todayStr);

    if (specialToday) {
      if (specialToday.is_closed) {
        return { isOpen: false, reason: specialToday.reason || "Special Closure" };
      }
      return {
        isOpen: true,
        hours: `${formatTime(specialToday.open_time)} - ${formatTime(specialToday.close_time)}`,
        reason: specialToday.reason,
      };
    }

    if (!todayHours || !todayHours.is_open) {
      return { isOpen: false };
    }

    return {
      isOpen: true,
      hours: `${formatTime(todayHours.open_time)} - ${formatTime(todayHours.close_time)}`,
    };
  };

  const todayStatus = getTodayStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Hours</h1>
          <p className="mt-1 text-gray-600">
            Set your operating hours and manage special closures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchBusinessHours}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleSaveHours} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {useMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">Demo Mode</p>
            <p className="text-xs text-blue-600">
              Changes will be saved locally. Connect to database for persistence.
            </p>
          </div>
        </div>
      )}

      {/* Today's Status */}
      <Card className={todayStatus.isOpen ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${todayStatus.isOpen ? "bg-green-100" : "bg-red-100"}`}>
                {todayStatus.isOpen ? (
                  <Sun className="h-6 w-6 text-green-600" />
                ) : (
                  <Moon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Today's Status: {todayStatus.isOpen ? "Open" : "Closed"}
                </h3>
                {todayStatus.isOpen && todayStatus.hours && (
                  <p className="text-sm text-gray-600">{todayStatus.hours}</p>
                )}
                {todayStatus.reason && (
                  <p className="text-sm text-gray-500">{todayStatus.reason}</p>
                )}
              </div>
            </div>
            <Badge className={todayStatus.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {todayStatus.isOpen ? "Open Now" : "Closed"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Settings</CardTitle>
          <CardDescription>Apply common schedule presets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => applyQuickSetting("standard")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Standard Hours (9-5, Mon-Fri)
            </Button>
            <Button
              variant="outline"
              onClick={() => applyQuickSetting("extended")}
            >
              <Sun className="h-4 w-4 mr-2" />
              Extended Hours (8-10, All Days)
            </Button>
            <Button
              variant="outline"
              onClick={() => applyQuickSetting("weekend_off")}
            >
              <CalendarOff className="h-4 w-4 mr-2" />
              Close Weekends Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Configure your regular operating hours</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-10 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {hours.map((day) => (
                <div
                  key={day.day_of_week}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-colors ${
                    day.is_open
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <Switch
                      checked={day.is_open}
                      onCheckedChange={() => handleDayToggle(day.day_of_week)}
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 w-24">
                        {day.day_name}
                      </span>
                    </div>
                    {!day.is_open ? (
                      <Badge variant="secondary" className="bg-gray-100">
                        Closed
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Open</Badge>
                    )}
                  </div>

                  {day.is_open && (
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Open/Close Times */}
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-gray-500" />
                        <Select
                          value={day.open_time}
                          onValueChange={(value) =>
                            handleTimeChange(day.day_of_week, "open_time", value)
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-400">to</span>
                        <Moon className="h-4 w-4 text-blue-500" />
                        <Select
                          value={day.close_time}
                          onValueChange={(value) =>
                            handleTimeChange(day.day_of_week, "close_time", value)
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Break Time */}
                      <div className="flex items-center gap-2 border-l pl-3">
                        <Coffee className="h-4 w-4 text-gray-500" />
                        <Select
                          value={day.break_start || "none"}
                          onValueChange={(value) =>
                            handleTimeChange(
                              day.day_of_week,
                              "break_start",
                              value === "none" ? "" : value
                            )
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Break" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Break</SelectItem>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {day.break_start && (
                          <>
                            <span className="text-gray-400">to</span>
                            <Select
                              value={day.break_end || ""}
                              onValueChange={(value) =>
                                handleTimeChange(day.day_of_week, "break_end", value)
                              }
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {formatTime(time)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Hours / Holidays */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Special Hours & Holidays</CardTitle>
              <CardDescription>
                Set closures or modified hours for specific dates
              </CardDescription>
            </div>
            <Dialog open={isSpecialDialogOpen} onOpenChange={setIsSpecialDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Special Hours
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Special Hours</DialogTitle>
                  <DialogDescription>
                    Set modified hours or closure for a specific date
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newSpecialHour.date}
                      onChange={(e) =>
                        setNewSpecialHour({ ...newSpecialHour, date: e.target.value })
                      }
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Closed for the day</Label>
                    <Switch
                      checked={newSpecialHour.is_closed}
                      onCheckedChange={(checked) =>
                        setNewSpecialHour({ ...newSpecialHour, is_closed: checked })
                      }
                    />
                  </div>

                  {!newSpecialHour.is_closed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Open Time</Label>
                        <Select
                          value={newSpecialHour.open_time}
                          onValueChange={(value) =>
                            setNewSpecialHour({ ...newSpecialHour, open_time: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Close Time</Label>
                        <Select
                          value={newSpecialHour.close_time}
                          onValueChange={(value) =>
                            setNewSpecialHour({ ...newSpecialHour, close_time: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Input
                      placeholder="e.g., National Holiday, Maintenance"
                      value={newSpecialHour.reason}
                      onChange={(e) =>
                        setNewSpecialHour({ ...newSpecialHour, reason: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSpecialDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSpecialHour}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Special Hours
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {specialHours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarOff className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No special hours set</p>
              <p className="text-sm mt-1">Add holidays or modified hours for specific dates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {specialHours.map((special) => (
                <div
                  key={special.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    special.is_closed
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        special.is_closed ? "bg-red-100" : "bg-gray-100"
                      }`}
                    >
                      {special.is_closed ? (
                        <CalendarOff className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(special.date)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {special.is_closed
                          ? "Closed"
                          : `Open: ${formatTime(special.open_time)} - ${formatTime(special.close_time)}`}
                        {special.reason && ` • ${special.reason}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSpecialHour(special.id!)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-black border border-gray-700 rounded-lg p-4 shadow-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-white" />
          <span className="text-sm font-medium text-white">
            You have unsaved changes
          </span>
          <Button size="sm" onClick={handleSaveHours} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Now"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
