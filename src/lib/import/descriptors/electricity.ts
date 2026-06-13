import "server-only";
import { db } from "@/lib/db";
import {
  electricitySchema,
  type ElectricityInput,
} from "@/lib/validations/electricity";
import {
  defineDescriptor,
  type ColumnSpec,
  type ConnectorRecordRef,
  type MetricDescriptor,
  type NormalizeResult,
  type RawRow,
  type SourceMeta,
} from "../types";

// Headers match the export route + the SAP feed's `electricity` block so files
// and the connector round-trip. Renewable/Supplier are optional.
const columns: ColumnSpec[] = [
  { header: "Site ID", field: "siteId", example: "MAN-001", siteRef: true, required: true },
  { header: "Meter ID", field: "meterId", example: "EM-1", required: true },
  { header: "Consumption (kWh)", field: "consumptionKwh", example: "128400", required: true },
  { header: "Renewable %", field: "renewablePercent", example: "42.5" },
  { header: "Supplier", field: "supplier", example: "Octopus Energy" },
  { header: "Period Start", field: "periodStart", example: "2026-05-01", required: true },
  { header: "Period End", field: "periodEnd", example: "2026-05-31", required: true },
];

function normalize(
  raw: RawRow,
  { siteIdByCode }: { siteIdByCode: Map<string, string> },
): NormalizeResult<ElectricityInput> {
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

  const parsed = electricitySchema.safeParse({ ...fields, siteId: resolvedSiteId });
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
  input: ElectricityInput,
  meta?: SourceMeta,
): Promise<{ id: string }> {
  return db.electricityRecord.create({
    data: {
      siteId: input.siteId,
      meterId: input.meterId,
      consumptionKwh: input.consumptionKwh,
      renewablePercent: input.renewablePercent ?? null,
      supplier: input.supplier ?? null,
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
  input: ElectricityInput,
  meta: SourceMeta,
): Promise<{ id: string }> {
  return db.electricityRecord.update({
    where: { id },
    data: {
      siteId: input.siteId,
      meterId: input.meterId,
      consumptionKwh: input.consumptionKwh,
      renewablePercent: input.renewablePercent ?? null,
      supplier: input.supplier ?? null,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      sourceHash: meta.sourceHash,
    },
    select: { id: true },
  });
}

function remove(id: string): Promise<unknown> {
  return db.electricityRecord.delete({ where: { id } });
}

async function listConnector(): Promise<ConnectorRecordRef[]> {
  const rows = await db.electricityRecord.findMany({
    where: { sourceRef: { not: null } },
    select: { id: true, sourceRef: true, sourceHash: true },
  });
  return rows.map((r) => ({
    id: r.id,
    sourceRef: r.sourceRef as string,
    sourceHash: r.sourceHash ?? "",
  }));
}

export const electricityDescriptor: MetricDescriptor<unknown> = defineDescriptor<
  ElectricityInput
>({
  key: "electricity",
  label: "Electricity",
  auditEntityType: "ElectricityRecord",
  sheetName: "Electricity",
  columns,
  normalize,
  create,
  update,
  remove,
  listConnector,
});
