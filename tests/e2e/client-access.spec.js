// Flow 12 of the spec: the self-train access gate once the free trial ends.
import { test, expect } from "@playwright/test";
import { boot } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => boot(page, "client-locked"));

test("an expired trial locks the app and states the price", async ({ page }) => {
  await expect(page.getByText("Your free trial has ended")).toBeVisible();
  await expect(
    page.getByText("$10/month keeps this unlocked — logging workouts, tracking food, and seeing calories burned vs. eaten.")
  ).toBeVisible();
});

test("the locked screen routes payment through Whish", async ({ page }) => {
  await expect(page.getByText(/^pay via whish money$/i).first()).toBeVisible();
  await expect(page.getByText("+961 71107437")).toBeVisible();
});

test("the dashboard is not reachable while locked", async ({ page }) => {
  await expect(page.getByText(/^sets done$/i)).toHaveCount(0);
  await expect(page.getByText("Hello, Demo Client — ready when you are, nothing logged yet today")).toHaveCount(0);
});
