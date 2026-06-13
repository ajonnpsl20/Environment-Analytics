import "server-only";
import { db } from "@/lib/db";
import { waterSchema, type WaterInput } from "@/lib/validations/water";
import {
  defineDescriptor,
  type ColumnSpec,
  type ConnectorRecordRef,
  type MetricDescriptor,
  type NormalizeResult,
  type RawRow,
  type SourceMeta,
} from "../types";

// Headers match the export route + the SAP feed's `water` block so files and the
// connector round-trip.
const columns: ColumnSpec[] = [
  { header: "Site ID", field: "siteId", example: "BIR-002", siteRef: true, required: true },
  { header: "Meter ID", field: "meterId", example: "WM-1", required: true },
  { header: "Reading Start", field: "readingStart", example: "184320", required: true },
  { header: "Reading End", field: "readingEnd", example: "186110", required: true },
  { header: "Consumption (m³)", field: "consumptionM3", example: "1790", required: true },
  { header: "Source", field: "source", example: "MAINS", required: true },
  { header: "Period Start", field: "periodStart", example: "2026-05-01", required: true },
  { header: "Period End", field: "periodEnd", example: "2026-05-31", required: true },
];

function normalize(
  raw: RawRow,
  { siteIdByCode }: { siteIdByCode: Map<string, string> },
): NormalizeResult<WaterInput> {
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

  const parsed = waterSchema.safeParse({ ...fields, siteId: resolvedSiteId });
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

async function create(
  input: WaterInput,
  meta?: SourceMeta,
): Promise<{ id: string }> {
  return db.waterUsageRecord.create({
    data: {
      siteId: input.siteId,
      meterId: input.meterId,
      readingStart: input.readingStart,
      readingEnd: input.readingEnd,
      consumptionM3: input.consumptionM3,
      source: input.source,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      sourceRef: meta?.sourceRef ?? null,
      sourceHash: meta?.sourceHash ?? null,
    },
    select: { id: true },
  });
}

async function update(
  id: string,
  input: WaterInput,
  meta: SourceMeta,
): Promise<{ id: string }> {
  return db.waterUsageRecord.update({
    where: { id },
    data: {
      siteId: input.siteId,
      meterId: input.meterId,
      readingStart: input.readingStart,
      readingEnd: input.readingEnd,
      consumptionM3: input.consumptionM3,
      source: input.source,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      sourceHash: meta.sourceHash,
    },
    select: { id: true },
  });
}

function remove(id: string): Promise<unknown> {
  return db.waterUsageRecord.delete({ where: { id } });
}

async function listConnector(): Promise<ConnectorRecordRef[]> {
  const rows = await db.waterUsageRecord.findMany({
    where: { sourceRef: { not: null } },
    select: { id: true, sourceRef: true, sourceHash: true },
  });
  return rows.map((r) => ({
    id: r.id,
    sourceRef: r.sourceRef as string,
    sourceHash: r.sourceHash ?? "",
  }));
}

export const waterDescriptor: MetricDescriptor<unknown> = defineDescriptor<
  WaterInput
>({
  key: "water",
  label: "Water",
  auditEntityType: "WaterUsageRecord",
  sheetName: "Water",
  columns,
  normalize,
  create,
  update,
  remove,
  listConnector,
});
