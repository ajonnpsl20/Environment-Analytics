import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { isRecordStatus } from "@/lib/record-status";
import { WASTE_TYPES, type WasteTypeName } from "@/lib/validations/waste";

export type WasteFilters = {
  from?: string;
  to?: string;
  siteId?: string;
  wasteType?: string;
  status?: string;
};

export function parseWasteFilters(
  get: (key: string) => string | undefined,
): WasteFilters {
  return {
    from: get("from"),
    to: get("to"),
    siteId: get("site"),
    wasteType: get("wasteType"),
    status: get("status"),
  };
}

export async function buildWasteWhere(
  user: { id: string; role: Role },
  filters: WasteFilters,
): Promise<Prisma.WasteRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.WasteRecordWhereInput = { ...scope };
  if (filters.siteId) where.siteId = filters.siteId;
  if (
    filters.wasteType &&
    (WASTE_TYPES as readonly string[]).includes(filters.wasteType)
  ) {
    where.wasteType = filters.wasteType as WasteTypeName;
  }
  if (filters.status && isRecordStatus(filters.status)) {
    where.status = filters.status;
  }
  if (filters.from || filters.to) {
    where.transferDate = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}),
    };
  }

  // A non-SystemAdmin with an explicit site filter must stay within scope.
  if (filters.siteId && scope.siteId && !scope.siteId.in.includes(filters.siteId)) {
    where.siteId = { in: [] };
  }

  return where;
}

const listInclude = {
  site: { select: { name: true, siteId: true } },
  submittedBy: { select: { name: true } },
  approvedBy: { select: { name: true } },
} satisfies Prisma.WasteRecordInclude;

export type WasteRow = Prisma.WasteRecordGetPayload<{
  include: typeof listInclude;
}>;

/** Filtered, role-scoped list of waste records (newest transfer first). */
export async function listWaste(
  user: { id: string; role: Role },
  filters: WasteFilters,
): Promise<WasteRow[]> {
  const where = await buildWasteWhere(user, filters);
  return db.wasteRecord.findMany({
    where,
    include: listInclude,
    orderBy: { transferDate: "desc" },
  });
}
