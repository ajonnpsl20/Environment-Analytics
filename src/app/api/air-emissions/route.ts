import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { canAccessSite } from "@/lib/site-scope";
import { requireApiUser, badRequest } from "@/lib/api";
import { airEmissionSchema } from "@/lib/validations/air-emission";
import {
  parseAirEmissionFilters,
  listAirEmissions,
} from "@/lib/air-emissions-query";

// GET /api/air-emissions — filtered, role-scoped list.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const filters = parseAirEmissionFilters((k) => sp.get(k) ?? undefined);
  const records = await listAirEmissions(result.user, filters);
  return NextResponse.json({ records });
}

// POST /api/air-emissions — create a record (enters the workflow as SUBMITTED).
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

  const parsed = airEmissionSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const data = parsed.data;

  if (!(await canAccessSite(user, data.siteId))) {
    return NextResponse.json(
      { error: "You are not assigned to that site." },
      { status: 403 },
    );
  }

  const record = await db.airEmissionRecord.create({
    data: {
      siteId: data.siteId,
      stackId: data.stackId,
      measuredAt: data.measuredAt,
      pollutantType: data.pollutantType,
      concentration: data.concentration,
      concentrationUnit: data.concentrationUnit,
      flowRate: data.flowRate ?? null,
      totalEmissions: data.totalEmissions ?? null,
      measurementMethod: data.measurementMethod,
      equipmentReference: data.equipmentReference ?? null,
      status: "SUBMITTED",
      submittedById: user.id,
    },
  });

  await logAction({
    entityType: "AirEmissionRecord",
    entityId: record.id,
    action: "SUBMITTED",
    userId: user.id,
    after: record,
  });

  return NextResponse.json({ record }, { status: 201 });
}
