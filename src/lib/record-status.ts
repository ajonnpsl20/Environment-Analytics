// Record-status constants shared by all four metric modules. No Prisma runtime
// import, so this is safe in client components (filters, columns, badges).
// Mirrors the `RecordStatus` enum in prisma/schema.prisma.

export const RECORD_STATUSES = [
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "RETURNED",
] as const;

export type RecordStatusName = (typeof RECORD_STATUSES)[number];

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const STATUS_LABEL: Record<RecordStatusName, string> = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RETURNED: "Returned",
};

export const STATUS_BADGE_VARIANT: Record<RecordStatusName, BadgeVariant> = {
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  RETURNED: "outline",
};

export function isRecordStatus(value: string): value is RecordStatusName {
  return (RECORD_STATUSES as readonly string[]).includes(value);
}

/** A record is editable by its submitter only while it is not locked/terminal. */
export const EDITABLE_STATUSES: ReadonlySet<RecordStatusName> = new Set([
  "SUBMITTED",
  "RETURNED",
]);
