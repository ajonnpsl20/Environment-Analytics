import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getScopedSites } from "@/lib/site-scope";
import {
  parseAirEmissionFilters,
  listAirEmissions,
} from "@/lib/air-emissions-query";
import { AccessDenied } from "@/components/layout/access-denied";
import { AirEmissionsClient } from "./air-emissions-client";

export const metadata: Metadata = { title: "Air Emissions" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AirEmissionsPage({
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
  const getAll = (k: string): string[] => {
    const v = sp[k];
    if (Array.isArray(v)) return v.filter((s) => s !== "");
    return typeof v === "string" && v !== "" ? [v] : [];
  };

  const filters = parseAirEmissionFilters(getAll);

  const [records, scopedSites] = await Promise.all([
    listAirEmissions(user, filters),
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
          Air Emissions
        </h2>
        <p className="text-sm text-muted-foreground">
          Stack emission measurements per site, stack, and pollutant.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 rounded-lg border bg-card" />}>
        <AirEmissionsClient
          records={records}
          sites={sites}
          canEnter={can(session.user.role, "enter_data")}
        />
      </Suspense>
    </div>
  );
}
