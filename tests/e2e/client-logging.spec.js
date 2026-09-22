// Part A, Task 1 of the hooks-extraction plan: the workout entry form.
// These assertions exist to catch a useWorkoutEntryForm extraction that
// rebinds state to the wrong variable — a failure the screen-level suite
// cannot see, because the form still renders either way.
import { test, expect } from "@playwright/test";
import { boot } from "../harness/fixtures.js";

const EXERCISE = "Search exercises… e.g. Bench Press";
const QUICK = "e.g. 3x8 or 3x8x60";
// getByPlaceholder substring-matches by default, and the quick-entry
// placeholder "e.g. 3x8 or 3x8x60" contains both "8" and "60" — the set
// columns must be matched exactly or the quick-entry box is hit instead.
const REPS = { exact: true };

async function openForm(page) {
  await page.getByText("New exercise", { exact: true }).first().click();
  await expect(page.getByPlaceholder(EXERCISE)).toBeVisible();
}

test.beforeEach(async ({ page }) => boot(page, "client"));

test("new exercise opens the form with every section", async ({ page }) => {
  await openForm(page);
  for (const section of [/^date$/i, /^workout title \(optional\)$/i, /^exercise$/i,
                         /^muscle group$/i, /^quick entry \(optional\)$/i, /^sets$/i]) {
    await expect(page.getByText(section).first()).toBeVisible();
  }
});

test("the set row exposes reps, weight and rest", async ({ page }) => {
  await openForm(page);
  for (const col of [/^reps$/i, /^weight \(kg\)$/i, /^rest \(s\)$/i]) {
    await expect(page.getByText(col).first()).toBeVisible();
  }
});

test("exercise and set values are held as typed", async ({ page }) => {
  await openForm(page);
  await page.getByPlaceholder(EXERCISE).fill("Bench Press");
  await page.getByPlaceholder("8", REPS).first().fill("10");
  await page.getByPlaceholder("60", REPS).first().fill("70");
  await expect(page.getByPlaceholder(EXERCISE)).toHaveValue("Bench Press");
  await expect(page.getByPlaceholder("8", REPS).first()).toHaveValue("10");
  await expect(page.getByPlaceholder("60", REPS).first()).toHaveValue("70");
});

test("add set appends a row", async ({ page }) => {
  await openForm(page);
  const before = await page.getByPlaceholder("8", REPS).count();
  await page.getByText("Add set", { exact: true }).first().click();
  await expect(page.getByPlaceholder("8", REPS)).toHaveCount(before + 1);
});

test("quick entry expands 3x8x60 into three filled sets", async ({ page }) => {
  await openForm(page);
  await page.getByPlaceholder(QUICK).fill("3x8x60");
  await page.getByText("Apply", { exact: true }).first().click();
  await expect(page.getByPlaceholder("8", REPS)).toHaveCount(3);
  await expect(page.getByPlaceholder("8", REPS).first()).toHaveValue("8");
  await expect(page.getByPlaceholder("60", REPS).first()).toHaveValue("60");
});

test("saving with nothing entered closes the form rather than erroring", async ({ page }) => {
  // Sept 14 2026 behaviour: an untouched form has nothing to validate, so
  // "Finish & close" just closes instead of showing an off-screen error.
  await openForm(page);
  await page.getByText("Finish & close", { exact: true }).first().click();
  await expect(page.getByPlaceholder(EXERCISE)).toHaveCount(0);
});

test("typing an exercise name does not select it on its own", async ({ page }) => {
  // The exercise field is a picker, not a text input: what is typed is a
  // search term until it is committed, so an uncommitted name leaves the form
  // empty and "Finish & close" simply closes it.
  await openForm(page);
  await page.getByPlaceholder(EXERCISE).fill("Bench Press");
  await expect(page.getByText('+ Use "Bench Press" as a custom exercise')).toBeVisible();
  await page.getByText("Finish & close", { exact: true }).first().click();
  await expect(page.getByPlaceholder(EXERCISE)).toHaveCount(0);
});

test("a committed exercise with no valid set is refused", async ({ page }) => {
  await openForm(page);
  await page.getByPlaceholder(EXERCISE).fill("Bench Press");
  await page.getByText('+ Use "Bench Press" as a custom exercise').click();
  await page.getByText("Finish & close", { exact: true }).first().click();
  await expect(page.getByText("Add an exercise and at least one valid set.")).toBeVisible();
});

test("cancel abandons the form", async ({ page }) => {
  await openForm(page);
  await page.getByPlaceholder(EXERCISE).fill("Bench Press");
  await page.getByText("Cancel", { exact: true }).first().click();
  await expect(page.getByPlaceholder(EXERCISE)).toHaveCount(0);
});

test("timed and bodyweight toggles are offered on the sets block", async ({ page }) => {
  await openForm(page);
  await expect(page.getByText("Timed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Bodyweight", { exact: true }).first()).toBeVisible();
});
