import "server-only";
import { db } from "@/lib/db";
import {
  airEmissionSchema,
  type AirEmissionInput,
} from "@/lib/validations/air-emission";
import {
  defineDescriptor,
  type ColumnSpec,
  type MetricDescriptor,
  type NormalizeResult,
  type RawRow,
} from "../types";

// Headers match the export route's column headers so an exported file round-trips
// straight back into import.
const columns: ColumnSpec[] = [
  { header: "Site ID", field: "siteId", example: "MAN-001", siteRef: true, required: true },
  { header: "Stack ID", field: "stackId", example: "STK-1", required: true },
  { header: "Measured At", field: "measuredAt", example: "2025-11-03", required: true },
  { header: "Pollutant", field: "pollutantType", example: "NOx", required: true },
  { header: "Concentration", field: "concentration", example: "182.4", required: true },
  { header: "Unit", field: "concentrationUnit", example: "mg/m³", required: true },
  { header: "Flow Rate (m³/h)", field: "flowRate", example: "12400" },
  { header: "Total Emissions", field: "totalEmissions", example: "3100" },
  { header: "Measurement Method", field: "measurementMethod", example: "CONTINUOUS", required: true },
  { header: "Equipment Ref", field: "equipmentReference", example: "CEMS-204" },
];

function normalize(
  raw: RawRow,
  { siteIdByCode }: { siteIdByCode: Map<string, string> },
): NormalizeResult<AirEmissionInput> {
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
      // Required-but-empty is reported here; the coercing schema would otherwise
      // turn "" into 0/undefined and mask the omission.
      if (col.required) messages.push(`${col.header} is required`);
      fields[col.field] = "";
      continue;
    }
    fields[col.field] = String(cell).trim();
  }

  if (messages.length > 0) return { ok: false, messages };

  const parsed = airEmissionSchema.safeParse({
    ...fields,
    siteId: resolvedSiteId,
  });
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

async function create(input: AirEmissionInput): Promise<{ id: string }> {
  return db.airEmissionRecord.create({
    data: {
      siteId: input.siteId,
      stackId: input.stackId,
      measuredAt: input.measuredAt,
      pollutantType: input.pollutantType,
      concentration: input.concentration,
      concentrationUnit: input.concentrationUnit,
      flowRate: input.flowRate ?? null,
      totalEmissions: input.totalEmissions ?? null,
      measurementMethod: input.measurementMethod,
      equipmentReference: input.equipmentReference ?? null,
    },
    select: { id: true },
  });
}

export const airEmissionDescriptor: MetricDescriptor<unknown> = defineDescriptor<
  AirEmissionInput
>({
  key: "airEmission",
  label: "Air Emissions",
  auditEntityType: "AirEmissionRecord",
  sheetName: "Air Emissions",
  columns,
  normalize,
  create,
});
