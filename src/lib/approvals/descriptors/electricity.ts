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
  const rows = await db.electricityRecord.findMany({
    where: { status: "SUBMITTED", ...scopeWhere },
    include: {
      site: { select: { name: true, siteId: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    metricKey: "electricity",
    id: r.id,
    siteCode: r.site.siteId,
    siteName: r.site.name,
    submittedByName: r.submittedBy.name,
    submittedAt: r.createdAt.toISOString(),
    primary: `${r.consumptionKwh.toLocaleString()} kWh${r.renewablePercent != null ? ` · ${r.renewablePercent}% renewable` : ""}`,
    secondary: `${r.meterId} · ${format(r.periodStart, "d MMM")}–${format(r.periodEnd, "d MMM yyyy")}`,
    status: r.status,
  }));
}

async function getForReview(
  id: string,
): Promise<{ id: string; siteId: string; status: string } | null> {
  return db.electricityRecord.findUnique({
    where: { id },
    select: { id: true, siteId: true, status: true },
  });
}

async function applyStatus(id: string, data: ApplyStatusData): Promise<unknown> {
  return db.electricityRecord.update({ where: { id }, data });
}

export const electricityApprovalDescriptor = defineApprovalDescriptor({
  key: "electricity",
  label: "Electricity",
  auditEntityType: "ElectricityRecord",
  listPending,
  getForReview,
  applyStatus,
});
