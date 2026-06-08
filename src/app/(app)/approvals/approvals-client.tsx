"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/data-table";
import type { PendingQueue, ReviewRow } from "@/lib/approvals/types";
import { getApprovalColumns } from "./columns";
import {
  approveRecordAction,
  rejectRecordAction,
  returnRecordAction,
} from "./actions";

type DialogState = { mode: "REJECT" | "RETURN"; row: ReviewRow };

export function ApprovalsClient({ queues }: { queues: PendingQueue[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [note, setNote] = useState("");

  const firstRegistered =
    queues.find((q) => q.registered)?.metricKey ?? queues[0]?.metricKey;

  function approve(row: ReviewRow) {
    startTransition(async () => {
      const res = await approveRecordAction(row.metricKey, row.id);
      if (res.ok) {
        toast.success("Record approved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function openDialog(mode: "REJECT" | "RETURN", row: ReviewRow) {
    setNote("");
    setDialog({ mode, row });
  }

  function submitDialog() {
    if (!dialog || note.trim() === "") return;
    const { mode, row } = dialog;
    startTransition(async () => {
      const res =
        mode === "REJECT"
          ? await rejectRecordAction(row.metricKey, row.id, note)
          : await returnRecordAction(row.metricKey, row.id, note);
      if (res.ok) {
        toast.success(mode === "REJECT" ? "Record rejected" : "Record returned");
        setDialog(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const columns = getApprovalColumns({
    onApprove: approve,
    onReject: (row) => openDialog("REJECT", row),
    onReturn: (row) => openDialog("RETURN", row),
    pending,
  });

  return (
    <>
      <Tabs defaultValue={firstRegistered} className="gap-4">
        <TabsList>
          {queues.map((q) => (
            <TabsTrigger key={q.metricKey} value={q.metricKey} className="gap-1.5">
              {q.label}
              {q.registered && q.count > 0 && (
                <Badge variant="secondary">{q.count}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {queues.map((q) => (
          <TabsContent key={q.metricKey} value={q.metricKey}>
            {q.registered ? (
              <DataTable
                columns={columns}
                data={q.rows}
                pageSize={15}
                emptyMessage="Nothing awaiting review here. All caught up."
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-10 text-center">
                <Inbox className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  The {q.label} module isn&apos;t built yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {q.label} records will appear here once that module
                  ships.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "REJECT" ? "Reject record" : "Return record"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === "REJECT"
                ? "Rejection is final — the submitter must create a new record. Give a reason."
                : "The record goes back to the submitter to edit and resubmit. Add your feedback."}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              dialog?.mode === "REJECT"
                ? "Reason for rejection…"
                : "What needs changing before resubmission…"
            }
            rows={4}
            autoFocus
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant={dialog?.mode === "REJECT" ? "destructive" : "default"}
              onClick={submitDialog}
              disabled={pending || note.trim() === ""}
            >
              {pending && <Loader2 className="animate-spin" />}
              {dialog?.mode === "REJECT" ? "Reject record" : "Return record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
