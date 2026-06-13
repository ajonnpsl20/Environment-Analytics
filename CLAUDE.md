# CLAUDE.md — EnviroHub PoC

This file is Claude Code's primary guide for working on this project. Read this top-to-bottom at the start of each new conversation. Update it as project decisions evolve.

---

## What this project is

**EnviroHub** is a centralized web application for an environmental-safety-standards team at a UK enterprise to collect, validate, and analyze multi-site environmental performance data. It replaces a manual Excel-based workflow that currently takes weeks-to-a-month per reporting cycle.

**Stage:** Proof of Concept (PoC) — partially-working demo built to pitch the target company. Not production. Not yet a commercial product.

**Target audience for the pitch:** Environmental compliance / sustainability leads at a UK company (initially one specific company; commercial expansion is Phase 3 — separate instances per tenant).

---

## PoC scope — what's IN

These five data-entry modules are the PoC:

1. **Air Emissions** (stack emissions per site/stack/pollutant) — dashboard: **one line chart per pollutant** (averaged concentration over time)
2. **Waste Data** (waste transfer notes with required EWC code + required WTN reference & PDF) — dashboard: **two bar charts** (hazardous + non-hazardous, grouped by site)
3. **Water Consumption** (meter readings) — dashboard: **one nested bar chart** (month → grouped by site → split by source; defaults to last 6 months)
4. **Electricity Consumption** (kWh per period, renewable %) — dashboard: **one grouped-and-stacked bar chart** (per month, one bar per site, stacked renewable/non-renewable; defaults to last 12 months)
5. **Gas Consumption** (m³ per period per meter) — dashboard: **one grouped bar chart** (one bar per site per month; defaults to last 12 months)

Cross-cutting features for ALL four modules:

- Manual web-form data entry
- Bulk Excel/CSV import
- "SAP connector" (mock — reads from a local JSON file styled as a configured connector in the UI)
- Dashboard per metric with filters (date range + **multi-select** site, type/category) — filters drive both chart AND underlying table
- Export filtered table data to Excel/CSV
- **Data Entry Log** for every record change (created / edited / imported / deleted)

> **No approval workflow.** Records are entered and immediately live — there is no submitted/approved/rejected/returned status, no `/approvals` queue, and no record locking. (Removed 2026-06-11; see history if reinstating.)

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
| Frontend / API | Next.js 16 (App Router) | TypeScript, React Server Components where natural |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) | Use shadcn primitives; avoid building from scratch. shadcn now ships on `@base-ui/react`, not Radix |
| Charts | Recharts | Line + Bar only at PoC |
| Database | Neon Postgres (EU region — Frankfurt or Dublin) | Free tier; serverless; scale-to-zero OK |
| ORM | Prisma 6 (pinned) | Schema-first; migrations in `prisma/migrations`. Pinned to v6 — do NOT upgrade to v7 (it requires runtime driver adapters and forbids `url` in schema) without re-discussing |
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

### Toolchain notes (actual, post-bootstrap)

The bootstrap used `@latest` tooling, which drifted from the original plan. The repo as built reflects:

- **Next.js 16** (not 15). App Router patterns are unchanged.
- **Prisma 6, pinned.** `generator client { provider = "prisma-client-js" }` + `url = env("DATABASE_URL")` in `schema.prisma`; import the client from `@prisma/client`. Do not bump to Prisma 7.
- **shadcn/ui on Base UI** (`@base-ui/react`). The registry's `form` item ships no files, so `src/components/ui/form.tsx` is the canonical React-Hook-Form wrapper, added manually (depends on `@radix-ui/react-slot`).
- **Env loading:** all secrets live in `.env.local` (gitignored). Prisma 6 only auto-loads `.env`, so the `db:*` npm scripts wrap Prisma with `dotenv -e .env.local --` (dotenv-cli). Next.js loads `.env.local` natively. There is no `.env` or `prisma.config.ts`.
- **DB workflow via npm scripts:** `npm run db:migrate`, `db:seed`, `db:reset`, `db:studio`, `db:generate` (and `postinstall` runs `prisma generate` for Vercel builds).
- Actual config files: `next.config.ts` (not `.mjs`); Tailwind v4 is configured in CSS (`globals.css`), so there is no `tailwind.config.ts`.

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
│   │   ├── (app)/             # authenticated app routes (login lands on air-emissions)
│   │   │   ├── sites/         # site management (System Admin only)
│   │   │   ├── air-emissions/
│   │   │   ├── waste/
│   │   │   ├── water/
│   │   │   ├── electricity/
│   │   │   ├── gas/
│   │   │   ├── connectors/    # SAP connector mock UI
│   │   │   └── audit-log/     # the "Data Entry Log" (route kept as /audit-log)
│   │   ├── api/               # API routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── air-emissions/
│   │   │   ├── waste/
│   │   │   ├── water/
│   │   │   ├── electricity/
│   │   │   ├── gas/
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

