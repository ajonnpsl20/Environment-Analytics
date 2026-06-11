import { type NextRequest } from "next/server";
import { format } from "date-fns";

import { requireApiUser } from "@/lib/api";
import { rowsToXlsx, rowsToCsv } from "@/lib/excel";
import { parseWasteFilters, listWaste } from "@/lib/waste-query";

// GET /api/export/waste?format=xlsx|csv&<filters>
// Streams the same filtered, role-scoped records shown on the Data tab. Headers
// match the import template so an exported file round-trips back into import.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("export_data");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const isCsv = sp.get("format") === "csv";
  const filters = parseWasteFilters((k) => sp.getAll(k));
  const records = await listWaste(result.user, filters);

  const rows = records.map((r) => ({
    "Site ID": r.site.siteId,
    Site: r.site.name,
    "Waste Type": r.wasteType,
    "EWC Code": r.ewcCode,
    Stream: r.streamCategory,
    "Weight (kg)": r.weightKg,
    "Disposal Method": r.disposalMethod,
    Contractor: r.contractor,
    "WTN Reference": r.wtnReference,
    "Transfer Date": format(r.transferDate, "yyyy-MM-dd"),
    "WTN Attached?": r.wtnDocumentR2Key ? "Yes" : "No",
  }));

  const date = format(new Date(), "yyyy-MM-dd");
  const filename = `envirohub-waste-${date}.${isCsv ? "csv" : "xlsx"}`;
  const disposition = `attachment; filename="${filename}"`;

  if (isCsv) {
    return new Response(rowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
      },
    });
  }

  const xlsx = rowsToXlsx(rows, "Waste") as unknown as BodyInit;
  return new Response(xlsx, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
