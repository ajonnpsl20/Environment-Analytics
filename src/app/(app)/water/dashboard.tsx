"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { BarChart, type BarSeries } from "@/components/charts/bar-chart";
import type { WaterRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Total consumption per month, stacked by site.
function buildConsumptionBySite(records: WaterRow[]): {
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

export function WaterDashboard({ records }: { records: WaterRow[] }) {
  const trend = useMemo(() => buildConsumptionBySite(records), [records]);

  const charts = [
    {
      key: "consumption-by-site",
      title: "Water consumption over time",
      description:
        "Total consumption per month (m³), stacked by site. Filter to narrow by site or source.",
      node: (
        <BarChart
          data={trend.data}
          series={trend.series}
          xKey="month"
          stacked
          unit="m³"
        />
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {charts.map((c) => (
        <ChartCard key={c.key} title={c.title} description={c.description}>
          {c.node}
        </ChartCard>
      ))}
    </div>
  );
}
