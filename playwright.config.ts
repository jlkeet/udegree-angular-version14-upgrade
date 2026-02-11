import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4200);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const authStatePath = path.resolve("e2e/.auth/user.json");
const storageState = fs.existsSync(authStatePath) ? authStatePath : undefined;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /auth\.setup\.spec\.ts/,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: "chrome",
    storageState,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm run start -- --host 127.0.0.1",
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
