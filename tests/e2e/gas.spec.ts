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

test("gas: data table and dashboard chart render seeded data", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Gas" }).click();
  // Generous timeout: the dev server compiles the route on first navigation.
  await expect(
    page.getByRole("heading", { name: "Gas", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Seeded gas records render (m³ unit shows in the consumption column).
  await expect(page.getByText("m³").first()).toBeVisible();

  await page.getByRole("tab", { name: "Dashboard" }).click();
  await expect(
    page.getByText("Gas consumption by site"),
  ).toBeVisible();
});

test("gas: new-record form opens", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/gas");

  await page.getByRole("button", { name: "New record" }).click();
  await expect(
    page.getByRole("heading", { name: "New gas record" }),
  ).toBeVisible();
});

test("gas: export endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/export/gas?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
  expect(res.headers()["content-disposition"]).toContain("envirohub-gas-");
});

test("gas: import template endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/import/gas/template?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
});
