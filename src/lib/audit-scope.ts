import "server-only";
import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getAssignedSiteIds } from "@/lib/site-scope";

/**
 * Restrict audit-log visibility by role.
 * - SystemAdmin: all entries.
 * - SiteAdmin (and others): AuditLog has no siteId, so we approximate "assigned
 *   sites only" as entries authored by users who share at least one assigned site.
 *   Extend this (e.g. resolve entityId → site) when metric entities are added.
 */
export async function buildAuditScopeWhere(user: {
  id: string;
  role: Role;
}): Promise<Prisma.AuditLogWhereInput> {
  if (user.role === "SystemAdmin") return {};

  const siteIds = await getAssignedSiteIds(user.id);
  if (siteIds.length === 0) return { userId: user.id };

  const peers = await db.siteAssignment.findMany({
    where: { siteId: { in: siteIds } },
    select: { userId: true },
  });
  const userIds = Array.from(new Set([user.id, ...peers.map((p) => p.userId)]));
  return { userId: { in: userIds } };
}
