// Flow 9 of the spec: progress, assessments and measurements.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => {
  await boot(page, "client");
  await openTab(page, "Progress");
});

test("progress offers the four sub-tabs", async ({ page }) => {
  for (const sub of ["Overview", "Photos", "Body", "Info"]) {
    await expect(page.getByText(sub, { exact: true }).first()).toBeVisible();
  }
});

test("this-week card counts sessions against the profile's weekly target", async ({ page }) => {
  await expect(page.getByText(/^this week$/i).first()).toBeVisible();
  // profile seeds days_per_week: 4, and the fixtures log no sessions this week
  await expect(page.getByText("1/4").first()).toBeVisible();
  await expect(page.getByText(/^sessions$/i).first()).toBeVisible();
});

test("warns when the weekly target can no longer be reached", async ({ page }) => {
  await expect(page.getByText("Can't reach 4 days this week — only 0 days left.")).toBeVisible();
});
