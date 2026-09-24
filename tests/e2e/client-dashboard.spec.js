// Flow 2 of the spec: the client shell and its dashboard.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => boot(page, "client"));

test("today card shows the three stat tiles", async ({ page }) => {
  // These labels are uppercased by CSS; the DOM text is title case.
  await expect(page.getByText(/^today$/i).first()).toBeVisible();
  for (const tile of [/^volume$/i, /^sets done$/i, /^new prs$/i]) {
    await expect(page.getByText(tile).first()).toBeVisible();
  }
  await expect(page.getByText("Tap a stat to see what it tracks")).toBeVisible();
});

test("greets the client by name with an empty-log message", async ({ page }) => {
  await expect(
    page.getByText("Hello, Demo Client — ready when you are, nothing logged yet today")
  ).toBeVisible();
});

test("bottom navigation exposes all seven client tabs", async ({ page }) => {
  for (const tab of ["Log", "Muscles", "Progress", "Diet", "Programs", "Trainer", "AI Chat"]) {
    await expect(page.getByText(tab, { exact: true }).last()).toBeVisible();
  }
});

test("log tab offers exercise entry and both filters", async ({ page }) => {
  await expect(page.getByText("New exercise")).toBeVisible();
  await expect(page.getByText(/^filter by workout$/i).first()).toBeVisible();
  await expect(page.getByText(/^filter by date$/i).first()).toBeVisible();
  await expect(page.getByText("No sessions match that filter.")).toBeVisible();
});

test("self-train trial banner states the price and remaining days", async ({ page }) => {
  await expect(
    page.getByText("Free trial — 365 days left, then $10/month to keep using the app.")
  ).toBeVisible();
});

test("check-in panel invites a voice note", async ({ page }) => {
  await expect(page.getByText("Check-ins")).toBeVisible();
  await expect(page.getByText("Nothing yet — tap the mic and tell us how you're doing today.")).toBeVisible();
});

test("muscles tab renders the rolling-7-day balance view", async ({ page }) => {
  await openTab(page, "Muscles");
  await expect(page.getByText("Muscle balance")).toBeVisible();
  await expect(page.getByText("Rolling 7 days — drag to spin, tap a muscle for details.")).toBeVisible();
  for (const legend of ["Trained", "Assisted", "Not trained"]) {
    await expect(page.getByText(legend, { exact: true })).toBeVisible();
  }
});

test("ai chat warns that answers are AI-generated", async ({ page }) => {
  await openTab(page, "AI Chat");
  await expect(page.getByText(/AI-generated — helpful for general questions/)).toBeVisible();
});

test("trainer tab explains that requests are matched by the team", async ({ page }) => {
  await openTab(page, "Trainer");
  await expect(page.getByText("Find a trainer")).toBeVisible();
  await expect(page.getByText(/your request goes to our team to match you up/)).toBeVisible();
});
