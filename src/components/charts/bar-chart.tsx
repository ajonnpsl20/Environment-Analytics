"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
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

// An outer x-axis "tier": one entry per group spanning categories x1..x2 (the
// first/last xKey value in the group). Rendered as a shaded band behind the bars
// with a centred label — e.g. the month grouping the per-site categories below it.
export type XAxisGroup = { x1: string; x2: string; label: string };

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
  xTickFormatter,
  xGroups,
  xTooltipFormatter,
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
  /**
   * Format the inner x-axis tick. Lets the category stay a unique `xKey` value
   * while the tick displays something shorter (e.g. rowKey → site code). Forces
   * every tick to render (interval 0).
   */
  xTickFormatter?: (value: string) => string;
  /** Outer x-axis tier: shaded, labelled month bands grouping the inner ticks. */
  xGroups?: XAxisGroup[];
  /** Format the tooltip title (the hovered category) — e.g. rowKey → "MAN · Jan 2025". */
  xTooltipFormatter?: (value: string) => string;
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
        margin={{ top: xGroups ? 24 : 8, right: 16, bottom: 8, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          tickFormatter={xTickFormatter}
          interval={xTickFormatter ? 0 : undefined}
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
          labelFormatter={
            xTooltipFormatter
              ? (label) => xTooltipFormatter(String(label))
              : undefined
          }
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
        {xGroups?.map((g, i) => (
          <ReferenceArea
            key={`grp-${g.x1}`}
            x1={g.x1}
            x2={g.x2}
            // Shade alternate bands so the month groupings read clearly behind
            // the bars; the un-shaded bands stay transparent.
            fill={i % 2 === 1 ? "var(--color-muted)" : "transparent"}
            fillOpacity={i % 2 === 1 ? 0.7 : 0}
            stroke="none"
            ifOverflow="extendDomain"
            label={{
              value: g.label,
              position: "insideTop",
              style: {
                fontSize: 11,
                fontWeight: 500,
                fill: "var(--color-muted-foreground)",
              },
            }}
          />
        ))}
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
