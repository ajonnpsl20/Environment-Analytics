import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/api";
import { getDescriptor } from "@/lib/import/registry";
import { commitRows } from "@/lib/import/engine";
import { getSapMetricRows } from "@/lib/import/sap-feed";

// POST /api/connectors/sap?metric=<key> — mock SAP sync for one metric.
// Reads src/data/sap-mock.json, normalizes via the metric's import descriptor,
// creates SUBMITTED records attributed to the system user, and records the sync
// event (even a zero-row sync) in ConnectorSync.
export async function POST(req: NextRequest) {
  const result = await requireApiUser("run_connector");
  if ("response" in result) return result.response;
  const { user } = result;

  const metric = req.nextUrl.searchParams.get("metric");
  if (!metric) {
    return NextResponse.json(
      { error: "Missing ?metric= parameter." },
      { status: 400 },
    );
  }

  const descriptor = getDescriptor(metric);
  if (!descriptor) {
    return NextResponse.json(
      {
        error: `"${metric}" is present in the SAP feed but has no importer configured yet.`,
      },
      { status: 400 },
    );
  }

  // Connector-created records are attributed to the system service account, and
  // it runs the site-access check (SystemAdmin ⇒ all sites) so a system feed is
  // never limited by which admin happened to click Sync.
  const systemUser = await db.user.findUnique({
    where: { email: "system@envirohub.demo" },
    select: { id: true, role: true },
  });
  if (!systemUser) {
    return NextResponse.json(
      { error: "System connector account is not seeded. Run `npm run db:seed`." },
      { status: 500 },
    );
  }

  const rows = getSapMetricRows(metric);
  const commit = await commitRows(descriptor, rows, systemUser, {
    submittedById: systemUser.id,
    auditUserId: user.id,
    notes: "via SAP connector (Demo)",
  });

  const syncedAt = new Date();
  await db.connectorSync.upsert({
    where: { connectorKey_metricKey: { connectorKey: "sap", metricKey: metric } },
    create: {
      connectorKey: "sap",
      metricKey: metric,
      lastSyncAt: syncedAt,
      lastCreated: commit.created,
      lastResultJson: { created: commit.created, skipped: commit.skipped },
    },
    update: {
      lastSyncAt: syncedAt,
      lastCreated: commit.created,
      lastResultJson: { created: commit.created, skipped: commit.skipped },
    },
  });

  return NextResponse.json({
    metricKey: metric,
    detected: rows.length,
    created: commit.created,
    skipped: commit.skipped,
    syncedAt: syncedAt.toISOString(),
  });
}
