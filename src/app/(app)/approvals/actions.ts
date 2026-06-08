"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { transition } from "@/lib/approvals/engine";

export type ActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN: ActionResult = {
  ok: false,
  error: "You do not have permission to review records.",
};

const noteSchema = z.object({ text: z.string().trim().min(1) });

async function requireApprover() {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session.user.role, "approve_records")) return null;
  return session.user;
}

export async function approveRecordAction(
  metricKey: string,
  id: string,
): Promise<ActionResult> {
  const user = await requireApprover();
  if (!user) return FORBIDDEN;

  const res = await transition(metricKey, id, "APPROVE", user);
  if (!res.ok) return res;

  revalidatePath("/approvals");
  return { ok: true };
}

export async function rejectRecordAction(
  metricKey: string,
  id: string,
  reason: string,
): Promise<ActionResult> {
  const user = await requireApprover();
  if (!user) return FORBIDDEN;

  const parsed = noteSchema.safeParse({ text: reason });
  if (!parsed.success) {
    return { ok: false, error: "A rejection reason is required." };
  }

  const res = await transition(metricKey, id, "REJECT", user, parsed.data.text);
  if (!res.ok) return res;

  revalidatePath("/approvals");
  return { ok: true };
}

export async function returnRecordAction(
  metricKey: string,
  id: string,
  feedback: string,
): Promise<ActionResult> {
  const user = await requireApprover();
  if (!user) return FORBIDDEN;

  const parsed = noteSchema.safeParse({ text: feedback });
  if (!parsed.success) {
    return { ok: false, error: "Return feedback is required." };
  }

  const res = await transition(metricKey, id, "RETURN", user, parsed.data.text);
  if (!res.ok) return res;

  revalidatePath("/approvals");
  return { ok: true };
}
