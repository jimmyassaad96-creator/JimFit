// Part A, Task 2 of the hooks-extraction plan: the diet food log and the food
// picker. Regression gate for useFoodLog and useMealItems.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

const FOOD = "Type a food — e.g. chicken, hummus, rice";

test.beforeEach(async ({ page }) => {
  await boot(page, "client");
  await openTab(page, "Diet");
});

test("the food log breaks the day's energy down into four rows", async ({ page }) => {
  for (const row of ["BMR", "Workout burn (est.)", "Steps burn (est.)", "Food eaten"]) {
    await expect(page.getByText(row, { exact: true }).first()).toBeVisible();
  }
});

test("an empty day states both empty cases", async ({ page }) => {
  await expect(page.getByText(/Nothing logged today yet/)).toBeVisible();
  await expect(page.getByText(/No past days yet/)).toBeVisible();
});

test("manual intake is gated until a daily target exists", async ({ page }) => {
  await expect(page.getByText("Set at least one daily target above before logging intake.")).toBeVisible();
});

test("log food opens the picker", async ({ page }) => {
  await page.getByText("Log food", { exact: true }).first().click();
  await expect(page.getByPlaceholder(FOOD)).toBeVisible();
  await expect(page.getByText("Search", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Cancel", { exact: true }).first()).toBeVisible();
});

test("the picker holds what is typed", async ({ page }) => {
  await page.getByText("Log food", { exact: true }).first().click();
  await page.getByPlaceholder(FOOD).fill("chicken");
  await expect(page.getByPlaceholder(FOOD)).toHaveValue("chicken");
});

test("cancel closes the picker", async ({ page }) => {
  await page.getByText("Log food", { exact: true }).first().click();
  await expect(page.getByPlaceholder(FOOD)).toBeVisible();
  await page.getByText("Cancel", { exact: true }).first().click();
  await expect(page.getByPlaceholder(FOOD)).toHaveCount(0);
});

test("steps for the day start unlogged with a warning", async ({ page }) => {
  await expect(page.getByText(/steps today/i).first()).toBeVisible();
  await expect(
    page.getByText("Not logged yet today — your calorie-burn numbers above are reading low without it.")
  ).toBeVisible();
});

test("the log date defaults to today and holds a change", async ({ page }) => {
  const date = page.locator('input[type="date"]').first();
  const today = new Date().toISOString().slice(0, 10);
  await expect(date).toHaveValue(today);
  await date.fill("2026-09-01");
  await expect(date).toHaveValue("2026-09-01");
});
