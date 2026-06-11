import { test, expect } from "@playwright/test";

// NOTE: the create test mutates the database. Re-run `npm run db:seed` before a
// demo to reset. The WTN-attachment test below adapts to whichever R2 state this
// environment is in (configured ⇒ file picker; unconfigured ⇒ graceful note).

// .env.local is loaded by playwright.config.ts, so the test process sees the same
// R2 vars as the app (`next dev`). Mirrors isR2Configured() in src/lib/r2.ts.
const R2_CONFIGURED = Boolean(
  process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME,
);

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
}

test("waste: data table and dashboard bar chart render seeded data", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Waste" }).click();
  // Generous timeout: the dev server compiles the route on first navigation.
  await expect(
    page.getByRole("heading", { name: "Waste", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Seeded waste records render — filter by type for a deterministic assertion.
  await page.goto("/waste?wasteType=HAZARDOUS");
  await expect(page.getByText("Hazardous").first()).toBeVisible();

  await page.getByRole("tab", { name: "Dashboard" }).click();
  await expect(page.getByText(/waste over time/).first()).toBeVisible();
});

test("waste: new-record form reflects R2 configuration", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/waste");

  await page.getByRole("button", { name: "New record" }).click();
  await expect(
    page.getByRole("heading", { name: "New waste record" }),
  ).toBeVisible();

  if (R2_CONFIGURED) {
    // Configured → the PDF picker is rendered and the degraded note is gone.
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
    await expect(page.getByText(/File storage isn.t configured/)).toHaveCount(0);
  } else {
    // Unconfigured → graceful degradation: the note shows and no file input.
    await expect(page.getByText(/File storage isn.t configured/)).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  }
});

test("waste: export endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/export/waste?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
  expect(res.headers()["content-disposition"]).toContain("envirohub-waste-");
});

test("waste: import template endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/import/waste/template?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
});

test("waste: the SAP connector offers a Sync for all four metrics", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/connectors");
  const syncButtons = page.getByRole("button", { name: "Sync now" });
  await expect(syncButtons).toHaveCount(4); // Air, Waste, Water, Electricity
});
