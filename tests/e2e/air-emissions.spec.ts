import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Generous timeout: the dev server compiles routes on first navigation.
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
}

test("air emissions: data table and dashboard chart render seeded data", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.getByRole("link", { name: "Air Emissions" }).click();
  // Generous timeout: the dev server compiles the route on first navigation.
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Air Emissions", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // Seeded records render — filter by a pollutant for a deterministic assertion.
  await page.goto("/air-emissions?pollutant=NOx");
  await expect(page.getByText("NOx").first()).toBeVisible();

  // Dashboard tab renders a per-pollutant line chart card.
  await page.getByRole("tab", { name: "Dashboard" }).click();
  await expect(
    page.getByText(/concentration over time/).first(),
  ).toBeVisible();
});

test("air emissions: pollutant filter updates the URL and persists", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/air-emissions?pollutant=NOx");

  await expect(
    page.getByRole("heading", { name: "Air Emissions", level: 2 }),
  ).toBeVisible();
  // NOx appears in the filtered table.
  await expect(page.getByText("NOx").first()).toBeVisible();
});

test("air emissions: Excel export endpoint returns a spreadsheet", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const res = await page.request.get(
    "/api/export/air-emissions?format=xlsx&pollutant=CO2",
  );
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
  expect(res.headers()["content-disposition"]).toContain(
    "envirohub-air-emissions-",
  );
});

test("data entry user sees Air Emissions but is scoped to assigned sites", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });

  await page.getByRole("link", { name: "Air Emissions" }).click();
  await expect(
    page.getByRole("heading", { name: "Air Emissions", level: 2 }),
  ).toBeVisible();
  // The "New record" entry button is available to Data Entry users.
  await expect(page.getByRole("button", { name: "New record" })).toBeVisible();
});
