import { test, expect } from "@playwright/test";

// NOTE: these specs mutate the database (approve/reject/return real seeded
// records). Re-run `npm run db:seed` before a demo to restore the ~40 SUBMITTED
// air-emission records and keep the queue deterministic.
//
// Serial mode: the approve and return tests both act on the *first* pending
// record. Run in parallel they can target the same record — the second loses the
// `transition` race guard ("already actioned by someone else"). Serial execution
// drains the queue one record at a time so each test acts on a distinct record.
test.describe.configure({ mode: "serial" });

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test("approvals: approving a record removes it from the queue", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Approvals" }).click();
  // Generous timeout: the dev server compiles the route on first navigation and
  // the page runs a pending-queue query per metric against the remote DB.
  await expect(
    page.getByRole("heading", { name: "Approvals", level: 2 }),
  ).toBeVisible({ timeout: 20_000 });

  // The Air Emissions queue has seeded SUBMITTED records with Approve buttons.
  const firstApprove = page.getByRole("button", { name: "Approve" }).first();
  await expect(firstApprove).toBeVisible({ timeout: 20_000 });
  await firstApprove.click();

  await expect(page.getByText("Record approved")).toBeVisible({
    timeout: 25_000,
  });
});

test("approvals: return requires feedback before it can be submitted", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/approvals");

  await page.getByRole("button", { name: "Return" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Return record" }),
  ).toBeVisible();

  // The submit button is disabled until feedback is entered.
  const submit = page.getByRole("button", { name: "Return record" });
  await expect(submit).toBeDisabled();

  await page.getByRole("textbox").fill("Please re-check the stack reference.");
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText("Record returned")).toBeVisible({
    timeout: 25_000,
  });
});

test("approvals: data entry user cannot access the queue", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("data@envirohub.demo");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // No nav item, and the route itself is access-denied.
  await expect(page.getByRole("link", { name: "Approvals" })).toHaveCount(0);
  await page.goto("/approvals");
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
});
