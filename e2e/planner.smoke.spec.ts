import { expect, test } from "@playwright/test";
import { assertNoRuntimeIssues, captureRuntimeIssues } from "./runtime-issues";

test.describe.serial("Planner smoke", () => {
  test("DO IT FOR ME avoids new prerequisite errors and runtime crashes", async ({ page }) => {
    const runtimeIssues = captureRuntimeIssues(page);

    await page.goto("/planner");

    const doItButton = page.getByRole("button", { name: "DO IT FOR ME" });
    await expect(
      doItButton,
      "Planner was not reachable. Run `npm run e2e:auth` first if login is required."
    ).toBeVisible();

    const courseCards = page.locator(".course");
    const errorCards = page.locator(".course.course--error");

    const beforeCourseCount = await courseCards.count();
    const beforeErrorCount = await errorCards.count();

    await doItButton.click();
    await page.waitForTimeout(2500);

    const afterCourseCount = await courseCards.count();
    const afterErrorCount = await errorCards.count();

    expect(afterCourseCount).toBeGreaterThanOrEqual(beforeCourseCount);
    expect(afterErrorCount).toBeLessThanOrEqual(beforeErrorCount);

    assertNoRuntimeIssues(runtimeIssues);
  });

  test("course detail prerequisite messages are reflected by red course borders", async ({ page }) => {
    test.slow();

    const runtimeIssues = captureRuntimeIssues(page);

    await page.goto("/planner");

    const doItButton = page.getByRole("button", { name: "DO IT FOR ME" });
    await expect(doItButton).toBeVisible();

    let courseCards = page.locator(".course");
    let courseCount = await courseCards.count();
    if (courseCount === 0) {
      await doItButton.click();
      await page.waitForTimeout(2500);
      courseCards = page.locator(".course");
      courseCount = await courseCards.count();
    }

    if (courseCount === 0) {
      test.skip(
        true,
        "No generated courses found for this account state; skipping border consistency check."
      );
      return;
    }

    const detailsClose = page.locator(".course-details-panel .close-dialog");
    const maxChecks = Math.min(courseCount, 12);
    for (let i = 0; i < maxChecks; i++) {
      if ((await detailsClose.count()) > 0 && (await detailsClose.first().isVisible())) {
        await detailsClose.first().click();
      }

      const card = courseCards.nth(i);
      await card.click({ force: true });

      const errorMessageCount = await page
        .locator(".course-details-panel .course-error-message")
        .count();

      if (errorMessageCount > 0) {
        await expect(card).toHaveClass(/course--error/);
      }
    }

    if ((await detailsClose.count()) > 0 && (await detailsClose.first().isVisible())) {
      await detailsClose.first().click();
    }

    assertNoRuntimeIssues(runtimeIssues);
  });
});