> **`prisma/schema.prisma` is the source of truth** for exact field names/types. The list below is the conceptual model; where it differs (e.g. `weightKg`, `consumptionM3`, `consumptionKwh`, `Site.address`), defer to the schema.

The core entities follow the PDF spec, simplified for PoC scope:

> **No status/authorship columns.** With the approval workflow removed, the five record tables carry **no** `status`, `submittedBy`, `approvedBy`, or `approvedAt`. Who-entered-what lives only in the Data Entry Log (`AuditLog.userId`).

- **User** — id, email, name, hashedPassword (PoC only), role enum
- **Site** — id, siteId (human-readable), name, address, country, operationalType
- **AirEmissionRecord** — siteId, stackId, measuredAt, pollutantType, concentration, concentrationUnit, flowRate, totalEmissions, measurementMethod, equipmentReference
- **WasteRecord** — siteId, wasteType (enum: hazardous/non-hazardous/recyclable), **ewcCode (required)**, streamCategory, weightKg, disposalMethod, contractor, **wtnReference (required)**, transferDate, **wtnDocumentR2Key** (nullable in schema; required by the manual web form/API, optional for import/connector)
- **WaterUsageRecord** — siteId, meterId, readingStart, readingEnd, consumptionM3, source enum, periodStart, periodEnd
- **ElectricityRecord** — siteId, meterId, consumptionKwh, renewablePercent (nullable), supplier (nullable), periodStart, periodEnd
- **GasRecord** — siteId, meterId, consumptionM3, periodStart, periodEnd
- **AuditLog** — id, entityType, entityId, action (enum), userId, timestamp, beforeJson, afterJson, notes

Use Prisma enums for `Role`, `WasteType`, `WaterSource`, `MeasurementMethod`, `AuditAction`. (`RecordStatus` was removed.) The `AuditAction` enum keeps its legacy values for migration simplicity, but only **CREATED / EDITED / DELETED / IMPORTED** are ever written; `src/lib/audit-constants.ts` lists just those for the log's action filter.

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

## Record lifecycle (no approval workflow)

Records are created and immediately live — no review step. Create → `AuditLog(action='CREATED')`; edit (always allowed) → `AuditLog(action='EDITED')`; bulk/connector → `AuditLog(action='IMPORTED')`; **delete** (hard delete from the row-actions menu) → `AuditLog(action='DELETED')` (the row is removed but the deletion stays in the Data Entry Log). There is no record locking and no `/approvals` page. Edit **and delete** are gated the same way: `enter_data` + `canAccessSite` via `DELETE /api/<metric>/[id]` (so the same people who can add/edit can delete on their assigned sites). Deleting a waste record also best-effort removes its WTN R2 object. The only manual-entry gate is that a **waste record requires a WTN PDF** (enforced in the form + `POST /api/waste`, not in the shared `wasteSchema`, so import/connector still work).

---

## SAP connector (mock) pattern

The mock connector exists in the UI as a real-looking feature so the pitch shows the connector pattern.

- `/connectors` page lists "Configured Connectors" — shows one entry: "SAP ERP — Production" with a status badge and last-sync time
- Clicking "Sync Now" hits `/api/connectors/sap?metric=<metric>` which reads `src/data/sap-mock.json`, normalizes records to the target metric's schema, and **reconciles** them against the connector-owned records (the site-access check runs as the `system` service account)
- Surface a small banner/notification on success summarising the changes: e.g. "Synced Gas — 3 new · 2 updated · 1 removed · 45 unchanged"
- Records synced via connector are immediately live (no review)

