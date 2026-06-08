import "server-only";
import sapMock from "@/data/sap-mock.json";
import type { RawRow } from "./types";

// Single accessor for the mock SAP feed. The feed is keyed by metric descriptor
// key and is intentionally open-ended: it may contain metrics that have no
// importer yet (the connector detects and reports those as "not configured").
const FEED = sapMock as Record<string, RawRow[]>;

export function getSapMetricKeys(): string[] {
  return Object.keys(FEED);
}

export function getSapMetricRows(key: string): RawRow[] {
  const rows = FEED[key];
  return Array.isArray(rows) ? rows : [];
}

/** Per-metric row counts, for rendering the connector's detected feed contents. */
export function getSapFeedSummary(): { key: string; count: number }[] {
  return getSapMetricKeys().map((key) => ({ key, count: getSapMetricRows(key).length }));
}
