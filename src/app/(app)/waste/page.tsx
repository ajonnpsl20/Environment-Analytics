import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getScopedSites } from "@/lib/site-scope";
import { isR2Configured } from "@/lib/r2";
import { parseWasteFilters, listWaste } from "@/lib/waste-query";
import { AccessDenied } from "@/components/layout/access-denied";
import { WasteClient } from "./waste-client";

export const metadata: Metadata = { title: "Waste" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function WastePage({
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

  const filters = parseWasteFilters(getStr);

  const [records, scopedSites] = await Promise.all([
    listWaste(user, filters),
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
          Waste
        </h2>
        <p className="text-sm text-muted-foreground">
          Waste transfer notes per site, with type, weight, and disposal route.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 rounded-lg border bg-card" />}>
        <WasteClient
          records={records}
          sites={sites}
          canEnter={can(session.user.role, "enter_data")}
          r2Enabled={isR2Configured()}
        />
      </Suspense>
    </div>
  );
}
