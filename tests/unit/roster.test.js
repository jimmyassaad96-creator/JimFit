import { describe, it, expect } from "vitest";
import { categorize, renewalFor } from "../../src/domain/roster.js";

// These two decide what a client's billing line says and whether their access
// looks current, so they are worth pinning directly rather than through the
// roster screen that renders them.

describe("categorize", () => {
  const bucket = () => ({});

  it("splits payments by the note patterns the app writes", () => {
    const map = bucket();
    categorize(map, "u1", "App access — September", 10);
    categorize(map, "u1", "Diet plan unlock", 30);
    categorize(map, "u1", "Program: Hypertrophy", 35);
    expect(map.u1).toEqual({ subscription: 10, diet: 30, programs: 35, other: 0 });
  });

  it("puts anything unrecognised in other, so no payment vanishes", () => {
    const map = bucket();
    categorize(map, "u1", "cash, agreed with Jimmy", 25);
    categorize(map, "u1", "", 5);
    categorize(map, "u1", null, 1);
    expect(map.u1.other).toBe(31);
  });

  it("accumulates across calls for the same key", () => {
    const map = bucket();
    categorize(map, "u1", "App access", 10);
    categorize(map, "u1", "App access", 10);
    expect(map.u1.subscription).toBe(20);
  });

  it("keeps separate keys apart", () => {
    const map = bucket();
    categorize(map, "u1", "Diet plan unlock", 30);
    categorize(map, "u2", "Diet plan unlock", 30);
    expect(map.u1.diet).toBe(30);
    expect(map.u2.diet).toBe(30);
  });
});

describe("renewalFor", () => {
  const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const past = "2020-01-01";
  const trainers = [{ id: "t1", name: "Real Trainer" }];

  it("is null for a client who trains with a real trainer", () => {
    // they bill outside the app, so there is no in-app renewal date
    expect(renewalFor({ trainer_id: "t1", access_paid_through: future }, trainers)).toBeNull();
  });

  it("is null when there is no client", () => {
    expect(renewalFor(null, trainers)).toBeNull();
  });

  it("reports an active paid period as ok", () => {
    const r = renewalFor({ trainer_id: null, access_paid_through: future }, trainers);
    expect(r.ok).toBe(true);
    expect(r.label).toMatch(/^Renews /);
  });

  it("reports an active trial as ok", () => {
    const r = renewalFor({ trainer_id: null, trial_ends_at: future }, trainers);
    expect(r.ok).toBe(true);
    expect(r.label).toMatch(/^Trial ends /);
  });

  it("reports a lapsed paid period as not ok", () => {
    const r = renewalFor({ trainer_id: null, access_paid_through: past }, trainers);
    expect(r.ok).toBe(false);
    expect(r.label).toMatch(/^Lapsed /);
  });

  it("reports an ended trial as not ok", () => {
    const r = renewalFor({ trainer_id: null, trial_ends_at: past }, trainers);
    expect(r).toEqual({ label: "Trial ended", ok: false });
  });

  it("prefers a live paid period over an expired trial", () => {
    const r = renewalFor({ trainer_id: null, trial_ends_at: past, access_paid_through: future }, trainers);
    expect(r.ok).toBe(true);
    expect(r.label).toMatch(/^Renews /);
  });

  it("is null for a client with neither date set", () => {
    expect(renewalFor({ trainer_id: null }, trainers)).toBeNull();
  });
});
