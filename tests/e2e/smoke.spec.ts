import { test, expect } from "@playwright/test";

const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "";

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/air-emissions");
  await expect(page).toHaveURL(/\/login/);
});

test("admin can log in and reach metrics, sites, and the data entry log", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Login lands on the first metric (the Dashboard overview was removed).
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Air Emissions", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // System Admin sees Sites; it loads the seeded facilities.
  await page.getByRole("link", { name: "Sites" }).click();
  await expect(page).toHaveURL(/\/sites/, { timeout: 20_000 });
  await expect(page.getByText("Manchester Manufacturing Facility")).toBeVisible({
    timeout: 20_000,
  });

  // The Data Entry Log (renamed from Audit Log) loads with seeded events.
  await page.getByRole("link", { name: "Data Entry Log" }).click();
  await expect(page).toHaveURL(/\/audit-log/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Data Entry Log", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });
});

test("data entry user does NOT see the Sites or Data Entry Log nav items", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Sites" })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Data Entry Log" }),
  ).toHaveCount(0);
});

test("the avatar menu opens without crashing and offers log out", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/air-emissions/, { timeout: 20_000 });

  // Opening this menu used to crash the app (Base UI MenuGroupContext is missing).
  await page.getByRole("button", { name: /System Administrator/ }).click();
  await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
});
