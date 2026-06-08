import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { isRecordStatus } from "@/lib/record-status";

export type AirEmissionFilters = {
  from?: string;
  to?: string;
  siteId?: string;
  pollutant?: string;
  status?: string;
};

/** Read the metric's filter params out of a URLSearchParams-like accessor. */
export function parseAirEmissionFilters(
  get: (key: string) => string | undefined,
): AirEmissionFilters {
  return {
    from: get("from"),
    to: get("to"),
    siteId: get("site"),
    pollutant: get("pollutant"),
    status: get("status"),
  };
}

/** Build the Prisma `where` combining role scope and the active filters. */
export async function buildAirEmissionWhere(
  user: { id: string; role: Role },
  filters: AirEmissionFilters,
): Promise<Prisma.AirEmissionRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.AirEmissionRecordWhereInput = { ...scope };
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.pollutant) where.pollutantType = filters.pollutant;
  if (filters.status && isRecordStatus(filters.status)) {
    where.status = filters.status;
  }
  if (filters.from || filters.to) {
    where.measuredAt = {
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
