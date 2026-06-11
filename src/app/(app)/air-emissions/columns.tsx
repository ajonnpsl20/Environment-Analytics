"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/tables/data-table";

// Mirrors the include in `listAirEmissions` (kept client-safe via type-only import).
export type AirEmissionRow = Prisma.AirEmissionRecordGetPayload<{
  include: {
    site: { select: { name: true; siteId: true } };
  };
}>;

const num = (n: number | null) =>
  n == null ? (
    <span className="text-muted-foreground">—</span>
  ) : (
    <span className="tabular-nums">{n.toLocaleString()}</span>
  );

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
            {row.original.site.siteId}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "stackId",
      header: "Stack",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.stackId}</span>
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
          {row.original.concentration.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "concentrationUnit",
      header: "Unit",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.concentrationUnit}
        </span>
      ),
    },
    {
      accessorKey: "flowRate",
      header: "Flow rate",
      cell: ({ row }) => num(row.original.flowRate),
    },
    {
      accessorKey: "totalEmissions",
      header: "Total emissions",
      cell: ({ row }) => num(row.original.totalEmissions),
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
      accessorKey: "equipmentReference",
      header: "Equipment ref",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.equipmentReference ?? "—"}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
