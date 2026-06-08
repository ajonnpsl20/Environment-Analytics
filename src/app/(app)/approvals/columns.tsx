"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Check, Undo2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/tables/data-table";
import type { ReviewRow } from "@/lib/approvals/types";

export function getApprovalColumns(handlers: {
  onApprove: (row: ReviewRow) => void;
  onReject: (row: ReviewRow) => void;
  onReturn: (row: ReviewRow) => void;
  pending: boolean;
}): ColumnDef<ReviewRow>[] {
  return [
    {
      id: "site",
      header: "Site",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.siteName}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.siteCode}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "primary",
      header: "Detail",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.primary}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.secondary}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "submittedByName",
      header: "Submitted by",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.submittedByName}
        </span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Submitted</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {format(new Date(row.original.submittedAt), "d MMM yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex justify-end gap-1.5">
            <Button
              size="xs"
              onClick={() => handlers.onApprove(record)}
              disabled={handlers.pending}
            >
              <Check />
              Approve
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => handlers.onReturn(record)}
              disabled={handlers.pending}
            >
              <Undo2 />
              Return
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handlers.onReject(record)}
              disabled={handlers.pending}
            >
              <X />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];
}
