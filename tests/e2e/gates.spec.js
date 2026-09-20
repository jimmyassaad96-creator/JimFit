// Flow 1 and 11 of the spec: the unauthenticated chain, with the real gates
// left in place (only Turnstile and the service worker are disabled).
import { test, expect } from "@playwright/test";
import { boot } from "../harness/fixtures.js";

test("welcome screen is the entry point", async ({ page }) => {
  await boot(page, "gates");
  await expect(page.getByText("Welcome to JimFit")).toBeVisible();
  await expect(page.getByText("Personal training, workout logging and nutrition — all in one place.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Privacy Policy" })).toBeVisible();
});

test("get started leads to the two public roles only", async ({ page }) => {
  await boot(page, "gates");
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByText("How are you logging in?")).toBeVisible();
  await expect(page.getByRole("button", { name: "I'm a Client" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I'm a Trainer" })).toBeVisible();
  // Gym-owner signup is invite-only, reached only via ?newgym=1
  await expect(page.getByRole("button", { name: /gym/i })).toHaveCount(0);
});

test("role picker offers a way back to welcome", async ({ page }) => {
  await boot(page, "gates");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Welcome to JimFit")).toBeVisible();
});
