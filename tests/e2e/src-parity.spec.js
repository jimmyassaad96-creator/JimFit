// The other specs drive index.html. These drive the same flows out of the
// built src/ module tree, so a refactor of src/ — the hooks extraction, and
// everything after it — is actually covered rather than assumed.
import { test, expect } from "@playwright/test";
import { installSupabaseFixtures } from "../harness/fixtures.js";

async function bootSrc(page, variant) {
  await installSupabaseFixtures(page);
  await page.goto(`/src-${variant}/`);
  await page.waitForFunction(() => {
    const t = document.getElementById("root").innerText.trim();
    return t.length > 40 && !/loading…?$/i.test(t);
  }, null, { timeout: 20000 });
}

test("src: the client dashboard matches the shipped build", async ({ page }) => {
  await bootSrc(page, "client");
  await expect(page.getByText("Hello, Demo Client — ready when you are, nothing logged yet today")).toBeVisible();
  for (const tile of [/^volume$/i, /^sets done$/i, /^new prs$/i]) {
    await expect(page.getByText(tile).first()).toBeVisible();
  }
  await expect(page.getByText("Free trial — 365 days left, then $10/month to keep using the app.")).toBeVisible();
});

test("src: the diet tab renders its sub-tabs and BMR precondition", async ({ page }) => {
  await bootSrc(page, "client");
  await page.getByText("Diet", { exact: true }).last().click();
  for (const sub of ["Food log", "Diet plan", "Energy balance"]) {
    await expect(page.getByText(sub, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/^no bmr yet$/i).first()).toBeVisible();
});

test("src: the diet plan browser renders", async ({ page }) => {
  // The template browser is the only place useDietTemplates' state is read,
  // and nothing else in the suite opens it — a missing setter there threw
  // "setTemplates is not defined" while every other test stayed green.
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await bootSrc(page, "client");
  await page.getByText("Diet", { exact: true }).last().click();
  await page.getByText("Diet plan", { exact: true }).first().click();
  await expect(page.getByText(/^your goal$/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("src: the trainer lands on their roster", async ({ page }) => {
  await bootSrc(page, "trainer");
  await expect(page.getByText("Demo Trainer's clients")).toBeVisible();
  await expect(page.getByText("No clients assigned to you yet — ask your manager to assign some.")).toBeVisible();
});

test("src: an overdue trainer is paused with the Whish details", async ({ page }) => {
  await bootSrc(page, "trainer-overdue");
  await expect(page.getByText("Payment due")).toBeVisible();
  await expect(page.getByText("+961 71107437")).toBeVisible();
  await expect(page.getByText("Demo Trainer's clients")).toHaveCount(0);
});

test("src: the owner roster computes the same 7-day volume", async ({ page }) => {
  await bootSrc(page, "coach");
  await page.getByText("Owner", { exact: true }).last().click();
  await expect(page.getByText("1,350 vol/7d")).toBeVisible();
});

test("src: the expired trial locks the app", async ({ page }) => {
  await bootSrc(page, "client-locked");
  await expect(page.getByText("Your free trial has ended")).toBeVisible();
});
