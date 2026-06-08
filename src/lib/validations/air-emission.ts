import { z } from "zod";

// Plain string constants for selects/filters — safe in client components.
// `pollutantType` and `concentrationUnit` are free-text in the schema; these are
// curated suggestions matching the seed data so the demo looks consistent.
export const POLLUTANT_TYPES = [
  "CO2",
  "NOx",
  "SOx",
  "PM2.5",
  "PM10",
  "CO",
  "VOC",
] as const;

export const CONCENTRATION_UNITS = ["mg/m³", "µg/m³", "ppm", "ppb"] as const;

// Mirrors the `MeasurementMethod` enum in prisma/schema.prisma.
export const MEASUREMENT_METHODS = [
  "CONTINUOUS",
  "PERIODIC",
  "CALCULATED",
  "ESTIMATED",
] as const;

export type MeasurementMethodName = (typeof MEASUREMENT_METHODS)[number];

export const MEASUREMENT_METHOD_LABEL: Record<MeasurementMethodName, string> = {
  CONTINUOUS: "Continuous (CEMS)",
  PERIODIC: "Periodic",
  CALCULATED: "Calculated",
  ESTIMATED: "Estimated",
};

const numberish = (v: string) => v.trim() !== "" && !Number.isNaN(Number(v));
const emptyOrNumberish = (v: string) => v.trim() === "" || !Number.isNaN(Number(v));

// ─────────────────────────────────────────────────────────────────────────────
// Server schema — coerces strings from the form/API into typed values.
// ─────────────────────────────────────────────────────────────────────────────
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

export const airEmissionSchema = z.object({
  siteId: z.string().trim().min(1, "Site is required"),
  stackId: z.string().trim().min(1, "Stack ID is required").max(32),
  measuredAt: z.coerce.date({ message: "A valid measurement date is required" }),
  pollutantType: z.string().trim().min(1, "Pollutant is required").max(32),
  concentration: z.coerce.number().min(0, "Concentration must be ≥ 0"),
  concentrationUnit: z.string().trim().min(1, "Unit is required").max(16),
  flowRate: optionalNumber,
  totalEmissions: optionalNumber,
  measurementMethod: z.enum(MEASUREMENT_METHODS),
  equipmentReference: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().trim().max(64).optional(),
  ),
});

export type AirEmissionInput = z.infer<typeof airEmissionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Client form schema — all strings so React Hook Form + zodResolver stay simple.
// The server re-validates with `airEmissionSchema`, which coerces the numbers/date.
// ─────────────────────────────────────────────────────────────────────────────
export const airEmissionFormSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  stackId: z.string().trim().min(1, "Stack ID is required").max(32),
  measuredAt: z.string().min(1, "Measurement date is required"),
  pollutantType: z.string().min(1, "Pollutant is required"),
  concentration: z
    .string()
    .trim()
    .refine(numberish, "Must be a number")
    .refine((v) => Number(v) >= 0, "Must be ≥ 0"),
  concentrationUnit: z.string().min(1, "Unit is required"),
  flowRate: z
    .string()
    .trim()
    .refine(emptyOrNumberish, "Must be a number")
    .optional(),
  totalEmissions: z
    .string()
    .trim()
    .refine(emptyOrNumberish, "Must be a number")
    .optional(),
  measurementMethod: z.enum(MEASUREMENT_METHODS, {
    message: "Measurement method is required",
  }),
  equipmentReference: z.string().trim().max(64).optional(),
});

export type AirEmissionFormValues = z.infer<typeof airEmissionFormSchema>;
