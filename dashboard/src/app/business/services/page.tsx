"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Store,
  Clock,
  Users,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Banknote,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { resolveBusinessId } from "@/lib/resolve-business-id";
import { Skeleton } from "@/components/ui/skeleton";

interface QueueType {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  color: string;
  estimated_service_time: number;
  max_capacity: number;
  is_active: boolean;
  price?: number;
}

interface QueueEntry {
  id: string;
  service_type?: string;
  status: string;
}

export default function ServicesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQueueType, setEditingQueueType] = useState<QueueType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    estimated_service_time: 5,
    max_capacity: 50,
    price: 0,
  });

  /* ── Init */
  useEffect(() => {
    resolveBusinessId().then(id => {
      if (id) setBusinessId(id);
      else setLoading(false);
    });
  }, []);

  /* ── Fetch queue types */
  const fetchQueueTypes = useCallback(async () => {
    if (!businessId) return;
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types?business_id=${businessId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setQueueTypes(j.data ?? []);
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  /* ── Fetch live queue entries (for waiting/serving counts) */
  const fetchEntries = useCallback(async () => {
    if (!businessId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/queue?business_id=${businessId}&status=all`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        setQueueEntries(j.data?.data ?? []);
      }
    } catch { /* silent */ }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      fetchQueueTypes();
      fetchEntries();
    }
  }, [businessId, fetchQueueTypes, fetchEntries]);

  /* ── CRUD helpers */
  const resetForm = () => {
    setEditingQueueType(null);
    setForm({ name: "", description: "", color: "#3B82F6", estimated_service_time: 5, max_capacity: 50, price: 0 });
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (qt: QueueType) => {
    setEditingQueueType(qt);
    setForm({
      name: qt.name,
      description: qt.description ?? "",
      color: qt.color,
      estimated_service_time: qt.estimated_service_time,
      max_capacity: qt.max_capacity,
      price: qt.price ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Service name is required"); return; }
    if (!businessId) return;
    setSaving(true);
    try {
      const isEditing = !!editingQueueType;
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${editingQueueType!.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/queue-types`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...form, business_id: businessId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Service ${isEditing ? "updated" : "created"}!`);
      setDialogOpen(false);
      resetForm();
      fetchQueueTypes();
    } catch (err: any) {
      toast.error(err.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      toast.success("Service deleted!");
      fetchQueueTypes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
    }
  };

  /* ── Live count helpers */
  const countForType = (qtId: string, status: string) =>
    queueEntries.filter(e => e.service_type === qtId && e.status === status).length;

  /* ── Render */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-gray-500">
            Manage the services you offer — each becomes its own queue lane with a unique QR code
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { fetchQueueTypes(); fetchEntries(); }} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Add Service
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      {queueTypes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border text-sm">
            <Store className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{queueTypes.length}</span>
            <span className="text-gray-500">{queueTypes.length === 1 ? "service" : "services"}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border text-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="font-semibold text-gray-900">{queueTypes.filter(q => q.is_active).length}</span>
            <span className="text-gray-500">active</span>
          </div>
        </div>
      )}

      {/* Services grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-5 w-5" />Your Services
          </CardTitle>
          <p className="text-sm text-gray-500">
            Each service appears as its own lane in Queue Management with its own QR code
          </p>
        </CardHeader>
        <CardContent>
          {queueTypes.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Store className="h-14 w-14 mx-auto mb-4 text-gray-200" />
              <p className="text-lg font-medium text-gray-600">No services configured</p>
              <p className="text-sm mt-2 max-w-xs mx-auto">
                Add services you offer to your customers — each gets its own queue lane and QR code
              </p>
              <Button className="mt-5" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />Add Your First Service
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queueTypes.map(qt => {
                const waiting = countForType(qt.id, "waiting");
                const serving = countForType(qt.id, "in_progress") + countForType(qt.id, "serving");
                return (
                  <div
                    key={qt.id}
                    className="relative p-4 rounded-xl border-2 transition-all hover:shadow-md"
                    style={{ borderColor: qt.color + "40", backgroundColor: qt.color + "08" }}
                  >
                    {/* Active badge */}
                    {!qt.is_active && (
                      <Badge className="absolute top-3 right-3 bg-gray-100 text-gray-400 border-0 text-[10px]">
                        Inactive
                      </Badge>
                    )}

                    {/* Top row */}
                    <div className="flex items-start justify-between pr-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                          style={{ backgroundColor: qt.color }}
                        >
                          {qt.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{qt.name}</h3>
                          <p className="text-xs text-gray-500">{qt.description || "No description"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Specs */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />~{qt.estimated_service_time} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />Max {qt.max_capacity}
                      </span>
                      {(qt.price ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Banknote className="h-3.5 w-3.5" />Rs.{Number(qt.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Live counts */}
                    <div className="mt-2 flex gap-2">
                      {waiting > 0 && (
                        <Badge className="bg-gray-100 text-gray-700 text-[11px]">{waiting} waiting</Badge>
                      )}
                      {serving > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 text-[11px]">{serving} serving</Badge>
                      )}
                      {waiting === 0 && serving === 0 && (
                        <Badge className="bg-green-50 text-green-600 text-[11px]">Queue clear</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm" variant="outline" className="flex-1 text-xs"
                        onClick={() => openEdit(qt)}
                        style={{ borderColor: qt.color + "60", color: qt.color }}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />Edit
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(qt.id, qt.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{editingQueueType ? "Edit Service" : "Create Service"}</DialogTitle>
            <DialogDescription>
              {editingQueueType
                ? "Update this service's details"
                : "A new queue lane will appear in Queue Management immediately after saving"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input
                placeholder="e.g., Haircut, Latte, Consultation"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this service"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color" value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Est. Service Time (min)</Label>
                <Input
                  type="number" min={1} value={form.estimated_service_time}
                  onChange={e => setForm(p => ({ ...p, estimated_service_time: parseInt(e.target.value) || 5 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Capacity</Label>
              <Input
                type="number" min={1} value={form.max_capacity}
                onChange={e => setForm(p => ({ ...p, max_capacity: parseInt(e.target.value) || 50 }))}
              />
              <p className="text-xs text-gray-400">Maximum customers allowed in this queue at once</p>
            </div>
            <div className="space-y-2">
              <Label>Price per Item (Rs.)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs.</span>
                <Input
                  type="number" min={0} step={0.01} value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                  className="pl-10" placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-400">Used to estimate queue revenue in Queue Management</p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQueueType ? "Update" : "Create"} Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
