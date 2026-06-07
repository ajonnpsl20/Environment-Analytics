import { z } from "zod";

export const OPERATIONAL_TYPES = [
  "Manufacturing",
  "Warehouse",
  "Office",
  "Distribution",
  "Production Plant",
  "Other",
] as const;

// Optional numeric fields come from text inputs; treat "" / null as "not provided".
const optionalCoord = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(min).max(max).optional(),
  );

// Canonical schema used by server actions — coerces lat/long from form strings.
export const siteSchema = z.object({
  siteId: z.string().trim().min(1, "Site ID is required").max(32),
  name: z.string().trim().min(1, "Name is required").max(120),
  address: z.string().trim().min(1, "Address is required").max(240),
  country: z.string().trim().min(1, "Country is required").max(80),
  operationalType: z.string().trim().min(1, "Operational type is required"),
  latitude: optionalCoord(-90, 90),
  longitude: optionalCoord(-180, 180),
});

export type SiteInput = z.infer<typeof siteSchema>;

// Client form schema — all string fields so React Hook Form + zodResolver types
// stay simple (no transforms). The server action re-validates with `siteSchema`,
// which coerces latitude/longitude and turns "" into undefined.
export const siteFormSchema = z.object({
  siteId: z.string().trim().min(1, "Site ID is required").max(32),
  name: z.string().trim().min(1, "Name is required").max(120),
  address: z.string().trim().min(1, "Address is required").max(240),
  country: z.string().trim().min(1, "Country is required").max(80),
  operationalType: z.string().trim().min(1, "Operational type is required"),
  latitude: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Number(v)), "Must be a number")
    .optional(),
  longitude: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Number(v)), "Must be a number")
    .optional(),
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;
