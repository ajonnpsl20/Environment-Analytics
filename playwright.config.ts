import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load .env.local into the test process (the webServer loads it natively via
// `next dev`, but specs that branch on env — e.g. whether R2 is configured —
// need it here too). Mirrors the app's single source of secrets.
loadEnv({ path: ".env.local" });

/**
 * Playwright config for EnviroHub UI verification.
 * Runtime e2e specs live in `tests/e2e/` and require a connected database
 * (Neon + `npm run db:migrate` + `npm run db:seed`). Run with `npx playwright test`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // Default 5s is too tight under full parallelism against a remote (Neon) DB:
  // heavier pages (e.g. /approvals runs a pending-queue query per metric) plus
  // first-navigation Turbopack compiles routinely exceed it. 15s removes the flake.
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
