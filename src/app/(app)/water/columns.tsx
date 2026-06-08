"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/tables/data-table";
import {
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  EDITABLE_STATUSES,
  isRecordStatus,
} from "@/lib/record-status";
import { WATER_SOURCE_LABEL, type WaterSourceName } from "@/lib/validations/water";

// Mirrors the include in `listWater` (kept client-safe via type-only import).
export type WaterRow = Prisma.WaterUsageRecordGetPayload<{
  include: {
    site: { select: { name: true; siteId: true } };
    submittedBy: { select: { name: true } };
    approvedBy: { select: { name: true } };
  };
}>;

export function getWaterColumns(handlers: {
  onEdit: (record: WaterRow) => void;
  canEdit: boolean;
}): ColumnDef<WaterRow>[] {
  return [
    {
      accessorKey: "periodStart",
      header: ({ column }) => (
        <SortableHeader column={column}>Period</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(row.original.periodStart, "d MMM")} –{" "}
          {format(row.original.periodEnd, "d MMM yyyy")}
        </span>
      ),
    },
    {
      id: "site",
      header: "Site",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.site.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.site.siteId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "meterId",
      header: "Meter",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.meterId}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <SortableHeader column={column}>Source</SortableHeader>
      ),
      cell: ({ row }) => {
        const s = row.original.source as WaterSourceName;
        return <Badge variant="outline">{WATER_SOURCE_LABEL[s] ?? s}</Badge>;
      },
    },
    {
      accessorKey: "consumptionM3",
      header: ({ column }) => (
        <SortableHeader column={column}>Consumption</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.consumptionM3.toLocaleString()}{" "}
          <span className="text-xs text-muted-foreground">m³</span>
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={isRecordStatus(status) ? STATUS_BADGE_VARIANT[status] : "secondary"}
          >
            {isRecordStatus(status) ? STATUS_LABEL[status] : status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const record = row.original;
        const editable =
          handlers.canEdit &&
          isRecordStatus(record.status) &&
          EDITABLE_STATUSES.has(record.status);

        if (!editable) {
          return (
            <div className="flex justify-end pr-2 text-muted-foreground">
              <Lock className="size-3.5" aria-label="Locked" />
            </div>
          );
        }

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
                <DropdownMenuItem onClick={() => handlers.onEdit(record)}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
