import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { canAccessSite } from "@/lib/site-scope";
import { requireApiUser, badRequest } from "@/lib/api";
import { electricitySchema } from "@/lib/validations/electricity";
import { parseElectricityFilters, listElectricity } from "@/lib/electricity-query";

// GET /api/electricity — filtered, role-scoped list.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const filters = parseElectricityFilters((k) => sp.get(k) ?? undefined);
  const records = await listElectricity(result.user, filters);
  return NextResponse.json({ records });
}

// POST /api/electricity — create a record (enters the workflow as SUBMITTED).
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

  const parsed = electricitySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const data = parsed.data;

  if (!(await canAccessSite(user, data.siteId))) {
    return NextResponse.json(
      { error: "You are not assigned to that site." },
      { status: 403 },
    );
  }

  const record = await db.electricityRecord.create({
    data: {
      siteId: data.siteId,
      meterId: data.meterId,
      consumptionKwh: data.consumptionKwh,
      peakKwh: data.peakKwh ?? null,
      offPeakKwh: data.offPeakKwh ?? null,
      renewablePercent: data.renewablePercent ?? null,
      supplier: data.supplier ?? null,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: "SUBMITTED",
      submittedById: user.id,
    },
  });

  await logAction({
    entityType: "ElectricityRecord",
    entityId: record.id,
    action: "SUBMITTED",
    userId: user.id,
    after: record,
  });

  return NextResponse.json({ record }, { status: 201 });
}
