"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import type { AirEmissionRow } from "./columns";

type ChartData = Array<Record<string, string | number | null>>;

type PollutantChart = { pollutant: string; unit?: string; data: ChartData };

// One chart per pollutant: a single line of the monthly AVERAGE concentration
// across all (filtered) sites. Splitting by pollutant keeps each chart's Y-axis
// in a single unit/scale instead of mixing CO2 with PM2.5 on one axis.
function buildByPollutant(records: AirEmissionRow[]): PollutantChart[] {
  const byPollutant = new Map<string, AirEmissionRow[]>();
  for (const r of records) {
    const arr = byPollutant.get(r.pollutantType) ?? [];
    arr.push(r);
    byPollutant.set(r.pollutantType, arr);
  }

  return [...byPollutant.keys()].sort().map((pollutant) => {
    const rows = byPollutant.get(pollutant)!;
    const byMonth = new Map<string, { label: string; sum: number; count: number }>();
    for (const r of rows) {
      const key = format(r.measuredAt, "yyyy-MM");
      let b = byMonth.get(key);
      if (!b) {
        b = { label: format(r.measuredAt, "MMM yyyy"), sum: 0, count: 0 };
        byMonth.set(key, b);
      }
      b.sum += r.concentration;
      b.count += 1;
    }
    const data: ChartData = [...byMonth.keys()].sort().map((k) => {
      const b = byMonth.get(k)!;
      return { month: b.label, value: Math.round((b.sum / b.count) * 100) / 100 };
    });
    const units = new Set(rows.map((r) => r.concentrationUnit));
    const unit = units.size === 1 ? [...units][0] : undefined;
    return { pollutant, unit, data };
  });
}

export function AirEmissionDashboard({
  records,
}: {
  records: AirEmissionRow[];
}) {
  const charts = useMemo(() => buildByPollutant(records), [records]);

  if (charts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
        No data for the selected filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {charts.map((c) => (
        <ChartCard
          key={c.pollutant}
          title={`${c.pollutant} concentration over time`}
          description="Monthly average across the filtered sites."
        >
          <LineChart
            data={c.data}
            series={[{ key: "value", label: c.pollutant }]}
            xKey="month"
            unit={c.unit}
            height={260}
          />
        </ChartCard>
      ))}
    </div>
  );
}
