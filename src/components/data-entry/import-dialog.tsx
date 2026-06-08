"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { metricLabel } from "@/lib/import/metric-keys";

type ImportError = {
  row: number;
  messages: string[];
  cells: Record<string, string | number | null>;
};

type Preview = {
  summary: { valid: number; invalid: number; total: number };
  errors: ImportError[];
  validRaw: Record<string, string | number | null>[];
};

type Phase = "idle" | "validating" | "committing";

export function ImportDialog({
  metricKey,
  onSuccess,
}: {
  metricKey: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const label = metricLabel(metricKey);

  function reset() {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setPreview(null);
    setPhase("validating");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/import/${metricKey}`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not read the file.");
        reset();
        return;
      }
      setPreview(data as Preview);
    } finally {
      setPhase("idle");
    }
  }

  async function commit() {
    if (!preview || preview.validRaw.length === 0) return;
    setPhase("committing");
    try {
      const res = await fetch(`/api/import/${metricKey}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.validRaw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Import failed.");
        return;
      }
      toast.success(
        `Imported ${data.created} record${data.created === 1 ? "" : "s"} — pending review`,
      );
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} row(s) were skipped during import.`);
      }
      router.refresh();
      onSuccess();
    } finally {
      setPhase("idle");
    }
  }

  async function downloadErrorReport() {
    if (!preview) return;
    const res = await fetch(`/api/import/${metricKey}/error-report?format=xlsx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors: preview.errors }),
    });
    if (!res.ok) {
      toast.error("Could not generate the error report.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `envirohub-${metricKey}-import-errors.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const busy = phase !== "idle";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Step 1 — download a template:
        </span>
        <Button
          variant="outline"
          size="xs"
          nativeButton={false}
          render={<a href={`/api/import/${metricKey}/template?format=xlsx`} />}
        >
          <FileSpreadsheet />
          Excel
        </Button>
        <Button
          variant="outline"
          size="xs"
          nativeButton={false}
          render={<a href={`/api/import/${metricKey}/template?format=csv`} />}
        >
          <FileText />
          CSV
        </Button>
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-8 text-center transition-colors hover:bg-muted/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {phase === "validating" ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        <div className="text-sm">
          <span className="font-medium">Drop an .xlsx or .csv file</span>{" "}
          <span className="text-muted-foreground">or click to browse</span>
        </div>
        {fileName && (
          <span className="text-xs text-muted-foreground">{fileName}</span>
        )}
      </label>

      {preview && (
        <div className="space-y-3">
          <Alert variant={preview.summary.invalid > 0 ? "destructive" : "default"}>
            {preview.summary.invalid > 0 ? (
              <AlertTriangle />
            ) : (
              <CheckCircle2 />
            )}
            <AlertTitle>
              {preview.summary.valid} valid · {preview.summary.invalid} invalid ·{" "}
              {preview.summary.total} total
            </AlertTitle>
            <AlertDescription>
              {preview.summary.valid > 0
                ? `${preview.summary.valid} ${label} row(s) will be submitted for review.`
                : "No valid rows to import — fix the errors and re-upload."}
            </AlertDescription>
          </Alert>

          {preview.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  First {Math.min(5, preview.errors.length)} of{" "}
                  {preview.errors.length} invalid rows
                </span>
                <Button variant="ghost" size="xs" onClick={downloadErrorReport}>
                  <Download />
                  Error report
                </Button>
              </div>
              <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border bg-card p-2 text-xs">
                {preview.errors.slice(0, 5).map((e) => (
                  <li key={e.row} className="flex gap-2">
                    <span className="font-mono text-muted-foreground">
                      Row {e.row}
                    </span>
                    <span className="text-destructive">
                      {e.messages.join("; ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={reset} disabled={busy}>
              <X />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={commit}
              disabled={busy || preview.summary.valid === 0}
            >
              {phase === "committing" && <Loader2 className="animate-spin" />}
              Import {preview.summary.valid} valid row
              {preview.summary.valid === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
