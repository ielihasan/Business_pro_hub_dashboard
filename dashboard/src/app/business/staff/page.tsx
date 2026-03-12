"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  Copy,
  Shield,
  ShieldOff,
  Search,
  Loader2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const POSITIONS = [
  "Staff",
  "Manager",
  "Cashier",
  "Barista",
  "Receptionist",
  "Technician",
  "Chef",
  "Waiter",
  "Security",
  "Cleaner",
];

interface StaffMember {
  id: string;
  business_id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  position: string;
  is_active: boolean;
  customers_served: number;
  created_at?: string;
}

interface NewStaffForm {
  full_name: string;
  email: string;
  phone: string;
  position: string;
}

interface EditForm {
  full_name: string;
  phone: string;
  position: string;
  is_active: boolean;
}

export default function StaffPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Staff dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<NewStaffForm>({
    full_name: "", email: "", phone: "", position: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  // Edit Staff dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: "", phone: "", position: "Staff", is_active: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View served customers dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<StaffMember | null>(null);

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: adminData } = await supabase
        .from("admins")
        .select("id, business_name")
        .eq("id", session.user.id)
        .eq("role", "business_owner")
        .single();
      if (!adminData) return;
      setBusinessId(session.user.id);
      setToken(session.access_token);
    };
    init();
  }, []);

  useEffect(() => {
    if (businessId && token) fetchStaff();
  }, [businessId, token]);

  const fetchStaff = async () => {
    if (!businessId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/staff?business_id=${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setStaff(json.data?.data ?? []);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  // ── Add Staff ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.full_name.trim() || !addForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!addForm.position) {
      toast.error("Position is required");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(`${API}/api/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...addForm, business_id: businessId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to add staff member");
        return;
      }
      toast.success("Staff member added!");
      setCreatedCreds({ email: addForm.email, password: json.data.temp_password });
      setAddForm({ full_name: "", email: "", phone: "", position: "" });
      fetchStaff();
    } catch {
      toast.error("Network error");
    } finally {
      setAddLoading(false);
    }
  };

  const closeAddDialog = () => {
    setAddOpen(false);
    setCreatedCreds(null);
    setAddForm({ full_name: "", email: "", phone: "", position: "" });
  };

  // ── Edit Staff ────────────────────────────────────────────────────────────
  const openEdit = (s: StaffMember) => {
    setEditTarget(s);
    setEditForm({
      full_name: s.full_name,
      phone: s.phone ?? "",
      position: s.position,
      is_active: s.is_active,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editForm.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`${API}/api/staff/${editTarget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to update staff member");
        return;
      }
      toast.success("Staff member updated");
      setEditOpen(false);
      fetchStaff();
    } catch {
      toast.error("Network error");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete Staff ──────────────────────────────────────────────────────────
  const openDelete = (s: StaffMember) => {
    setDeleteTarget(s);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/staff/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to remove staff member");
        return;
      }
      toast.success("Staff member removed");
      setDeleteOpen(false);
      fetchStaff();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const filtered = staff.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.position.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount  = staff.filter((s) => s.is_active).length;
  const totalServed  = staff.reduce((acc, s) => acc + (s.customers_served ?? 0), 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-gray-500">Manage your team members and their access</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-black hover:bg-gray-800 text-white shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Customers Served</p>
              <p className="text-2xl font-bold">{totalServed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Note */}
      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Staff Access is Limited</p>
            <p className="mt-0.5">
              Staff members can access Queue Management, Orders, and Customers.
              They <strong>cannot</strong> manage other staff, change subscription plans, or modify business settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>View, edit and manage your staff</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <UserCog className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              {staff.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No staff members yet</p>
                  <p className="text-sm mt-1">Add team members to help manage your business</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setAddOpen(true)}
                  >
                    Add Your First Staff Member
                  </Button>
                </>
              ) : (
                <p className="text-lg font-medium">No results for &ldquo;{search}&rdquo;</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Dashboard Access</TableHead>
                    <TableHead className="text-center">Customers Served</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      {/* Name + Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 select-none">
                            {s.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{s.full_name}</span>
                        </div>
                      </TableCell>
                      {/* Position */}
                      <TableCell>
                        <span className="text-sm text-gray-700">{s.position}</span>
                      </TableCell>
                      {/* Contact */}
                      <TableCell>
                        <p className="text-sm text-gray-700">{s.email}</p>
                        {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                      </TableCell>
                      {/* Auth account */}
                      <TableCell>
                        {s.auth_user_id ? (
                          <div className="flex items-center gap-1.5 text-green-700">
                            <Shield className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Login Enabled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <ShieldOff className="h-3.5 w-3.5" />
                            <span className="text-xs">No Account</span>
                          </div>
                        )}
                      </TableCell>
                      {/* Customers served */}
                      <TableCell className="text-center">
                        <span className="font-semibold text-gray-900">{s.customers_served}</span>
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            s.is_active
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-50 text-gray-500"
                          }
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-gray-100"
                            title="View customers served"
                            onClick={() => { setViewTarget(s); setViewOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-gray-100"
                            title="Edit staff member"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            title="Remove staff member"
                            onClick={() => openDelete(s)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Staff Dialog ────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) closeAddDialog(); else setAddOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          {!createdCreds ? (
            <>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  A dashboard login account will be created for them with limited access.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. John Smith"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+92 300 0000000"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Position <span className="text-red-500">*</span></Label>
                  <Select
                    value={addForm.position}
                    onValueChange={(v) => setAddForm({ ...addForm, position: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeAddDialog}>Cancel</Button>
                <Button
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={handleAdd}
                  disabled={addLoading}
                >
                  {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Show credentials after creation
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Staff Member Added!
                </DialogTitle>
                <DialogDescription>
                  Share these login credentials with your staff member. The password is shown only once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="font-medium text-gray-900 text-sm">{createdCreds.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(createdCreds.email, "Email")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Temporary Password</p>
                      <p className="font-mono font-semibold text-gray-900">{createdCreds.password}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(createdCreds.password, "Password")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <strong>Note:</strong> Staff have limited access — they can manage queues and orders,
                  but cannot add staff, change plans, or modify business settings.
                </div>
              </div>
              <DialogFooter>
                <Button className="bg-black hover:bg-gray-800 text-white w-full" onClick={closeAddDialog}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Staff Dialog ───────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update details for {editTarget?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Select
                value={editForm.position}
                onValueChange={(v) => setEditForm({ ...editForm, position: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editForm.is_active ? "active" : "inactive"}
                onValueChange={(v) => setEditForm({ ...editForm, is_active: v === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="bg-black hover:bg-gray-800 text-white"
              onClick={handleEdit}
              disabled={editLoading}
            >
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Remove Staff Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.full_name}</strong>?
              Their dashboard login will be disabled and this action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Staff Performance Dialog ────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Staff Performance</DialogTitle>
            <DialogDescription>{viewTarget?.full_name} — {viewTarget?.position}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{viewTarget?.customers_served ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Customers Served</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <Badge
                  variant="outline"
                  className={
                    viewTarget?.is_active
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }
                >
                  {viewTarget?.is_active ? "Active" : "Inactive"}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">Current Status</p>
              </div>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{viewTarget?.email}</span>
              </div>
              {viewTarget?.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-900">{viewTarget.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Dashboard Login</span>
                <span className={viewTarget?.auth_user_id ? "text-green-700 font-medium" : "text-gray-400"}>
                  {viewTarget?.auth_user_id ? "Enabled" : "No Account"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Customers served counts queue entries marked as completed by this staff member.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
