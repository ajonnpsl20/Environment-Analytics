import "server-only";
import * as XLSX from "xlsx";
import type { RawRow } from "@/lib/import/types";

// SheetJS wrappers shared by every metric's export and import endpoint.
// Rows are flat objects keyed by human-readable column headers.

type Row = Record<string, string | number | null>;

/** Build an `.xlsx` workbook from rows and return it as bytes for a Response. */
export function rowsToXlsx(rows: Row[], sheetName: string): Uint8Array {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
  return new Uint8Array(buffer);
}

/** Build a CSV string from rows. */
export function rowsToCsv(rows: Row[]): string {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(worksheet);
}

/**
 * Parse an uploaded `.xlsx` or `.csv` (SheetJS sniffs the format from bytes) into
 * header-keyed rows from the first sheet. `raw: false` returns cell values as
 * formatted strings so the metric Zod schemas' string-coercing preprocessors
 * behave identically to the manual-entry API path. `defval: null` keeps empty
 * cells present (as null) so optional fields are handled consistently.
 */
export function sheetToRows(bytes: Uint8Array): RawRow[] {
  const workbook = XLSX.read(bytes, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<RawRow>(worksheet, {
    defval: null,
    raw: false,
  });
}
