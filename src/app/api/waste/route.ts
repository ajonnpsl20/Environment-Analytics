import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { canAccessSite } from "@/lib/site-scope";
import { requireApiUser, badRequest } from "@/lib/api";
import { wasteSchema } from "@/lib/validations/waste";
import { parseWasteFilters, listWaste } from "@/lib/waste-query";

// GET /api/waste — filtered, role-scoped list.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const filters = parseWasteFilters((k) => sp.get(k) ?? undefined);
  const records = await listWaste(result.user, filters);
  return NextResponse.json({ records });
}

// POST /api/waste — create a record (enters the workflow as SUBMITTED).
export async function POST(req: NextRequest) {
  const result = await requireApiUser("enter_data");
  if ("response" in result) return result.response;
  const { user } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = wasteSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const data = parsed.data;

  if (!(await canAccessSite(user, data.siteId))) {
    return NextResponse.json(
      { error: "You are not assigned to that site." },
      { status: 403 },
    );
  }

  const record = await db.wasteRecord.create({
    data: {
      siteId: data.siteId,
      wasteType: data.wasteType,
      streamCategory: data.streamCategory,
      weightKg: data.weightKg,
      disposalMethod: data.disposalMethod,
      contractor: data.contractor,
      wtnReference: data.wtnReference,
      transferDate: data.transferDate,
      wtnDocumentR2Key: data.wtnDocumentR2Key ?? null,
      status: "SUBMITTED",
      submittedById: user.id,
    },
  });

  await logAction({
    entityType: "WasteRecord",
    entityId: record.id,
    action: "SUBMITTED",
    userId: user.id,
    after: record,
  });

  return NextResponse.json({ record }, { status: 201 });
}
