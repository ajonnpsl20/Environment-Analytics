import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { canAccessSite } from "@/lib/site-scope";
import { requireApiUser, badRequest } from "@/lib/api";
import { gasSchema } from "@/lib/validations/gas";
import { parseGasFilters, listGas } from "@/lib/gas-query";

// GET /api/gas — filtered, role-scoped list.
export async function GET(req: NextRequest) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;

  const sp = req.nextUrl.searchParams;
  const filters = parseGasFilters((k) => sp.getAll(k));
  const records = await listGas(result.user, filters);
  return NextResponse.json({ records });
}

// POST /api/gas — create a record.
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

  const parsed = gasSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);
  const data = parsed.data;

  if (!(await canAccessSite(user, data.siteId))) {
    return NextResponse.json(
      { error: "You are not assigned to that site." },
      { status: 403 },
    );
  }

  const record = await db.gasRecord.create({
    data: {
      siteId: data.siteId,
      meterId: data.meterId,
      consumptionM3: data.consumptionM3,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
  });

  await logAction({
    entityType: "GasRecord",
    entityId: record.id,
    action: "CREATED",
    userId: user.id,
    after: record,
  });

  return NextResponse.json({ record }, { status: 201 });
}
