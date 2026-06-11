import { test, expect } from "@playwright/test";

// NOTE: the create/import tests mutate the database. Re-run `npm run db:seed`
// before a demo to reset to deterministic seed data.

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
}

test("water: data table and dashboard bar chart render seeded data", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Water" }).click();
  // Generous timeout: the dev server compiles the route on first navigation.
  await expect(
    page.getByRole("heading", { name: "Water", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Seeded water records render — filter by source for a deterministic assertion.
  await page.goto("/water?source=MAINS");
  await expect(page.getByText("Mains").first()).toBeVisible();

  await page.getByRole("tab", { name: "Dashboard" }).click();
  await expect(
    page.getByText("Water consumption by site & source"),
  ).toBeVisible();
});

test("water: new-record form opens", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/water");

  await page.getByRole("button", { name: "New record" }).click();
  await expect(
    page.getByRole("heading", { name: "New water record" }),
  ).toBeVisible();
});

test("water: export endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/export/water?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
  expect(res.headers()["content-disposition"]).toContain("envirohub-water-");
});

test("water: import template endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/import/water/template?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
});

test("water: source filter narrows the table", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/water?source=BOREHOLE");
  await expect(
    page.getByRole("heading", { name: "Water", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Borehole").first()).toBeVisible();
});
