"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
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
import { WATER_SOURCE_LABEL, type WaterSourceName } from "@/lib/validations/water";

// Mirrors the include in `listWater` (kept client-safe via type-only import).
export type WaterRow = Prisma.WaterUsageRecordGetPayload<{
  include: {
    site: { select: { name: true; siteId: true } };
  };
}>;

export function getWaterColumns(handlers: {
  onEdit: (record: WaterRow) => void;
  onDelete: (record: WaterRow) => void;
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
      accessorKey: "readingStart",
      header: "Reading start",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.readingStart.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "readingEnd",
      header: "Reading end",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.readingEnd.toLocaleString()}
        </span>
      ),
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
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const record = row.original;
        if (!handlers.canEdit) return null;

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
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handlers.onDelete(record)}
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
