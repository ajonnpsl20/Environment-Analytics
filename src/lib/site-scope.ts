import "server-only";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

/** Site IDs a user is assigned to (used to scope data for non-SystemAdmin roles). */
export async function getAssignedSiteIds(userId: string): Promise<string[]> {
  const rows = await db.siteAssignment.findMany({
    where: { userId },
    select: { siteId: true },
  });
  return rows.map((r) => r.siteId);
}

/**
 * A `{ siteId }` filter fragment scoping metric records by role.
 * - SystemAdmin: `{}` (no restriction).
 * - Others: `{ siteId: { in: assignedSiteIds } }` (empty list ⇒ sees nothing).
 * Shared by all four metric modules' queries and exports.
 */
export async function buildSiteScopeWhere(user: {
  id: string;
  role: Role;
}): Promise<{ siteId?: { in: string[] } }> {
  if (user.role === "SystemAdmin") return {};
  const siteIds = await getAssignedSiteIds(user.id);
  return { siteId: { in: siteIds } };
}

/** Whether a user may submit/edit a record at a given site. */
export async function canAccessSite(
  user: { id: string; role: Role },
  siteId: string,
): Promise<boolean> {
  if (user.role === "SystemAdmin") return true;
  const siteIds = await getAssignedSiteIds(user.id);
  return siteIds.includes(siteId);
}

/** Sites visible to a user, ordered by human-readable site ID. */
export async function getScopedSites(user: { id: string; role: Role }) {
  if (user.role === "SystemAdmin") {
    return db.site.findMany({ orderBy: { siteId: "asc" } });
  }
  const siteIds = await getAssignedSiteIds(user.id);
  return db.site.findMany({
    where: { id: { in: siteIds } },
    orderBy: { siteId: "asc" },
  });
}
