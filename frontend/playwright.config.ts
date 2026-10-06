import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;

// End-to-end tests run against a live frontend + backend. In Docker Compose
// the whole stack is already up on port 3000, so `reuseExistingServer` simply
// attaches to it. When running locally, `npm run dev` is started automatically
// (the backend API must already be running on NEXT_PUBLIC_API_URL).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.PLAYWRIGHT_VIDEO === "on" ? "retain-on-failure" : "off",
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ["--no-sandbox"],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
