"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, FileSpreadsheet, FileText, Upload, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { GasForm, type SiteOption } from "@/components/data-entry/gas-form";
import { ImportDialog } from "@/components/data-entry/import-dialog";
import type { GasFormValues } from "@/lib/validations/gas";
import { GasFilters } from "./filters";
import { GasDashboard } from "./dashboard";
import { getGasColumns, type GasRow } from "./columns";

function toYyyyMmDd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toFormValues(r: GasRow): GasFormValues {
  return {
    siteId: r.siteId,
    meterId: r.meterId,
    consumptionM3: String(r.consumptionM3),
    periodStart: toYyyyMmDd(r.periodStart),
    periodEnd: toYyyyMmDd(r.periodEnd),
  };
}

export function GasClient({
  records,
  sites,
  canEnter,
}: {
  records: GasRow[];
  sites: SiteOption[];
  canEnter: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<GasRow | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<GasRow | null>(null);

  const columns = getGasColumns({
    onEdit: setEditRecord,
    onDelete: setDeleteRecord,
    canEdit: canEnter,
  });

  function confirmDelete() {
    if (!deleteRecord) return;
    const id = deleteRecord.id;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/gas/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Record deleted");
          router.refresh();
          setDeleteRecord(null);
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not delete the record.");
      } catch {
        toast.error(
          "Couldn't reach the server. Check your connection and try again.",
        );
      }
    });
  }

  function exportHref(formatExt: "xlsx" | "csv") {
    const q = new URLSearchParams(params.toString());
    q.set("format", formatExt === "csv" ? "csv" : "xlsx");
    return `/api/export/gas?${q.toString()}`;
  }

  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<a href={exportHref("xlsx")} />}
      >
        <FileSpreadsheet />
        Export Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<a href={exportHref("csv")} />}
      >
        <FileText />
        Export CSV
      </Button>
      {canEnter && (
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload />
          Import
        </Button>
      )}
      {canEnter && (
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          New record
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Tabs defaultValue="data" className="gap-4">
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <GasFilters sites={sites} />
          <DataTable
            columns={columns}
            data={records}
            pageSize={15}
            emptyMessage="No gas records match these filters."
            toolbar={toolbar}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <GasFilters sites={sites} />
          <GasDashboard records={records} />
        </TabsContent>
      </Tabs>

      {canEnter && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New gas record</DialogTitle>
              <DialogDescription>
                Add a gas meter reading for a site and period.
              </DialogDescription>
            </DialogHeader>
            <GasForm sites={sites} onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {canEnter && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import gas records</DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file. Valid rows are added as records.
              </DialogDescription>
            </DialogHeader>
            <ImportDialog metricKey="gas" onSuccess={() => setImportOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit gas record</DialogTitle>
            <DialogDescription>Update this gas meter reading.</DialogDescription>
          </DialogHeader>
          {editRecord && (
            <GasForm
              sites={sites}
              recordId={editRecord.id}
              defaultValues={toFormValues(editRecord)}
              onSuccess={() => setEditRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteRecord}
        onOpenChange={(open) => !open && setDeleteRecord(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete gas record</DialogTitle>
            <DialogDescription>
              {deleteRecord
                ? `Delete the record for ${deleteRecord.site.name} (${format(deleteRecord.periodStart, "d MMM yyyy")})? This can't be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRecord(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
