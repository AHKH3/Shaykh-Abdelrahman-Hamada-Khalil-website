import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const keepArtifacts = process.env.PLAYWRIGHT_KEEP_ARTIFACTS === "1";
const shouldWriteReports = keepArtifacts || Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: process.env.CI ? 2 : 2,
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  outputDir: "test-results/visual",
  preserveOutput: keepArtifacts ? "always" : "never",
  reporter: shouldWriteReports
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report/visual" }],
      ]
    : [["list"]],
  use: {
    baseURL,
    headless: true,
    trace: shouldWriteReports ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
  },
  expect: {
    timeout: 12_000,
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${port} -H 127.0.0.1`,
    port,
    timeout: 240_000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 960 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 412, height: 915 },
      },
    },
  ],
});
