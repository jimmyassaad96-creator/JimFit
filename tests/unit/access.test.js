import { describe, it, expect } from "vitest";
import { isTrainerPaymentOverdue } from "../../src/domain/access.js";

// Decides whether a trainer is locked out of their roster, so it is worth
// pinning precisely rather than through the screen it drives.
describe("isTrainerPaymentOverdue", () => {
  it("is false when there is no trainer", () => {
    expect(isTrainerPaymentOverdue(null)).toBe(false);
  });

  it("is false when no payment date is set", () => {
    expect(isTrainerPaymentOverdue({ next_payment_date: null })).toBe(false);
  });

  it("is true once the date has passed", () => {
    expect(isTrainerPaymentOverdue({ next_payment_date: "2020-01-01" })).toBe(true);
  });

  it("is false for a date still in the future", () => {
    const far = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
    expect(isTrainerPaymentOverdue({ next_payment_date: far })).toBe(false);
  });

  it("treats the due date itself as still paid, to the end of that day", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isTrainerPaymentOverdue({ next_payment_date: today })).toBe(false);
  });
});
