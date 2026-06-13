import { test, expect } from "@playwright/test";

// NOTE: the sync test mutates the database (creates records). Re-run
// `npm run db:seed` before a demo to reset to deterministic seed data.

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
}

test("connectors: SAP card lists metrics with a Sync for each registered one", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Connectors" }).click();
  await expect(
    page.getByRole("heading", { name: "Connectors", level: 2 }),
  ).toBeVisible();

  await expect(page.getByText("SAP ERP — Production")).toBeVisible();
  await expect(page.getByText("Demo", { exact: true })).toBeVisible();
  // All five metrics are registered → one Sync button per metric in the feed.
  await expect(page.getByRole("button", { name: "Sync now" })).toHaveCount(5);
});

test("connectors: sync imports SAP records and shows the banner", async ({
  page,
}) => {
  // The sync is the slowest single action (≈18 sequential remote writes); raise
  // this test's overall budget above the default 30s so the 45s banner wait fits.
  test.setTimeout(60_000);
  await loginAsAdmin(page);
  await page.goto("/connectors");

  await page.getByRole("button", { name: "Sync now" }).first().click();

  // The persistent result banner. The sync does ~18 sequential create+audit
  // round-trips to the remote (Neon) DB; under full-suite parallel load that is
  // the slowest single action, so allow generous headroom.
  // Exact match → the alert title only (the toast reads "Synced Air Emissions: …").
  await expect(
    page.getByText("Synced Air Emissions", { exact: true }),
  ).toBeVisible({ timeout: 45_000 });
  await expect(
    page.getByText(/of \d+ record\(s\) in the feed/),
  ).toBeVisible();
});

test("connectors: re-syncing the same feed is idempotent (no changes)", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await loginAsAdmin(page);
  await page.goto("/connectors");

  // Gas is the last metric in the feed — small (5 rows), so this is quick.
  const gasSync = page.getByRole("button", { name: "Sync now" }).last();

  // First sync: creates on a fresh DB, or already a no-op if a prior run synced.
  await gasSync.click();
  await expect(
    page.getByText(/of \d+ record\(s\) in the feed/),
  ).toBeVisible({ timeout: 45_000 });

  // Second sync of the identical feed → nothing changes, everything unchanged.
  await gasSync.click();
  await expect(page.getByText(/No changes/)).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/unchanged/)).toBeVisible();
});

test("connectors: data entry user does NOT see the Connectors nav item", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });

  await expect(page.getByRole("link", { name: "Connectors" })).toHaveCount(0);
});
