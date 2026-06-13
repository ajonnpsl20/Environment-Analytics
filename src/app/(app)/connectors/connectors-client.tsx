"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Plug,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  Database,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ConnectorMetric = {
  key: string;
  label: string;
  count: number;
  registered: boolean;
  lastSyncAt: string | null;
};

type SyncResult = {
  label: string;
  detected: number;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  skipped: number;
};

// "3 new · 2 updated · 1 removed" — only the non-zero parts; "" if nothing changed.
function changeSummary(r: {
  created: number;
  updated: number;
  deleted: number;
}): string {
  const parts: string[] = [];
  if (r.created) parts.push(`${r.created} new`);
  if (r.updated) parts.push(`${r.updated} updated`);
  if (r.deleted) parts.push(`${r.deleted} removed`);
  return parts.join(" · ");
}

export function ConnectorsClient({ metrics }: { metrics: ConnectorMetric[] }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const registeredCount = metrics.filter((m) => m.registered).length;
  const skippedLabels = metrics
    .filter((m) => !m.registered)
    .map((m) => m.label);

  async function sync(metric: ConnectorMetric) {
    setSyncing(metric.key);
    try {
      const res = await fetch(`/api/connectors/sap?metric=${metric.key}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed.");
        return;
      }
      const summary = changeSummary(data);
      toast.success(
        summary ? `Synced ${metric.label}: ${summary}` : `${metric.label}: no changes`,
      );
      setResult({
        label: metric.label,
        detected: data.detected,
        created: data.created,
        updated: data.updated,
        deleted: data.deleted,
        unchanged: data.unchanged,
        skipped: data.skipped,
      });
      router.refresh();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Plug className="size-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                SAP ERP — Production
                <Badge variant="secondary">Demo</Badge>
              </CardTitle>
              <CardDescription>
                Mock connector reading a local sample feed. Real SAP integration
                plugs will be placed here — same workflow.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Connected
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {result && (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Synced {result.label}</AlertTitle>
            <AlertDescription>
              {changeSummary(result) || "No changes"}
              {result.unchanged > 0
                ? ` · ${result.unchanged} unchanged`
                : ""}
              {" "}of {result.detected} record(s) in the feed.
              {result.skipped > 0 ? ` ${result.skipped} row(s) skipped.` : ""}
            </AlertDescription>
          </Alert>
        )}

        <div className="divide-y rounded-lg border">
          {metrics.map((m) => (
            <div
              key={m.key}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex items-center gap-3">
                <Database className="size-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {m.label}
                    {!m.registered && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not configured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {m.count} record{m.count === 1 ? "" : "s"} in feed
                    <span aria-hidden>·</span>
                    <Clock className="size-3" />
                    {m.lastSyncAt
                      ? `synced ${formatDistanceToNow(new Date(m.lastSyncAt), { addSuffix: true })}`
                      : "never synced"}
                  </div>
                </div>
              </div>
              {m.registered ? (
                <Button
                  size="sm"
                  onClick={() => sync(m)}
                  disabled={syncing !== null}
                >
                  {syncing === m.key ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCw />
                  )}
                  Sync now
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Module not built
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          This connector maps {registeredCount} of {metrics.length} metrics in the
          feed.
          {skippedLabels.length > 0
            ? ` ${skippedLabels.join(", ")} will sync once those modules ship.`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}
