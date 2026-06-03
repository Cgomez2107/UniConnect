import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8081";

export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  ...(process.env.CI
    ? {
        webServer: {
          command: "npx serve dist-web -l 8081 -s",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 60_000,
        },
      }
    : {}),
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});