import { test, expect } from "@playwright/test";
import { installSupabaseFixtures } from "../harness/fixtures.js";

test("client dashboard renders past the auth gate", async ({ page }) => {
  await installSupabaseFixtures(page);
  await page.goto("/client/");
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByText("Demo Client").first()).toBeVisible({ timeout: 15000 });
});
