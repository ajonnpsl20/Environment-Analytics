import { NextResponse, type NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api";
import { rowsToXlsx, rowsToCsv } from "@/lib/excel";
import { getDescriptor } from "@/lib/import/registry";

type Context = { params: Promise<{ metric: string }> };

type ErrorEntry = {
  row?: number;
  messages?: string[];
  cells?: Record<string, string | number | null>;
};

// POST /api/import/[metric]/error-report?format=xlsx|csv — body { errors }.
// Returns a downloadable file of the rejected rows (original cells + the reasons)
// so the user can fix and re-upload.
export async function POST(req: NextRequest, { params }: Context) {
  const result = await requireApiUser("import_data");
  if ("response" in result) return result.response;

  const { metric } = await params;
  const descriptor = getDescriptor(metric);
  if (!descriptor) {
    return NextResponse.json(
      { error: `No importer configured for "${metric}".` },
      { status: 404 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    errors?: ErrorEntry[];
  } | null;
  const errors = body?.errors;
  if (!Array.isArray(errors)) {
    return NextResponse.json(
      { error: "Expected a JSON body of the form { errors: [...] }." },
      { status: 400 },
    );
  }

  const rows = errors.map((e) => ({
    Row: e.row ?? null,
    ...(e.cells ?? {}),
    Errors: (e.messages ?? []).join("; "),
  }));

  const isCsv = req.nextUrl.searchParams.get("format") === "csv";
  const filename = `envirohub-${descriptor.key}-import-errors.${isCsv ? "csv" : "xlsx"}`;
  const disposition = `attachment; filename="${filename}"`;

  if (isCsv) {
    return new Response(rowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  const xlsx = rowsToXlsx(rows, "Import Errors") as unknown as BodyInit;
  return new Response(xlsx, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
