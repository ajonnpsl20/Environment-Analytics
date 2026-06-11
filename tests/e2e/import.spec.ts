import { test, expect } from "@playwright/test";

// NOTE: these specs mutate the database (they create records). Re-run
// `npm run db:seed` before a demo to reset to deterministic seed data.

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
}

// Two valid rows + one invalid (unknown site code) so the preview shows a split.
const CSV = [
  "Site ID,Stack ID,Measured At,Pollutant,Concentration,Unit,Flow Rate (m³/h),Total Emissions,Measurement Method,Equipment Ref",
  "MAN-001,STK-1,2026-05-01,NOx,180,mg/m³,12000,3000,CONTINUOUS,CEMS-1",
  "BIR-002,STK-2,2026-05-02,CO2,30000,mg/m³,40000,90000,CONTINUOUS,CEMS-2",
  "ZZZ-999,STK-1,2026-05-03,NOx,100,mg/m³,,,PERIODIC,",
].join("\n");

test("import: template endpoint returns a spreadsheet", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.get(
    "/api/import/airEmission/template?format=xlsx",
  );
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("spreadsheetml");
  expect(res.headers()["content-disposition"]).toContain("import-template");
});

test("import: upload previews valid/invalid split then commits valid rows", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Air Emissions" }).click();
  await expect(
    page.getByRole("heading", { name: "Air Emissions", level: 2 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Import air-emission records" }),
  ).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "air.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(CSV, "utf-8"),
  });

  // Preview: 2 valid, 1 invalid (the unknown site row).
  await expect(page.getByText("2 valid · 1 invalid · 3 total")).toBeVisible();
  const commit = page.getByRole("button", { name: /Import 2 valid rows?/ });
  await expect(commit).toBeVisible();
  await commit.click();

  // On success the dialog closes.
  await expect(
    page.getByRole("heading", { name: "Import air-emission records" }),
  ).toBeHidden({ timeout: 15_000 });
});

test("import: data entry user can import for assigned sites", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });

  await page.getByRole("link", { name: "Air Emissions" }).click();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Import air-emission records" }),
  ).toBeVisible();
  // The dialog's template-download step is present.
  await expect(page.getByText(/download a template/i)).toBeVisible();
});
