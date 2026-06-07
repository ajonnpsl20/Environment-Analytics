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

export const metadata: Metadata = { title: "Audit Log" };
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
  const getStr = (k: string) =>
    typeof sp[k] === "string" && sp[k] !== "" ? (sp[k] as string) : undefined;

  const rawAction = getStr("action");
  const action = rawAction && isAuditAction(rawAction) ? rawAction : undefined;
  const entityType = getStr("entityType");
  const userId = getStr("user");
  const from = getStr("from");
  const to = getStr("to");
  const page = Math.max(1, Number(getStr("page") ?? "1") || 1);

  const filters: Prisma.AuditLogWhereInput = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (userId) filters.userId = userId;
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
    if (action) next.set("action", action);
    if (entityType) next.set("entityType", entityType);
    if (userId) next.set("user", userId);
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
          Audit Log
        </h2>
        <p className="text-sm text-muted-foreground">
          Every change to records and sites is recorded here.
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
