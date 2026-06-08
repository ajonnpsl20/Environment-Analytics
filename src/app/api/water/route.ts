import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { canAccessSite } from "@/lib/site-scope";
import { requireApiUser, badRequest } from "@/lib/api";
import { waterSchema } from "@/lib/validations/water";
import { parseWaterFilters, listWater } from "@/lib/water-query";

// GET /api/water — filtered, role-scoped list.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const filters = parseWaterFilters((k) => sp.get(k) ?? undefined);
  const records = await listWater(result.user, filters);
  return NextResponse.json({ records });
}

// POST /api/water — create a record (enters the workflow as SUBMITTED).
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

  const parsed = waterSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const data = parsed.data;

  if (!(await canAccessSite(user, data.siteId))) {
    return NextResponse.json(
      { error: "You are not assigned to that site." },
      { status: 403 },
    );
  }

  const record = await db.waterUsageRecord.create({
    data: {
      siteId: data.siteId,
      meterId: data.meterId,
      readingStart: data.readingStart,
      readingEnd: data.readingEnd,
      consumptionM3: data.consumptionM3,
      source: data.source,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: "SUBMITTED",
      submittedById: user.id,
    },
  });

  await logAction({
    entityType: "WaterUsageRecord",
    entityId: record.id,
    action: "SUBMITTED",
    userId: user.id,
    after: record,
  });

  return NextResponse.json({ record }, { status: 201 });
}
