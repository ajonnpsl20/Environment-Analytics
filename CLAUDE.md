# CLAUDE.md — EnviroHub PoC

This file is Claude Code's primary guide for working on this project. Read this top-to-bottom at the start of each new conversation. Update it as project decisions evolve.

---

## What this project is

**EnviroHub** is a centralized web application for an environmental-safety-standards team at a UK enterprise to collect, validate, and analyze multi-site environmental performance data. It replaces a manual Excel-based workflow that currently takes weeks-to-a-month per reporting cycle.

**Stage:** Proof of Concept (PoC) — partially-working demo built to pitch the target company. Not production. Not yet a commercial product.

**Target audience for the pitch:** Environmental compliance / sustainability leads at a UK company (initially one specific company; commercial expansion is Phase 3 — separate instances per tenant).

---

## PoC scope — what's IN

These four data-entry modules are the PoC:

1. **Air Emissions** (stack emissions per site/stack/pollutant) — dashboard uses **line charts**
2. **Waste Data** (waste transfer notes with file attachments) — dashboard uses **bar charts**
3. **Water Consumption** (meter readings) — dashboard uses **bar charts**
4. **Electricity Consumption** (kWh per period, peak/off-peak optional, renewable %) — dashboard uses **bar charts**

Cross-cutting features for ALL four modules:

- Manual web-form data entry
- Bulk Excel/CSV import
- "SAP connector" (mock — reads from a local JSON file styled as a configured connector in the UI)
- Approval workflow: `submitted` → Site Admin reviews → `approved` (locked + audit-logged) / `rejected` / `returned`
- Dashboard per metric with filters (date range, site, type/category) — filters drive both chart AND underlying table
- Export filtered table data to Excel/CSV
- Audit log for every state change

**3 roles:** System Admin, Site Admin, Data Entry User.

**5 demo sites** (UK-themed): Manchester manufacturing, Birmingham warehouse, London office, Glasgow plant, Cardiff distribution centre.

**Auth:** Hardcoded user list (NextAuth credentials provider). Architecture supports drop-in OIDC/SAML for the post-PoC corporate-SSO production deployment.

---

## PoC scope — what's OUT (do NOT build these unless explicitly asked)

- Scope 1 / Scope 2 / Scope 3 emissions calculations
- Emission factor library / management
- Sustainability Manager (read-only) role
- Auditor (read-only) role
- AI-based emissions forecasting (Phase 2)
- Automated anomaly detection (Phase 2)
- Carbon reduction recommendations (Phase 2)
- Supplier-level Scope 3 tracking portal (Phase 2)
- Real SAP connector (mocked with JSON)
- Real corporate SSO / SAML (mocked with hardcoded users)
- GDPR compliance features (deferred until commercialization concerns emerge)
- Multi-tenant database isolation (each future tenant = separate instance, not row-level isolation)

When the user asks for something on this OUT list, push back with a brief reminder of PoC scope and ask if they want to add it explicitly. Do NOT silently expand scope.

---

## Tech stack — locked in (do not propose alternatives unless asked)

| Layer | Choice | Notes |
|---|---|---|
| Frontend / API | Next.js 15 (App Router) | TypeScript, React Server Components where natural |
| Styling | Tailwind CSS v4 + shadcn/ui | Use shadcn primitives; avoid building from scratch |
| Charts | Recharts | Line + Bar only at PoC |
| Database | Neon Postgres (EU region — Frankfurt or Dublin) | Free tier; serverless; scale-to-zero OK |
| ORM | Prisma | Schema-first; migrations in `prisma/migrations` |
| Auth | NextAuth v5 (Auth.js) credentials provider | Hardcoded users in PoC; OIDC/SAML provider drop-in later |
| File storage | Cloudflare R2 | For Waste Transfer Note attachments; S3-compatible SDK |
| Excel I/O | SheetJS (`xlsx` npm package) | Both import and export |
| Hosting | Vercel (Hobby tier) | EU/UK region preferred |
| Validation | Zod | Schema validation for all forms and API inputs |
| Forms | React Hook Form + Zod resolver | Standard pattern across all entry forms |
| Tables | TanStack Table v8 | For all data tables (filtering, sorting, pagination) |
| Date handling | date-fns | Avoid moment.js |
| Icons | lucide-react | Already used by shadcn/ui |

