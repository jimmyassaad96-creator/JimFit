import { useState, useEffect } from "react";
import { sb } from "../../platform/supabase.js";

/**
 * The owner's inbound queues: trainer applications, diet-plan and program
 * requests, and the first-payment claims shown on the Trainers tab.
 *
 * Each queue is fetched when its tab is opened rather than up front, which is
 * why the fetchers are returned — useCoachData re-runs them as part of its own
 * refresh after a write.
 */
export function useCoachRequests({ coachTab }) {
    const [trainerRequests, setTrainerRequests] = useState([]);
    const [dietPlanRequests, setDietPlanRequests] = useState([]);
    const [programRequests, setProgramRequests] = useState([]); // raw unpaid client_program_assignments — filtered to self-train clients only via selfTrainProgramRequests below

    // Pulled out separately from the big mount-time fetch below so it can
    // also be re-run on demand — a client can submit a request at any point
    // during this same Owner session, and the request list otherwise only
    // ever loads once, when the view first unlocks.
    function fetchTrainerRequests() {
      if (!sb) return;
      sb.from("trainer_requests").select("*").eq("status", "pending").order("created_at", { ascending: true }).then(({ data, error }) => {
        if (!error && data) setTrainerRequests(data);
      });
    }

    // Same idea as fetchTrainerRequests, for clients who've tapped "Request a
    // diet plan" from their own Diet tab (plan_requested_at set) but the plan
    // isn't unlocked yet — previously only visible one client at a time by
    // stumbling onto their page, now surfaced here so nothing gets missed.
    // Also catches an already-unlocked client's pending PLAN SWITCH
    // (pending_switch_template_id set) — those still have plan_unlocked =
    // true the whole time (see handleSwitchTemplate/request_diet_plan_switch),
    // so the plan_unlocked check alone would miss them.
    function fetchDietPlanRequests() {
      if (!sb) return;
      sb.from("diet_plans").select("*").not("plan_requested_at", "is", null).or("plan_unlocked.is.null,plan_unlocked.eq.false,pending_switch_template_id.not.is.null").order("plan_requested_at", { ascending: true }).then(({ data, error }) => {
        if (!error && data) setDietPlanRequests(data);
      });
    }

    // Same idea, for clients who've picked a program from the library but
    // haven't paid for it yet (client_program_assignments.paid still false/
    // null). Pulls every unpaid pick regardless of who the client belongs to
    // — trainer-owned clients pick programs for free (never gated, see
    // ProgramsPanel's gatePayment prop) and just never get charged, so their
    // rows would sit here forever as noise. selfTrainProgramRequests below
    // filters those out before this ever reaches the menu badge or panel.
    function fetchProgramRequests() {
      if (!sb) return;
      sb.from("client_program_assignments").select("*").or("paid.is.null,paid.eq.false").order("assigned_at", { ascending: true }).then(({ data, error }) => {
        if (!error && data) setProgramRequests(data);
      });
    }

    // Sept 13 2026, Jimmy: "i didnt see the request even" — a trainer's
    // "I've sent the payment" button (PaymentStatusStepper, added Sept 12)
    // has been writing real payment_claims rows this whole time, but
    // nothing on this screen ever read them back. Jimmy had no way to know
    // a trainer had claimed to pay short of independently spotting the
    // Whish transfer and remembering who it was from — so a trainer who
    // marked payment as sent (like Bugz) just sat stuck re-seeing the same
    // "One more step" pay screen on every login, waiting on a confirmation
    // Jimmy never knew to give. Keyed by lowercased email so it's a cheap
    // lookup per trainer card below; same PAYMENT_CLAIM_FRESH_MS staleness
    // window PaymentStatusStepper itself uses, so this reads "sent" exactly
    // as long as the trainer's own screen does.
    const [firstPaymentClaimsByEmail, setFirstPaymentClaimsByEmail] = useState({});
    function fetchFirstPaymentClaims() {
      if (!sb) return;
      sb.from("payment_claims").select("*").eq("context", "trainer_first_payment").order("submitted_at", { ascending: false }).then(({ data, error }) => {
        if (error || !data) return;
        const map = {};
        data.forEach((row) => {
          // Newest first, keep the first (latest) one seen per email.
          if (!map[row.payer_email]) map[row.payer_email] = row;
        });
        setFirstPaymentClaimsByEmail(map);
      });
    }

    useEffect(() => {
      if (coachTab === "requests") fetchTrainerRequests();
      if (coachTab === "dietRequests") fetchDietPlanRequests();
      if (coachTab === "programRequests") fetchProgramRequests();
      if (coachTab === "trainers") fetchFirstPaymentClaims();
    }, [coachTab]);

  return {
    trainerRequests, setTrainerRequests,
    dietPlanRequests, setDietPlanRequests,
    programRequests, setProgramRequests,
    firstPaymentClaimsByEmail, fetchFirstPaymentClaims,
    fetchTrainerRequests, fetchDietPlanRequests, fetchProgramRequests,
  };
}
