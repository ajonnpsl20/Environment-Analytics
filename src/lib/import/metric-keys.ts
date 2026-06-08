// Plain metric-key constants shared by client (import dialog, connector page) and
// server. No Prisma runtime / no "server-only" so it is safe in client bundles.
// These are the keys used in `src/data/sap-mock.json` and the import registry.

export const METRIC_KEYS = [
  "airEmission",
  "waste",
  "water",
  "electricity",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export const METRIC_LABEL: Record<MetricKey, string> = {
  airEmission: "Air Emissions",
  waste: "Waste",
  water: "Water",
  electricity: "Electricity",
};

/** Label for any feed key, falling back to the raw key if it is unknown. */
export function metricLabel(key: string): string {
  return (METRIC_LABEL as Record<string, string>)[key] ?? key;
}
