"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { LineChart, type LineSeries } from "@/components/charts/line-chart";
import type { AirEmissionRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Bucket records by month, one averaged line per pollutant type.
function buildPollutantTrend(records: AirEmissionRow[]): {
  data: ChartData;
  series: LineSeries[];
} {
  const byMonth = new Map<
    string,
    { label: string; sums: Map<string, { sum: number; count: number }> }
  >();
  const pollutants = new Set<string>();

  for (const r of records) {
    const key = format(r.measuredAt, "yyyy-MM");
    pollutants.add(r.pollutantType);

    let bucket = byMonth.get(key);
    if (!bucket) {
      bucket = { label: format(r.measuredAt, "MMM yyyy"), sums: new Map() };
      byMonth.set(key, bucket);
    }
    const agg = bucket.sums.get(r.pollutantType) ?? { sum: 0, count: 0 };
    agg.sum += r.concentration;
    agg.count += 1;
    bucket.sums.set(r.pollutantType, agg);
  }

  const series: LineSeries[] = [...pollutants]
    .sort()
    .map((p) => ({ key: p, label: p }));

  const data: ChartData = [...byMonth.keys()].sort().map((key) => {
    const bucket = byMonth.get(key)!;
    const row: Record<string, string | number | null> = { month: bucket.label };
    for (const s of series) {
      const agg = bucket.sums.get(s.key);
      row[s.key] = agg ? Math.round((agg.sum / agg.count) * 100) / 100 : null;
    }
    return row;
  });

  return { data, series };
}

export function AirEmissionDashboard({
  records,
}: {
  records: AirEmissionRow[];
}) {
  const trend = useMemo(() => buildPollutantTrend(records), [records]);

  // Only show a Y-axis unit when the filtered set is single-unit — otherwise the
  // axis would be misleading (the card already advises filtering by pollutant).
  const unit = useMemo(() => {
    const units = new Set(records.map((r) => r.concentrationUnit));
    return units.size === 1 ? [...units][0] : undefined;
  }, [records]);

  // Rendered as an array so adding charts is a config change (CLAUDE.md).
  const charts = [
    {
      key: "pollutant-trend",
      title: "Pollutant concentration over time",
      description:
        "Monthly average concentration, one line per pollutant. Filter by pollutant to compare like-for-like units.",
      node: (
        <LineChart
          data={trend.data}
          series={trend.series}
          xKey="month"
          unit={unit}
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
