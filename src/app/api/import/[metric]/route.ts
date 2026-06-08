import { NextResponse, type NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api";
import { sheetToRows } from "@/lib/excel";
import { getDescriptor } from "@/lib/import/registry";
import { validateRows } from "@/lib/import/engine";

type Context = { params: Promise<{ metric: string }> };

// POST /api/import/[metric] — parse + validate an uploaded file. No writes.
// Returns a preview { summary, errors (with original cells), validRaw }.
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

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  let rows;
  try {
    rows = sheetToRows(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return NextResponse.json(
      { error: "Could not read the file. Upload a valid .xlsx or .csv." },
      { status: 400 },
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "The file has no data rows." },
      { status: 400 },
    );
  }

  const { valid, errors, totalRows } = await validateRows(
    descriptor,
    rows,
    result.user,
  );

  return NextResponse.json({
    metricKey: descriptor.key,
    summary: { valid: valid.length, invalid: errors.length, total: totalRows },
    errors: errors.map((e) => ({
      row: e.rowNumber,
      messages: e.messages,
      cells: e.raw,
    })),
    validRaw: valid.map((v) => v.raw),
  });
}
