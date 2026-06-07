import { defineConfig, devices } from "@playwright/test";

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