**Total monthly cost during PoC: $0.**

---

## Project structure

```
envirohub/
├── CLAUDE.md                  # this file
├── README.md                  # human setup guide
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── components.json            # shadcn/ui config
├── .env.local                 # secrets (gitignored)
├── .env.example               # template for .env.local
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                # demo data seeder (5 sites + sample records)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # login page
│   │   ├── (app)/             # authenticated app routes
│   │   │   ├── dashboard/     # overview
│   │   │   ├── sites/         # site management (System Admin only)
│   │   │   ├── air-emissions/
│   │   │   ├── waste/
│   │   │   ├── water/
│   │   │   ├── electricity/
│   │   │   ├── approvals/     # Site Admin queue
│   │   │   ├── connectors/    # SAP connector mock UI
│   │   │   └── audit-log/
│   │   ├── api/               # API routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── air-emissions/
│   │   │   ├── waste/
│   │   │   ├── water/
│   │   │   ├── electricity/
│   │   │   ├── import/        # CSV/Excel import endpoints
│   │   │   ├── export/        # CSV/Excel export endpoints
│   │   │   ├── connectors/sap/  # mock SAP fetch endpoint
│   │   │   └── uploads/       # signed-URL generation for R2
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # shadcn primitives (auto-generated)
│   │   ├── charts/            # chart wrappers (LineChart, BarChart)
│   │   ├── data-entry/        # form components per metric
│   │   ├── tables/            # table wrappers with filter/export
│   │   ├── approval/          # approval workflow widgets
│   │   └── layout/            # sidebar, header, etc.
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── r2.ts              # R2 S3-compatible client
│   │   ├── permissions.ts     # role → action map
│   │   ├── audit.ts           # audit log helpers
│   │   ├── excel.ts           # SheetJS wrappers (import + export)
│   │   └── validations/       # Zod schemas per entity
│   ├── data/
│   │   └── sap-mock.json      # mock SAP connector data
│   └── types/
│       └── index.ts           # shared TypeScript types
└── public/
    └── logo.svg               # placeholder EnviroHub logo
```

---

## Data model (Prisma schema)

The core entities follow the PDF spec, simplified for PoC scope:

- **User** — id, email, name, hashedPassword (PoC only), role enum
- **Site** — id, siteId (human-readable), name, location, country, operationalType
- **AirEmissionRecord** — siteId, stackId, measuredAt, pollutantType, concentration, concentrationUnit, flowRate, totalEmissions, measurementMethod, equipmentReference, status, submittedBy, approvedBy, approvedAt
- **WasteRecord** — siteId, wasteType (enum: hazardous/non-hazardous/recyclable), streamCategory, weight, weightUnit, disposalMethod, contractor, wtnReference, transferDate, **wtnDocumentR2Key** (nullable), status, submittedBy, approvedBy, approvedAt
- **WaterUsageRecord** — siteId, meterId, readingStart, readingEnd, consumption, source enum, periodStart, periodEnd, status, submittedBy, approvedBy, approvedAt
- **ElectricityRecord** — siteId, meterId, consumption, peakKwh (nullable), offPeakKwh (nullable), renewablePercent (nullable), supplier (nullable), periodStart, periodEnd, status, submittedBy, approvedBy, approvedAt
- **AuditLog** — id, entityType, entityId, action (enum: created/submitted/approved/rejected/returned/edited/deleted/imported), userId, timestamp, beforeJson, afterJson, notes

Use Prisma enums for `Role`, `RecordStatus`, `WasteType`, `WaterSource`, `MeasurementMethod`, `AuditAction`.

**Convention:** all four entry record tables share a common subset of fields (status, submittedBy, approvedBy, approvedAt) — consider a TypeScript discriminated union pattern in API layer for shared workflow logic.

---

## Coding conventions

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without comment
- **Server Components by default** in App Router; mark client components with `'use client'` only when needed (form state, charts, interactive filters)
- **API routes** use Next.js Route Handlers (`route.ts`); always validate input with Zod; always return typed responses
- **Database access** only via the Prisma client singleton in `src/lib/db.ts`; never instantiate ad-hoc clients
- **No raw SQL** in PoC — use Prisma typed queries
- **No `console.log` in production code paths** — use structured logging (just `console.error` is fine for PoC, but no debug logs left in)
- **All forms** use React Hook Form + Zod resolver; never use uncontrolled form state
- **All tables** use TanStack Table with the standard wrapper component
- **All charts** use the shared `LineChart`/`BarChart` wrapper components (not Recharts directly in pages) so theming is consistent
- **Audit log** — every state change writes an `AuditLog` entry; never bypass

