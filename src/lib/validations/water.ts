import { z } from "zod";

// Mirrors the WaterSource enum in prisma/schema.prisma (client-safe plain strings).
export const WATER_SOURCES = [
  "MAINS",
  "BOREHOLE",
  "RAINWATER",
  "SURFACE_WATER",
  "RECYCLED",
  "OTHER",
] as const;

export type WaterSourceName = (typeof WATER_SOURCES)[number];

export const WATER_SOURCE_LABEL: Record<WaterSourceName, string> = {
  MAINS: "Mains",
  BOREHOLE: "Borehole",
  RAINWATER: "Rainwater",
  SURFACE_WATER: "Surface water",
  RECYCLED: "Recycled",
  OTHER: "Other",
};

const numberish = (v: string) => v.trim() !== "" && !Number.isNaN(Number(v));

// ─────────────────────────────────────────────────────────────────────────────
// Server schema — coerces strings from the form/API into typed values.
// ─────────────────────────────────────────────────────────────────────────────
export const waterSchema = z.object({
  siteId: z.string().trim().min(1, "Site is required"),
  meterId: z.string().trim().min(1, "Meter ID is required").max(32),
  readingStart: z.coerce.number().min(0, "Reading must be ≥ 0"),
  readingEnd: z.coerce.number().min(0, "Reading must be ≥ 0"),
  consumptionM3: z.coerce.number().min(0, "Consumption must be ≥ 0"),
  source: z.enum(WATER_SOURCES),
  periodStart: z.coerce.date({ message: "A valid period start is required" }),
  periodEnd: z.coerce.date({ message: "A valid period end is required" }),
});

export type WaterInput = z.infer<typeof waterSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Client form schema — all strings so React Hook Form + zodResolver stay simple.
// The server re-validates with `waterSchema`, which coerces the numbers/dates.
// ─────────────────────────────────────────────────────────────────────────────
export const waterFormSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  meterId: z.string().trim().min(1, "Meter ID is required").max(32),
  readingStart: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  readingEnd: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  consumptionM3: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  source: z.enum(WATER_SOURCES, { message: "Source is required" }),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
});

export type WaterFormValues = z.infer<typeof waterFormSchema>;
