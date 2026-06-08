// Per-metric approval abstraction, mirroring src/lib/import/. Adding a metric =
// author one descriptor + add one registry line; the engine, actions, page and
// columns never change. TYPES are client-safe (no Prisma runtime, no
// "server-only") so the columns/client can import ReviewRow.

export type ApprovalAction = "APPROVE" | "REJECT" | "RETURN";

/** A pending record flattened to a uniform shape every metric's queue renders. */
export type ReviewRow = {
  metricKey: string;
  id: string;
  siteCode: string; // human Site.siteId, e.g. "MAN-001"
  siteName: string;
  submittedByName: string;
  submittedAt: string; // ISO string (Date serialized at the server boundary)
  primary: string; // e.g. "NOx · 182.4 mg/m³"
  secondary: string; // e.g. "Stack STK-1 · 3 Nov 2025"
  status: string; // always "SUBMITTED" in the queue; carried for the badge
};

export type ApplyStatusData = {
  status: "APPROVED" | "REJECTED" | "RETURNED";
  approvedById: string | null;
  approvedAt: Date | null;
};

/** One metric's pending queue, built for every METRIC_KEYS entry (registered or not). */
export type PendingQueue = {
  metricKey: string;
  label: string;
  registered: boolean;
  rows: ReviewRow[];
  count: number;
};

/**
 * Metric-specific DB ops; everything else (guards, audit, scoping) is generic in
 * engine.ts. The descriptor itself is only imported by the server-only registry.
 */
export type ApprovalDescriptor = {
  key: string; // matches METRIC_KEYS, e.g. "airEmission"
  label: string;
  auditEntityType: string; // e.g. "AirEmissionRecord"
  listPending: (scopeWhere: { siteId?: { in: string[] } }) => Promise<ReviewRow[]>;
  getForReview: (
    id: string,
  ) => Promise<{ id: string; siteId: string; status: string } | null>;
  applyStatus: (id: string, data: ApplyStatusData) => Promise<unknown>;
};

/** Registration helper — identity, kept for parity with import's defineDescriptor. */
export function defineApprovalDescriptor(
  descriptor: ApprovalDescriptor,
): ApprovalDescriptor {
  return descriptor;
}
