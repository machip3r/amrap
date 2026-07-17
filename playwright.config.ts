import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.local"), quiet: true });
dotenv.config({
  path: path.resolve(__dirname, ".env.test"),
  override: true,
  quiet: true,
});

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "pnpm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
  },
  projects: [
    {
      name: "public",
      testMatch: /public\/.*\.spec\.ts/,
    },
    {
      name: "owner-setup",
      testMatch: /setup\/owner\.setup\.ts/,
    },
    {
      name: "provisional-setup",
      dependencies: ["owner-setup"],
      testMatch: /setup\/provisional\.setup\.ts/,
    },
    {
      name: "owner",
      dependencies: ["owner-setup"],
      testMatch: /owner\/.*\.spec\.ts/,
      testIgnore: [
        /owner\/auth-register-onboarding\.spec\.ts/,
        /owner\/provisional-powers\.spec\.ts/,
      ],
      use: {
        storageState: path.join(__dirname, "e2e/.auth/owner.json"),
      },
    },
    {
      name: "owner-auth",
      testMatch: /owner\/auth-register-onboarding\.spec\.ts/,
    },
    {
      name: "provisional",
      dependencies: ["provisional-setup"],
      testMatch: /owner\/provisional-powers\.spec\.ts/,
      use: {
        storageState: path.join(__dirname, "e2e/.auth/provisional.json"),
      },
    },
  ],
});
