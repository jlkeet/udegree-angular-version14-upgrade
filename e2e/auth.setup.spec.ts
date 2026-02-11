import { expect, test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const authDir = path.resolve("e2e/.auth");
const authStatePath = path.join(authDir, "user.json");

async function loginWithCredentials(page: Page): Promise<void> {
  const email = process.env.UDEGREE_E2E_EMAIL;
  const password = process.env.UDEGREE_E2E_PASSWORD;

  if (!email || !password) {
    return;
  }

  await page.goto("/login");
  await page.locator('input[formcontrolname="email"]').fill(email);
  await page.locator('input[formcontrolname="password"]').fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

test("capture authenticated planner state", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await page.goto("/planner");

  if (!page.url().includes("/planner")) {
    await loginWithCredentials(page);
  }

  if (!page.url().includes("/planner")) {
    console.log(
      "Waiting for manual login. Complete login in the opened browser window to continue."
    );
    await page.goto("/login");
    await page.waitForURL(/\/planner(?:[/?#]|$)/, { timeout: 180_000 });
  }

  await expect(page.getByRole("button", { name: "DO IT FOR ME" })).toBeVisible();
  await page.context().storageState({ path: authStatePath, indexedDB: true });
});
