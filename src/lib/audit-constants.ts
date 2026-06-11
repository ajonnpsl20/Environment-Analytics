// Plain data shared by client (filters, columns) and server (audit-log page).
// No Prisma runtime import, so it's safe to use in client components.

// The data-entry actions actually produced now that the approval workflow is
// gone (the DB AuditAction enum keeps its legacy values, but none are written).
export const AUDIT_ACTIONS = [
  "CREATED",
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
  "GasRecord",
] as const;

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const ACTION_BADGE_VARIANT: Record<AuditActionName, BadgeVariant> = {
  CREATED: "default",
  EDITED: "outline",
  DELETED: "destructive",
  IMPORTED: "secondary",
};

export function isAuditAction(value: string): value is AuditActionName {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}
