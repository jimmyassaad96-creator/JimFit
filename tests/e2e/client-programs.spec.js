// Flow 8 of the spec: program selection and the price gate in front of it.
import { test, expect } from "@playwright/test";
import { boot, openTab } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => {
  await boot(page, "client");
  await openTab(page, "Programs");
});

test("an unpicked program states the unlock price", async ({ page }) => {
  await expect(page.getByText("Your program")).toBeVisible();
  await expect(
    page.getByText("No program picked yet — browse below, choose one, then unlock it with a one-time $35 payment (no monthly charge).")
  ).toBeVisible();
});

test("offers both a guided choice and a full browse", async ({ page }) => {
  await expect(page.getByText("Choose a program", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Browse all programs", { exact: true }).first()).toBeVisible();
});

test("lists the training styles a program can be filtered by", async ({ page }) => {
  for (const style of ["Powerlifting", "Calisthenics", "Hyrox"]) {
    await expect(page.getByText(style, { exact: true }).first()).toBeVisible();
  }
});
