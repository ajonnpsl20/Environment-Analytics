import { z } from "zod";

// Free-text in the schema; these are curated suggestions matching the seed data.
export const SUPPLIERS = [
  "EDF Energy",
  "E.ON Next",
  "British Gas",
  "SSE",
  "Octopus Energy",
] as const;

const numberish = (v: string) => v.trim() !== "" && !Number.isNaN(Number(v));
const emptyOrNumberish = (v: string) =>
  v.trim() === "" || !Number.isNaN(Number(v));

// ─────────────────────────────────────────────────────────────────────────────
// Server schema — coerces strings from the form/API into typed values.
// renewablePercent / supplier are optional.
// ─────────────────────────────────────────────────────────────────────────────
export const electricitySchema = z.object({
  siteId: z.string().trim().min(1, "Site is required"),
  meterId: z.string().trim().min(1, "Meter ID is required").max(32),
  consumptionKwh: z.coerce.number().min(0, "Consumption must be ≥ 0"),
  renewablePercent: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce
      .number()
      .min(0, "Must be between 0 and 100")
      .max(100, "Must be between 0 and 100")
      .optional(),
  ),
  supplier: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().trim().max(80).optional(),
  ),
  periodStart: z.coerce.date({ message: "A valid period start is required" }),
  periodEnd: z.coerce.date({ message: "A valid period end is required" }),
});

export type ElectricityInput = z.infer<typeof electricitySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Client form schema — all strings so React Hook Form + zodResolver stay simple.
// The server re-validates with `electricitySchema`, which coerces the values.
// ─────────────────────────────────────────────────────────────────────────────
export const electricityFormSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  meterId: z.string().trim().min(1, "Meter ID is required").max(32),
  consumptionKwh: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  renewablePercent: z
    .string()
    .trim()
    .refine(emptyOrNumberish, "Must be a number")
    .refine(
      (v) => v.trim() === "" || (Number(v) >= 0 && Number(v) <= 100),
      "Must be between 0 and 100",
    )
    .optional(),
  supplier: z.string().trim().max(80).optional(),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
});

export type ElectricityFormValues = z.infer<typeof electricityFormSchema>;
