import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { scopedSiteIn } from "@/lib/filter-scope";

export type ElectricityFilters = {
  from?: string;
  to?: string;
  siteId?: string[];
  supplier?: string[];
};

export function parseElectricityFilters(
  getAll: (key: string) => string[],
): ElectricityFilters {
  return {
    from: getAll("from")[0],
    to: getAll("to")[0],
    siteId: getAll("site"),
    supplier: getAll("supplier"),
  };
}

export async function buildElectricityWhere(
  user: { id: string; role: Role },
  filters: ElectricityFilters,
): Promise<Prisma.ElectricityRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.ElectricityRecordWhereInput = { ...scope };
  const siteIn = scopedSiteIn(filters.siteId, scope);
  if (siteIn) where.siteId = siteIn;
  if (filters.supplier?.length) where.supplier = { in: filters.supplier };
  if (filters.from || filters.to) {
    where.periodStart = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}),
    };
  }

  return where;
}

const listInclude = {
  site: { select: { name: true, siteId: true } },
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
