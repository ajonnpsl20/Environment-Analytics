"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { siteSchema, type SiteFormValues } from "@/lib/validations/site";

export type ActionResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN: ActionResult = {
  ok: false,
  error: "You do not have permission to manage sites.",
};

const INVALID: ActionResult = {
  ok: false,
  error: "Please check the form for errors.",
};

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

function isForeignKeyViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003"
  );
}

async function requireSiteManager() {
  const session = await auth();
  if (!session?.user) return null;
  if (!can(session.user.role, "manage_sites")) return null;
  return session.user;
}

export async function createSiteAction(
  input: SiteFormValues,
): Promise<ActionResult> {
  const user = await requireSiteManager();
  if (!user) return FORBIDDEN;

  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return INVALID;
  const data = parsed.data;

  try {
    const site = await db.site.create({ data });
    await logAction({
      entityType: "Site",
      entityId: site.id,
      action: "CREATED",
      userId: user.id,
      after: site,
    });
    revalidatePath("/sites");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: `Site ID "${data.siteId}" already exists.` };
    }
    throw e;
  }
}

export async function updateSiteAction(
  id: string,
  input: SiteFormValues,
): Promise<ActionResult> {
  const user = await requireSiteManager();
  if (!user) return FORBIDDEN;

  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return INVALID;
  const data = parsed.data;

  const before = await db.site.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Site not found." };

  try {
    const after = await db.site.update({ where: { id }, data });
    await logAction({
      entityType: "Site",
      entityId: id,
      action: "EDITED",
      userId: user.id,
      before,
      after,
    });
    revalidatePath("/sites");
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: `Site ID "${data.siteId}" already exists.` };
    }
    throw e;
  }
}

export async function deleteSiteAction(id: string): Promise<ActionResult> {
  const user = await requireSiteManager();
  if (!user) return FORBIDDEN;

  const before = await db.site.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          airEmissionRecords: true,
          wasteRecords: true,
          waterUsageRecords: true,
          electricityRecords: true,
        },
      },
    },
  });
  if (!before) return { ok: false, error: "Site not found." };

  const recordCount =
    before._count.airEmissionRecords +
    before._count.wasteRecords +
    before._count.waterUsageRecords +
    before._count.electricityRecords;
  if (recordCount > 0) {
    return {
      ok: false,
      error: `Cannot delete: this site has ${recordCount} record(s). Remove them first.`,
    };
  }

  const { _count, ...siteData } = before;
  void _count;

  try {
    await db.siteAssignment.deleteMany({ where: { siteId: id } });
    await db.site.delete({ where: { id } });
  } catch (e) {
    // A record may have been added between the count check and the delete.
    if (isForeignKeyViolation(e)) {
      return {
        ok: false,
        error: "Cannot delete: this site now has related records.",
      };
    }
    throw e;
  }

  await logAction({
    entityType: "Site",
    entityId: id,
    action: "DELETED",
    userId: user.id,
    before: siteData,
  });
  revalidatePath("/sites");
  return { ok: true };
}
