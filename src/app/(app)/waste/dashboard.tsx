"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { BarChart, type BarSeries } from "@/components/charts/bar-chart";
import { WASTE_TYPE_LABEL, type WasteTypeName } from "@/lib/validations/waste";
import type { WasteRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Total weight per month, stacked by waste type.
function buildWeightByType(records: WasteRow[]): {
  data: ChartData;
  series: BarSeries[];
} {
  const byMonth = new Map<string, { label: string; sums: Map<string, number> }>();
  const types = new Set<string>();

  for (const r of records) {
    const key = format(r.transferDate, "yyyy-MM");
    types.add(r.wasteType);

    let bucket = byMonth.get(key);
    if (!bucket) {
      bucket = { label: format(r.transferDate, "MMM yyyy"), sums: new Map() };
      byMonth.set(key, bucket);
    }
    bucket.sums.set(r.wasteType, (bucket.sums.get(r.wasteType) ?? 0) + r.weightKg);
  }

  const series: BarSeries[] = [...types].sort().map((t) => ({
    key: t,
    label: WASTE_TYPE_LABEL[t as WasteTypeName] ?? t,
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

export function WasteDashboard({ records }: { records: WasteRow[] }) {
  const trend = useMemo(() => buildWeightByType(records), [records]);

  const charts = [
    {
      key: "weight-by-type",
      title: "Waste weight over time",
      description:
        "Total weight transferred per month (kg), stacked by waste type. Filter to narrow by site or type.",
      node: (
        <BarChart
          data={trend.data}
          series={trend.series}
          xKey="month"
          stacked
          unit="kg"
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
