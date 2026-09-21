// Roster rules lifted out of CoachView. Pure functions over data — no React,
// no Supabase — so they can be unit-tested in milliseconds instead of through
// a browser that renders the roster.
import { SELF_TRAIN_NAME } from "./access.js";
import { fmtDateMed } from "../shared/lib/format.js";

    // Same idea as paidByUserId/paidByNameNoUserId above, but split into the
    // three payment types by note text (see PaymentsPanel's identical
    // categorization) — this is what lets the roster show "Sub/Diet/Program"
    // for every client at a glance instead of needing to open each one.
    // Sept 7 2026, Jimmy: "i want to see clients billing, each client what
    // did he pay for" — this already fed the roster's inline Sub/Diet/
    // Program line, but anything that didn't match one of those three exact
    // note patterns (a manager typing a manual amount with a custom or blank
    // note — same as the "Other" bucket PaymentsPanel's own summary already
    // has) used to just vanish from the breakdown, even though it still
    // counted in the client's total/balance. Added an "other" bucket so
    // every dollar shows up somewhere.
    export function categorize(map, key, note, amount) {
      if (!map[key]) map[key] = { subscription: 0, diet: 0, programs: 0, other: 0 };
      const n = note || "";
      if (n.indexOf("App access") === 0) map[key].subscription += amount;
      else if (n === "Diet plan unlock") map[key].diet += amount;
      else if (n.indexOf("Program:") === 0) map[key].programs += amount;
      else map[key].other += amount;
    }

    // Self-train (no real trainer) is the only client type that has a
    // monthly renewal date at all — same check ProgramsPanel/AppAccessCard
    // use elsewhere. Everyone else (a trainer's own client) bills outside
    // the app, so this returns null for them and the roster row just shows
    // nothing extra.
    export function renewalFor(cp, trainers) {
      if (!cp) return null;
      const t = trainers.find((tr) => tr.id === cp.trainer_id);
      const isSelfTrain = !cp.trainer_id || (t && t.name === SELF_TRAIN_NAME);
      if (!isSelfTrain) return null;
      const now = new Date();
      const paidActive = cp.access_paid_through && new Date(cp.access_paid_through + "T23:59:59") > now;
      const trialActive = cp.trial_ends_at && new Date(cp.trial_ends_at) > now;
      if (paidActive) return { label: `Renews ${fmtDateMed(cp.access_paid_through)}`, ok: true };
      if (trialActive) return { label: `Trial ends ${fmtDateMed(cp.trial_ends_at.slice(0, 10))}`, ok: true };
      if (cp.access_paid_through) return { label: `Lapsed ${fmtDateMed(cp.access_paid_through)}`, ok: false };
      if (cp.trial_ends_at) return { label: "Trial ended", ok: false };
      return null;
    }