The pitch narrative: "Here's the connector pattern. Real SAP integration plugs in here — same data normalization, same entry flow."

**Do not pretend the connector is real to the user.** The UI says "SAP ERP — Production (Demo)" with a small badge. Honesty here protects credibility during the pitch.

**As built.** `src/data/sap-mock.json` is keyed by metric descriptor key (`airEmission`, `waste`, `water`, `electricity`, `gas`) so the feed's scope is open-ended — it may carry any subset of metrics. The connector page renders one row per key found in the feed with a **per-metric "Sync now" button**; all five metrics have registered descriptors and sync, and any unregistered key renders "Not configured" so the cross-metric design is visible. Sync hits `POST /api/connectors/sap?metric=<key>`; the seeded `system@envirohub.demo` SystemAdmin service account runs the site-access check (audit `userId` = the admin who clicked, `notes: "via SAP connector (Demo)"`). "Last sync" is persisted per `(connectorKey, metricKey)` in the **`ConnectorSync`** table (records the sync event even on a zero-row pull); seed pre-populates a realistic value.

**Reconcile semantics (delta sync) — `reconcileRows` in `src/lib/import/engine.ts`.** A sync is idempotent: it diffs the feed against the **connector-owned** records and only acts on real changes:
- Each metric record has `sourceRef String? @unique` (the source system's external key; **`NULL` ⇒ manually entered**) and `sourceHash String?` (a hash of the record's business fields at last sync). "Connector-owned" ≡ `sourceRef IS NOT NULL`.
- Each feed row carries a `"Source Ref"` column (engine-level — it is **not** in any descriptor's `columns`, so it never enters the business schema; the engine reads it directly).
- Per sync: feed key absent locally → **create** (`IMPORTED`); present but hash differs → **update** (`EDITED`); present and identical → **no-op, no audit entry**; connector-owned record whose key is absent from the feed → **delete** (`DELETED`). Returns `{created, updated, deleted, unchanged, skipped}`.
- **Manually-entered records (`sourceRef = NULL`) are never read, updated, or deleted by a sync** — the key safety property. So only genuine new/changed/removed events reach the Data Entry Log; unchanged records produce no noise.
- The descriptor gained reconcile primitives (`create(input, meta?)`, `update`, `remove`, `listConnector`); **manual import still uses `commitRows` (create-only) and is unchanged**. The static mock feed means the 1st sync inserts and every later sync is all-unchanged; edit/trim `sap-mock.json` then re-sync to exercise the EDITED/DELETED paths (mirrors real source changes). Migration `add_record_source`.

---

## Dashboards

Each metric has its own page under `/{metric}` with two tabs/sections:

1. **Data** tab — TanStack Table with filter sidebar (date range + **multi-select** site, type/category), bulk import button, manual entry button, export-to-Excel and export-to-CSV buttons
2. **Dashboard** tab — chart(s) driven by the same filter state as the Data tab

Filter state is held in URL query params. **Multi-select filters use repeated keys** (`?site=a&site=b`); the date range stays single-valued. Empty selection = no filter (all). So:
- Filter state survives reloads
- Export endpoint receives the same filters
- Demo links can be shared with pre-applied filters

Dashboards as built (each is an array of `<ChartCard>` so adding charts is a config change):
- **Air Emissions** — **one line chart per pollutant**, each the monthly average concentration across the filtered sites.
- **Waste** — **two bar charts** (hazardous + non-hazardous; recyclable excluded), monthly weight grouped by site.
- **Water** — **one nested bar chart**: x = month, grouped by site, each site split into per-source bars (coloured by source). Defaults to the most recent 6 months.
- **Electricity** — **one grouped-and-stacked bar chart**: one bar per site each month, stacked into renewable (solid) / non-renewable (faded) kWh. Defaults to the most recent 12 months.
- **Gas** — **one grouped bar chart**: monthly consumption (m³), one bar per site. Defaults to the most recent 12 months.

The `BarChart` wrapper (`src/components/charts/bar-chart.tsx`) supports optional per-series `color`/`stackId`/`opacity` (per-series `stackId` gives grouped-AND-stacked) and a compact `legendItems` static legend for the dense charts.

---

## Data import / export

**Import flow** (Excel + CSV both supported):

1. User clicks "Import" on a metric page → modal opens with download-template button + drop zone
2. Drop a file → server parses with SheetJS → validates each row with the metric's Zod schema
3. Show preview: "47 valid rows, 3 invalid (download error report)" with row-level errors
4. User clicks "Import valid rows" → records created (immediately live), audit-logged with `action='IMPORTED'`

**Export flow:**

1. User applies filters on the Data tab
2. Clicks "Export to Excel" or "Export to CSV"
3. Server endpoint receives same filter query → streams the filtered records to a SheetJS workbook (Excel) or CSV
4. Filename: `envirohub-{metric}-{YYYY-MM-DD}.xlsx`

**As built.** Import + connector share a **per-metric descriptor registry** in `src/lib/import/` (`types.ts`, `metric-keys.ts`, `registry.ts`, `engine.ts`, `descriptors/<metric>.ts`). Each descriptor declares its template columns (header↔field, `siteRef` marks the human `Site.siteId` column), a `normalize(raw)` that resolves the site code → `Site.id` and validates with the metric's existing server Zod schema, and a `create()`. The shared `engine.ts` (`validateRows` / `commitRows`) powers both the manual import routes (`/api/import/[metric]`, `…/commit`, `…/template`, `…/error-report`) and the SAP connector. Adding Waste/Water/Electricity = author one descriptor + one registry line; no engine changes. Manual import is two-step (validate → preview → commit); commit re-validates server-side and re-checks site access (never trusts the client). The reusable UI is `src/components/data-entry/import-dialog.tsx`, keyed by `metricKey`.

---

## Role-based permissions

Permissions matrix:

| Action | System Admin | Site Admin | Data Entry User |
|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ |
| Create/edit sites | ✅ | ❌ | ❌ |
| View all sites' data | ✅ | ✅ (assigned sites only) | ✅ (assigned sites only) |
| Enter data | ✅ | ✅ | ✅ |
| Edit / delete records | ✅ | ✅ (assigned sites only) | ✅ (assigned sites only) |
| Import bulk data | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ |
| Run SAP connector sync | ✅ | ✅ | ❌ |
| View Data Entry Log | ✅ | ✅ (assigned sites only) | ❌ |

For PoC, Data Entry Users are also assigned to specific sites (a `siteAssignments` join table). System Admin sees everything.

All permission checks go through `src/lib/permissions.ts`. Never inline a role check in a route handler.

---

## Demo data

`prisma/seed.ts` produces:

- **4 login users + 1 service account:** `admin@` (System Admin), `siteadmin@` (Site Admin – England: Manchester/Birmingham/London), `siteadmin2@` (Site Admin – Scotland & Wales: Glasgow/Cardiff), `data@` (Data Entry User: Manchester + Birmingham), plus non-login `system@envirohub.demo` (connector service account).
- **5 sites:** Manchester manufacturing, Birmingham warehouse, London office, Glasgow plant, Cardiff distribution centre
- A full **(site × month × category) grid** across 2023-2025: **720 air** (per site/month/pollutant), **540 waste** (per site/month/type, each with an EWC code), **900 water** (per site/month/source — all five sources), **180 electricity** (per site/month), **180 gas** (per site/month) — uniform so the dashboards have no gaps
- A **Data Entry Log** entry per record (mostly `CREATED`, some `IMPORTED`, a few `EDITED`), attributed to a user assigned to that record's site (so each Site Admin's scoped log is realistic).

