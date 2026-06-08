import "server-only";
import type { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { getAssignedSiteIds } from "@/lib/site-scope";
import { logAction } from "@/lib/audit";
import type {
  CommitResult,
  MetricDescriptor,
  RawRow,
  ValidateResult,
  ValidRow,
  InvalidRow,
} from "./types";

type Actor = { id: string; role: Role };

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
 * and audit each one. `submittedById` is the record's author (the system user for
 * the connector); `auditUserId` + `notes` record who/why in the audit trail.
 */
export async function commitRows(
  descriptor: MetricDescriptor<unknown>,
  rawRows: RawRow[],
  actingUser: Actor,
  opts: { submittedById: string; auditUserId: string; notes?: string | null },
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

    const record = await descriptor.create(result.data, opts.submittedById);
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
