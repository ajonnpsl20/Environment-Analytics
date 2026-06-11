import "server-only";
import { db } from "@/lib/db";
import { wasteSchema, type WasteInput } from "@/lib/validations/waste";
import {
  defineDescriptor,
  type ColumnSpec,
  type MetricDescriptor,
  type NormalizeResult,
  type RawRow,
} from "../types";

// Headers match the export route + the SAP feed's `waste` block so files and the
// connector round-trip. (Imported/synced records carry no WTN attachment.)
const columns: ColumnSpec[] = [
  { header: "Site ID", field: "siteId", example: "MAN-001", siteRef: true, required: true },
  { header: "Waste Type", field: "wasteType", example: "HAZARDOUS", required: true },
  { header: "EWC Code", field: "ewcCode", example: "13 02 05*", required: true },
  { header: "Stream", field: "streamCategory", example: "Waste Oils", required: true },
  { header: "Weight (kg)", field: "weightKg", example: "1240", required: true },
  { header: "Disposal Method", field: "disposalMethod", example: "Treatment", required: true },
  { header: "Contractor", field: "contractor", example: "Veolia", required: true },
  { header: "WTN Reference", field: "wtnReference", example: "WTN-2026-5001", required: true },
  { header: "Transfer Date", field: "transferDate", example: "2026-05-15", required: true },
];

function normalize(
  raw: RawRow,
  { siteIdByCode }: { siteIdByCode: Map<string, string> },
): NormalizeResult<WasteInput> {
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

  const parsed = wasteSchema.safeParse({ ...fields, siteId: resolvedSiteId });
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

async function create(input: WasteInput): Promise<{ id: string }> {
  return db.wasteRecord.create({
    data: {
      siteId: input.siteId,
      wasteType: input.wasteType,
      ewcCode: input.ewcCode,
      streamCategory: input.streamCategory,
      weightKg: input.weightKg,
      disposalMethod: input.disposalMethod,
      contractor: input.contractor,
      wtnReference: input.wtnReference,
      transferDate: input.transferDate,
      wtnDocumentR2Key: input.wtnDocumentR2Key ?? null,
    },
    select: { id: true },
  });
}

export const wasteDescriptor: MetricDescriptor<unknown> = defineDescriptor<
  WasteInput
>({
  key: "waste",
  label: "Waste",
  auditEntityType: "WasteRecord",
  sheetName: "Waste",
  columns,
  normalize,
  create,
});
