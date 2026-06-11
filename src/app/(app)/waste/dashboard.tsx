"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { BarChart, type BarSeries } from "@/components/charts/bar-chart";
import { WASTE_TYPE_LABEL, type WasteTypeName } from "@/lib/validations/waste";
import type { WasteRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Monthly total weight (kg) for one waste type, one grouped bar per site.
function buildWeightBySite(records: WasteRow[]): {
  data: ChartData;
  series: BarSeries[];
} {
  const byMonth = new Map<string, { label: string; sums: Map<string, number> }>();
  const sites = new Map<string, string>();

  for (const r of records) {
    const key = format(r.transferDate, "yyyy-MM");
    sites.set(r.site.siteId, r.site.name);

    let bucket = byMonth.get(key);
    if (!bucket) {
      bucket = { label: format(r.transferDate, "MMM yyyy"), sums: new Map() };
      byMonth.set(key, bucket);
    }
    bucket.sums.set(
      r.site.siteId,
      (bucket.sums.get(r.site.siteId) ?? 0) + r.weightKg,
    );
  }

  const series: BarSeries[] = [...sites.keys()].sort().map((code) => ({
    key: code,
    label: sites.get(code)!,
  }));

  const data: ChartData = [...byMonth.keys()].sort().map((key) => {
    const bucket = byMonth.get(key)!;
    const row: Record<string, string | number | null> = { month: bucket.label };
    for (const s of series) {
      row[s.key] = Math.round((bucket.sums.get(s.key) ?? 0) * 100) / 100;
    }
    return row;
  });

  return { data, series };
}

// Hazardous + non-hazardous only (recyclable is excluded from the dashboard).
const CHARTED_TYPES: WasteTypeName[] = ["HAZARDOUS", "NON_HAZARDOUS"];

export function WasteDashboard({ records }: { records: WasteRow[] }) {
  const charts = useMemo(
    () =>
      CHARTED_TYPES.map((type) => ({
        type,
        ...buildWeightBySite(records.filter((r) => r.wasteType === type)),
      })),
    [records],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {charts.map((c) => (
        <ChartCard
          key={c.type}
          title={`${WASTE_TYPE_LABEL[c.type]} waste over time`}
          description="Total weight transferred per month (kg), one bar per site."
        >
          <BarChart
            data={c.data}
            series={c.series}
            xKey="month"
            unit="kg"
            height={280}
          />
        </ChartCard>
      ))}
    </div>
  );
}
