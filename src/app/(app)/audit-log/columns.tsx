"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/tables/data-table";
import {
  ACTION_BADGE_VARIANT,
  isAuditAction,
} from "@/lib/audit-constants";

export type AuditLogRow = Prisma.AuditLogGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;

export const auditColumns: ColumnDef<AuditLogRow>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <SortableHeader column={column}>Time</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(row.original.timestamp, "d MMM yyyy, HH:mm")}
      </span>
    ),
  },
  {
    id: "user",
    header: "User",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.user?.name ?? "—"}</span>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.original.action;
      return (
        <Badge
          variant={isAuditAction(action) ? ACTION_BADGE_VARIANT[action] : "secondary"}
        >
          {action}
        </Badge>
      );
    },
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => <span>{row.original.entityType}</span>,
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.entityId}
      </span>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.notes ?? "—"}</span>
    ),
  },
];
