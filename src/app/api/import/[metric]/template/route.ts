import { NextResponse, type NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api";
import { rowsToXlsx, rowsToCsv } from "@/lib/excel";
import { getDescriptor } from "@/lib/import/registry";

type Context = { params: Promise<{ metric: string }> };

// GET /api/import/[metric]/template?format=xlsx|csv — a one-row example file with
// the exact headers the importer expects (headers round-trip into the upload).
export async function GET(req: NextRequest, { params }: Context) {
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

  const isCsv = req.nextUrl.searchParams.get("format") === "csv";
  const example: Record<string, string | number> = {};
  for (const col of descriptor.columns) example[col.header] = col.example;

  const filename = `envirohub-${descriptor.key}-import-template.${isCsv ? "csv" : "xlsx"}`;
  const disposition = `attachment; filename="${filename}"`;

  if (isCsv) {
    return new Response(rowsToCsv([example]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  const xlsx = rowsToXlsx([example], descriptor.sheetName) as unknown as BodyInit;
  return new Response(xlsx, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
