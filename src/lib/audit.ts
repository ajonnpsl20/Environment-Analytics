import "server-only";
import type { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type LogActionInput = {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  before?: unknown;
  after?: unknown;
  notes?: string | null;
};

// Normalize arbitrary values (Dates, nested objects) for the Json? columns.
function toJsonSafe(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** Write one AuditLog row. Every state change must go through this (CLAUDE.md). */
export async function logAction(input: LogActionInput): Promise<void> {
  await db.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      userId: input.userId,
      beforeJson: toJsonSafe(input.before),
      afterJson: toJsonSafe(input.after),
      notes: input.notes ?? null,
    },
  });
}
