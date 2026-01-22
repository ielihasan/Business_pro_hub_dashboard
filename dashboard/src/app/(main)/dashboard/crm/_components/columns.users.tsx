"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash } from "lucide-react";
import { useState } from "react";

export const registeredUsersColumns: ColumnDef<any>[] = [
  /* ---------- SELECT ---------- */
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      </div>
    ),
  },

  /* ---------- ID ---------- */
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => row.original.id.slice(0, 8),
  },

  /* ---------- USERNAME ---------- */
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
  },

  /* ---------- FULL NAME ---------- */
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Full Name" />
    ),
  },

  /* ---------- EMAIL ---------- */
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },

  /* ---------- PHONE ---------- */
  {
    accessorKey: "phone_no",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.phone_no}</Badge>
    ),
  },

  /* ---------- STATUS ---------- */
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.status || "Active"}</Badge>
    ),
  },

  /* ---------- ACTIONS ---------- */
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original;

      const [form, setForm] = useState({
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone_no: user.phone_no,
       // status: user.status || "Active",
      });

      const handleUpdate = async () => {
        const res = await fetch("/api/users/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id, ...form }),
        });

        if (!res.ok) {
          alert("Update failed");
          return;
        }

        /* 🔥 INSTANT UI UPDATE (no refresh) */
        row.original.username = form.username;
        row.original.full_name = form.full_name;
        row.original.email = form.email;
        row.original.phone_no = form.phone_no;
        row.original.status = form.status;

        table.options.meta?.updateData?.();
      };

      const handleDelete = async () => {
        await fetch("/api/users/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id }),
        });
      };

      return (
        <div className="flex justify-center gap-2">
          {/* ===== EDIT ===== */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit User</AlertDialogTitle>
                <AlertDialogDescription>
                  Update user details and click save.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="grid gap-3 mt-2">
                {[
                  ["Username", "username"],
                  ["Full Name", "full_name"],
                  ["Email", "email"],
                  ["Phone", "phone_no"],
              //    ["Status", "status"],
                ].map(([label, key]) => (
                  <div key={key} className="grid gap-1">
                    <Label>{label}</Label>
                    <Input
                      value={(form as any)[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUpdate}>
                  Save
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ===== DELETE ===== */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete this user? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
];
