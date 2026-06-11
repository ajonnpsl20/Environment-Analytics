import "server-only";
import { db } from "@/lib/db";
import { gasSchema, type GasInput } from "@/lib/validations/gas";
import {
  defineDescriptor,
  type ColumnSpec,
  type MetricDescriptor,
  type NormalizeResult,
  type RawRow,
} from "../types";

// Headers match the export route + the SAP feed's `gas` block so files and the
// connector round-trip.
const columns: ColumnSpec[] = [
  { header: "Site ID", field: "siteId", example: "MAN-001", siteRef: true, required: true },
  { header: "Meter ID", field: "meterId", example: "GM-1", required: true },
  { header: "Consumption (m³)", field: "consumptionM3", example: "12400", required: true },
  { header: "Period Start", field: "periodStart", example: "2026-05-01", required: true },
  { header: "Period End", field: "periodEnd", example: "2026-05-31", required: true },
];

function normalize(
  raw: RawRow,
  { siteIdByCode }: { siteIdByCode: Map<string, string> },
): NormalizeResult<GasInput> {
  const messages: string[] = [];
  const fields: Record<string, string> = {};
  let resolvedSiteId: string | undefined;

  for (const col of columns) {
    const cell = raw[col.header];
    const empty = cell === null || cell === undefined || String(cell).trim() === "";

    if (col.siteRef) {
      if (empty) {
        messages.push(`${col.header} is required`);
        continue;
      }
      const code = String(cell).trim();
      const id = siteIdByCode.get(code);
      if (!id) {
        messages.push(`Unknown site code "${code}"`);
        continue;
      }
      resolvedSiteId = id;
      continue;
    }

    if (empty) {
      if (col.required) messages.push(`${col.header} is required`);
      fields[col.field] = "";
      continue;
    }
    fields[col.field] = String(cell).trim();
  }

  if (messages.length > 0) return { ok: false, messages };

  const parsed = gasSchema.safeParse({ ...fields, siteId: resolvedSiteId });
  if (!parsed.success) {
    return {
      ok: false,
      messages: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "row"}: ${i.message}`,
      ),
    };
  }
  return { ok: true, data: parsed.data, siteId: parsed.data.siteId };
}

async function create(input: GasInput): Promise<{ id: string }> {
  return db.gasRecord.create({
    data: {
      siteId: input.siteId,
      meterId: input.meterId,
      consumptionM3: input.consumptionM3,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    },
    select: { id: true },
  });
}

export const gasDescriptor: MetricDescriptor<unknown> = defineDescriptor<GasInput>({
  key: "gas",
  label: "Gas",
  auditEntityType: "GasRecord",
  sheetName: "Gas",
  columns,
  normalize,
  create,
});
