import "server-only";
import { db } from "@/lib/db";

/** Site IDs a user is assigned to (used to scope data for non-SystemAdmin roles). */
export async function getAssignedSiteIds(userId: string): Promise<string[]> {
  const rows = await db.siteAssignment.findMany({
    where: { userId },
    select: { siteId: true },
  });
  return rows.map((r) => r.siteId);
}
