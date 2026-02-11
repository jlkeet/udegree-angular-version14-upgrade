import { expect, Page } from "@playwright/test";

export interface RuntimeIssue {
  source: "console" | "pageerror";
  text: string;
}

const ignoredNoise = [
  /ERR_BLOCKED_BY_CLIENT/i,
  /message port closed before a response was received/i,
  /google\.firestore.*TYPE=terminate/i,
];

export function captureRuntimeIssues(page: Page): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    issues.push({
      source: "console",
      text: message.text(),
    });
  });

  page.on("pageerror", (error) => {
    issues.push({
      source: "pageerror",
      text: error.stack || error.message,
    });
  });

  return issues;
}

export function assertNoRuntimeIssues(issues: RuntimeIssue[]): void {
  const relevant = issues.filter(
    (issue) => !ignoredNoise.some((pattern) => pattern.test(issue.text))
  );

  const summary = relevant.map((issue) => `${issue.source}: ${issue.text}`);
  expect(summary, `Runtime errors were detected:\n${summary.join("\n")}`).toEqual([]);
}
