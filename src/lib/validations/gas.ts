import { z } from "zod";

const numberish = (v: string) => v.trim() !== "" && !Number.isNaN(Number(v));

// ─────────────────────────────────────────────────────────────────────────────
// Server schema — coerces strings from the form/API into typed values.
// ─────────────────────────────────────────────────────────────────────────────
export const gasSchema = z.object({
  siteId: z.string().trim().min(1, "Site is required"),
  meterId: z.string().trim().min(1, "Meter ID is required").max(32),
  consumptionM3: z.coerce.number().min(0, "Consumption must be ≥ 0"),
  periodStart: z.coerce.date({ message: "A valid period start is required" }),
  periodEnd: z.coerce.date({ message: "A valid period end is required" }),
});

export type GasInput = z.infer<typeof gasSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Client form schema — all strings so React Hook Form + zodResolver stay simple.
// The server re-validates with `gasSchema`, which coerces the values.
// ─────────────────────────────────────────────────────────────────────────────
export const gasFormSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  meterId: z.string().trim().min(1, "Meter ID is required").max(32),
  consumptionM3: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
});

export type GasFormValues = z.infer<typeof gasFormSchema>;
