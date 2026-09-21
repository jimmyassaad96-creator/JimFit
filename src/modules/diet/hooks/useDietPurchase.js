import { useState } from "react";
import { DIET_PLAN_PRICE } from "../../../domain/access.js";
import { todayISO } from "../../../shared/lib/dates.js";
import { sb } from "../../../platform/supabase.js";
import { notifyClient, notifyTrainer } from "../../../data/group1.js";
import { notifyOwner } from "../../../data/notifyOwner.js";

/**
 * Paying for a diet plan: the manager's manual unlock, a client's request and
 * its cancellation, switching plans, unassigning one, and the nudge that tells
 * a trainer their client is waiting on targets.
 *
 * Every write here moves money or access, so each goes through the same
 * request/confirm path the rest of the app uses rather than a direct write.
 */
export function useDietPurchase({ userId, clientName, profile, plan, setPlan, mapPlanRow }) {
    const [unlocking, setUnlocking] = useState(false);
    const [unlockAmount, setUnlockAmount] = useState(String(DIET_PLAN_PRICE));
    const [unlockDate, setUnlockDate] = useState(todayISO());
    const [unlockSaving, setUnlockSaving] = useState(false);
    const [unlockError, setUnlockError] = useState("");
    // Sept 18 2026, Jimmy: "stuck waiting on their trainer to set diet
    // targets has no way to escalate" review finding — a one-tap nudge next
    // to the "Ask your trainer to set your macros" line below, same push
    // notification notifyTrainer already sends for a diet-plan request
    // (see the requestPlan handlers above), just a lighter-weight message
    // and no payment/approval flow attached. Session-only "sent" flag (no
    // persisted cooldown) — low-stakes enough that a client double-tapping
    // it once in a while isn't worth the extra plumbing.
    const [nudgeSent, setNudgeSent] = useState(false);
    function handleNudgeTrainer() {
      if (!profile || !profile.trainer_id) return;
      notifyTrainer(profile.trainer_id, `${clientName} is waiting on their diet macros/targets to be set.`);
      setNudgeSent(true);
    }

    const [requestingPlan, setRequestingPlan] = useState(false);
    const [cancelingRequest, setCancelingRequest] = useState(false);
    const [cancelingSwitch, setCancelingSwitch] = useState(false);
    // Sept 11 2026, Jimmy: "remove button on their current plan even after
    // paying, same as programs" — a client can now drop their active,
    // already-unlocked plan themselves (Programs already allowed this on
    // its own assignment; Diet used to be manager-only for anything paid,
    // by deliberate design — Jimmy confirmed he wants both to match now).
    const [unassigningPlan, setUnassigningPlan] = useState(false);
    // Sept 13 2026, Jimmy: inline "are you sure" instead of window.confirm().
    const [confirmUnassignPlan, setConfirmUnassignPlan] = useState(false);

    async function handleUnlockPlan() {
      setUnlockError("");
      const amt = Number(unlockAmount);
      if (!unlockAmount || isNaN(amt) || amt <= 0) { setUnlockError("Enter a valid amount."); return; }
      if (!unlockDate) { setUnlockError("Pick a date."); return; }
      if (!sb || !userId) { setUnlockError("Backend not configured yet."); return; }
      setUnlockSaving(true);
      // Mark the plan unlocked — upsert on the user_id unique index means this
      // always lands on the client's one real plan row, never a stray new one.
      const { data: planData, error: planErr } = await sb.from("diet_plans").upsert([{ user_id: userId, client_name: clientName, plan_unlocked: true }], { onConflict: "user_id" }).select();
      if (!planErr && planData && planData[0]) setPlan(mapPlanRow(planData[0]));
      // Log it as a real payment, same ledger as everything else this client pays —
      // and bump their "Total package" target by the same amount so the balance
      // math still lines up (this is on top of what they already owe, not instead of it).
      // Sept 6 2026, Jimmy: tags which template this payment was for (null for
      // a template-less custom plan) — this is what lets a later re-pick of
      // the SAME plan (after a client or trainer deletes it by mistake) be
      // recognized as already paid instead of charging again. See
      // DietPlanRequestRow's alreadyPaid/handleRestore for where that's used.
      await sb.from("client_payments").insert([{ user_id: userId, client_name: clientName, amount: amt, paid_on: unlockDate, note: "Diet plan unlock", template_id: (plan && plan.templateId) || null }]);
      notifyClient(userId, "Your diet plan is ready — check your Diet tab.");
      if (onUnlockDietPlan) onUnlockDietPlan(amt);
      setUnlockSaving(false);
      setUnlocking(false);
      setUnlockAmount(String(DIET_PLAN_PRICE));
      setUnlockDate(todayISO());
    }

    // Lets a client flag "I want a full diet plan" without being able to touch
    // anything else on the plan row (macros, unlock status, meal content) — a
    // client never gets direct write access to diet_plans, so this goes through
    // a SECURITY DEFINER function that only ever sets plan_requested_at for the
    // caller's own row. The trainer/manager side then sees a highlighted note
    // right above the Unlock control.
    async function handleRequestPlan() {
      // Sept 11 2026, Jimmy: matches Programs' "Request this program" —
      // requesting/picking is allowed even before the monthly app-access
      // payment; only actually USING a picked plan needs the app-access
      // (and plan) payments, both still gated elsewhere.
      if (!sb || !userId) return;
      setRequestingPlan(true);
      const { error: err } = await sb.rpc("request_diet_plan", { p_client_name: clientName });
      if (!err) {
        setPlan((p) => (p ? { ...p, requestedAt: new Date().toISOString() } : { requestedAt: new Date().toISOString() }));
        // Sept 17 2026, Jimmy: "the trainers how they get notifications" —
        // client requests a diet plan is one of the three events he wants
        // pushed. profile is this client's own row (this function only runs
        // for a real client's own request, see handleTrainerRequestPlan for
        // the separate trainer-initiated path just below, which isn't this).
        if (profile && profile.trainer_id) {
          notifyTrainer(profile.trainer_id, `${clientName} requested a diet plan.`);
          notifyOwner(`${clientName} requested a diet plan.`, { viaTrainerId: profile.trainer_id });
        } else {
          // Sept 18 2026, Jimmy: self-train clients (no trainer_id) have no
          // trainer to notify, but Jimmy still wants to know — same reasoning
          // as the self-train sign-up fix (see notifyOwner's allowGlobalFallback).
          notifyOwner(`${clientName} requested a diet plan (self-training, no trainer).`, { allowGlobalFallback: true });
        }
      }
      setRequestingPlan(false);
    }

    // Client changed their mind before a manager acted on the switch
    // request — clears just the pending switch fields. Deliberately a
    // SEPARATE, narrower RPC from cancel_diet_plan_request (used for a
    // first-ever request): that one clears the LIVE template_id, which
    // would be wrong here — this client already has a paid, active plan
    // that must stay untouched.
    async function handleCancelSwitch() {
      if (!sb || !userId) return;
      setCancelingSwitch(true);
      const { error: err } = await sb.rpc("cancel_diet_plan_switch", { p_client_name: clientName });
      if (!err) setPlan((p) => (p ? { ...p, pendingSwitchTemplateId: null, requestedAt: null } : p));
      setCancelingSwitch(false);
    }

    // Lets a client back out of a pending request — picked the wrong ready
    // plan, or changed their mind on a custom request — before a trainer/
    // manager has unlocked it. Same "only ever writes your own row" SECURITY
    // DEFINER pattern as the request handlers above.
    async function handleCancelRequest() {
      if (!sb || !userId) return;
      setCancelingRequest(true);
      const { error: err } = await sb.rpc("cancel_diet_plan_request", { p_client_name: clientName });
      if (!err) setPlan((p) => (p ? { ...p, requestedAt: null, templateId: null } : p));
      setCancelingRequest(false);
    }

    // Sept 11 2026, Jimmy: "remove button on their current plan even after
    // paying same as programs" — until now, once plan_unlocked was true,
    // only a manager could clear a client's plan (see the canManage-only
    // trash button further down); a client could only cancel a PENDING,
    // unpaid request via handleCancelRequest above. Jimmy explicitly asked
    // to match Programs, where a client can self-remove even a paid
    // assignment, so this is the new client-facing equivalent. It only
    // clears which plan is currently active — it does NOT touch
    // client_payments, so "Your paid plans" below still lists it and
    // picking it again (here or via handlePickTemplate) is free, same as
    // Programs re-picking a program you already paid for never re-charges.
    async function handleUnassignPlan() {
      if (!sb || !userId) return;
      setConfirmUnassignPlan(false);
      setUnassigningPlan(true);
      const { error: err } = await sb.rpc("unassign_diet_plan", { p_client_name: clientName });
      // Sept 11 2026, Jimmy: "i cant see the instant meal plan" — this used
      // to also clear instantPlanGoal/Diet/Calories here, which deleted the
      // client's already-built free instant plan along with the assigned
      // template. Those are a separate, already-paid-for entitlement (see
      // everPaidDiet above) — removing "your current plan" should only
      // touch template_id/plan_unlocked/pending_switch, never the instant
      // plan. unassign_diet_plan on the server was updated to match (no
      // longer nulls the instant_plan_* columns).
      if (!err) setPlan((p) => (p ? { ...p, templateId: null, unlocked: false, pendingSwitchTemplateId: null } : p));
      setUnassigningPlan(false);
    }

  return {
    unlocking, setUnlocking, unlockAmount, setUnlockAmount,
    unlockDate, setUnlockDate, unlockSaving, unlockError,
    nudgeSent, handleNudgeTrainer,
    requestingPlan, cancelingRequest, cancelingSwitch,
    unassigningPlan, confirmUnassignPlan, setConfirmUnassignPlan,
    handleUnlockPlan, handleRequestPlan,
    handleCancelSwitch, handleCancelRequest, handleUnassignPlan,
  };
}
