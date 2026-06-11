"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/tables/data-table";
import { WASTE_TYPE_LABEL, type WasteTypeName } from "@/lib/validations/waste";

// Mirrors the include in `listWaste` (kept client-safe via type-only import).
export type WasteRow = Prisma.WasteRecordGetPayload<{
  include: {
    site: { select: { name: true; siteId: true } };
  };
}>;

export function getWasteColumns(handlers: {
  onEdit: (record: WasteRow) => void;
  canEdit: boolean;
}): ColumnDef<WasteRow>[] {
  return [
    {
      accessorKey: "transferDate",
      header: ({ column }) => (
        <SortableHeader column={column}>Transfer</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(row.original.transferDate, "d MMM yyyy")}
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
      accessorKey: "wasteType",
      header: ({ column }) => (
        <SortableHeader column={column}>Type</SortableHeader>
      ),
      cell: ({ row }) => {
        const t = row.original.wasteType as WasteTypeName;
        return <Badge variant="outline">{WASTE_TYPE_LABEL[t] ?? t}</Badge>;
      },
    },
    {
      accessorKey: "ewcCode",
      header: "EWC code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.ewcCode}</span>
      ),
    },
    {
      accessorKey: "streamCategory",
      header: "Stream",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.streamCategory}</span>
      ),
    },
    {
      accessorKey: "weightKg",
      header: ({ column }) => (
        <SortableHeader column={column}>Weight</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.weightKg.toLocaleString()}{" "}
          <span className="text-xs text-muted-foreground">kg</span>
        </span>
      ),
    },
    {
      accessorKey: "disposalMethod",
      header: "Disposal",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.disposalMethod}</span>
      ),
    },
    {
      accessorKey: "contractor",
      header: "Contractor",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.contractor}</span>
      ),
    },
    {
      accessorKey: "wtnReference",
      header: "WTN ref",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.wtnReference}</span>
      ),
    },
    {
      id: "wtn",
      header: "Doc",
      cell: ({ row }) => {
        const key = row.original.wtnDocumentR2Key;
        if (!key) return <span className="text-muted-foreground">—</span>;
        return (
          <a
            href={`/api/uploads/wtn/${key}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            aria-label="Download WTN document"
          >
            <Paperclip className="size-3.5" />
            <span className="text-xs">PDF</span>
          </a>
        );
      },
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