All seed records are deterministic (seeded random) so demos are repeatable.

Demo login passwords are set via the `SEED_DEMO_PASSWORD` env var in `.env.local` (gitignored) and shared by all demo users — the literal is never committed. See your local `DEMO_LOGINS.md` for the current value.

---

## Working agreements with Claude Code

When picking up a new task in this project:

1. **Check this file first.** Confirm task is within PoC scope. If unclear, ASK the operator before building.
2. **Run `npm run db:generate` and `npm run db:migrate`** after any schema change (these wrap Prisma with dotenv-cli so `.env.local` is loaded). Don't skip.
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
- [ ] All 4 metric pages load with seeded data and their chart(s) render
- [ ] Login as each role works (admin / siteadmin / siteadmin2 / data); each sees the expected scoped UI
- [ ] Non-date filters are multi-select and narrow both chart + table
- [ ] SAP connector sync button works (and is honest about being a demo)
- [ ] Excel import works on at least one metric (have a sample file ready)
- [ ] Excel export works with filters applied
- [ ] Data Entry Log shows recent activity
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

## Post-PoC: Authentication & user lifecycle (NOT for PoC — captured for Phase 3)

The PoC uses a NextAuth credentials provider with seeded users sharing a demo password (set via the `SEED_DEMO_PASSWORD` env var, never hardcoded). That is a demo convenience only. For a real deployment:

