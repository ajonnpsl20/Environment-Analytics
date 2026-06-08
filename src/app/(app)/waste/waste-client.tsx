"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, FileSpreadsheet, FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/data-table";
import { WasteForm, type SiteOption } from "@/components/data-entry/waste-form";
import { ImportDialog } from "@/components/data-entry/import-dialog";
import type { WasteFormValues } from "@/lib/validations/waste";
import type { WasteTypeName } from "@/lib/validations/waste";
import { WasteFilters } from "./filters";
import { WasteDashboard } from "./dashboard";
import { getWasteColumns, type WasteRow } from "./columns";

function toFormValues(r: WasteRow): WasteFormValues {
  const d = r.transferDate;
  const yyyyMmDd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    siteId: r.siteId,
    wasteType: r.wasteType as WasteTypeName,
    streamCategory: r.streamCategory,
    weightKg: String(r.weightKg),
    disposalMethod: r.disposalMethod,
    contractor: r.contractor,
    wtnReference: r.wtnReference,
    transferDate: yyyyMmDd,
    wtnDocumentR2Key: r.wtnDocumentR2Key ?? "",
  };
}

export function WasteClient({
  records,
  sites,
  canEnter,
  r2Enabled,
}: {
  records: WasteRow[];
  sites: SiteOption[];
  canEnter: boolean;
  r2Enabled: boolean;
}) {
  const params = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<WasteRow | null>(null);

  const columns = getWasteColumns({ onEdit: setEditRecord, canEdit: canEnter });

  function exportHref(formatExt: "xlsx" | "csv") {
    const q = new URLSearchParams(params.toString());
    q.set("format", formatExt === "csv" ? "csv" : "xlsx");
    return `/api/export/waste?${q.toString()}`;
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
          <WasteFilters sites={sites} />
          <DataTable
            columns={columns}
            data={records}
            pageSize={15}
            emptyMessage="No waste records match these filters."
            toolbar={toolbar}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <WasteFilters sites={sites} />
          <WasteDashboard records={records} />
        </TabsContent>
      </Tabs>

      {canEnter && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New waste record</DialogTitle>
              <DialogDescription>
                The record is submitted for Site Admin review.
              </DialogDescription>
            </DialogHeader>
            <WasteForm
              sites={sites}
              r2Enabled={r2Enabled}
              onSuccess={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {canEnter && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import waste records</DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file. Valid rows are submitted for review.
              </DialogDescription>
            </DialogHeader>
            <ImportDialog metricKey="waste" onSuccess={() => setImportOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit waste record</DialogTitle>
            <DialogDescription>
              Editing a returned record resubmits it for review.
            </DialogDescription>
          </DialogHeader>
          {editRecord && (
            <WasteForm
              sites={sites}
              r2Enabled={r2Enabled}
              recordId={editRecord.id}
              defaultValues={toFormValues(editRecord)}
              onSuccess={() => setEditRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
