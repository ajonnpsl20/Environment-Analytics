import { NextResponse, type NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api";
import { isR2Configured, presignGetUrl } from "@/lib/r2";

type Context = { params: Promise<{ key: string[] }> };

// GET /api/uploads/wtn/<key...> — redirect to a short-lived presigned download
// URL. Catch-all because the key contains a "/" (e.g. wtn/<uuid>.pdf). WTN docs
// stay private — never served publicly.
export async function GET(_req: NextRequest, { params }: Context) {
  const result = await requireApiUser("view_all_sites");
  if ("response" in result) return result.response;

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "File storage is not configured." },
      { status: 503 },
    );
  }

  const { key } = await params;
  const objectKey = key.join("/");
  const url = await presignGetUrl(objectKey);
  return NextResponse.redirect(url);
}
