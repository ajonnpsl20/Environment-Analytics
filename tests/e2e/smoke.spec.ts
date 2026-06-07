import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("admin can log in and reach dashboard, sites, and audit log", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Welcome back/)).toBeVisible();

  // System Admin sees Sites; it loads the seeded facilities.
  await page.getByRole("link", { name: "Sites" }).click();
  await expect(page).toHaveURL(/\/sites/);
  await expect(
    page.getByRole("heading", { name: "Sites", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText("Manchester Manufacturing Facility")).toBeVisible();

  // Audit log loads with seeded events.
  await page.getByRole("link", { name: "Audit Log" }).click();
  await expect(page).toHaveURL(/\/audit-log/);
  await expect(
    page.getByRole("heading", { name: "Audit Log", level: 2 }),
  ).toBeVisible();
});

test("data entry user does NOT see the Sites nav item", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("link", { name: "Sites" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Audit Log" })).toHaveCount(0);
});
