import { type NextRequest } from "next/server";
import { format } from "date-fns";

import { requireApiUser } from "@/lib/api";
import { rowsToXlsx, rowsToCsv } from "@/lib/excel";
import { parseWaterFilters, listWater } from "@/lib/water-query";

// GET /api/export/water?format=xlsx|csv&<filters>
// Streams the same filtered, role-scoped records shown on the Data tab. Headers
// match the import template so an exported file round-trips back into import.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("export_data");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const isCsv = sp.get("format") === "csv";
  const filters = parseWaterFilters((k) => sp.get(k) ?? undefined);
  const records = await listWater(result.user, filters);

  const rows = records.map((r) => ({
    "Site ID": r.site.siteId,
    Site: r.site.name,
    "Meter ID": r.meterId,
    "Reading Start": r.readingStart,
    "Reading End": r.readingEnd,
    "Consumption (m³)": r.consumptionM3,
    Source: r.source,
    "Period Start": format(r.periodStart, "yyyy-MM-dd"),
    "Period End": format(r.periodEnd, "yyyy-MM-dd"),
    Status: r.status,
    "Submitted By": r.submittedBy.name,
    "Approved By": r.approvedBy?.name ?? null,
  }));

  const date = format(new Date(), "yyyy-MM-dd");
  const filename = `envirohub-water-${date}.${isCsv ? "csv" : "xlsx"}`;
  const disposition = `attachment; filename="${filename}"`;

  if (isCsv) {
    return new Response(rowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  const xlsx = rowsToXlsx(rows, "Water") as unknown as BodyInit;
  return new Response(xlsx, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
