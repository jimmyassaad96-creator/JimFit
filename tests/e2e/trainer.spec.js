// Flow 4 of the spec: the approved trainer's surface.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => boot(page, "trainer"));

test("an approved trainer lands on their own roster, not a client dashboard", async ({ page }) => {
  await expect(page.getByText("Demo Trainer's clients")).toBeVisible();
  await expect(page.getByText("No clients assigned to you yet — ask your manager to assign some.")).toBeVisible();
  await expect(page.getByText("· Trainer")).toBeVisible();
});

test("bottom navigation exposes all eight trainer tabs", async ({ page }) => {
  for (const tab of ["Clients", "Stats", "Rota", "Diet", "My Log", "Muscles", "AI Chat", "Profile"]) {
    await expect(page.getByText(tab, { exact: true }).last()).toBeVisible();
  }
});

test("an incomplete trainer profile is prompted for the BMR inputs", async ({ page }) => {
  await expect(
    page.getByText("Complete your profile — add your birthday, gender, weight, height, and phone number so we can calculate your BMR and reach you.")
  ).toBeVisible();
  await expect(page.getByText("Complete profile", { exact: true }).first()).toBeVisible();
});

test("stats tab reports sessions and collections", async ({ page }) => {
  await openTab(page, "Stats");
  for (const label of [/^sessions today$/i, /^sessions this month$/i,
                       /^collected this month$/i, /^collected all-time$/i]) {
    await expect(page.getByText(label).first()).toBeVisible();
  }
  await expect(page.getByText("No sessions or payments logged yet.")).toBeVisible();
});

test("rota allows booking a session for someone not yet a client", async ({ page }) => {
  await openTab(page, "Rota");
  await expect(page.getByText("Not a client yet? Enter details manually")).toBeVisible();
  await expect(page.getByText("Schedule session", { exact: true }).first()).toBeVisible();
});

test("my-log starts empty with a prompt to add an exercise", async ({ page }) => {
  await openTab(page, "My Log");
  await expect(page.getByText("No sessions logged yet.")).toBeVisible();
  await expect(page.getByText("Add exercise", { exact: true }).first()).toBeVisible();
});

test("profile tab states the trainer's own billing terms", async ({ page }) => {
  await openTab(page, "Profile");
  await expect(page.getByText("My billing")).toBeVisible();
  await expect(page.getByText("$24.99/mo")).toBeVisible();
  await expect(page.getByText(/^clients included$/i).first()).toBeVisible();
  await expect(page.getByText("Unlimited", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("+961 71107437")).toBeVisible();
});
