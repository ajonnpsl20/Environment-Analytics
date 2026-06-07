// Plain data shared by client (filters, columns) and server (audit-log page).
// No Prisma runtime import, so it's safe to use in client components.

export const AUDIT_ACTIONS = [
  "CREATED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "RETURNED",
  "EDITED",
  "DELETED",
  "IMPORTED",
] as const;

export type AuditActionName = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  "Site",
  "User",
  "AirEmissionRecord",
  "WasteRecord",
  "WaterUsageRecord",
  "ElectricityRecord",
] as const;

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const ACTION_BADGE_VARIANT: Record<AuditActionName, BadgeVariant> = {
  CREATED: "secondary",
  SUBMITTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  RETURNED: "outline",
  EDITED: "outline",
  DELETED: "destructive",
  IMPORTED: "secondary",
};

export function isAuditAction(value: string): value is AuditActionName {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}
