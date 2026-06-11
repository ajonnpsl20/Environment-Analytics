import { NextResponse, type NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api";
import { getDescriptor } from "@/lib/import/registry";
import { commitRows } from "@/lib/import/engine";
import type { RawRow } from "@/lib/import/types";

type Context = { params: Promise<{ metric: string }> };

// POST /api/import/[metric]/commit — body { rows: RawRow[] }.
// Re-validates from scratch (never trusts the client), creates the records, and
// audit-logs each as IMPORTED attributed to the uploader.
export async function POST(req: NextRequest, { params }: Context) {
  const result = await requireApiUser("import_data");
  if ("response" in result) return result.response;
  const { user } = result;

  const { metric } = await params;
  const descriptor = getDescriptor(metric);
  if (!descriptor) {
    return NextResponse.json(
      { error: `No importer configured for "${metric}".` },
      { status: 404 },
    );
  }

  const body = (await req.json().catch(() => null)) as { rows?: unknown } | null;
  const rows = body?.rows;
  if (!Array.isArray(rows)) {
    return NextResponse.json(
      { error: "Expected a JSON body of the form { rows: [...] }." },
      { status: 400 },
    );
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const commit = await commitRows(descriptor, rows as RawRow[], user, {
    auditUserId: user.id,
    notes: "Bulk file import",
  });

  return NextResponse.json(commit);
}
