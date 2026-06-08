import "server-only";
import type { Role } from "@prisma/client";

import { buildSiteScopeWhere, canAccessSite } from "@/lib/site-scope";
import { logAction } from "@/lib/audit";
import { METRIC_KEYS, metricLabel } from "@/lib/import/metric-keys";
import {
  getApprovalDescriptor,
} from "./registry";
import type { ApprovalAction, PendingQueue } from "./types";

type Actor = { id: string; role: Role };
type TransitionResult = { ok: true } | { ok: false; error: string };

/**
 * Pending queues for every metric (registered or not), scoped to the user's
 * sites. Unregistered metrics return an empty queue so the page can show a
 * "module not built yet" tab — the roadmap is visible (mirrors the connector page).
 */
export async function listPendingForUser(
  user: Actor,
): Promise<PendingQueue[]> {
  const scopeWhere = await buildSiteScopeWhere(user);

  return Promise.all(
    METRIC_KEYS.map(async (metricKey) => {
      const descriptor = getApprovalDescriptor(metricKey);
      const rows = descriptor ? await descriptor.listPending(scopeWhere) : [];
      return {
        metricKey,
        label: metricLabel(metricKey),
        registered: Boolean(descriptor),
        rows,
        count: rows.length,
      };
    }),
  );
}

const AUDIT_BY_ACTION = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  RETURN: "RETURNED",
} as const;

/**
 * Move one submitted record to approved/rejected/returned, with audit. Guards, in
 * order: descriptor exists → record exists & in the actor's site scope → still
 * SUBMITTED (catches a concurrent admin actioning it first).
 */
export async function transition(
  metricKey: string,
  id: string,
  action: ApprovalAction,
  actor: Actor,
  notes?: string | null,
): Promise<TransitionResult> {
  const descriptor = getApprovalDescriptor(metricKey);
  if (!descriptor) {
    return { ok: false, error: "This metric is not available for approval yet." };
  }

  const record = await descriptor.getForReview(id);
  if (!record || !(await canAccessSite(actor, record.siteId))) {
    return { ok: false, error: "Record not found." };
  }
  if (record.status !== "SUBMITTED") {
    return {
      ok: false,
      error: "This record was already actioned by someone else.",
    };
  }

  const data =
    action === "APPROVE"
      ? { status: "APPROVED" as const, approvedById: actor.id, approvedAt: new Date() }
      : {
          status: (action === "REJECT" ? "REJECTED" : "RETURNED") as
            | "REJECTED"
            | "RETURNED",
          approvedById: null,
          approvedAt: null,
        };

  const after = await descriptor.applyStatus(id, data);

  await logAction({
    entityType: descriptor.auditEntityType,
    entityId: id,
    action: AUDIT_BY_ACTION[action],
    userId: actor.id,
    before: record,
    after,
    notes: notes ?? null,
  });

  return { ok: true };
}
