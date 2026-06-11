"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import {
  BarChart,
  type BarSeries,
  type LegendItem,
} from "@/components/charts/bar-chart";
import {
  WATER_SOURCES,
  WATER_SOURCE_LABEL,
  type WaterSourceName,
} from "@/lib/validations/water";
import type { WaterRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

// Default window: the dashboard is dense (sites × sources per month), so it shows
// only the most recent N months unless the user widens the date filter.
const DEFAULT_MONTHS = 6;

// One colour per source, reused across sites so the legend stays compact.
const SOURCE_COLORS: Record<WaterSourceName, string> = {
  MAINS: "var(--color-chart-1)",
  BOREHOLE: "var(--color-chart-2)",
  RAINWATER: "var(--color-chart-3)",
  SURFACE_WATER: "var(--color-chart-4)",
  RECYCLED: "var(--color-chart-5)",
  OTHER: "var(--color-muted-foreground)",
};

// Nested grouping: x = month; within each month one cluster per site, and within
// each site one bar per water source. Series are ordered site-major so same-site
// bars sit adjacent; colour encodes the source (legend = sources).
function buildNested(records: WaterRow[]): {
  data: ChartData;
  series: BarSeries[];
  legendItems: LegendItem[];
} {
  const byMonth = new Map<string, { label: string; sums: Map<string, number> }>();
  const sites = new Map<string, string>();
  const sourcesPresent = new Set<WaterSourceName>();

  for (const r of records) {
    const mkey = format(r.periodStart, "yyyy-MM");
    sites.set(r.site.siteId, r.site.name);
    sourcesPresent.add(r.source as WaterSourceName);

    let bucket = byMonth.get(mkey);
    if (!bucket) {
      bucket = { label: format(r.periodStart, "MMM yyyy"), sums: new Map() };
      byMonth.set(mkey, bucket);
    }
    const seriesKey = `${r.site.siteId}__${r.source}`;
    bucket.sums.set(seriesKey, (bucket.sums.get(seriesKey) ?? 0) + r.consumptionM3);
  }

  const recentMonths = [...byMonth.keys()].sort().slice(-DEFAULT_MONTHS);
  const siteCodes = [...sites.keys()].sort();
  const orderedSources = WATER_SOURCES.filter((s) => sourcesPresent.has(s));

  const series: BarSeries[] = [];
  for (const code of siteCodes) {
    for (const src of orderedSources) {
      series.push({
        key: `${code}__${src}`,
        label: `${sites.get(code)} – ${WATER_SOURCE_LABEL[src]}`,
        color: SOURCE_COLORS[src],
      });
    }
  }

  const data: ChartData = recentMonths.map((mkey) => {
    const bucket = byMonth.get(mkey)!;
    const row: Record<string, string | number | null> = { month: bucket.label };
    for (const s of series) {
      row[s.key] = Math.round((bucket.sums.get(s.key) ?? 0) * 100) / 100;
    }
    return row;
  });

  const legendItems: LegendItem[] = orderedSources.map((src) => ({
    label: WATER_SOURCE_LABEL[src],
    color: SOURCE_COLORS[src],
  }));

  return { data, series, legendItems };
}

export function WaterDashboard({ records }: { records: WaterRow[] }) {
  const chart = useMemo(() => buildNested(records), [records]);

  return (
    <div className="grid gap-4">
      <ChartCard
        title="Water consumption by site & source"
        description="Most recent 6 months (m³). Each month groups bars by site; within a site, one bar per source. Use the date filter to widen the range."
      >
        <BarChart
          data={chart.data}
          series={chart.series}
          xKey="month"
          unit="m³"
          legendItems={chart.legendItems}
          height={340}
        />
      </ChartCard>
    </div>
  );
}
