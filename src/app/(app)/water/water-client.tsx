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
import { WaterForm, type SiteOption } from "@/components/data-entry/water-form";
import { ImportDialog } from "@/components/data-entry/import-dialog";
import type { WaterFormValues, WaterSourceName } from "@/lib/validations/water";
import { WaterFilters } from "./filters";
import { WaterDashboard } from "./dashboard";
import { getWaterColumns, type WaterRow } from "./columns";

function toYyyyMmDd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toFormValues(r: WaterRow): WaterFormValues {
  return {
    siteId: r.siteId,
    meterId: r.meterId,
    readingStart: String(r.readingStart),
    readingEnd: String(r.readingEnd),
    consumptionM3: String(r.consumptionM3),
    source: r.source as WaterSourceName,
    periodStart: toYyyyMmDd(r.periodStart),
    periodEnd: toYyyyMmDd(r.periodEnd),
  };
}

export function WaterClient({
  records,
  sites,
  canEnter,
}: {
  records: WaterRow[];
  sites: SiteOption[];
  canEnter: boolean;
}) {
  const params = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<WaterRow | null>(null);

  const columns = getWaterColumns({ onEdit: setEditRecord, canEdit: canEnter });

  function exportHref(formatExt: "xlsx" | "csv") {
    const q = new URLSearchParams(params.toString());
    q.set("format", formatExt === "csv" ? "csv" : "xlsx");
    return `/api/export/water?${q.toString()}`;
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
          <WaterFilters sites={sites} />
          <DataTable
            columns={columns}
            data={records}
            pageSize={15}
            emptyMessage="No water records match these filters."
            toolbar={toolbar}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <WaterFilters sites={sites} />
          <WaterDashboard records={records} />
        </TabsContent>
      </Tabs>

      {canEnter && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New water record</DialogTitle>
              <DialogDescription>
                The record is submitted for Site Admin review.
              </DialogDescription>
            </DialogHeader>
            <WaterForm sites={sites} onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {canEnter && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import water records</DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file. Valid rows are submitted for review.
              </DialogDescription>
            </DialogHeader>
            <ImportDialog metricKey="water" onSuccess={() => setImportOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit water record</DialogTitle>
            <DialogDescription>
              Editing a returned record resubmits it for review.
            </DialogDescription>
          </DialogHeader>
          {editRecord && (
            <WaterForm
              sites={sites}
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
