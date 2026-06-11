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
import {
  AirEmissionForm,
  type SiteOption,
} from "@/components/data-entry/air-emission-form";
import { ImportDialog } from "@/components/data-entry/import-dialog";
import type { AirEmissionFormValues } from "@/lib/validations/air-emission";
import { AirEmissionFilters } from "./filters";
import { AirEmissionDashboard } from "./dashboard";
import { getAirEmissionColumns, type AirEmissionRow } from "./columns";

function toFormValues(r: AirEmissionRow): AirEmissionFormValues {
  const d = r.measuredAt;
  const yyyyMmDd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    siteId: r.siteId,
    stackId: r.stackId,
    measuredAt: yyyyMmDd,
    pollutantType: r.pollutantType,
    concentration: String(r.concentration),
    concentrationUnit: r.concentrationUnit,
    flowRate: r.flowRate != null ? String(r.flowRate) : "",
    totalEmissions: r.totalEmissions != null ? String(r.totalEmissions) : "",
    measurementMethod: r.measurementMethod,
    equipmentReference: r.equipmentReference ?? "",
  };
}

export function AirEmissionsClient({
  records,
  sites,
  canEnter,
}: {
  records: AirEmissionRow[];
  sites: SiteOption[];
  canEnter: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AirEmissionRow | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AirEmissionRow | null>(null);

  const columns = getAirEmissionColumns({
    onEdit: setEditRecord,
    onDelete: setDeleteRecord,
    canEdit: canEnter,
  });

  function confirmDelete() {
    if (!deleteRecord) return;
    const id = deleteRecord.id;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/air-emissions/${id}`, {
          method: "DELETE",
        });
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
    return `/api/export/air-emissions?${q.toString()}`;
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
          <AirEmissionFilters sites={sites} />
          <DataTable
            columns={columns}
            data={records}
            pageSize={15}
            emptyMessage="No air-emission records match these filters."
            toolbar={toolbar}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <AirEmissionFilters sites={sites} />
          <AirEmissionDashboard records={records} />
        </TabsContent>
      </Tabs>

      {canEnter && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New air-emission record</DialogTitle>
              <DialogDescription>
                The record is submitted for Site Admin review.
              </DialogDescription>
            </DialogHeader>
            <AirEmissionForm sites={sites} onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {canEnter && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import air-emission records</DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file. Valid rows are submitted for review.
              </DialogDescription>
            </DialogHeader>
            <ImportDialog
              metricKey="airEmission"
              onSuccess={() => setImportOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit air-emission record</DialogTitle>
            <DialogDescription>
              Editing a returned record resubmits it for review.
            </DialogDescription>
          </DialogHeader>
          {editRecord && (
            <AirEmissionForm
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
            <DialogTitle>Delete air-emission record</DialogTitle>
            <DialogDescription>
              {deleteRecord
                ? `Delete the record for ${deleteRecord.site.name} (${format(deleteRecord.measuredAt, "d MMM yyyy")})? This can't be undone.`
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
