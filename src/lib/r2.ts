import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 (S3-compatible) client for WTN document attachments.
// Everything here is OPTIONAL: when the R2 env vars are absent the app runs
// fully without attachments. `isR2Configured()` is the single source of truth —
// the waste form, upload endpoints, and download endpoint all gate on it, so
// dropping the credentials into .env.local activates uploads with no code change.

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME;
// Optional R2 jurisdiction for data-residency buckets (e.g. "eu"). When set, the
// S3 endpoint gains the infix: <account>.<jurisdiction>.r2.cloudflarestorage.com.
// A jurisdiction bucket is ONLY reachable via its matching endpoint.
const JURISDICTION = process.env.R2_JURISDICTION?.trim();

/** True only when every credential needed to talk to R2 is present. */
export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET);
}

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured.");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}${JURISDICTION ? `.${JURISDICTION}` : ""}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY_ID as string,
        secretAccessKey: SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

/** A fresh object key for a WTN upload. */
export function newWtnKey(): string {
  return `wtn/${crypto.randomUUID()}.pdf`;
}

const PRESIGN_TTL = 300; // 5 minutes

/** Presigned PUT URL the browser uploads the file bytes to directly. */
export function presignPutUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: PRESIGN_TTL });
}

/** Presigned GET URL for a private download (short-lived). */
export function presignGetUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(getR2Client(), command, { expiresIn: PRESIGN_TTL });
}
