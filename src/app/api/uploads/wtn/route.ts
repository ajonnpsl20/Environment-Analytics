import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireApiUser, badRequest } from "@/lib/api";
import { isR2Configured, newWtnKey, presignPutUrl } from "@/lib/r2";

const bodySchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.literal("application/pdf"),
});

// POST /api/uploads/wtn — issue a presigned PUT URL the browser uploads to
// directly. Returns 503 until R2 is configured (the form degrades gracefully).
export async function POST(req: NextRequest) {
  const result = await requireApiUser("enter_data");
  if ("response" in result) return result.response;

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "File storage is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const key = newWtnKey();
  const uploadUrl = await presignPutUrl(key, parsed.data.contentType);
  return NextResponse.json({ key, uploadUrl });
}
