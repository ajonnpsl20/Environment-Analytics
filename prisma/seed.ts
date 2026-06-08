import {
  PrismaClient,
  Role,
  RecordStatus,
  WasteType,
  WaterSource,
  MeasurementMethod,
  AuditAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic PRNG (mulberry32) — fixed seed so demo data is repeatable.
// ─────────────────────────────────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const randInt = (min: number, max: number): number =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const round = (n: number, d = 2): number => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

const RANGE_START = new Date("2023-01-01T00:00:00.000Z").getTime();
const RANGE_END = new Date("2025-12-31T00:00:00.000Z").getTime();
const randomDate = (): Date =>
  new Date(RANGE_START + rand() * (RANGE_END - RANGE_START));
const addDays = (d: Date, days: number): Date =>
  new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

// Weighted status: mostly approved, some submitted, a few returned/rejected.
function pickStatus(): RecordStatus {
  const r = rand();
  if (r < 0.65) return RecordStatus.APPROVED;
  if (r < 0.85) return RecordStatus.SUBMITTED;
  if (r < 0.93) return RecordStatus.RETURNED;
  return RecordStatus.REJECTED;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static reference data
// ─────────────────────────────────────────────────────────────────────────────
const SITES = [
  {
    id: "site-manchester",
    siteId: "MAN-001",
    name: "Manchester Manufacturing Facility",
    address: "Trafford Park, Manchester",
    operationalType: "Manufacturing",
    latitude: 53.4699,
    longitude: -2.3211,
  },
  {
    id: "site-birmingham",
    siteId: "BIR-002",
    name: "Birmingham Distribution Warehouse",
    address: "Aston, Birmingham",
    operationalType: "Warehouse",
    latitude: 52.5012,
    longitude: -1.8823,
  },
  {
    id: "site-london",
    siteId: "LON-003",
    name: "London Head Office",
    address: "Canary Wharf, London",
    operationalType: "Office",
    latitude: 51.5054,
    longitude: -0.0235,
  },
  {
    id: "site-glasgow",
    siteId: "GLA-004",
    name: "Glasgow Production Plant",
    address: "Cambuslang, Glasgow",
    operationalType: "Manufacturing",
    latitude: 55.8194,
    longitude: -4.1659,
  },
  {
    id: "site-cardiff",
    siteId: "CAR-005",
    name: "Cardiff Distribution Centre",
    address: "Cardiff Bay, Cardiff",
    operationalType: "Distribution",
    latitude: 51.4636,
    longitude: -3.1646,
  },
] as const;

const SITE_IDS = SITES.map((s) => s.id);

const USER_ADMIN = "user-admin";
const USER_SITEADMIN = "user-siteadmin";
const USER_SITEADMIN2 = "user-siteadmin2";
const USER_DATA = "user-data";
// Service account that SAP-connector-imported records are attributed to.
const USER_SYSTEM = "user-system";

// Per-site assignments — deliberately split so the SystemAdmin↔SiteAdmin scope
// difference is visible in the demo (each Site Admin sees only their region).
const SITEADMIN_SITES = new Set([
  "site-manchester",
  "site-birmingham",
  "site-london",
]); // Site Admin – England
const SITEADMIN2_SITES = new Set(["site-glasgow", "site-cardiff"]); // Site Admin – Scotland & Wales
// Data Entry User is assigned to Manchester + Birmingham only.
const DATA_USER_SITES = new Set(["site-manchester", "site-birmingham"]);

// Who submits a record at a given site — always a user assigned to that site, so
// each role's scoped views (dashboards, approvals, audit) stay coherent.
const submitterFor = (siteId: string): string => {
  if (DATA_USER_SITES.has(siteId)) return USER_DATA;
  if (SITEADMIN2_SITES.has(siteId)) return USER_SITEADMIN2;
  return USER_SITEADMIN; // London (+ any other England site)
};

// Who approves/returns/rejects a record at a given site (a Site Admin for it).
const approverFor = (siteId: string): string =>
  SITEADMIN2_SITES.has(siteId) ? USER_SITEADMIN2 : USER_SITEADMIN;

const POLLUTANTS: Record<string, [number, number]> = {
  CO2: [10000, 50000],
  NOx: [50, 400],
  SOx: [20, 300],
  "PM2.5": [1, 50],
};
const MEASUREMENT_METHODS = [
  MeasurementMethod.CONTINUOUS,
  MeasurementMethod.PERIODIC,
  MeasurementMethod.CALCULATED,
  MeasurementMethod.ESTIMATED,
] as const;

const WASTE_TYPES = [
  WasteType.HAZARDOUS,
  WasteType.NON_HAZARDOUS,
  WasteType.RECYCLABLE,
] as const;
const WASTE_STREAMS = [
  "Mixed Municipal",
  "Packaging",
  "Metals",
  "Chemicals",
  "Waste Oils",
  "WEEE",
  "Construction & Demolition",
] as const;
const DISPOSAL_METHODS = [
  "Landfill",
  "Incineration",
  "Recycling",
  "Energy Recovery",
  "Treatment",
] as const;
const CONTRACTORS = [
  "Veolia",
  "Suez Recycling",
  "Biffa",
  "FCC Environment",
  "Cory",
] as const;

const WATER_SOURCES = [
  WaterSource.MAINS,
  WaterSource.BOREHOLE,
  WaterSource.RAINWATER,
  WaterSource.SURFACE_WATER,
  WaterSource.RECYCLED,
] as const;

const SUPPLIERS = [
  "EDF Energy",
  "E.ON Next",
  "British Gas",
  "SSE",
  "Octopus Energy",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Generic builders
// ─────────────────────────────────────────────────────────────────────────────
type WorkflowFields = {
  status: RecordStatus;
  submittedById: string;
  approvedById: string | null;
  approvedAt: Date | null;
};

type AuditRow = {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  timestamp: Date;
  notes: string | null;
};

const auditRows: AuditRow[] = [];

// Build workflow fields + audit-log entries for a record.
function workflow(
  entityType: string,
  entityId: string,
  siteId: string,
  createdAt: Date,
): WorkflowFields {
  const status = pickStatus();
  const submittedById = submitterFor(siteId);

  auditRows.push({
    entityType,
    entityId,
    action: AuditAction.SUBMITTED,
    userId: submittedById,
    timestamp: createdAt,
    notes: null,
  });

  let approvedById: string | null = null;
  let approvedAt: Date | null = null;
  const reviewer = approverFor(siteId);

  if (status === RecordStatus.APPROVED) {
    approvedById = reviewer;
    approvedAt = addDays(createdAt, randInt(1, 7));
    auditRows.push({
      entityType,
      entityId,
      action: AuditAction.APPROVED,
      userId: reviewer,
      timestamp: approvedAt,
      notes: null,
    });
  } else if (status === RecordStatus.RETURNED) {
    auditRows.push({
      entityType,
      entityId,
      action: AuditAction.RETURNED,
      userId: reviewer,
      timestamp: addDays(createdAt, randInt(1, 5)),
      notes: "Please re-check the meter/equipment reference and resubmit.",
    });
  } else if (status === RecordStatus.REJECTED) {
    auditRows.push({
      entityType,
      entityId,
      action: AuditAction.REJECTED,
      userId: reviewer,
      timestamp: addDays(createdAt, randInt(1, 5)),
      notes: "Duplicate of an existing record.",
    });
  }

  return { status, submittedById, approvedById, approvedAt };
}

async function main() {
  console.error("Seeding EnviroHub demo data…");

  // Clean slate so demos are repeatable.
  await prisma.connectorSync.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.airEmissionRecord.deleteMany();
  await prisma.wasteRecord.deleteMany();
  await prisma.waterUsageRecord.deleteMany();
  await prisma.electricityRecord.deleteMany();
  await prisma.siteAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();

  // Sites
  await prisma.site.createMany({ data: SITES.map((s) => ({ ...s })) });

  // Users
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error(
      "SEED_DEMO_PASSWORD is not set — add it to .env.local (see .env.example).",
    );
  }
  const hashedPassword = await bcrypt.hash(demoPassword, 10);
  await prisma.user.createMany({
    data: [
      {
        id: USER_ADMIN,
        email: "admin@envirohub.demo",
        name: "System Administrator",
        hashedPassword,
        role: Role.SystemAdmin,
      },
      {
        id: USER_SITEADMIN,
        email: "siteadmin@envirohub.demo",
        name: "Site Administrator – England",
        hashedPassword,
        role: Role.SiteAdmin,
      },
      {
        id: USER_SITEADMIN2,
        email: "siteadmin2@envirohub.demo",
        name: "Site Administrator – Scotland & Wales",
        hashedPassword,
        role: Role.SiteAdmin,
      },
      {
        id: USER_DATA,
        email: "data@envirohub.demo",
        name: "Data Entry User",
        hashedPassword,
        role: Role.DataEntryUser,
      },
      {
        id: USER_SYSTEM,
        email: "system@envirohub.demo",
        name: "SAP Connector (System)",
        hashedPassword,
        role: Role.SystemAdmin,
      },
    ],
  });

  // Site assignments — two regional Site Admins (non-overlapping) so the per-site
  // scope difference vs SystemAdmin is visible; Data User → Manchester + Birmingham.
  await prisma.siteAssignment.createMany({
    data: [
      ...[...SITEADMIN_SITES].map((siteId) => ({ userId: USER_SITEADMIN, siteId })),
      ...[...SITEADMIN2_SITES].map((siteId) => ({ userId: USER_SITEADMIN2, siteId })),
      ...[...DATA_USER_SITES].map((siteId) => ({ userId: USER_DATA, siteId })),
    ],
  });

  // Air emission records (~200)
  const airRows = Array.from({ length: 200 }, (_, i) => {
    const id = `air-${String(i).padStart(4, "0")}`;
    const siteId = pick(SITE_IDS);
    const pollutant = pick(Object.keys(POLLUTANTS));
    const [lo, hi] = POLLUTANTS[pollutant];
    const measuredAt = randomDate();
    const wf = workflow("AirEmissionRecord", id, siteId, measuredAt);
    return {
      id,
      siteId,
      stackId: `STK-${randInt(1, 4)}`,
      measuredAt,
      pollutantType: pollutant,
      concentration: round(lo + rand() * (hi - lo)),
      concentrationUnit: "mg/m³",
      flowRate: round(randInt(1000, 50000)),
      totalEmissions: round((lo + rand() * (hi - lo)) * randInt(10, 100)),
      measurementMethod: pick(MEASUREMENT_METHODS),
      equipmentReference: `CEMS-${randInt(100, 999)}`,
      ...wf,
    };
  });
  await prisma.airEmissionRecord.createMany({ data: airRows });

  // Waste records (~150)
  const wasteRows = Array.from({ length: 150 }, (_, i) => {
    const id = `waste-${String(i).padStart(4, "0")}`;
    const siteId = pick(SITE_IDS);
    const transferDate = randomDate();
    const wf = workflow("WasteRecord", id, siteId, transferDate);
    return {
      id,
      siteId,
      wasteType: pick(WASTE_TYPES),
      streamCategory: pick(WASTE_STREAMS),
      weightKg: round(randInt(50, 20000) + rand()),
      disposalMethod: pick(DISPOSAL_METHODS),
      contractor: pick(CONTRACTORS),
      wtnReference: `WTN-${transferDate.getUTCFullYear()}-${String(i).padStart(4, "0")}`,
      transferDate,
      wtnDocumentR2Key: null,
      ...wf,
    };
  });
  await prisma.wasteRecord.createMany({ data: wasteRows });

  // Water usage records (~120)
  const waterRows = Array.from({ length: 120 }, (_, i) => {
    const id = `water-${String(i).padStart(4, "0")}`;
    const siteId = pick(SITE_IDS);
    const periodStart = randomDate();
    const periodEnd = addDays(periodStart, 30);
    const readingStart = round(randInt(10000, 500000) + rand());
    const consumptionM3 = round(randInt(50, 5000) + rand());
    const wf = workflow("WaterUsageRecord", id, siteId, periodStart);
    return {
      id,
      siteId,
      meterId: `WM-${randInt(1, 3)}`,
      readingStart,
      readingEnd: round(readingStart + consumptionM3),
      consumptionM3,
      source: pick(WATER_SOURCES),
      periodStart,
      periodEnd,
      ...wf,
    };
  });
  await prisma.waterUsageRecord.createMany({ data: waterRows });

  // Electricity records (~120)
  const elecRows = Array.from({ length: 120 }, (_, i) => {
    const id = `elec-${String(i).padStart(4, "0")}`;
    const siteId = pick(SITE_IDS);
    const periodStart = randomDate();
    const periodEnd = addDays(periodStart, 30);
    const consumptionKwh = round(randInt(5000, 250000) + rand());
    const peakKwh = round(consumptionKwh * (0.4 + rand() * 0.2));
    const wf = workflow("ElectricityRecord", id, siteId, periodStart);
    return {
      id,
      siteId,
      meterId: `EM-${randInt(1, 3)}`,
      consumptionKwh,
      peakKwh,
      offPeakKwh: round(consumptionKwh - peakKwh),
      renewablePercent: round(rand() * 100, 1),
      supplier: pick(SUPPLIERS),
      periodStart,
      periodEnd,
      ...wf,
    };
  });
  await prisma.electricityRecord.createMany({ data: elecRows });

  // Audit log (accumulated during record generation)
  await prisma.auditLog.createMany({ data: auditRows });

  // Pre-seed a realistic "last sync" for the SAP connector (Air Emissions only;
  // the other metrics have no descriptor yet, so they read as "never synced").
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.connectorSync.create({
    data: {
      connectorKey: "sap",
      metricKey: "airEmission",
      lastSyncAt: yesterday,
      lastCreated: 18,
    },
  });

  const total =
    airRows.length + wasteRows.length + waterRows.length + elecRows.length;
  console.error(
    `Seed complete: ${SITES.length} sites, 5 users, ${total} metric records ` +
      `(${airRows.length} air, ${wasteRows.length} waste, ${waterRows.length} water, ` +
      `${elecRows.length} electricity), ${auditRows.length} audit-log entries.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
