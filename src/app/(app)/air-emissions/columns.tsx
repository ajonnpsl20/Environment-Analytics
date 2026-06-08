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

// Mirrors the include in `listAirEmissions` (kept client-safe via type-only import).
export type AirEmissionRow = Prisma.AirEmissionRecordGetPayload<{
  include: {
    site: { select: { name: true; siteId: true } };
    submittedBy: { select: { name: true } };
    approvedBy: { select: { name: true } };
  };
}>;

export function getAirEmissionColumns(handlers: {
  onEdit: (record: AirEmissionRow) => void;
  canEdit: boolean;
}): ColumnDef<AirEmissionRow>[] {
  return [
    {
      accessorKey: "measuredAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Measured</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(row.original.measuredAt, "d MMM yyyy")}
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
            {row.original.site.siteId} · {row.original.stackId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "pollutantType",
      header: ({ column }) => (
        <SortableHeader column={column}>Pollutant</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.pollutantType}</Badge>
      ),
    },
    {
      accessorKey: "concentration",
      header: ({ column }) => (
        <SortableHeader column={column}>Concentration</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.concentration.toLocaleString()}{" "}
          <span className="text-xs text-muted-foreground">
            {row.original.concentrationUnit}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "measurementMethod",
      header: "Method",
      cell: ({ row }) => (
        <span className="text-muted-foreground capitalize">
          {row.original.measurementMethod.toLowerCase()}
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
