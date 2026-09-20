// Part A, Task 3 of the hooks-extraction plan: the owner/coach surface, which
// had no coverage at all. Regression gate for useCoachData, useCoachRequests
// and useTrainerAdmin.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => {
  await boot(page, "coach");
  await openTab(page, "Owner");
});

test("a manager email gets the Owner tab in place of Find-a-trainer", async ({ page }) => {
  await expect(page.getByText("Owner", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Trainer", { exact: true })).toHaveCount(0);
});

test("the roster can be grouped by trainer or by payment", async ({ page }) => {
  await expect(page.getByText("👥 By trainer")).toBeVisible();
  await expect(page.getByText("💳 By payment")).toBeVisible();
});

test("clients are counted into with-a-trainer and training-alone groups", async ({ page }) => {
  await expect(page.getByText("🤝 With a trainer (1)")).toBeVisible();
  await expect(page.getByText("🧍 Training alone (0)")).toBeVisible();
});

test("a client row summarises sessions, last date and 7-day volume", async ({ page }) => {
  // The fixture logs one session of 8x60, 8x60, 6x65 on 2026-09-19:
  // 480 + 480 + 390 = 1,350 kg. This assertion pins that arithmetic.
  await expect(page.getByText("1 session · last SEP 19 · trains with Unassigned")).toBeVisible();
  await expect(page.getByText("1,350 vol/7d")).toBeVisible();
});

test("selecting a client opens their detail with the destructive actions", async ({ page }) => {
  await page.getByText("Demo Client", { exact: true }).last().click();
  await expect(page.getByText("All clients", { exact: true })).toBeVisible();
  await expect(page.getByText("Clear workouts", { exact: true })).toBeVisible();
  await expect(page.getByText("Delete client", { exact: true })).toBeVisible();
});

test("the owner menu lists every section", async ({ page }) => {
  await page.getByText("Menu", { exact: true }).first().click();
  for (const heading of [/^overview$/i, /^trainers & clients$/i, /^requests$/i,
                         /^billing$/i, /^tools$/i]) {
    await expect(page.getByText(heading).first()).toBeVisible();
  }
});

test("the owner menu reaches trainers, requests and billing", async ({ page }) => {
  await page.getByText("Menu", { exact: true }).first().click();
  for (const entry of ["Trainers", "Trainer requests", "Diet plan requests",
                       "Program requests", "Gyms", "Trainer billing", "Client billing",
                       "Diet plan templates", "Exercise Library"]) {
    await expect(page.getByText(entry, { exact: true }).first()).toBeVisible();
  }
});
