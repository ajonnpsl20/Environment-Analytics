"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { InteractiveLegend, useSeriesHighlight } from "./interactive-legend";

// Shared line-chart wrapper so all metrics theme consistently (CLAUDE.md: charts
// go through these wrappers, never Recharts directly in pages).

export type LineSeries = { key: string; label: string };

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function LineChart({
  data,
  series,
  xKey,
  height = 320,
  unit,
}: {
  data: Array<Record<string, string | number | null>>;
  series: LineSeries[];
  xKey: string;
  height?: number;
  /** Optional unit shown on the Y-axis (e.g. "mg/m³", "%"). */
  unit?: string;
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
      <RechartsLineChart
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
            <InteractiveLegend
              series={series}
              colorFor={colorFor}
              highlight={highlight}
            />
          }
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={colorFor(i)}
            strokeWidth={2}
            strokeOpacity={highlight.isDimmed(s.key) ? 0.18 : 1}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
