"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

export const registeredUsersColumns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  /*{
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
    enableSorting: true,
  },*/
  
  {
    accessorKey: "username",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
    cell: ({ row }) => <span>{row.original.username}</span>,
    enableSorting: true,
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Full Name" />,
    cell: ({ row }) => <span>{row.original.full_name}</span>,
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span>{row.original.email}</span>,
    enableSorting: true,
  },
  {
    accessorKey: "phone_no",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone No" />,
    cell: ({ row }) => <span>{row.original.phone_no}</span>,
    enableSorting: true,
  },
 /* {
    accessorKey: "updated_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated At" />,
    cell: ({ row }) => <span>{new Date(row.original.updated_at).toLocaleString()}</span>,
    enableSorting: true,
  },*/
  {
    id: "actions",
    cell: ({ row }) => {
      const userId = row.original.id;

      const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        const res = await fetch("/api/delete-user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId }),
        });

        const data = await res.json();

        if (!res.ok) alert(data.error || "Something went wrong");
        else alert("User deleted successfully!");
      };

      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => alert(`Edit user ${userId}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
          >
            <Trash className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
];
