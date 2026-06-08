import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getScopedSites } from "@/lib/site-scope";
import {
  parseElectricityFilters,
  listElectricity,
} from "@/lib/electricity-query";
import { AccessDenied } from "@/components/layout/access-denied";
import { ElectricityClient } from "./electricity-client";

export const metadata: Metadata = { title: "Electricity" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ElectricityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "enter_data")) {
    return <AccessDenied />;
  }
  const user = { id: session.user.id, role: session.user.role };

  const sp = await searchParams;
  const getStr = (k: string) =>
    typeof sp[k] === "string" && sp[k] !== "" ? (sp[k] as string) : undefined;

  const filters = parseElectricityFilters(getStr);

  const [records, scopedSites] = await Promise.all([
    listElectricity(user, filters),
    getScopedSites(user),
  ]);

  const sites = scopedSites.map((s) => ({
    id: s.id,
    name: s.name,
    siteId: s.siteId,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Electricity
        </h2>
        <p className="text-sm text-muted-foreground">
          Electricity meter readings per site, with peak/off-peak split and
          renewable share.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 rounded-lg border bg-card" />}>
        <ElectricityClient
          records={records}
          sites={sites}
          canEnter={can(session.user.role, "enter_data")}
        />
      </Suspense>
    </div>
  );
}