## Naming

- Routes: kebab-case (`/air-emissions`)
- Database fields: camelCase in Prisma schema (Prisma maps to snake_case in Postgres automatically — use `@@map` only if needed)
- React components: PascalCase
- Hooks: `useXxx`
- Server actions: `xxxAction`

---

## Approval workflow — the canonical pattern

For each of the four record types, the lifecycle is:

```
[Data Entry User submits] → status='submitted'
       │
       ▼
[Site Admin reviews on /approvals]
       │
       ├──→ Approve → status='approved' (LOCKED — no further edits)
       │             AuditLog(action='approved', userId=siteAdminId)
       │
       ├──→ Reject  → status='rejected' (terminal; new submission required)
       │             AuditLog(action='rejected', notes=reason)
       │
       └──→ Return  → status='returned' (editable by submitter)
                     AuditLog(action='returned', notes=feedback)
```

- Approved records are immutable. Any attempt to edit an `approved` record must return 403 with a clear error message.
- The `/approvals` page lists all records with `status='submitted'` for sites the current Site Admin manages.
- Editing a `returned` record auto-resets it to `submitted` upon save.

---

## SAP connector (mock) pattern

The mock connector exists in the UI as a real-looking feature so the pitch shows the connector pattern.

- `/connectors` page lists "Configured Connectors" — shows one entry: "SAP ERP — Production" with a status badge and last-sync time
- Clicking "Sync Now" hits `/api/connectors/sap?metric=<metric>` which reads `src/data/sap-mock.json`, normalizes records to the target metric's schema, and creates them with `status='submitted'` attributed to a `system` user
- Surface a small banner/notification on success: "Imported 47 records from SAP — pending review"
- Records imported via connector flow into the standard approval workflow

The pitch narrative: "Here's the connector pattern. Real SAP integration plugs in here — same data normalization, same approval flow."

**Do not pretend the connector is real to the user.** The UI says "SAP ERP — Production (Demo)" with a small badge. Honesty here protects credibility during the pitch.

---

## Dashboards

Each metric has its own page under `/{metric}` with two tabs/sections:

1. **Data** tab — TanStack Table with filter sidebar (date range, site, type/category), bulk import button, manual entry button, export-to-Excel and export-to-CSV buttons
2. **Dashboard** tab — at least one chart driven by the same filter state as the Data tab

Filter state is held in URL query params (`?dateFrom=2024-01-01&site=manchester&...`) so:
- Filter state survives reloads
- Export endpoint receives the same filters
- Demo links can be shared with pre-applied filters

**Air Emissions** dashboard: Line chart of pollutant concentration over time, one line per pollutant type, filter-driven.

**Waste, Water, Electricity** dashboards: Bar chart of totals per period (week/month/quarter), stacked or grouped by site / category as appropriate, filter-driven.

Design dashboards to support **multiple charts per metric** even though we ship one chart per metric initially. Pattern: each page renders an array of `<ChartCard>` components; adding more is a config addition, not a refactor.

---

## Data import / export

**Import flow** (Excel + CSV both supported):

1. User clicks "Import" on a metric page → modal opens with download-template button + drop zone
2. Drop a file → server parses with SheetJS → validates each row with the metric's Zod schema
3. Show preview: "47 valid rows, 3 invalid (download error report)" with row-level errors
4. User clicks "Import valid rows" → records created with `status='submitted'`, audit-logged with `action='imported'`

**Export flow:**

1. User applies filters on the Data tab
2. Clicks "Export to Excel" or "Export to CSV"
3. Server endpoint receives same filter query → streams the filtered records to a SheetJS workbook (Excel) or CSV
4. Filename: `envirohub-{metric}-{YYYY-MM-DD}.xlsx`

---

## Role-based permissions

Permissions matrix:

