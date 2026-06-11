import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buildAuditScopeWhere } from "@/lib/audit-scope";
import { isAuditAction } from "@/lib/audit-constants";
import { AccessDenied } from "@/components/layout/access-denied";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { auditColumns } from "./columns";
import { AuditFilters } from "./audit-filters";

export const metadata: Metadata = { title: "Data Entry Log" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "view_audit_log")) {
    return <AccessDenied />;
  }

  const sp = await searchParams;
  const getAll = (k: string): string[] => {
    const v = sp[k];
    if (Array.isArray(v)) return v.filter((s) => s !== "");
    return typeof v === "string" && v !== "" ? [v] : [];
  };

  const actions = getAll("action").filter(isAuditAction);
  const entityTypes = getAll("entityType");
  const userIds = getAll("user");
  const from = getAll("from")[0];
  const to = getAll("to")[0];
  const page = Math.max(1, Number(getAll("page")[0] ?? "1") || 1);

  const filters: Prisma.AuditLogWhereInput = {};
  if (actions.length) filters.action = { in: actions };
  if (entityTypes.length) filters.entityType = { in: entityTypes };
  if (userIds.length) filters.userId = { in: userIds };
  if (from || to) {
    filters.timestamp = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
    };
  }

  const scope = await buildAuditScopeWhere(session.user);
  const where: Prisma.AuditLogWhereInput = { AND: [scope, filters] };

  const [rows, total, users] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
    db.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(target: number) {
    const next = new URLSearchParams();
    actions.forEach((a) => next.append("action", a));
    entityTypes.forEach((e) => next.append("entityType", e));
    userIds.forEach((u) => next.append("user", u));
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `/audit-log?${qs}` : "/audit-log";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Data Entry Log
        </h2>
        <p className="text-sm text-muted-foreground">
          Every record created, edited, imported, or deleted is recorded here.
        </p>
      </div>

      <Suspense
        fallback={<div className="h-16 rounded-lg border bg-card" />}
      >
        <AuditFilters users={users} />
      </Suspense>

      <DataTable
        columns={auditColumns}
        data={rows}
        pageSize={PAGE_SIZE}
        emptyMessage="No audit events match these filters."
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} event{total === 1 ? "" : "s"} · Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={pageHref(page - 1)} />}
            >
              Previous
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {page < totalPages ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={pageHref(page + 1)} />}
            >
              Next
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
