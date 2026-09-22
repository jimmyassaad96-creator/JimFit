// Shared boot for the src/ parity sweep.
//
// The assertion that matters most here is not any particular label — it is
// that opening a surface produces no uncaught page error. A hook extraction
// that leaves a setter behind throws a ReferenceError and renders nothing,
// and every content assertion elsewhere in the suite stays green while it
// happens, because nothing else opens that surface.
import { expect } from "@playwright/test";
import { installSupabaseFixtures } from "./fixtures.js";

export function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && /is not defined|is not a function|Cannot read propert/.test(m.text())) {
      errors.push(m.text());
    }
  });
  return errors;
}

export async function bootSrc(page, variant) {
  const errors = watchErrors(page);
  await installSupabaseFixtures(page);
  await page.goto(`/src-${variant}/`);
  await page.waitForFunction(() => {
    const t = document.getElementById("root").innerText.trim();
    return t.length > 40 && !/loading…?$/i.test(t);
  }, null, { timeout: 20000 });
  return errors;
}

/** Click a label, wait for the surface to settle, and assert it rendered. */
export async function open(page, label) {
  await page.getByText(label, { exact: true }).last().click();
  await page.waitForTimeout(500);
  const text = await page.locator("#root").innerText();
  expect(text.trim().length, `"${label}" rendered nothing`).toBeGreaterThan(40);
}

export async function openFirst(page, label) {
  await page.getByText(label, { exact: true }).first().click();
  await page.waitForTimeout(500);
  const text = await page.locator("#root").innerText();
  expect(text.trim().length, `"${label}" rendered nothing`).toBeGreaterThan(40);
}