| Action | System Admin | Site Admin | Data Entry User |
|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ |
| Create/edit sites | ✅ | ❌ | ❌ |
| View all sites' data | ✅ | ✅ (assigned sites only) | ✅ (assigned sites only) |
| Enter data | ✅ | ✅ | ✅ |
| Approve / reject / return submissions | ✅ | ✅ (assigned sites only) | ❌ |
| Import bulk data | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ |
| Run SAP connector sync | ✅ | ✅ | ❌ |
| View audit log | ✅ | ✅ (assigned sites only) | ❌ |

For PoC, Data Entry Users are also assigned to specific sites (a `siteAssignments` join table). System Admin sees everything.

All permission checks go through `src/lib/permissions.ts`. Never inline a role check in a route handler.

---

## Demo data

`prisma/seed.ts` produces:

- **3 users:** `admin@envirohub.demo` (System Admin), `siteadmin@envirohub.demo` (Site Admin, assigned to all 5 sites), `data@envirohub.demo` (Data Entry User, assigned to Manchester + Birmingham)
- **5 sites:** Manchester manufacturing, Birmingham warehouse, London office, Glasgow plant, Cardiff distribution centre
- **~200 air emission records** across 2023-2025, mix of approved/submitted, multiple pollutants
- **~150 waste records** across 2023-2025, mix of types and disposal methods
- **~120 water records** across 2023-2025, multiple meters per site
- **~120 electricity records** across 2023-2025, with renewable % varying

All seed records are deterministic (seeded random) so demos are repeatable.

Demo login passwords are `demo1234` for all three users.

---

## Working agreements with Claude Code

When picking up a new task in this project:

1. **Check this file first.** Confirm task is within PoC scope. If unclear, ASK the operator before building.
2. **Run `prisma generate` and `prisma migrate dev`** after any schema change. Don't skip.
3. **Run `npm run lint` and `npm run typecheck`** before declaring a task complete.
4. **Write seed data** for any new entity so demos still work.
5. **Update this file** when project decisions change (don't let it go stale).
6. **No commented-out code.** Delete it; git history preserves it.
7. **No TODO comments** without a tracked task. If you need to defer something, tell the operator explicitly.
8. **Push back on scope creep.** If asked to build something on the OUT list, surface the conflict before building.
9. **The pitch demo is the success criterion.** When uncertain about polish vs functionality, prioritize what makes the pitch land.

---

## Pitch-readiness check before each demo

Before any demo to the friend or to the target company, verify:

- [ ] All 5 sites visible with realistic-sounding names + addresses
- [ ] All 4 metric pages load with seeded data and at least one chart renders
- [ ] Login as each of the 3 roles works; each role sees the expected UI surface
- [ ] At least one record in each metric has gone through the full approval cycle
- [ ] SAP connector sync button works (and is honest about being a demo)
- [ ] Excel import works on at least one metric (have a sample file ready)
- [ ] Excel export works with filters applied
- [ ] Audit log shows recent activity
- [ ] Deploy preview URL is up-to-date and works in an incognito window
- [ ] Demo data has been reset so prior session's edits don't show

Run the checklist physically; don't trust memory.

---

## Operator context (for situational awareness)

- The builder (operator) is an India-based solo developer working in evenings/weekends, using VS Code + Claude Code.
- Pre-customer build budget: under USD 100 (currently $0 with the stack chosen).
- This is a speculative PoC for a friend's UK employer. The friend has NOT yet pitched the idea to the company. Validation will happen with the friend FIRST, then a pitch.
- Operator does not natively speak Danish, French, or other EU languages — but EnviroHub is English-only since the target users are UK-based.
- Operator may eventually offer this commercially. The single-tenant architecture chosen here supports that via instance-per-tenant; do NOT prematurely refactor toward row-level multi-tenancy in PoC.

---

## Glossary

- **WTN** — Waste Transfer Note. UK regulatory document tracking waste handover between producer and carrier. PDF attachment expected per waste record.
- **Site** — a single physical facility (manufacturing plant, warehouse, office, etc.)
- **Stack** — an industrial emission point (chimney, vent) at a site
- **Meter** — a measurement device for water or electricity, identified by Meter ID
- **PoC** — Proof of Concept
- **IdP** — Identity Provider (for the future corporate SSO integration)
- **Submitted / Approved / Returned / Rejected** — the four record statuses
- **System Admin / Site Admin / Data Entry User** — the three PoC roles

---

*Last updated: project initialization. Update this date when material decisions change.*
