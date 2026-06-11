// Shared helper for the metric queries: resolve a multi-select `site` filter
// against the user's role-based site scope. Returns the Prisma `{ in: [...] }`
// fragment to assign to `where.siteId`, or undefined when no site filter is set
// (in which case the caller's spread of the scope `where` already applies).
export function scopedSiteIn(
  requested: string[] | undefined,
  scope: { siteId?: { in: string[] } },
): { in: string[] } | undefined {
  if (!requested || requested.length === 0) return undefined;
  // SystemAdmin (no scope) ⇒ use the request as-is; scoped roles ⇒ intersect
  // the request with their assigned sites so they can't widen their access.
  if (!scope.siteId) return { in: requested };
  const allowed = new Set(scope.siteId.in);
  return { in: requested.filter((s) => allowed.has(s)) };
}
