import { type NextRequest } from "next/server";
import { format } from "date-fns";

import { requireApiUser } from "@/lib/api";
import { rowsToXlsx, rowsToCsv } from "@/lib/excel";
import {
  parseAirEmissionFilters,
  listAirEmissions,
} from "@/lib/air-emissions-query";

// GET /api/export/air-emissions?format=xlsx|csv&<filters>
// Streams the same filtered, role-scoped records shown on the Data tab.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("export_data");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const isCsv = sp.get("format") === "csv";
  const filters = parseAirEmissionFilters((k) => sp.getAll(k));
  const records = await listAirEmissions(result.user, filters);

  const rows = records.map((r) => ({
    "Site ID": r.site.siteId,
    Site: r.site.name,
    "Stack ID": r.stackId,
    "Measured At": format(r.measuredAt, "yyyy-MM-dd HH:mm"),
    Pollutant: r.pollutantType,
    Concentration: r.concentration,
    Unit: r.concentrationUnit,
    "Flow Rate (m³/h)": r.flowRate,
    "Total Emissions": r.totalEmissions,
    "Measurement Method": r.measurementMethod,
    "Equipment Ref": r.equipmentReference,
  }));

  const date = format(new Date(), "yyyy-MM-dd");
  const filename = `envirohub-air-emissions-${date}.${isCsv ? "csv" : "xlsx"}`;
  const disposition = `attachment; filename="${filename}"`;

  if (isCsv) {
    return new Response(rowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  // Uint8Array is a valid runtime body; the cast satisfies the DOM BodyInit type.
  const xlsx = rowsToXlsx(rows, "Air Emissions") as unknown as BodyInit;
  return new Response(xlsx, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
