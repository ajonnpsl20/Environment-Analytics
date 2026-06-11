import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { scopedSiteIn } from "@/lib/filter-scope";
import { WATER_SOURCES, type WaterSourceName } from "@/lib/validations/water";

export type WaterFilters = {
  from?: string;
  to?: string;
  siteId?: string[];
  source?: string[];
};

export function parseWaterFilters(
  getAll: (key: string) => string[],
): WaterFilters {
  return {
    from: getAll("from")[0],
    to: getAll("to")[0],
    siteId: getAll("site"),
    source: getAll("source"),
  };
}

export async function buildWaterWhere(
  user: { id: string; role: Role },
  filters: WaterFilters,
): Promise<Prisma.WaterUsageRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.WaterUsageRecordWhereInput = { ...scope };
  const siteIn = scopedSiteIn(filters.siteId, scope);
  if (siteIn) where.siteId = siteIn;
  const sources = (filters.source ?? []).filter((s) =>
    (WATER_SOURCES as readonly string[]).includes(s),
  ) as WaterSourceName[];
  if (sources.length) where.source = { in: sources };
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
} satisfies Prisma.WaterUsageRecordInclude;

export type WaterRow = Prisma.WaterUsageRecordGetPayload<{
  include: typeof listInclude;
}>;

/** Filtered, role-scoped list of water records (newest period first). */
export async function listWater(
  user: { id: string; role: Role },
  filters: WaterFilters,
): Promise<WaterRow[]> {
  const where = await buildWaterWhere(user, filters);
  return db.waterUsageRecord.findMany({
    where,
    include: listInclude,
    orderBy: { periodStart: "desc" },
  });
}
