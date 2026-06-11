import "server-only";
import type { Prisma, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { buildSiteScopeWhere } from "@/lib/site-scope";
import { scopedSiteIn } from "@/lib/filter-scope";
import { WASTE_TYPES, type WasteTypeName } from "@/lib/validations/waste";

export type WasteFilters = {
  from?: string;
  to?: string;
  siteId?: string[];
  wasteType?: string[];
};

export function parseWasteFilters(
  getAll: (key: string) => string[],
): WasteFilters {
  return {
    from: getAll("from")[0],
    to: getAll("to")[0],
    siteId: getAll("site"),
    wasteType: getAll("wasteType"),
  };
}

export async function buildWasteWhere(
  user: { id: string; role: Role },
  filters: WasteFilters,
): Promise<Prisma.WasteRecordWhereInput> {
  const scope = await buildSiteScopeWhere(user);

  const where: Prisma.WasteRecordWhereInput = { ...scope };
  const siteIn = scopedSiteIn(filters.siteId, scope);
  if (siteIn) where.siteId = siteIn;
  const types = (filters.wasteType ?? []).filter((t) =>
    (WASTE_TYPES as readonly string[]).includes(t),
  ) as WasteTypeName[];
  if (types.length) where.wasteType = { in: types };
  if (filters.from || filters.to) {
    where.transferDate = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}),
    };
  }

  return where;
}

const listInclude = {
  site: { select: { name: true, siteId: true } },
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
