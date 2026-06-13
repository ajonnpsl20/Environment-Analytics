import "server-only";
import { createHash } from "node:crypto";
import type { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { getAssignedSiteIds } from "@/lib/site-scope";
import { logAction } from "@/lib/audit";
import type {
  CommitResult,
  ConnectorRecordRef,
  MetricDescriptor,
  RawRow,
  ReconcileResult,
  ValidateResult,
  ValidRow,
  InvalidRow,
} from "./types";

type Actor = { id: string; role: Role };

// The feed column carrying the source system's external key. It is NOT in any
// descriptor's `columns`, so `normalize` ignores it and it never enters the
// business schema — the reconcile engine reads it from the raw row directly.
const SOURCE_REF_HEADER = "Source Ref";

// Deterministic hash of a record's business fields, to detect changes between
// syncs. Inputs are flat objects; the sorted-key replacer + ISO date serialisation
// make the result stable across runs.
function hashInput(data: unknown): string {
  const keys = Object.keys(data as Record<string, unknown>).sort();
  return createHash("sha256").update(JSON.stringify(data, keys)).digest("hex");
}

/** Map of human-readable Site code (e.g. "MAN-001") → Site.id cuid (one query). */
async function buildSiteIndex(): Promise<Map<string, string>> {
  const sites = await db.site.findMany({ select: { id: true, siteId: true } });
  return new Map(sites.map((s) => [s.siteId, s.id]));
}

/** A site-access predicate resolved once per file (avoids a query per row). */
async function buildAccess(user: Actor): Promise<(siteId: string) => boolean> {
  if (user.role === "SystemAdmin") return () => true;
  const allowed = new Set(await getAssignedSiteIds(user.id));
  return (siteId) => allowed.has(siteId);
}

/**
 * Validate every row WITHOUT writing. Rows that normalize cleanly but target a
 * site the user can't access are reported as errors so the preview is honest.
 */
export async function validateRows(
  descriptor: MetricDescriptor<unknown>,
  rows: RawRow[],
  user: Actor,
): Promise<ValidateResult<unknown>> {
  const siteIdByCode = await buildSiteIndex();
  const access = await buildAccess(user);

  const valid: ValidRow<unknown>[] = [];
  const errors: InvalidRow[] = [];

  rows.forEach((raw, i) => {
    const rowNumber = i + 1;
    const result = descriptor.normalize(raw, { siteIdByCode });
    if (!result.ok) {
      errors.push({ ok: false, rowNumber, messages: result.messages, raw });
      return;
    }
    if (!access(result.siteId)) {
      errors.push({
        ok: false,
        rowNumber,
        messages: ["You are not assigned to this site."],
        raw,
      });
      return;
    }
    valid.push({ ok: true, rowNumber, data: result.data, siteId: result.siteId, raw });
  });

  return { metricKey: descriptor.key, valid, errors, totalRows: rows.length };
}

/**
 * Re-validate raw rows from scratch (never trust the client), create the records,
 * and audit each one. `auditUserId` + `notes` record who/why in the audit trail.
 */
export async function commitRows(
  descriptor: MetricDescriptor<unknown>,
  rawRows: RawRow[],
  actingUser: Actor,
  opts: { auditUserId: string; notes?: string | null },
): Promise<CommitResult> {
  const siteIdByCode = await buildSiteIndex();
  const access = await buildAccess(actingUser);

  let created = 0;
  const skippedReasons: CommitResult["skippedReasons"] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 1;
    const result = descriptor.normalize(rawRows[i], { siteIdByCode });
    if (!result.ok) {
      skippedReasons.push({ rowNumber, messages: result.messages });
      continue;
    }
    if (!access(result.siteId)) {
      skippedReasons.push({
        rowNumber,
        messages: ["You are not assigned to this site."],
      });
      continue;
    }

    const record = await descriptor.create(result.data);
    await logAction({
      entityType: descriptor.auditEntityType,
      entityId: record.id,
      action: "IMPORTED",
      userId: opts.auditUserId,
      notes: opts.notes ?? null,
      after: result.data,
    });
    created++;
  }

  return { created, skipped: skippedReasons.length, skippedReasons };
}

/**
 * Reconcile a connector feed against the connector-owned records (sourceRef set):
 * insert new (IMPORTED), update changed (EDITED), delete those gone from the feed
 * (DELETED), and skip unchanged silently (no audit). Manually-entered records
 * (sourceRef = null) are never read, updated, or deleted. Used by the SAP connector.
 */
export async function reconcileRows(
  descriptor: MetricDescriptor<unknown>,
  rawRows: RawRow[],
  actingUser: Actor,
  opts: { auditUserId: string; notes?: string | null },
): Promise<ReconcileResult> {
  const siteIdByCode = await buildSiteIndex();
  const access = await buildAccess(actingUser);

  const existing = new Map<string, ConnectorRecordRef>();
  for (const rec of await descriptor.listConnector()) existing.set(rec.sourceRef, rec);

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const seen = new Set<string>();
  const skippedReasons: ReconcileResult["skippedReasons"] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 1;
    const raw = rawRows[i];
    const refCell = raw[SOURCE_REF_HEADER];
    const sourceRef = refCell == null ? "" : String(refCell).trim();
    if (!sourceRef) {
      skippedReasons.push({
        rowNumber,
        messages: [`${SOURCE_REF_HEADER} is required`],
      });
      continue;
    }

    const result = descriptor.normalize(raw, { siteIdByCode });
    if (!result.ok) {
      skippedReasons.push({ rowNumber, messages: result.messages });
      continue;
    }
    if (!access(result.siteId)) {
      skippedReasons.push({
        rowNumber,
        messages: ["You are not assigned to this site."],
      });
      continue;
    }

    seen.add(sourceRef);
    const sourceHash = hashInput(result.data);
    const prior = existing.get(sourceRef);

    if (!prior) {
      const rec = await descriptor.create(result.data, { sourceRef, sourceHash });
      await logAction({
        entityType: descriptor.auditEntityType,
        entityId: rec.id,
        action: "IMPORTED",
        userId: opts.auditUserId,
        notes: opts.notes ?? null,
        after: result.data,
      });
      created++;
    } else if (prior.sourceHash !== sourceHash) {
      const rec = await descriptor.update(prior.id, result.data, {
        sourceRef,
        sourceHash,
      });
      await logAction({
        entityType: descriptor.auditEntityType,
        entityId: rec.id,
        action: "EDITED",
        userId: opts.auditUserId,
        notes: opts.notes ?? null,
        after: result.data,
      });
      updated++;
    } else {
      unchanged++; // identical → no write, no audit entry
    }
  }

  // Connector-owned records absent from this feed were removed at source.
  let deleted = 0;
  for (const [ref, rec] of existing) {
    if (seen.has(ref)) continue;
    const before = await descriptor.remove(rec.id);
    await logAction({
      entityType: descriptor.auditEntityType,
      entityId: rec.id,
      action: "DELETED",
      userId: opts.auditUserId,
      notes: opts.notes ?? null,
      before,
    });
    deleted++;
  }

  return {
    created,
    updated,
    deleted,
    unchanged,
    skipped: skippedReasons.length,
    skippedReasons,
  };
}
