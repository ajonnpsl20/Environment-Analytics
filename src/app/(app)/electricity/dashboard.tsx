"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { BarChart, type BarSeries } from "@/components/charts/bar-chart";
import { LineChart, type LineSeries } from "@/components/charts/line-chart";
import type { ElectricityRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Total consumption per month, stacked by site.
function buildConsumptionBySite(records: ElectricityRow[]): {
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
      (bucket.sums.get(r.site.siteId) ?? 0) + r.consumptionKwh,
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

// Average renewable % per month (across all records that report it).
function buildRenewableTrend(records: ElectricityRow[]): {
  data: ChartData;
  series: LineSeries[];
} {
  const byMonth = new Map<string, { label: string; total: number; count: number }>();

  for (const r of records) {
    if (r.renewablePercent == null) continue;
    const key = format(r.periodStart, "yyyy-MM");
    let bucket = byMonth.get(key);
    if (!bucket) {
      bucket = { label: format(r.periodStart, "MMM yyyy"), total: 0, count: 0 };
      byMonth.set(key, bucket);
    }
    bucket.total += r.renewablePercent;
    bucket.count += 1;
  }

  const data: ChartData = [...byMonth.keys()].sort().map((key) => {
    const bucket = byMonth.get(key)!;
    return {
      month: bucket.label,
      renewable: Math.round((bucket.total / bucket.count) * 10) / 10,
    };
  });

  return { data, series: [{ key: "renewable", label: "Avg renewable %" }] };
}

export function ElectricityDashboard({
  records,
}: {
  records: ElectricityRow[];
}) {
  const consumption = useMemo(
    () => buildConsumptionBySite(records),
    [records],
  );
  const renewable = useMemo(() => buildRenewableTrend(records), [records]);

  const charts = [
    {
      key: "consumption-by-site",
      title: "Electricity consumption over time",
      description:
        "Total consumption per month (kWh), stacked by site. Filter to narrow by site or supplier.",
      node: (
        <BarChart
          data={consumption.data}
          series={consumption.series}
          xKey="month"
          stacked
          unit="kWh"
        />
      ),
    },
    {
      key: "renewable-trend",
      title: "Renewable share over time",
      description:
        "Average renewable energy percentage per month across the filtered records.",
      node: (
        <LineChart
          data={renewable.data}
          series={renewable.series}
          xKey="month"
          unit="%"
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
