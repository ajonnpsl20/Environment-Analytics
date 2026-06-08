import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

import { auth } from "@/lib/auth";
import { can, type Action } from "@/lib/permissions";

export type ApiUser = { id: string; role: import("@prisma/client").Role };

/** Resolve the signed-in user and assert a permission; returns a 401/403 otherwise. */
export async function requireApiUser(
  action: Action,
): Promise<{ user: ApiUser } | { response: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return { response: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  }
  if (!can(session.user.role, action)) {
    return {
      response: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 },
      ),
    };
  }
  return { user: { id: session.user.id, role: session.user.role } };
}

/** Flatten a ZodError into a `{ field: message }` map for client display. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function badRequest(error: z.ZodError): NextResponse {
  return NextResponse.json(
    { error: "Please check the form for errors.", fieldErrors: fieldErrorsOf(error) },
    { status: 400 },
  );
}
