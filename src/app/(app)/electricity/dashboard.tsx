"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import {
  BarChart,
  type BarSeries,
  type LegendItem,
} from "@/components/charts/bar-chart";
import type { ElectricityRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Dense (sites × 2 energy types per month) — default to the most recent N months.
const DEFAULT_MONTHS = 12;

const SITE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// One bar per site per month, each bar stacked into renewable (solid) and
// non-renewable (faded) kWh. Same site ⇒ same stackId (stacked); different sites
// ⇒ different stackId (grouped side-by-side). Renewable kWh = Σ kWh × renew%/100
// (a missing renewable % counts as 0% renewable).
function buildEnergyMix(records: ElectricityRow[]): {
  data: ChartData;
  series: BarSeries[];
  legendItems: LegendItem[];
} {
  const byMonth = new Map<
    string,
    { label: string; ren: Map<string, number>; non: Map<string, number> }
  >();
  const sites = new Map<string, string>();

  for (const r of records) {
    const key = format(r.periodStart, "yyyy-MM");
    sites.set(r.site.siteId, r.site.name);

    let bucket = byMonth.get(key);
    if (!bucket) {
      bucket = {
        label: format(r.periodStart, "MMM yyyy"),
        ren: new Map(),
        non: new Map(),
      };
      byMonth.set(key, bucket);
    }
    const code = r.site.siteId;
    const renKwh = (r.consumptionKwh * (r.renewablePercent ?? 0)) / 100;
    bucket.ren.set(code, (bucket.ren.get(code) ?? 0) + renKwh);
    bucket.non.set(code, (bucket.non.get(code) ?? 0) + (r.consumptionKwh - renKwh));
  }

  const recentMonths = [...byMonth.keys()].sort().slice(-DEFAULT_MONTHS);
  const siteCodes = [...sites.keys()].sort();
  const colorFor = (i: number) => SITE_COLORS[i % SITE_COLORS.length];

  const series: BarSeries[] = [];
  siteCodes.forEach((code, i) => {
    series.push({
      key: `${code}__re`,
      label: sites.get(code)!,
      color: colorFor(i),
      stackId: code,
      opacity: 1,
    });
    series.push({
      key: `${code}__non`,
      label: `${sites.get(code)} (non-renewable)`,
      color: colorFor(i),
      stackId: code,
      opacity: 0.4,
    });
  });

  const data: ChartData = recentMonths.map((mkey) => {
    const bucket = byMonth.get(mkey)!;
    const row: Record<string, string | number | null> = { month: bucket.label };
    siteCodes.forEach((code) => {
      row[`${code}__re`] = Math.round(bucket.ren.get(code) ?? 0);
      row[`${code}__non`] = Math.round(bucket.non.get(code) ?? 0);
    });
    return row;
  });

  const legendItems: LegendItem[] = siteCodes.map((code, i) => ({
    label: sites.get(code)!,
    color: colorFor(i),
  }));

  return { data, series, legendItems };
}

export function ElectricityDashboard({
  records,
}: {
  records: ElectricityRow[];
}) {
  const chart = useMemo(() => buildEnergyMix(records), [records]);

  return (
    <div className="grid gap-4">
      <ChartCard
        title="Renewable vs non-renewable consumption by site"
        description="Most recent 12 months (kWh). One bar per site each month; solid = renewable, faded = non-renewable. Use the date filter to widen the range."
      >
        <BarChart
          data={chart.data}
          series={chart.series}
          xKey="month"
          unit="kWh"
          legendItems={chart.legendItems}
          height={340}
        />
      </ChartCard>
    </div>
  );
}
