import type { Role } from "@prisma/client";

// Pure permission logic — NO database or server-only imports, so this module is
// safe to import from server components, server actions, route handlers, AND
// client components / edge middleware. DB-backed site scoping lives in
// `site-scope.ts` (server-only) to keep Prisma out of the client/edge bundle.

export type Action =
  | "manage_users"
  | "manage_sites"
  | "view_all_sites"
  | "enter_data"
  | "import_data"
  | "export_data"
  | "run_connector"
  | "view_audit_log";

// Mirrors the permissions matrix in CLAUDE.md.
export const ROLE_ACTIONS: Record<Role, ReadonlySet<Action>> = {
  SystemAdmin: new Set<Action>([
    "manage_users",
    "manage_sites",
    "view_all_sites",
    "enter_data",
    "import_data",
    "export_data",
    "run_connector",
    "view_audit_log",
  ]),
  SiteAdmin: new Set<Action>([
    "view_all_sites",
    "enter_data",
    "import_data",
    "export_data",
    "run_connector",
    "view_audit_log",
  ]),
  DataEntryUser: new Set<Action>([
    "view_all_sites",
    "enter_data",
    "import_data",
    "export_data",
  ]),
};

export function can(role: Role, action: Action): boolean {
  return ROLE_ACTIONS[role]?.has(action) ?? false;
}

// SystemAdmin sees every site; SiteAdmin & DataEntryUser are scoped to their assignments.
export function isScopedRole(role: Role): boolean {
  return role !== "SystemAdmin";
}

export class ForbiddenError extends Error {
  constructor(
    message = "You do not have permission to perform this action.",
  ) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) throw new ForbiddenError();
}
