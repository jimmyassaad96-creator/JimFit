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
  // The denominator is the profile's days_per_week (4); the numerator depends
  // on where today sits in the week relative to the fixture's logged session,
  // so it is matched as a shape rather than a value — asserting "1/4" broke
  // the moment the clock rolled into a new week.
  await expect(page.getByText(/^\d+\/4$/).first()).toBeVisible();
  await expect(page.getByText(/^sessions$/i).first()).toBeVisible();
});

test("tells the client where they stand against the weekly target", async ({ page }) => {
  // Early in the week this reads "N more days needed — M days left this week";
  // once the days left run out it becomes "Can't reach 4 days this week".
  // Both mention the 4-day target, which is the part that comes from profile.
  await expect(page.getByText(/4 (more days needed|days this week)/).first()).toBeVisible();
});
