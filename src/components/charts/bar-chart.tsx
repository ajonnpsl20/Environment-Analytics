"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { InteractiveLegend, useSeriesHighlight } from "./interactive-legend";

// Shared bar-chart wrapper (Waste/Water/Electricity dashboards), themed to match
// the LineChart wrapper. Charts go through these wrappers, never Recharts directly.
//
// Series may carry an optional per-series `color`, `stackId`, and `opacity`. A
// per-series `stackId` enables grouped-AND-stacked layouts (e.g. electricity: one
// bar per site, each stacked renewable/non-renewable). When many series map to a
// few meanings, pass `legendItems` to show a compact static legend instead of the
// interactive per-series one.

export type BarSeries = {
  key: string;
  label: string;
  /** Override the palette colour for this series. */
  color?: string;
  /** Bars sharing a stackId stack together; different ids render side-by-side. */
  stackId?: string;
  /** Base fill opacity (e.g. fade the non-renewable half of a stack). */
  opacity?: number;
};

export type LegendItem = { label: string; color: string };

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function StaticLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-[0.8125rem]">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-[2px]"
            style={{ background: it.color }}
          />
          <span className="text-muted-foreground">{it.label}</span>
        </span>
      ))}
    </div>
  );
}

export function BarChart({
  data,
  series,
  xKey,
  stacked = false,
  height = 320,
  unit,
  legendItems,
}: {
  data: Array<Record<string, string | number | null>>;
  series: BarSeries[];
  xKey: string;
  stacked?: boolean;
  height?: number;
  /** Optional unit shown on the Y-axis (e.g. "kg", "m³", "kWh"). */
  unit?: string;
  /** Compact static legend; when set it replaces the interactive per-series one. */
  legendItems?: LegendItem[];
}) {
  const highlight = useSeriesHighlight();

  if (data.length === 0 || series.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No data for the selected filters.
      </div>
    );
  }

  const colorFor = (i: number) => CHART_COLORS[i % CHART_COLORS.length];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          width={unit ? 68 : 56}
          label={
            unit
              ? {
                  value: unit,
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fontSize: 12,
                    fill: "var(--color-muted-foreground)",
                    textAnchor: "middle",
                  },
                }
              : undefined
          }
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            fontSize: "0.8125rem",
            color: "var(--color-popover-foreground)",
          }}
        />
        <Legend
          content={
            legendItems ? (
              <StaticLegend items={legendItems} />
            ) : (
              <InteractiveLegend
                series={series}
                colorFor={colorFor}
                highlight={highlight}
              />
            )
          }
        />
        {series.map((s, i) => {
          const isStacked = s.stackId != null || stacked;
          const dim = legendItems ? 1 : highlight.isDimmed(s.key) ? 0.18 : 1;
          return (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={s.stackId ?? (stacked ? "stack" : undefined)}
              fill={s.color ?? colorFor(i)}
              fillOpacity={(s.opacity ?? 1) * dim}
              radius={isStacked ? 0 : 4}
              isAnimationActive={false}
            />
          );
        })}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
