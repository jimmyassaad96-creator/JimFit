import { useState, useEffect, useMemo } from "react";
import { B2B_FLAT_RATE_MONTHLY } from "../../domain/access.js";
import { sb } from "../../platform/supabase.js";
import { SELF_TRAIN_EMAIL } from "../../domain/access.js";
import { randomInviteCode } from "../../domain/group3.js";
import { todayISO } from "../../shared/lib/dates.js";

/**
 * Owner-side trainer administration: adding one, editing their fields,
 * approving a pending application, and deleting or rejecting them.
 *
 * handleApproveAndConfirmPayment is the one to read first — it sets
 * is_approved and writes the first trainer_payments row together, which is
 * deliberate: a never-paid trainer should land on the payment screen rather
 * than behind a separate pending-approval wall. That single call decides both
 * money and access, and no test exercises it.
 *
 * trainerClientCounts is derived here rather than in the component because the
 * delete confirmation needs it, and leaving it above meant this hook had to be
 * called below every memo that reads trainerSearch.
 */
export function useTrainerAdmin({
  trainers, setTrainers, profiles, setProfiles,
  selectedTrainerId, setSelectedTrainerId, setAllTrainerPayments,
}) {
    const [showAddTrainer, setShowAddTrainer] = useState(false);
    // Sept 14 2026, Jimmy: "i want for every tab in it a search button i
    // dont want to scroll all the way down" — the Trainers list (below,
    // browsableTrainers) is the other long roster in this menu besides
    // Clients, so it gets the same search-by-name-or-email box.
    const [trainerSearch, setTrainerSearch] = useState("");
    const [newTrainerName, setNewTrainerName] = useState("");
    const [newTrainerEmail, setNewTrainerEmail] = useState("");
    const [newTrainerPhone, setNewTrainerPhone] = useState("");
    const [addTrainerError, setAddTrainerError] = useState("");
    const [addingTrainer, setAddingTrainer] = useState(false);

    const trainerClientCounts = useMemo(() => {
      const counts = {};
      profiles.forEach((p) => { if (p.trainer_id) counts[p.trainer_id] = (counts[p.trainer_id] || 0) + 1; });
      return counts;
    }, [profiles]);

    async function handleAddTrainer() {
      setAddTrainerError("");
      const name = newTrainerName.trim();
      const emailAddr = newTrainerEmail.trim().toLowerCase();
      if (!name) { setAddTrainerError("Enter a name."); return; }
      if (!emailAddr || !emailAddr.includes("@")) { setAddTrainerError("Enter a valid email."); return; }
      if (!sb) { setAddTrainerError("Backend not configured yet."); return; }
      setAddingTrainer(true);
      const { data: existing } = await sb.from("trainers").select("id").eq("email", emailAddr).maybeSingle();
      if (existing) {
        setAddingTrainer(false);
        setAddTrainerError("A trainer with that email already exists.");
        return;
      }
      const { data, error: err } = await sb.from("trainers").insert([{ name, email: emailAddr, phone: newTrainerPhone.trim() || null, invite_code: randomInviteCode() }]).select();
      setAddingTrainer(false);
      if (err || !data) { setAddTrainerError("Couldn't add that trainer. Try again."); return; }
      setTrainers((prev) => [...prev, data[0]].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      setNewTrainerName(""); setNewTrainerEmail(""); setNewTrainerPhone(""); setShowAddTrainer(false);
    }

    async function handleUpdateTrainerField(trainerId, field, value) {
      // Sept 19 2026 inspection fix: email is this trainer's login identity
      // (matched by exact string at login, see the trainer-check effect) —
      // give it the same format/lowercase/duplicate checks handleAddTrainer
      // already does for a brand-new trainer, instead of writing whatever
      // was typed straight through. A rejected edit leaves the field
      // showing the last-good value (EditableStat resyncs its draft from
      // the unchanged `value` prop) and surfaces why via trainerFieldError.
      if (field === "email") {
        setTrainerFieldError("");
        const normalized = (value || "").trim().toLowerCase();
        if (!normalized || !normalized.includes("@")) {
          setTrainerFieldError("Enter a valid email.");
          return;
        }
        if (sb) {
          const { data: existing } = await sb.from("trainers").select("id").eq("email", normalized).neq("id", trainerId).maybeSingle();
          if (existing) {
            setTrainerFieldError("A trainer with that email already exists.");
            return;
          }
        }
        setTrainers((prev) => prev.map((t) => (t.id === trainerId ? { ...t, email: normalized } : t)));
        if (sb) await sb.from("trainers").update({ email: normalized }).eq("id", trainerId);
        return;
      }
      setTrainers((prev) => prev.map((t) => (t.id === trainerId ? { ...t, [field]: value } : t)));
      if (sb) await sb.from("trainers").update({ [field]: value }).eq("id", trainerId);
    }

    // Sept 13 2026, Jimmy: "every delete button in the app... show inside
    // the page not above" — was window.confirm(); confirmDeleteTrainer just
    // tracks whether the inline "are you sure" block below the Delete
    // trainer button is open, same idea as every other delete in the app
    // now. Only one trainer's detail page is ever open at once here, so a
    // plain boolean (not per-id) is enough.
    const [confirmDeleteTrainer, setConfirmDeleteTrainer] = useState(false);
    // Sept 18 2026, review item #15: this was the one remaining delete flow
    // still popping a plain browser alert() box instead of the app's own
    // styled errorBanner (every other error in the app went through this
    // same setError/errorBanner pattern back on Sept 13).
    const [deleteTrainerError, setDeleteTrainerError] = useState("");
    // Sept 19 2026 inspection fix: every other delete flow in the app
    // disables its confirm button while the request is in flight — this one
    // didn't, so a fast double-click could fire owner_delete_trainer_account
    // twice concurrently (the second call just fails against an
    // already-deleted row, but it's an inconsistency worth closing).
    const [deletingTrainer, setDeletingTrainer] = useState(false);
    // Sept 19 2026 inspection fix: editing a trainer's email (below, via
    // handleUpdateTrainerField's special-cased "email" branch) had none of
    // handleAddTrainer's format/lowercase/duplicate checks — a typo or a
    // case mismatch (Bob@ vs bob@) would silently break that trainer's next
    // login (matched by exact email string), with nothing in the UI
    // warning it happened. This surfaces that validation's result.
    const [trainerFieldError, setTrainerFieldError] = useState("");
    useEffect(() => { setTrainerFieldError(""); }, [selectedTrainerId]);
    function deleteTrainerMessage(trainerId) {
      const t = trainers.find((x) => x.id === trainerId);
      if (!t) return "";
      const clientCount = trainerClientCounts[trainerId] || 0;
      // Sept 17 2026, Jimmy: same owner-side "actually delete the login too"
      // change as handleDeleteClient — see owner_delete_trainer_account in
      // supabase_owner_delete_accounts.sql. Previously this note said the
      // login would still work; now it doesn't, so the copy has to say so.
      const loginNote = " Their login will be deleted too — they won't be able to sign back in.";
      // Sept 19 2026 inspection fix: any session already on the Rota for
      // this trainer was left pointing at a trainer who no longer exists,
      // with no heads-up here that you'd need to find and deal with those
      // separately (they still show, just as "Unassigned"). Said plainly
      // now, same way the client-reassignment note already is.
      const sessionsNote = " Any sessions already booked with them will show as \"Unassigned\" on the Rota — reassign or remove those separately.";
      return (clientCount > 0
        ? `Delete ${t.name}? Their ${clientCount} client${clientCount === 1 ? "" : "s"} will become unassigned — you can reassign them anytime.`
        : `Delete ${t.name}? This can't be undone.`) + sessionsNote + loginNote;
    }
    async function handleDeleteTrainer(trainerId) {
      if (deletingTrainer) return;
      const t = trainers.find((x) => x.id === trainerId);
      if (!t) return;
      if (t.email === SELF_TRAIN_EMAIL) { setDeleteTrainerError("\"Self-Training\" is a built-in bucket for clients without a trainer — it can't be deleted."); return; }
      setDeleteTrainerError("");
      // Sept 19 2026 inspection fix: this used to close the confirm bar
      // (setConfirmDeleteTrainer(false)) in the same tick as setting
      // deletingTrainer(true) — React batches both into one render, so the
      // very next paint showed confirmDeleteTrainer=false, which picks the
      // plain, fully-enabled "Delete trainer" button instead of the
      // "Deleting…" busy one. It looked like the tap did nothing while the
      // delete was still running, and — since deleteTrainerError only
      // renders inside the confirmDeleteTrainer branch — a real failure's
      // error message was never visible either. Now stays open (with its
      // busy/disabled state and any error) until the operation actually
      // finishes; only Cancel and a real success close it.
      setDeletingTrainer(true);
      if (sb) {
        const { error: rpcErr } = await sb.rpc("owner_delete_trainer_account", { target_trainer_id: trainerId });
        if (rpcErr) {
          // Sept 18 2026: owner_delete_trainer_account deliberately REFUSES
          // (raise exception) for a protected row — a real multi-tenant gym
          // owner (is_owner = true) or the legacy __owner__ placeholder —
          // see supabase_owner_delete_accounts.sql. That refusal used to
          // land in this same rpcErr branch as "the RPC just isn't deployed
          // yet," so the raw fallback below ran either way and actually
          // deleted the exact row the SQL was trying to protect — a real
          // gym owner's trainer row, breaking their GymOwnerView and
          // orphaning their login. Only fall back to the old roster-only
          // cleanup when the function is genuinely missing; any other
          // error (including that explicit refusal) stops here and tells
          // you, instead of silently doing the delete anyway.
          const fnMissing = rpcErr.code === "42883" || rpcErr.code === "PGRST202" || /function .* does not exist|could not find the function/i.test(rpcErr.message || "");
          if (!fnMissing) {
            setDeleteTrainerError(rpcErr.message || "Couldn't delete that trainer — try again.");
            setDeletingTrainer(false);
            return;
          }
          await sb.from("client_profiles").update({ trainer_id: null }).eq("trainer_id", trainerId);
          await sb.from("trainers").delete().eq("id", trainerId);
        }
        // Sept 19 2026 inspection fix: neither the RPC nor this fallback
        // touched scheduled_sessions — any booking already on the Rota for
        // this trainer was left with a trainer_id pointing at a row that no
        // longer exists. It degrades gracefully (shows as "Unassigned"
        // rather than crashing), but leaving a real dangling reference
        // around when it's this easy to clear is worse than just clearing
        // it — same "becomes unassigned" outcome the client reassignment
        // above already gives, just for sessions instead of clients.
        await sb.from("scheduled_sessions").update({ trainer_id: null }).eq("trainer_id", trainerId);
      }
      setTrainers((prev) => prev.filter((x) => x.id !== trainerId));
      setProfiles((prev) => prev.map((p) => (p.trainer_id === trainerId ? { ...p, trainer_id: null } : p)));
      setAllTrainerPayments((prev) => prev.filter((p) => p.trainer_id !== trainerId));
      setConfirmDeleteTrainer(false);
      setSelectedTrainerId(null);
      setDeletingTrainer(false);
    }

    // Rejecting a pending self-signup is just a delete with clearer wording —
    // there's never a client to worry about reassigning at this stage, so the
    // shared confirm dialog's messaging doesn't fit; skip straight to a
    // reject-specific confirm instead of reusing handleDeleteTrainer's.
    // Sept 7 2026, Jimmy: "when he logs in and creates an account for the
    // first time [he should] directly see the payment whish and i accept
    // him once after paying" — approving and confirming the first payment
    // used to be two separate manual actions on two separate screens
    // (a plain "Approve" here, then later "Mark this month's payment
    // received" on Trainers → Billing), which also meant a trainer had to
    // log back in an extra time in between. Now a pending trainer sees the
    // Whish payment screen immediately on their first login (see the
    // render-order change near TrainerFirstPaymentDueScreen below), and
    // this single action both approves them AND logs their first payment
    // together — same amount/next-due-date mini-form pattern as
    // TrainersBillingPanel's "Mark this month's payment received" flow, so
    // it should feel familiar rather than like a second, different UI.
    const [approvingId, setApprovingId] = useState(null);
    const [approveAmount, setApproveAmount] = useState("");
    const [approveDate, setApproveDate] = useState("");
    const [approveSaving, setApproveSaving] = useState(false);
    const [approveError, setApproveError] = useState("");

    function openApprove(t) {
      setApproveError("");
      setApprovingId(t.id);
      setApproveAmount(String(Number(t.rate_monthly) || B2B_FLAT_RATE_MONTHLY));
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setApproveDate(d.toISOString().slice(0, 10));
    }

    async function handleApproveAndConfirmPayment(trainerId) {
      const t = trainers.find((x) => x.id === trainerId);
      if (!t) return;
      setApproveError("");
      const amt = Number(approveAmount);
      if (!approveAmount || Number.isNaN(amt) || amt <= 0) { setApproveError("Enter a valid amount."); return; }
      if (!approveDate) { setApproveError("Pick a next payment date."); return; }
      if (!sb) { setApproveError("Backend not configured yet."); return; }
      setApproveSaving(true);
      const updates = { is_approved: true, next_payment_date: approveDate, rate_monthly: amt };
      const { error: updErr } = await sb.from("trainers").update(updates).eq("id", trainerId);
      if (updErr) {
        setApproveSaving(false);
        setApproveError("Couldn't save that. Try again.");
        return;
      }
      const { error: payErr } = await sb.from("trainer_payments").insert([{
        trainer_id: t.id, trainer_name: t.name, amount: amt, paid_on: todayISO(),
        note: `First payment — paid through ${approveDate}`
      }]);
      setTrainers((prev) => prev.map((x) => (x.id === trainerId ? { ...x, ...updates } : x)));
      if (payErr) {
        setApproveSaving(false);
        setApproveError("Approved, but couldn't log the payment — add it manually on Trainers → Billing so the app unlocks for them.");
        return;
      }
      setApproveSaving(false);
      setApprovingId(null);
    }

    // Sept 13 2026, Jimmy: inline "are you sure" instead of window.confirm()
    // — tracks which pending trainer's Reject is mid-confirm, so only that
    // one card shows the inline bar.
    const [confirmRejectId, setConfirmRejectId] = useState(null);
    async function handleRejectTrainer(trainerId) {
      const t = trainers.find((x) => x.id === trainerId);
      if (!t) return;
      setConfirmRejectId(null);
      if (sb) await sb.from("trainers").delete().eq("id", trainerId);
      setTrainers((prev) => prev.filter((x) => x.id !== trainerId));
    }

  return {
    showAddTrainer, setShowAddTrainer, trainerSearch, setTrainerSearch,
    newTrainerName, setNewTrainerName, newTrainerEmail, setNewTrainerEmail,
    newTrainerPhone, setNewTrainerPhone, addTrainerError, addingTrainer,
    trainerClientCounts,
    confirmDeleteTrainer, setConfirmDeleteTrainer,
    deleteTrainerError, deletingTrainer, trainerFieldError,
    approvingId, setApprovingId, approveAmount, setApproveAmount,
    approveDate, setApproveDate, approveSaving, approveError,
    confirmRejectId, setConfirmRejectId,
    deleteTrainerMessage, openApprove,
    handleAddTrainer, handleUpdateTrainerField, handleDeleteTrainer,
    handleApproveAndConfirmPayment, handleRejectTrainer,
  };
}
