import "server-only";
import { format } from "date-fns";

import { db } from "@/lib/db";
import { WASTE_TYPE_LABEL, type WasteTypeName } from "@/lib/validations/waste";
import {
  defineApprovalDescriptor,
  type ApplyStatusData,
  type ReviewRow,
} from "../types";

async function listPending(scopeWhere: {
  siteId?: { in: string[] };
}): Promise<ReviewRow[]> {
  const rows = await db.wasteRecord.findMany({
    where: { status: "SUBMITTED", ...scopeWhere },
    include: {
      site: { select: { name: true, siteId: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    metricKey: "waste",
    id: r.id,
    siteCode: r.site.siteId,
    siteName: r.site.name,
    submittedByName: r.submittedBy.name,
    submittedAt: r.createdAt.toISOString(),
    primary: `${WASTE_TYPE_LABEL[r.wasteType as WasteTypeName] ?? r.wasteType} · ${r.weightKg.toLocaleString()} kg`,
    secondary: `${r.streamCategory} · ${format(r.transferDate, "d MMM yyyy")}`,
    status: r.status,
  }));
}

async function getForReview(
  id: string,
): Promise<{ id: string; siteId: string; status: string } | null> {
  return db.wasteRecord.findUnique({
    where: { id },
    select: { id: true, siteId: true, status: true },
  });
}

async function applyStatus(id: string, data: ApplyStatusData): Promise<unknown> {
  return db.wasteRecord.update({ where: { id }, data });
}

export const wasteApprovalDescriptor = defineApprovalDescriptor({
  key: "waste",
  label: "Waste",
  auditEntityType: "WasteRecord",
  listPending,
  getForReview,
  applyStatus,
});
