"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Site } from "@prisma/client";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/tables/data-table";

export function getSiteColumns(handlers: {
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
}): ColumnDef<Site>[] {
  return [
    {
      accessorKey: "siteId",
      header: ({ column }) => (
        <SortableHeader column={column}>Site ID</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.siteId}</span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "operationalType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.operationalType}</Badge>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.address}</span>
      ),
    },
    { accessorKey: "country", header: "Country" },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Added</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {format(row.original.createdAt, "d MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const site = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Actions">
                    <MoreHorizontal />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlers.onEdit(site)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handlers.onDelete(site)}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
