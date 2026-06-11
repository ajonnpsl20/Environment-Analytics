import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { scopedSiteIn } from "@/lib/filter-scope";

export type GasFilters = {
  from?: string;
  to?: string;
  siteId?: string[];
};

export function parseGasFilters(
  getAll: (key: string) => string[],
): GasFilters {
  return {
    from: getAll("from")[0],
    to: getAll("to")[0],
    siteId: getAll("site"),
  };
}

export async function buildGasWhere(
  user: { id: string; role: Role },
  filters: GasFilters,
): Promise<Prisma.GasRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.GasRecordWhereInput = { ...scope };
  const siteIn = scopedSiteIn(filters.siteId, scope);
  if (siteIn) where.siteId = siteIn;
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
} satisfies Prisma.GasRecordInclude;

export type GasRow = Prisma.GasRecordGetPayload<{
  include: typeof listInclude;
}>;

/** Filtered, role-scoped list of gas records (newest period first). */
export async function listGas(
  user: { id: string; role: Role },
  filters: GasFilters,
): Promise<GasRow[]> {
  const where = await buildGasWhere(user, filters);
  return db.gasRecord.findMany({
    where,
    include: listInclude,
    orderBy: { periodStart: "desc" },
  });
}
