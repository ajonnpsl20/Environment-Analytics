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
  nameByCode: Record<string, string>;
  legend: { code: string; name: string }[];
} {
  // month key → (rowKey "mkey__siteId" → source → sum)
  const byMonth = new Map<string, Map<string, Map<string, number>>>();
  const monthLabel = new Map<string, string>();
  const sites = new Map<string, string>(); // siteId → short code
  const siteName = new Map<string, string>(); // siteId → full name
  const sourcesPresent = new Set<WaterSourceName>();

  for (const r of records) {
    const mkey = format(r.periodStart, "yyyy-MM");
    monthLabel.set(mkey, format(r.periodStart, "MMM yyyy"));
    sites.set(r.site.siteId, shortCode(r.site.siteId));
    siteName.set(r.site.siteId, r.site.name);
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

  const lastMi = recentMonths.length - 1;
  recentMonths.forEach((mkey, mi) => {
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

    // Two empty spacer columns per gap (after this month): `__gA` is the left half
    // and belongs to THIS month's band, `__gB` the right half belongs to the NEXT
    // month's band — so each gap is split half/half between the two months' shades
    // (a ReferenceArea covers whole bands, so a half-gap needs its own column). No
    // source keys ⇒ no bars; blank siteByRow ⇒ blank x-axis tick.
    if (mi < lastMi) {
      const gA = `__gA-${mi}`;
      const gB = `__gB-${mi}`;
      siteByRow[gA] = "";
      siteByRow[gB] = "";
      data.push({ rowKey: gA });
      data.push({ rowKey: gB });
    }

    // Band spans from this month's leading right-half (`__gB` of the previous gap)
    // to its trailing left-half (`__gA` of the next gap), so the shade tiles to the
    // centre of each gap and the month label centres over the clusters.
    groups.push({
      x1: mi > 0 ? `__gB-${mi - 1}` : rowKeys[0],
      x2: mi < lastMi ? `__gA-${mi}` : rowKeys[rowKeys.length - 1],
      label: monthLabel.get(mkey)!,
    });
  });

  const nameByCode: Record<string, string> = {};
  const legend = siteIds.map((id) => {
    const code = sites.get(id)!;
    nameByCode[code] = siteName.get(id)!;
    return { code, name: siteName.get(id)! };
  });

  return { data, series, groups, siteByRow, monthByRow, nameByCode, legend };
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
          xTooltipFormatter={(rk) => {
            const code = chart.siteByRow[rk] ?? rk;
            return `${chart.nameByCode[code] ?? code} · ${chart.monthByRow[rk] ?? ""}`.trim();
          }}
          xGroups={chart.groups}
        />
        {/* Key: which 3-letter axis code maps to which site. */}
        <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {chart.legend.map((s) => (
            <span key={s.code}>
              <span className="font-medium text-foreground">{s.code}</span> — {s.name}
            </span>
          ))}
        </p>
      </ChartCard>
    </div>
  );
}