- **Per-user credentials, not shared.** `User.hashedPassword` is already per-row; the shared demo password exists only in `seed.ts`. Real users each have their own credential.
- **Preferred path — corporate SSO (OIDC/SAML).** The identity provider (Entra/Azure AD, Okta, Google Workspace) owns passwords, MFA, complexity, lockout. EnviroHub stores no passwords. NextAuth v5's `providers` array makes this an additive change — the session/JWT callbacks, `permissions.ts`, and pages stay unchanged; only the provider + a claims→`Role` mapping are added.
- **Onboarding (SSO):** IT adds the joiner to an IdP group → on first SSO login EnviroHub just-in-time provisions the `User` row and maps the group/claim to a `Role`. Offboarding/role-change handled in the IdP.
- **Onboarding (local accounts, no SSO):** build the System-Admin-only **Manage users** screen (already in the permissions matrix). Admin creates the user + role + site assignments; the user receives an invite email with a one-time set-password link (or a forced first-login reset). Never an admin-known shared password. Add an `active`/`disabledAt` flag on `User` and check it in `authorize()` for deactivation.
- **Role changes & sessions:** sessions are JWT, so a role change doesn't take effect until the token expires or the user re-logs in. In production set a sensible session `maxAge` or re-check role from DB/IdP for sensitive actions.

---

## Glossary

- **WTN** — Waste Transfer Note. UK regulatory document tracking waste handover between producer and carrier. PDF attachment expected per waste record.
- **Site** — a single physical facility (manufacturing plant, warehouse, office, etc.)
- **Stack** — an industrial emission point (chimney, vent) at a site
- **Meter** — a measurement device for water or electricity, identified by Meter ID
- **PoC** — Proof of Concept
- **IdP** — Identity Provider (for the future corporate SSO integration)
- **EWC code** — European Waste Catalogue code; the standard waste classification (required on every waste record)
- **Data Entry Log** — the audit trail of record changes (created / edited / imported / deleted); route is still `/audit-log`
- **System Admin / Site Admin / Data Entry User** — the three PoC roles

---

*Last updated: 2026-06-13 — the SAP connector now does a **reconciling delta sync** (`reconcileRows`): new→IMPORTED, changed→EDITED, removed-at-source→DELETED, unchanged→no-op (no log); idempotent and scoped to connector-owned records (`sourceRef`/`sourceHash` columns, migration `add_record_source`) so manually-entered data is never touched. 2026-06-12 — added a **Delete record** action to every metric's row-actions menu (`DELETE /api/<metric>/[id]`, gated like edit — `enter_data` + site access — logged as `DELETED`; waste delete best-effort removes the WTN R2 object). 2026-06-11 — added a **fifth metric, Gas** (site / meterId / consumptionM3 / period; own table, dashboard = grouped bar per site, nav tab, CRUD API, export, CSV/Excel import + SAP-connector mock; migration `add_gas_metric`); seed is now a uniform (site × month × category) grid and water covers all five sources. Earlier same-day: major simplification: **removed the approval workflow** (no status/authorship columns, no `/approvals`, no Dashboard overview — login lands on `/air-emissions`); **multi-select filters** (repeated-key URL params) replacing single-select, status filter dropped; **Audit Log → Data Entry Log** (CREATED/EDITED/DELETED/IMPORTED only); **waste** gains a required `ewcCode` + required WTN reference & PDF (form/API-enforced); **electricity** drops peak/off-peak; dashboards reworked (air = per-pollutant line charts; waste = hazardous + non-hazardous bars; water = nested site×source bars, last 6mo; electricity = grouped-and-stacked renewable/non-renewable, last 12mo) on an upgraded `BarChart` wrapper; all table columns now mirror the entry forms. Migration `20260611085858_simplify_drop_workflow_add_ewc`. Update this date when material decisions change.*
