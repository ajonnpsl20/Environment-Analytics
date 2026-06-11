// Per-metric import abstraction. Adding Waste/Water/Electricity later = author one
// descriptor + register it; the import endpoints and SAP connector are generic
// engines that never know metric specifics. TYPES ONLY here (client-safe — no
// Prisma runtime, no "server-only"), so client UI can share the result shapes.

export type RawRow = Record<string, string | number | null | undefined>;

/** One column of a metric's import template / upload sheet. */
export type ColumnSpec = {
  /** Human-readable header in the template and uploaded file (must round-trip). */
  header: string;
  /** Schema field this column feeds. */
  field: string;
  /** Sample value placed in the downloadable template's example row. */
  example: string | number;
  /** Marks the column carrying the human-readable Site code (e.g. "MAN-001"). */
  siteRef?: boolean;
  /** Empty cells in a required column produce a row error. */
  required?: boolean;
};

export type NormalizeResult<TInput> =
  | { ok: true; data: TInput; siteId: string }
  | { ok: false; messages: string[] };

export type ValidRow<TInput> = {
  ok: true;
  rowNumber: number;
  data: TInput;
  siteId: string;
  raw: RawRow;
};

export type InvalidRow = {
  ok: false;
  rowNumber: number;
  messages: string[];
  raw: RawRow;
};

export type ValidateResult<TInput> = {
  metricKey: string;
  valid: ValidRow<TInput>[];
  errors: InvalidRow[];
  totalRows: number;
};

export type CommitResult = {
  created: number;
  skipped: number;
  skippedReasons: { rowNumber: number; messages: string[] }[];
};

/**
 * Everything metric-specific. `normalize` maps a header-keyed raw row to the
 * field-keyed schema input, resolving the human Site code → Site.id cuid via the
 * prebuilt `siteIdByCode` map, then validates. `create` writes one record (the
 * engine handles the audit log, so attribution stays centralized).
 */
export type MetricDescriptor<TInput> = {
  key: string;
  label: string;
  auditEntityType: string;
  sheetName: string;
  columns: ColumnSpec[];
  normalize: (
    raw: RawRow,
    ctx: { siteIdByCode: Map<string, string> },
  ) => NormalizeResult<TInput>;
  create: (input: TInput) => Promise<{ id: string }>;
};

/**
 * Register a typed descriptor while erasing its input type for the generic
 * registry/engine. The single localized cast is sound because, within one
 * descriptor, `normalize`'s output type always matches `create`'s input type —
 * the engine only ferries values between them and never inspects the type.
 */
export function defineDescriptor<TInput>(
  descriptor: MetricDescriptor<TInput>,
): MetricDescriptor<unknown> {
  return descriptor as MetricDescriptor<unknown>;
}
