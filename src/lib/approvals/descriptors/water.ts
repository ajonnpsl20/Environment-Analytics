import "server-only";
import { format } from "date-fns";

import { db } from "@/lib/db";
import { WATER_SOURCE_LABEL, type WaterSourceName } from "@/lib/validations/water";
import {
  defineApprovalDescriptor,
  type ApplyStatusData,
  type ReviewRow,
} from "../types";

async function listPending(scopeWhere: {
  siteId?: { in: string[] };
}): Promise<ReviewRow[]> {
  const rows = await db.waterUsageRecord.findMany({
    where: { status: "SUBMITTED", ...scopeWhere },
    include: {
      site: { select: { name: true, siteId: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    metricKey: "water",
    id: r.id,
    siteCode: r.site.siteId,
    siteName: r.site.name,
    submittedByName: r.submittedBy.name,
    submittedAt: r.createdAt.toISOString(),
    primary: `${r.consumptionM3.toLocaleString()} m³ · ${WATER_SOURCE_LABEL[r.source as WaterSourceName] ?? r.source}`,
    secondary: `${r.meterId} · ${format(r.periodStart, "d MMM")}–${format(r.periodEnd, "d MMM yyyy")}`,
    status: r.status,
  }));
}

async function getForReview(
  id: string,
): Promise<{ id: string; siteId: string; status: string } | null> {
  return db.waterUsageRecord.findUnique({
    where: { id },
    select: { id: true, siteId: true, status: true },
  });
}

async function applyStatus(id: string, data: ApplyStatusData): Promise<unknown> {
  return db.waterUsageRecord.update({ where: { id }, data });
}

export const waterApprovalDescriptor = defineApprovalDescriptor({
  key: "water",
  label: "Water",
  auditEntityType: "WaterUsageRecord",
  listPending,
  getForReview,
  applyStatus,
});
