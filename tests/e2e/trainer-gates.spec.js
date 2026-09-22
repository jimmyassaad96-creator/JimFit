// Flow 5 of the spec: the screens that stand between a trainer and their
// roster. These encode who gets charged and who gets locked out, so they are
// the highest-value assertions in the suite.
import { test, expect } from "@playwright/test";
import { boot } from "../harness/fixtures.js";

test("an unapproved trainer sees the pending screen and cannot reach clients", async ({ page }) => {
  await boot(page, "trainer-unapproved");
  await expect(page.getByText("Almost there!")).toBeVisible();
  await expect(
    page.getByText("Thanks for signing up, Demo Trainer — your trainer account is waiting for approval. You'll be able to log in and see your assigned members as soon as it's approved.")
  ).toBeVisible();
  await expect(page.getByText("Demo Trainer's members")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("an overdue trainer is paused, told the due date, and shown how to pay", async ({ page }) => {
  await boot(page, "trainer-overdue");
  await expect(page.getByText("Payment due")).toBeVisible();
  await expect(
    page.getByText("Hi Demo Trainer — your monthly payment was due Jan 1, 2020 and hasn't been confirmed yet, so your account is paused until it is.")
  ).toBeVisible();
  await expect(page.getByText("Demo Trainer's members")).toHaveCount(0);
});

test("the overdue screen names the Whish payee, number and amount", async ({ page }) => {
  await boot(page, "trainer-overdue");
  await expect(page.getByText(/^pay via whish money$/i).first()).toBeVisible();
  await expect(page.getByText("JimFit", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("+961 71107437")).toBeVisible();
  await expect(page.getByText("Send $24.99")).toBeVisible();
  await expect(page.getByRole("button", { name: "I've sent the payment" })).toBeVisible();
  await expect(page.getByText("Send the payment above, then mark it as sent.")).toBeVisible();
});
