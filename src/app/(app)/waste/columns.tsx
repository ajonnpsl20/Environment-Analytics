"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Lock, Paperclip } from "lucide-react";

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
import { WASTE_TYPE_LABEL, type WasteTypeName } from "@/lib/validations/waste";

// Mirrors the include in `listWaste` (kept client-safe via type-only import).
export type WasteRow = Prisma.WasteRecordGetPayload<{
  include: {
    site: { select: { name: true; siteId: true } };
    submittedBy: { select: { name: true } };
    approvedBy: { select: { name: true } };
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
      id: "wtn",
      header: "WTN",
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
