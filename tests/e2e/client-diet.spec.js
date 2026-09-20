// Flow 3 of the spec: the client diet surface.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => {
  await boot(page, "client");
  await openTab(page, "Diet");
});

test("diet offers the three sub-tabs", async ({ page }) => {
  for (const sub of ["Food log", "Diet plan", "Energy balance"]) {
    await expect(page.getByText(sub, { exact: true }).first()).toBeVisible();
  }
});

test("energy balance is unavailable until a BMR reading exists", async ({ page }) => {
  await expect(page.getByText(/^no bmr yet$/i).first()).toBeVisible();
  await expect(
    page.getByText("Add a body assessment with a BMR reading (Assessments tab) to see today's full surplus/deficit.")
  ).toBeVisible();
});

test("eaten-vs-burned tile is present", async ({ page }) => {
  await expect(page.getByText(/eaten vs\. burned/i).first()).toBeVisible();
});
