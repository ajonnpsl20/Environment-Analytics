import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Database,
  Hourglass,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "there").split(" ")[0];

  const [
    sites,
    air,
    waste,
    water,
    elec,
    pendingAir,
    pendingWaste,
    pendingWater,
    pendingElec,
    audits,
  ] = await Promise.all([
    db.site.count(),
    db.airEmissionRecord.count(),
    db.wasteRecord.count(),
    db.waterUsageRecord.count(),
    db.electricityRecord.count(),
    db.airEmissionRecord.count({ where: { status: "SUBMITTED" } }),
    db.wasteRecord.count({ where: { status: "SUBMITTED" } }),
    db.waterUsageRecord.count({ where: { status: "SUBMITTED" } }),
    db.electricityRecord.count({ where: { status: "SUBMITTED" } }),
    db.auditLog.count(),
  ]);

  const totalRecords = air + waste + water + elec;
  const pending = pendingAir + pendingWaste + pendingWater + pendingElec;
  const canApprove = session?.user
    ? can(session.user.role, "approve_records")
    : false;

  type Kpi = {
    label: string;
    value: string | number;
    icon: LucideIcon;
    hint: string;
    href?: string;
  };

  const kpis: Kpi[] = [
    { label: "Sites", value: sites, icon: Building2, hint: "Active facilities" },
    {
      label: "Records",
      value: totalRecords.toLocaleString(),
      icon: Database,
      hint: "Across all metrics",
    },
    {
      label: "Pending review",
      value: pending.toLocaleString(),
      icon: Hourglass,
      hint: "Submitted, awaiting approval",
      // Reviewers can jump straight to the queue.
      href: canApprove ? "/approvals" : undefined,
    },
    {
      label: "Audit events",
      value: audits.toLocaleString(),
      icon: ScrollText,
      hint: "Logged changes",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Overview of your environmental data across all sites.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          const card = (
            <Card
              className={k.href ? "transition-colors hover:bg-muted/50" : undefined}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  {k.label}
                  <Icon className="size-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-3xl font-semibold tabular-nums">
                  {k.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
              </CardContent>
            </Card>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={k.label}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
