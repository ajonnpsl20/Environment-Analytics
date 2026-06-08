import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { isRecordStatus } from "@/lib/record-status";
import { WATER_SOURCES, type WaterSourceName } from "@/lib/validations/water";

export type WaterFilters = {
  from?: string;
  to?: string;
  siteId?: string;
  source?: string;
  status?: string;
};

export function parseWaterFilters(
  get: (key: string) => string | undefined,
): WaterFilters {
  return {
    from: get("from"),
    to: get("to"),
    siteId: get("site"),
    source: get("source"),
    status: get("status"),
  };
}

export async function buildWaterWhere(
  user: { id: string; role: Role },
  filters: WaterFilters,
): Promise<Prisma.WaterUsageRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.WaterUsageRecordWhereInput = { ...scope };
  if (filters.siteId) where.siteId = filters.siteId;
  if (
    filters.source &&
    (WATER_SOURCES as readonly string[]).includes(filters.source)
  ) {
    where.source = filters.source as WaterSourceName;
  }
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
