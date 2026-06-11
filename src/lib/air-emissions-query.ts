import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { scopedSiteIn } from "@/lib/filter-scope";

export type AirEmissionFilters = {
  from?: string;
  to?: string;
  siteId?: string[];
  pollutant?: string[];
};

/** Read the metric's filter params out of a multi-value accessor. */
export function parseAirEmissionFilters(
  getAll: (key: string) => string[],
): AirEmissionFilters {
  return {
    from: getAll("from")[0],
    to: getAll("to")[0],
    siteId: getAll("site"),
    pollutant: getAll("pollutant"),
  };
}

/** Build the Prisma `where` combining role scope and the active filters. */
export async function buildAirEmissionWhere(
  user: { id: string; role: Role },
  filters: AirEmissionFilters,
): Promise<Prisma.AirEmissionRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.AirEmissionRecordWhereInput = { ...scope };
  const siteIn = scopedSiteIn(filters.siteId, scope);
  if (siteIn) where.siteId = siteIn;
  if (filters.pollutant?.length) where.pollutantType = { in: filters.pollutant };
  if (filters.from || filters.to) {
    where.measuredAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}),
    };
  }

  return where;
}

const listInclude = {
  site: { select: { name: true, siteId: true } },
} satisfies Prisma.AirEmissionRecordInclude;

export type AirEmissionRow = Prisma.AirEmissionRecordGetPayload<{
  include: typeof listInclude;
}>;

/** Filtered, role-scoped list of air-emission records (newest measurement first). */
export async function listAirEmissions(
  user: { id: string; role: Role },
  filters: AirEmissionFilters,
): Promise<AirEmissionRow[]> {
  const where = await buildAirEmissionWhere(user, filters);
  return db.airEmissionRecord.findMany({
    where,
    include: listInclude,
    orderBy: { measuredAt: "desc" },
  });
}
