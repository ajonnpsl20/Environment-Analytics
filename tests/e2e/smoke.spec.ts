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
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Generous timeouts: the dev server compiles each route on first navigation.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByText(/Welcome back/)).toBeVisible();

  // System Admin sees Sites; it loads the seeded facilities.
  await page.getByRole("link", { name: "Sites" }).click();
  await expect(page).toHaveURL(/\/sites/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Sites", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Manchester Manufacturing Facility")).toBeVisible();

  // Audit log loads with seeded events.
  await page.getByRole("link", { name: "Audit Log" }).click();
  await expect(page).toHaveURL(/\/audit-log/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Audit Log", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });
});

test("data entry user does NOT see the Sites nav item", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Sites" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Audit Log" })).toHaveCount(0);
});

test("the avatar menu opens without crashing and offers log out", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // Opening this menu used to crash the app (Base UI MenuGroupContext is missing).
  await page.getByRole("button", { name: /System Administrator/ }).click();
  await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
});
