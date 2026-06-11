import { type NextRequest } from "next/server";
import { format } from "date-fns";

import { requireApiUser } from "@/lib/api";
import { rowsToXlsx, rowsToCsv } from "@/lib/excel";
import { parseGasFilters, listGas } from "@/lib/gas-query";

// GET /api/export/gas?format=xlsx|csv&<filters>
// Streams the same filtered, role-scoped records shown on the Data tab. Headers
// match the import template so an exported file round-trips back into import.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("export_data");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const isCsv = sp.get("format") === "csv";
  const filters = parseGasFilters((k) => sp.getAll(k));
  const records = await listGas(result.user, filters);

  const rows = records.map((r) => ({
    "Site ID": r.site.siteId,
    Site: r.site.name,
    "Meter ID": r.meterId,
    "Consumption (m³)": r.consumptionM3,
    "Period Start": format(r.periodStart, "yyyy-MM-dd"),
    "Period End": format(r.periodEnd, "yyyy-MM-dd"),
  }));

  const date = format(new Date(), "yyyy-MM-dd");
  const filename = `envirohub-gas-${date}.${isCsv ? "csv" : "xlsx"}`;
  const disposition = `attachment; filename="${filename}"`;

  if (isCsv) {
    return new Response(rowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  const xlsx = rowsToXlsx(rows, "Gas") as unknown as BodyInit;
  return new Response(xlsx, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
