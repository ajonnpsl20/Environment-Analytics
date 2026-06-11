"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { BarChart, type BarSeries } from "@/components/charts/bar-chart";
import type { GasRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Dashboard-only window: show the most recent N months so the grouped bars render
// at a readable width. The data table still reflects the full filtered range.
const DEFAULT_MONTHS = 12;

// Monthly total consumption (m³), one grouped bar per site.
function buildConsumptionBySite(records: GasRow[]): {
  data: ChartData;
  series: BarSeries[];
} {
  const byMonth = new Map<string, { label: string; sums: Map<string, number> }>();
  const sites = new Map<string, string>();

  for (const r of records) {
    const key = format(r.periodStart, "yyyy-MM");
    sites.set(r.site.siteId, r.site.name);

    let bucket = byMonth.get(key);
    if (!bucket) {
      bucket = { label: format(r.periodStart, "MMM yyyy"), sums: new Map() };
      byMonth.set(key, bucket);
    }
    bucket.sums.set(
      r.site.siteId,
      (bucket.sums.get(r.site.siteId) ?? 0) + r.consumptionM3,
    );
  }

  const series: BarSeries[] = [...sites.keys()].sort().map((code) => ({
    key: code,
    label: sites.get(code)!,
  }));

  const recentMonths = [...byMonth.keys()].sort().slice(-DEFAULT_MONTHS);
  const data: ChartData = recentMonths.map((key) => {
    const bucket = byMonth.get(key)!;
    const row: Record<string, string | number | null> = { month: bucket.label };
    for (const s of series) {
      row[s.key] = Math.round((bucket.sums.get(s.key) ?? 0) * 100) / 100;
    }
    return row;
  });

  return { data, series };
}

export function GasDashboard({ records }: { records: GasRow[] }) {
  const chart = useMemo(() => buildConsumptionBySite(records), [records]);

  return (
    <div className="grid gap-4">
      <ChartCard
        title="Gas consumption by site"
        description="Most recent 12 months (m³), one bar per site. Use the date filter to widen the range."
      >
        <BarChart
          data={chart.data}
          series={chart.series}
          xKey="month"
          unit="m³"
          height={340}
        />
      </ChartCard>
    </div>
  );
}
