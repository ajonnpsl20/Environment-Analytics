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
  const filters = parseWasteFilters((k) => sp.getAll(k));
  const records = await listWaste(result.user, filters);
  return NextResponse.json({ records });
}

// POST /api/waste — create a record.
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

  // The WTN document is required for manual web-form entry (this route). Bulk
  // import + the SAP connector create records via the import engine, which has
  // no file to attach, so the requirement is enforced here, not in wasteSchema.
  if (!data.wtnDocumentR2Key) {
    return NextResponse.json(
      { error: "A WTN document (PDF) is required.", fieldErrors: { wtnDocumentR2Key: "Attach the WTN PDF." } },
      { status: 400 },
    );
  }

  const record = await db.wasteRecord.create({
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
      wtnDocumentR2Key: data.wtnDocumentR2Key,
    },
  });

  await logAction({
    entityType: "WasteRecord",
    entityId: record.id,
    action: "CREATED",
    userId: user.id,
    after: record,
  });

  return NextResponse.json({ record }, { status: 201 });
}
