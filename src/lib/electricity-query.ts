import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { isRecordStatus } from "@/lib/record-status";

export type ElectricityFilters = {
  from?: string;
  to?: string;
  siteId?: string;
  supplier?: string;
  status?: string;
};

export function parseElectricityFilters(
  get: (key: string) => string | undefined,
): ElectricityFilters {
  return {
    from: get("from"),
    to: get("to"),
    siteId: get("site"),
    supplier: get("supplier"),
    status: get("status"),
  };
}

export async function buildElectricityWhere(
  user: { id: string; role: Role },
  filters: ElectricityFilters,
): Promise<Prisma.ElectricityRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.ElectricityRecordWhereInput = { ...scope };
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.supplier) where.supplier = filters.supplier;
  if (filters.status && isRecordStatus(filters.status)) {
    where.status = filters.status;
  }
  if (filters.from || filters.to) {
    where.periodStart = {
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
} satisfies Prisma.ElectricityRecordInclude;

export type ElectricityRow = Prisma.ElectricityRecordGetPayload<{
  include: typeof listInclude;
}>;

/** Filtered, role-scoped list of electricity records (newest period first). */
export async function listElectricity(
  user: { id: string; role: Role },
  filters: ElectricityFilters,
): Promise<ElectricityRow[]> {
  const where = await buildElectricityWhere(user, filters);
  return db.electricityRecord.findMany({
    where,
    include: listInclude,
    orderBy: { periodStart: "desc" },
  });
}
