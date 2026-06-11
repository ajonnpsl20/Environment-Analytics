import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { canAccessSite } from "@/lib/site-scope";
import { requireApiUser, badRequest } from "@/lib/api";
import { wasteSchema } from "@/lib/validations/waste";

type Context = { params: Promise<{ id: string }> };

// GET /api/waste/[id] — single record (role-scoped).
export async function GET(_req: NextRequest, { params }: Context) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;
  const { id } = await params;

  const record = await db.wasteRecord.findUnique({ where: { id } });
  if (!record || !(await canAccessSite(result.user, record.siteId))) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }
  return NextResponse.json({ record });
}

// PATCH /api/waste/[id] — edit a record.
export async function PATCH(req: NextRequest, { params }: Context) {
  const result = await requireApiUser("enter_data");
  if ("response" in result) return result.response;
  const { user } = result;
  const { id } = await params;

  const before = await db.wasteRecord.findUnique({ where: { id } });
  if (!before || !(await canAccessSite(user, before.siteId))) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = wasteSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const data = parsed.data;

  if (data.siteId !== before.siteId && !(await canAccessSite(user, data.siteId))) {
    return NextResponse.json(
      { error: "You are not assigned to that site." },
      { status: 403 },
    );
  }

  const record = await db.wasteRecord.update({
    where: { id },
    data: {
      siteId: data.siteId,
      wasteType: data.wasteType,
      ewcCode: data.ewcCode,
      streamCategory: data.streamCategory,
      weightKg: data.weightKg,
      disposalMethod: data.disposalMethod,
      contractor: data.contractor,
      wtnReference: data.wtnReference,
      transferDate: data.transferDate,
      wtnDocumentR2Key: data.wtnDocumentR2Key ?? null,
    },
  });

  await logAction({
    entityType: "WasteRecord",
    entityId: id,
    action: "EDITED",
    userId: user.id,
    before,
    after: record,
  });

  return NextResponse.json({ record });
}
