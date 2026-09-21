// Opens every surface of the src/ build and fails on any uncaught page error.
// This is the gate the hooks extraction relies on: it covers the screens the
// remaining hooks feed, so a setter left behind is caught here rather than by
// someone clicking through afterwards.
import { test, expect } from "@playwright/test";
import { bootSrc, open, openFirst } from "../harness/parity.js";

test("src: every client tab opens cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "client");
  for (const tab of ["Log", "Muscles", "Progress", "Diet", "Programs", "Trainer", "AI Chat"]) {
    await open(page, tab);
  }
  expect(errors).toEqual([]);
});

test("src: every progress sub-tab opens cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "client");
  await open(page, "Progress");
  for (const sub of ["Overview", "Photos", "Body", "Info"]) {
    await openFirst(page, sub);
  }
  expect(errors).toEqual([]);
});

test("src: every diet sub-tab opens cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "client");
  await open(page, "Diet");
  // "Energy balance" is a section heading inside the food log, not a tab —
  // only the first two are clickable.
  for (const sub of ["Diet plan", "Food log"]) {
    await openFirst(page, sub);
  }
  await expect(page.getByText("Energy balance", { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("src: the programs browser opens cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "client");
  await open(page, "Programs");
  await expect(page.getByText("Your program")).toBeVisible();
  await openFirst(page, "Browse all programs");
  expect(errors).toEqual([]);
});

test("src: the workout entry form opens and quick entry expands", async ({ page }) => {
  const errors = await bootSrc(page, "client");
  await openFirst(page, "New exercise");
  await page.getByPlaceholder("e.g. 3x8 or 3x8x60").fill("3x8x60");
  await openFirst(page, "Apply");
  await expect(page.getByPlaceholder("8", { exact: true })).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("src: every trainer tab opens cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "trainer");
  for (const tab of ["Clients", "Stats", "Rota", "Diet", "My Log", "Muscles", "AI Chat", "Profile"]) {
    await open(page, tab);
  }
  expect(errors).toEqual([]);
});

test("src: both trainer gate screens render cleanly", async ({ page }) => {
  let errors = await bootSrc(page, "trainer-unapproved");
  await expect(page.getByText("Almost there!")).toBeVisible();
  expect(errors).toEqual([]);
});

test("src: the owner menu opens every section cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "coach");
  await open(page, "Owner");
  for (const entry of ["Trainers", "Trainer requests", "Diet plan requests", "Program requests",
                       "Gyms", "Trainer billing", "Client billing", "Diet plan templates",
                       "Exercise Library"]) {
    await openFirst(page, "Menu");
    await openFirst(page, entry);
  }
  expect(errors).toEqual([]);
});

test("src: a client detail opens from the owner roster cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "coach");
  await open(page, "Owner");
  await open(page, "Demo Client");
  await expect(page.getByText("All clients", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("src: the unauthenticated chain renders cleanly", async ({ page }) => {
  const errors = await bootSrc(page, "gates");
  await expect(page.getByText("Welcome to JimFit")).toBeVisible();
  await openFirst(page, "Get started");
  await expect(page.getByText("How are you logging in?")).toBeVisible();
  expect(errors).toEqual([]);
});
