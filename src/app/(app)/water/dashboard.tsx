"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import {
  BarChart,
  type BarSeries,
  type XAxisGroup,
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

// One colour per source so the (now interactive) legend stays compact and a
// source reads consistently across every site.
const SOURCE_COLORS: Record<WaterSourceName, string> = {
  MAINS: "var(--color-chart-1)",
  BOREHOLE: "var(--color-chart-2)",
  RAINWATER: "var(--color-chart-3)",
  SURFACE_WATER: "var(--color-chart-4)",
  RECYCLED: "var(--color-chart-5)",
  OTHER: "var(--color-muted-foreground)",
};

// Short axis code from the human site id, e.g. "MAN-001" → "MAN".
const shortCode = (siteId: string) => siteId.split("-")[0];

// Two-tier layout. Each chart row is one (month, site): the inner x-axis tick is
// the site code and the outer tier (shaded bands) is the month. Series are the
// water sources (grouped side-by-side within a site), so the legend is the simple
// interactive per-source one. A site shows for every month in range (0 ⇒ no bar)
// so the month bands stay aligned.
function buildNested(records: WaterRow[]): {
  data: ChartData;
  series: BarSeries[];
  groups: XAxisGroup[];
  siteByRow: Record<string, string>;
  monthByRow: Record<string, string>;
} {
  // month key → (rowKey "mkey__siteId" → source → sum)
  const byMonth = new Map<string, Map<string, Map<string, number>>>();
  const monthLabel = new Map<string, string>();
  const sites = new Map<string, string>(); // siteId → short code
  const sourcesPresent = new Set<WaterSourceName>();

  for (const r of records) {
    const mkey = format(r.periodStart, "yyyy-MM");
    monthLabel.set(mkey, format(r.periodStart, "MMM yyyy"));
    sites.set(r.site.siteId, shortCode(r.site.siteId));
    sourcesPresent.add(r.source as WaterSourceName);

    let month = byMonth.get(mkey);
    if (!month) {
      month = new Map();
      byMonth.set(mkey, month);
    }
    const rowKey = `${mkey}__${r.site.siteId}`;
    let row = month.get(rowKey);
    if (!row) {
      row = new Map();
      month.set(rowKey, row);
    }
    row.set(r.source, (row.get(r.source) ?? 0) + r.consumptionM3);
  }

  const recentMonths = [...byMonth.keys()].sort().slice(-DEFAULT_MONTHS);
  const siteIds = [...sites.keys()].sort();
  const orderedSources = WATER_SOURCES.filter((s) => sourcesPresent.has(s));

  const series: BarSeries[] = orderedSources.map((src) => ({
    key: src,
    label: WATER_SOURCE_LABEL[src],
    color: SOURCE_COLORS[src],
  }));

  const data: ChartData = [];
  const groups: XAxisGroup[] = [];
  const siteByRow: Record<string, string> = {};
  const monthByRow: Record<string, string> = {};

  for (const mkey of recentMonths) {
    const month = byMonth.get(mkey)!;
    const rowKeys = siteIds.map((id) => `${mkey}__${id}`);
    rowKeys.forEach((rowKey, i) => {
      const sums = month.get(rowKey);
      const code = sites.get(siteIds[i])!;
      siteByRow[rowKey] = code;
      monthByRow[rowKey] = monthLabel.get(mkey)!;
      const row: Record<string, string | number | null> = { rowKey };
      for (const src of orderedSources) {
        row[src] = Math.round((sums?.get(src) ?? 0) * 100) / 100;
      }
      data.push(row);
    });
    groups.push({
      x1: rowKeys[0],
      x2: rowKeys[rowKeys.length - 1],
      label: monthLabel.get(mkey)!,
    });
  }

  return { data, series, groups, siteByRow, monthByRow };
}

export function WaterDashboard({ records }: { records: WaterRow[] }) {
  const chart = useMemo(() => buildNested(records), [records]);

  return (
    <div className="grid gap-4">
      <ChartCard
        title="Water consumption by site & source"
        description="Most recent 6 months (m³). Months group the sites; bars within a site are coloured by source. Hover a source in the legend to isolate it."
      >
        <BarChart
          data={chart.data}
          series={chart.series}
          xKey="rowKey"
          unit="m³"
          height={360}
          xTickFormatter={(rk) => chart.siteByRow[rk] ?? rk}
          xTooltipFormatter={(rk) =>
            `${chart.siteByRow[rk] ?? rk} · ${chart.monthByRow[rk] ?? ""}`.trim()
          }
          xGroups={chart.groups}
        />
      </ChartCard>
    </div>
  );
}
