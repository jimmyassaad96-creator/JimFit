import { useState, useEffect } from "react";
import { sb } from "../../platform/supabase.js";
import { B2B_FLAT_RATE_MONTHLY, OWNER_TRAINER_EMAIL, SELF_TRAIN_EMAIL } from "../../domain/access.js";
import { PENDING_GYM_CREATE_KEY, PENDING_TRAINER_CREATE_KEY, TRAINER_ROLE_ASSERT_KEY } from "../../domain/group1.js";
import { randomInviteCode } from "../../domain/group3.js";

/**
 * Whether the signed-in email belongs to a trainer, and which of the four
 * gate screens that puts in front of them.
 *
 * Carries the trainer-side gym-freeze check: a frozen gym signs out its owner
 * and trainers, and because this effect reruns on every login and reload it
 * catches an already-open session too, not just a fresh login. Its client-side
 * counterpart lives in useClientProfile.
 *
 * `setProfile` is passed in — resolving a trainer clears any client profile
 * that was loaded for the same session.
 */
export function useTrainerIdentity({ userEmail, setProfile }) {
    const [trainerChecked, setTrainerChecked] = useState(false);
    const [trainerInfo, setTrainerInfo] = useState(null);
    const [trainerNotOnRoster, setTrainerNotOnRoster] = useState(false);
    // Sept 6 2026, Jimmy: "i want the trainer when he first open to pay and
    // then get my approved to accept him not using the app for free" — being
    // is_approved was never meant to be enough on its own. Before this, a
    // freshly-approved trainer got a next_payment_date stamped 30 days out
    // (so isTrainerPaymentOverdue below stayed false) and had full access
    // that whole time whether or not they'd ever actually sent a cent —
    // "not yet overdue" and "never paid" were being treated the same. This
    // tracks whether trainer_payments has EVER seen a real row for them,
    // completely separate from the due-date/overdue cycle (which still
    // matters for someone who HAS paid before and is just between months).
    const [trainerHasEverPaid, setTrainerHasEverPaid] = useState(true);

    useEffect(() => {
      if (!userEmail || !sb) { setTrainerChecked(true); return; }
      setTrainerChecked(false);
      (async () => {
      // Consume a pending "start your own gym" signup, if this is that owner's
      // first authenticated moment. Deferred until now (rather than at signup
      // time) because the "create your own row" RLS insert policies need
      // auth.email() to resolve, which only exists once there's a live session
      // — not yet true at signup for accounts that require email confirmation.
      try {
        const rawPending = localStorage.getItem(PENDING_GYM_CREATE_KEY);
        if (rawPending) {
          const pending = JSON.parse(rawPending);
          if (pending && pending.email === userEmail.toLowerCase()) {
            let succeeded = false;
            let createdGymId = null;
            // Right after a brand-new signup, Supabase's own auth token can
            // briefly fail server-side validation ("JWT issued at future") —
            // a transient clock-sync race on Supabase's end, not a real
            // permissions problem. Retry a few times with short pauses
            // instead of giving up on the very first try.
            for (let attempt = 0; attempt < 5 && !succeeded; attempt++) {
              if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
              if (!createdGymId) {
                const { data: alreadyTrainer, error: alreadyErr } = await sb.from("trainers").select("id").eq("email", userEmail).limit(1);
                if (alreadyErr) { console.error("[gym-signup] attempt", attempt, "alreadyTrainer check failed:", alreadyErr); continue; }
                if (alreadyTrainer && alreadyTrainer.length) { succeeded = true; break; }
                // Sept 19 2026 inspection fix: trainers get auto-backfilled
                // to B2B_FLAT_RATE_MONTHLY if one's ever missing (see the
                // trainer-check effect above and TrainersBillingPanel) —
                // gyms had no equivalent, so a brand-new gym billed $0/month
                // with nothing flagging it until someone noticed and set a
                // rate by hand. Stamping the standard rate right at creation
                // matches GymsBillingPanel's own stated copy ("Standard rate
                // is $B2B_FLAT_RATE_MONTHLY/month per gym") — still freely
                // adjustable per gym afterward, same as today.
                const { data: newGym, error: gymErr } = await sb.from("gyms").insert([{ name: pending.gymName, owner_email: userEmail.toLowerCase(), flat_rate_monthly: B2B_FLAT_RATE_MONTHLY }]).select().maybeSingle();
                if (gymErr || !newGym) { console.error("[gym-signup] attempt", attempt, "gym insert failed:", gymErr); continue; }
                createdGymId = newGym.id;
              }
              const { error: trainerErr } = await sb.from("trainers").insert([{
                name: pending.ownerName,
                last_name: pending.ownerLastName || null,
                email: userEmail,
                gym_id: createdGymId,
                is_owner: true,
                invite_code: randomInviteCode()
              }]);
              if (trainerErr) { console.error("[gym-signup] attempt", attempt, "trainer insert failed:", trainerErr); continue; }
              succeeded = true;
            }
            // Only forget this pending signup once it actually worked — on
            // failure, leave it in place so the next login/reload retries it,
            // instead of silently losing the new owner's gym forever.
            if (succeeded) {
              localStorage.removeItem(PENDING_GYM_CREATE_KEY);
            } else {
              console.error("[gym-signup] gave up after retries — will retry again on next login/reload");
            }
          } else {
            // Different account's pending signup — not ours to consume or clear.
          }
        }
      } catch (err) {
        console.error("[gym-signup] EXCEPTION:", err);
      }
      // Consume a pending self-signed-up trainer, same deferred-until-a-live-
      // session pattern as the gym-owner block above (Sept 6 2026 — Jimmy is
      // about to post JimFit on Instagram and can't manually add every
      // trainer who signs up; this lets them create their own roster row,
      // landing with is_approved = false until he approves them). If this
      // email was actually already added by the manager, the "already a
      // trainer" check below makes this a harmless no-op — no duplicate row,
      // and the existing (already-approved) row is used as-is.
      try {
        const rawPendingTrainer = localStorage.getItem(PENDING_TRAINER_CREATE_KEY);
        if (rawPendingTrainer) {
          const pending = JSON.parse(rawPendingTrainer);
          if (pending && pending.email === userEmail.toLowerCase()) {
            let succeeded = false;
            for (let attempt = 0; attempt < 5 && !succeeded; attempt++) {
              if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
              const { data: already, error: alreadyErr } = await sb.from("trainers").select("id").eq("email", userEmail).limit(1);
              if (alreadyErr) { console.error("[trainer-signup] attempt", attempt, "already-check failed:", alreadyErr); continue; }
              if (already && already.length) { succeeded = true; break; } // manager already added this email — nothing to create
              const { error: insErr } = await sb.from("trainers").insert([{
                name: pending.name, last_name: pending.lastName || null, email: userEmail, phone: pending.phone || null, invite_code: randomInviteCode(), is_approved: false
              }]);
              if (insErr) { console.error("[trainer-signup] attempt", attempt, "insert failed:", insErr); continue; }
              succeeded = true;
            }
            if (succeeded) {
              localStorage.removeItem(PENDING_TRAINER_CREATE_KEY);
            } else {
              console.error("[trainer-signup] gave up after retries — will retry again on next login/reload");
            }
          }
        }
      } catch (err) {
        console.error("[trainer-signup] EXCEPTION:", err);
      }
      // Sept 18 2026: everything from here down used to run with no
      // top-level guard — unlike the two blocks just above, and unlike the
      // profileChecked effect further down (which retries once and shows a
      // real "couldn't reach the server, Retry" screen on failure). A real
      // network-level failure here (not just an {error} response — e.g. the
      // fetch itself rejecting on a flaky connection) would throw out of
      // this whole async IIFE, skip every setTrainerChecked(true) below, and
      // leave `if (!trainerChecked) return null` blocking the app on a
      // permanent blank screen with no way to recover short of reloading.
      // Wrapping the rest in try/catch means a failure here still unblocks
      // the UI (falls through as "not a trainer" — the normal client flow
      // below still applies its own retry/error screens) instead of hanging.
      try {
      // Same reasoning as the client_profiles fetch below: avoid .maybeSingle()
      // so a stray duplicate trainer row (same email twice) can never make
      // the app fail to recognize a real trainer's login.
      const { data, error: err } = await sb.from("trainers").select("*").eq("email", userEmail).order("id", { ascending: true }).limit(1);
      {
        const trainerRow = !err && data && data.length ? data[0] : null;
        // Safety net: catches an already-open session too, not just fresh logins —
        // if their gym gets frozen while they're signed in, the next reload boots them.
        if (trainerRow && trainerRow.gym_id) {
          const { data: gymRow } = await sb.from("gyms").select("is_frozen").eq("id", trainerRow.gym_id).maybeSingle();
          if (gymRow && gymRow.is_frozen) {
            await sb.auth.signOut();
            setTrainerInfo(null);
            setClientName(null);
            setUserId(null);
            setUserEmail(null);
            setProfile(null);
            setTrainerChecked(true);
            return;
          }
        }
        // Same safety net, per-trainer this time (Sept 1 2026 per-trainer
        // billing pivot — see TrainersBillingPanel) — a trainer frozen for
        // nonpayment is signed out here too, independent of any gym. The
        // two built-in system rows are excluded so they can never be
        // accidentally locked out even via a raw DB edit.
        if (trainerRow && trainerRow.is_frozen && trainerRow.email !== OWNER_TRAINER_EMAIL && trainerRow.email !== SELF_TRAIN_EMAIL) {
          await sb.auth.signOut();
          setTrainerInfo(null);
          setClientName(null);
          setUserId(null);
          setUserEmail(null);
          setProfile(null);
          setTrainerChecked(true);
          return;
        }
        // Auto-backfill a first "next payment due" date right here too, not
        // just when a manager happens to open Trainers → Billing — an
        // approved trainer logging in before that screen was ever opened
        // would otherwise have no due date and so could never actually be
        // caught by isTrainerPaymentOverdue below (Sept 6 2026, Jimmy:
        // "i wanted automatically to mark when their next payment is like
        // we did for clients"). One-time per trainer, best-effort — mutate
        // the local copy immediately so this same login sees the fresh date
        // (rather than needing a second reload to pick it up).
        if (trainerRow && trainerRow.is_approved !== false && trainerRow.next_payment_date == null
          && trainerRow.email !== OWNER_TRAINER_EMAIL && trainerRow.email !== SELF_TRAIN_EMAIL) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          const dueDateStr = dueDate.toISOString().slice(0, 10);
          const backfill = { next_payment_date: dueDateStr, ...(trainerRow.rate_monthly == null ? { rate_monthly: B2B_FLAT_RATE_MONTHLY } : {}) };
          trainerRow.next_payment_date = backfill.next_payment_date;
          if (backfill.rate_monthly != null) trainerRow.rate_monthly = backfill.rate_monthly;
          sb.from("trainers").update(backfill).eq("id", trainerRow.id).then(() => {});
        }
        // Sept 17 2026, Jimmy: trainer push notifications — notifyTrainer()
        // needs this trainer's own auth uid to look up their
        // push_subscriptions, but trainers is only ever matched by email
        // elsewhere in this file, nothing stores the login itself. Same
        // lightweight self-healing backfill as next_payment_date just above:
        // every trainer login from here on fills its own row in, once,
        // rather than needing a one-time migration to backfill everyone who
        // already has an account. Excluded for the two internal system rows,
        // which never have a real login to backfill.
        if (trainerRow && userId && trainerRow.user_id !== userId
          && trainerRow.email !== OWNER_TRAINER_EMAIL && trainerRow.email !== SELF_TRAIN_EMAIL) {
          trainerRow.user_id = userId;
          sb.from("trainers").update({ user_id: userId }).eq("id", trainerRow.id).then(() => {});
        }
        // Did this login/signup assert "I'm a Trainer"? Only ever trusted for
        // this exact email — see TRAINER_ROLE_ASSERT_KEY's own comment for why
        // it's only set after a successful auth call, never before one.
        let assertedTrainerRole = false;
        try {
          const asserted = localStorage.getItem(TRAINER_ROLE_ASSERT_KEY);
          assertedTrainerRole = !!asserted && asserted === userEmail.toLowerCase();
        } catch (err2) {}
        if (trainerRow) {
          // Confirmed real — clear the flag now so it can never linger into
          // an unrelated future login for this email.
          try { localStorage.removeItem(TRAINER_ROLE_ASSERT_KEY); } catch (err2) {}
        }
        setTrainerInfo(trainerRow);
        // Left un-cleared on purpose when this stays true — so a page reload
        // while stuck on the "not on roster" screen doesn't silently drop
        // someone into the client flow instead. Cleared explicitly by
        // handleLogout when they leave that screen.
        setTrainerNotOnRoster(!trainerRow && assertedTrainerRole);
        // Has this trainer EVER had a real payment logged? Skipped for the
        // two built-in system rows (no real billing) — everyone else starts
        // assumed unpaid until proven otherwise, so a query failure here
        // fails closed (locked out, not free access) rather than open.
        if (trainerRow && trainerRow.email !== OWNER_TRAINER_EMAIL && trainerRow.email !== SELF_TRAIN_EMAIL) {
          const { data: paidRows, error: paidErr } = await sb.from("trainer_payments").select("id").eq("trainer_id", trainerRow.id).limit(1);
          setTrainerHasEverPaid(!paidErr && !!(paidRows && paidRows.length));
        } else {
          setTrainerHasEverPaid(true);
        }
        setTrainerChecked(true);
      }
      } catch (err) {
        console.error("[trainer-check] EXCEPTION — falling through as not-a-trainer:", err);
        setTrainerChecked(true);
      }
      })();
    }, [userEmail]);

  return {
    trainerChecked, setTrainerChecked, trainerInfo, setTrainerInfo,
    trainerNotOnRoster, setTrainerNotOnRoster,
    trainerHasEverPaid, setTrainerHasEverPaid,
  };
}
