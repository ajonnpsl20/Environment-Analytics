import "server-only";
import { format } from "date-fns";

import { db } from "@/lib/db";
import {
  defineApprovalDescriptor,
  type ApplyStatusData,
  type ReviewRow,
} from "../types";

async function listPending(scopeWhere: {
  siteId?: { in: string[] };
}): Promise<ReviewRow[]> {
  const rows = await db.airEmissionRecord.findMany({
    where: { status: "SUBMITTED", ...scopeWhere },
    include: {
      site: { select: { name: true, siteId: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" }, // oldest first = review-queue order
  });

  return rows.map((r) => ({
    metricKey: "airEmission",
    id: r.id,
    siteCode: r.site.siteId,
    siteName: r.site.name,
    submittedByName: r.submittedBy.name,
    submittedAt: r.createdAt.toISOString(),
    primary: `${r.pollutantType} · ${r.concentration.toLocaleString()} ${r.concentrationUnit}`,
    secondary: `Stack ${r.stackId} · ${format(r.measuredAt, "d MMM yyyy")}`,
    status: r.status,
  }));
}

async function getForReview(
  id: string,
): Promise<{ id: string; siteId: string; status: string } | null> {
  return db.airEmissionRecord.findUnique({
    where: { id },
    select: { id: true, siteId: true, status: true },
  });
}

async function applyStatus(id: string, data: ApplyStatusData): Promise<unknown> {
  return db.airEmissionRecord.update({ where: { id }, data });
}

export const airEmissionApprovalDescriptor = defineApprovalDescriptor({
  key: "airEmission",
  label: "Air Emissions",
  auditEntityType: "AirEmissionRecord",
  listPending,
  getForReview,
  applyStatus,
});
