import { test, expect } from "@playwright/test";

// NOTE: the create/import tests mutate the database. Re-run `npm run db:seed`
// before a demo to reset to deterministic seed data.

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test("electricity: data table and both dashboard charts render seeded data", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Electricity" }).click();
  // Generous timeout: the dev server compiles the route on first navigation.
  await expect(
    page.getByRole("heading", { name: "Electricity", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Seeded approved electricity records render (filter so it's deterministic).
  await page.goto("/electricity?status=APPROVED");
  await expect(page.getByText("Approved").first()).toBeVisible();

  await page.getByRole("tab", { name: "Dashboard" }).click();
  // Both the kWh bar chart and the renewable-% line chart.
  await expect(
    page.getByText("Electricity consumption over time"),
  ).toBeVisible();
  await expect(page.getByText("Renewable share over time")).toBeVisible();
});

test("electricity: new-record form opens", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/electricity");

  await page.getByRole("button", { name: "New record" }).click();
  await expect(
    page.getByRole("heading", { name: "New electricity record" }),
  ).toBeVisible();
});

test("electricity: export endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get("/api/export/electricity?format=xlsx");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
  expect(res.headers()["content-disposition"]).toContain(
    "envirohub-electricity-",
  );
});

test("electricity: import template endpoint returns a spreadsheet", async ({
  page,
}) => {
  await loginAsAdmin(page);
  const res = await page.request.get(
    "/api/import/electricity/template?format=xlsx",
  );
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
});

test("electricity: approvals queue has an Electricity tab; connector syncs all 4 metrics", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/approvals");
  await page.getByRole("tab", { name: /Electricity/ }).click();
  await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();

  // All four metrics are now registered → four Sync buttons on the connector.
  await page.goto("/connectors");
  const syncButtons = page.getByRole("button", { name: "Sync now" });
  await expect(syncButtons).toHaveCount(4);
});
