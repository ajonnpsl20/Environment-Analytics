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

test("electricity: data table and dashboard chart render seeded data", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Electricity" }).click();
  // Generous timeout: the dev server compiles the route on first navigation.
  await expect(
    page.getByRole("heading", { name: "Electricity", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Seeded electricity records render — filter by supplier for determinism.
  await page.goto("/electricity?supplier=Octopus+Energy");
  await expect(page.getByText("Octopus Energy").first()).toBeVisible();

  await page.getByRole("tab", { name: "Dashboard" }).click();
  // The single grouped-and-stacked renewable/non-renewable chart.
  await expect(
    page.getByText("Renewable vs non-renewable consumption by site"),
  ).toBeVisible();
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

test("electricity: connector syncs all metrics", async ({ page }) => {
  await loginAsAdmin(page);

  // All five metrics are registered → five Sync buttons on the connector.
  await page.goto("/connectors");
  const syncButtons = page.getByRole("button", { name: "Sync now" });
  await expect(syncButtons).toHaveCount(5);
});

test("electricity: delete a record via the row menu", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/electricity");
  await expect(
    page.getByRole("heading", { name: "Electricity", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Open the first row's three-dots menu → Delete → confirm in the dialog.
  await page.getByRole("button", { name: "Actions" }).first().click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Delete electricity record" }),
  ).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText("Record deleted")).toBeVisible({
    timeout: 15_000,
  });
});
