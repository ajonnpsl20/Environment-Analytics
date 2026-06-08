import { z } from "zod";

// Mirrors the WasteType enum in prisma/schema.prisma (client-safe plain strings).
export const WASTE_TYPES = ["HAZARDOUS", "NON_HAZARDOUS", "RECYCLABLE"] as const;

export type WasteTypeName = (typeof WASTE_TYPES)[number];

export const WASTE_TYPE_LABEL: Record<WasteTypeName, string> = {
  HAZARDOUS: "Hazardous",
  NON_HAZARDOUS: "Non-hazardous",
  RECYCLABLE: "Recyclable",
};

// Free-text in the schema; these are curated suggestions matching the seed data.
export const WASTE_STREAMS = [
  "Mixed Municipal",
  "Packaging",
  "Metals",
  "Chemicals",
  "Waste Oils",
  "WEEE",
  "Construction & Demolition",
] as const;

export const DISPOSAL_METHODS = [
  "Landfill",
  "Incineration",
  "Recycling",
  "Energy Recovery",
  "Treatment",
] as const;

export const CONTRACTORS = [
  "Veolia",
  "Suez Recycling",
  "Biffa",
  "FCC Environment",
  "Cory",
] as const;

const numberish = (v: string) => v.trim() !== "" && !Number.isNaN(Number(v));

// ─────────────────────────────────────────────────────────────────────────────
// Server schema — coerces strings from the form/API into typed values.
// ─────────────────────────────────────────────────────────────────────────────
export const wasteSchema = z.object({
  siteId: z.string().trim().min(1, "Site is required"),
  wasteType: z.enum(WASTE_TYPES),
  streamCategory: z.string().trim().min(1, "Stream is required").max(64),
  weightKg: z.coerce.number().min(0, "Weight must be ≥ 0"),
  disposalMethod: z.string().trim().min(1, "Disposal method is required").max(64),
  contractor: z.string().trim().min(1, "Contractor is required").max(80),
  wtnReference: z.string().trim().max(64),
  transferDate: z.coerce.date({ message: "A valid transfer date is required" }),
  wtnDocumentR2Key: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().trim().max(200).optional(),
  ),
});

export type WasteInput = z.infer<typeof wasteSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Client form schema — all strings so React Hook Form + zodResolver stay simple.
// ─────────────────────────────────────────────────────────────────────────────
export const wasteFormSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  wasteType: z.enum(WASTE_TYPES, { message: "Waste type is required" }),
  streamCategory: z.string().min(1, "Stream is required"),
  weightKg: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  disposalMethod: z.string().min(1, "Disposal method is required"),
  contractor: z.string().min(1, "Contractor is required"),
  wtnReference: z.string().trim().max(64),
  transferDate: z.string().min(1, "Transfer date is required"),
  // Set by the upload step; hidden from the user.
  wtnDocumentR2Key: z.string().optional(),
});

export type WasteFormValues = z.infer<typeof wasteFormSchema>;
