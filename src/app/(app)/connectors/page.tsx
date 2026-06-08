import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { isRegistered } from "@/lib/import/registry";
import { getSapFeedSummary } from "@/lib/import/sap-feed";
import { metricLabel } from "@/lib/import/metric-keys";
import { AccessDenied } from "@/components/layout/access-denied";
import { ConnectorsClient, type ConnectorMetric } from "./connectors-client";

export const metadata: Metadata = { title: "Connectors" };
export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "run_connector")) {
    return <AccessDenied />;
  }

  const syncs = await db.connectorSync.findMany({
    where: { connectorKey: "sap" },
  });
  const lastSyncByMetric = new Map(
    syncs.map((s) => [s.metricKey, s.lastSyncAt.toISOString()]),
  );

  const metrics: ConnectorMetric[] = getSapFeedSummary().map(({ key, count }) => ({
    key,
    label: metricLabel(key),
    count,
    registered: isRegistered(key),
    lastSyncAt: lastSyncByMetric.get(key) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Connectors
        </h2>
        <p className="text-sm text-muted-foreground">
          Bring environmental data in from external systems and into the standard
          approval workflow.
        </p>
      </div>

      <ConnectorsClient metrics={metrics} />
    </div>
  );
}
