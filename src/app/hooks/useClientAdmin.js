import { useState } from "react";
import { sb } from "../../platform/supabase.js";
import { notifyTrainer } from "../../data/group1.js";
import { recalcBmrAndTargets } from "../../data/recalcBmrAndTargets.js";
import { fmtDate } from "../../shared/lib/format.js";

/**
 * Owner-side client administration — the mirror of useTrainerAdmin, and it
 * carries the same weight: handleDeleteClient removes a login through the
 * owner_delete RPC, handleIncrementTotalDue changes what someone owes, and
 * handleClearWorkouts wipes a training history.
 *
 * confirmDialog lives here because every one of those actions routes its
 * "are you sure" through the same inline bar.
 */
export function useClientAdmin({
  profiles, setProfiles, setAllEntries, setAllPayments,
  resolveClientById, paidByUserId, paidByNameNoUserId,
  selectedClient, setSelectedClient,
}) {
    // Sept 11 2026, Jimmy: brand pass — holds { title, message, confirmLabel,
    // onConfirm } for the on-brand ConfirmDialog replacing window.confirm()
    // on this page's highest-stakes deletes. null = no dialog showing.
    const [confirmDialog, setConfirmDialog] = useState(null);

    // Takes the profile row directly (not a name) — there's no ambiguity to
    // resolve since the caller already has the right client's own profile.
    function balanceFor(cp) {
      if (!cp || cp.total_due == null) return null;
      // The name-matched legacy fallback is only safe to trust when that
      // name is unique across current clients — otherwise an old untagged
      // payment belonging to ONE of two same-named clients would get
      // credited to BOTH of their balances (Sept 6 2026 deep bug search: a
      // real double-count, not just a theoretical one, since client names
      // in this app aren't guaranteed unique).
      const sameNameCount = profiles.filter((p) => p.client_name === cp.client_name).length;
      const legacyByName = sameNameCount === 1 ? (paidByNameNoUserId[cp.client_name] || 0) : 0;
      const paid = (cp.user_id ? (paidByUserId[cp.user_id] || 0) : 0) + legacyByName;
      return Number(cp.total_due) - paid;
    }

    // Sept 11 2026, Jimmy: brand pass — was window.confirm(); now opens the
    // on-brand ConfirmDialog (see confirmDialog state + its render near the
    // bottom of this component) and only runs the actual delete once the
    // dialog's own Delete button is tapped. Logic itself is unchanged.
    function handleDeleteClient(id) {
      // id is a roster row id — a real profile id, or a "name:X" pseudo-id
      // for a legacy row with no matching profile (see the roster builder).
      // Resolving by id first, before doing anything else, is what makes
      // this safe when two clients share a display name: cp is always THIS
      // specific client's own profile row, never a name-ambiguous guess.
      const cp = resolveClientById(id);
      const name = cp ? cp.client_name : String(id).replace(/^name:/, "");
      // Sept 17 2026, Jimmy: "if me as owner i delete someone automatically
      // will be deleted?" — previously this only wiped the app-side rows and
      // deliberately left the login alone (see the old copy of this message,
      // still true for a legacy client with no login at all). Now, when the
      // client has a real login, this also calls owner_delete_client_account
      // (see supabase_owner_delete_accounts.sql) which deletes their
      // auth.users row too — same end result as if the client had used
      // "Delete my account" themselves. hasLogin decides which message —
      // and which cleanup path — applies.
      const hasLogin = !!(cp && cp.user_id);
      setConfirmDialog({
        title: "Delete this client?",
        message: hasLogin
          ? `Delete ${name} entirely? This removes their profile, workout history, payment records, and their login — they won't be able to sign back in. This can't be undone.`
          : `Delete ${name} entirely? This removes their profile, workout history, and payment records, and can't be undone. (They don't have a login account yet, so there's nothing else to remove.)`,
        confirmLabel: "Delete client",
        onConfirm: async () => {
          setConfirmDialog(null);
          setAllEntries((prev) => prev.filter((x) => (cp && cp.id ? x.clientId !== cp.id : x.clientName !== name)));
          setProfiles((prev) => prev.filter((p) => (cp && cp.id ? p.id !== cp.id : p.client_name !== name)));
          setAllPayments((prev) => prev.filter((p) => (cp && cp.user_id ? p.user_id !== cp.user_id : p.client_name !== name)));
          if (selectedClient === id) setSelectedClient(null);
          if (sb) {
            if (hasLogin) {
              const { error: rpcErr } = await sb.rpc("owner_delete_client_account", { target_user_id: cp.user_id });
              if (rpcErr) {
                // RPC not deployed yet (or failed) — fall back to the old
                // app-data-only cleanup so the client still disappears from
                // the roster now; their login is left for the SQL script to
                // be run, same as before this feature existed.
                await sb.from("workout_entries").delete().eq("client_id", cp.id);
                await sb.from("client_program_assignments").delete().eq("client_id", cp.id);
                await sb.from("client_payments").delete().eq("user_id", cp.user_id);
                await sb.from("client_profiles").delete().eq("id", cp.id);
              }
            } else if (cp && cp.id) {
              await sb.from("workout_entries").delete().eq("client_id", cp.id);
              await sb.from("client_program_assignments").delete().eq("client_id", cp.id);
              await sb.from("client_profiles").delete().eq("id", cp.id);
            } else {
              await sb.from("workout_entries").delete().eq("client_name", name);
              await sb.from("client_profiles").delete().eq("client_name", name);
            }
          }
        }
      });
    }

    // Sept 14 2026, Jimmy: "add ... a delete option button" on the Diet plan
    // requests / Program requests "Paid" lists — same on-brand ConfirmDialog
    // as every other delete in this view, just removing one client_payments
    // row (e.g. logged by mistake, wrong client, test entry) instead of a
    // whole client. Doesn't touch the client's plan/program unlock itself —
    // just the payment record — same as any other billing correction.
    function handleDeletePayment(payment) {
      setConfirmDialog({
        title: "Delete this payment?",
        message: `Delete the $${Number(payment.amount || 0).toLocaleString()} payment from ${payment.client_name || "this client"} (${payment.paid_on ? fmtDate(payment.paid_on.slice(0, 10)) : "no date"})? This can't be undone and won't undo their plan/program unlock automatically.`,
        confirmLabel: "Delete payment",
        onConfirm: async () => {
          setConfirmDialog(null);
          setAllPayments((prev) => prev.filter((p) => p.id !== payment.id));
          if (sb) await sb.from("client_payments").delete().eq("id", payment.id);
        }
      });
    }

    function handleClearWorkouts(id) {
      const cp = resolveClientById(id);
      const name = cp ? cp.client_name : String(id).replace(/^name:/, "");
      setConfirmDialog({
        title: "Clear workout history?",
        message: `Clear all logged workouts for ${name}? Their profile and payment history stay intact — only session history is removed. Can't be undone.`,
        confirmLabel: "Clear history",
        onConfirm: async () => {
          setConfirmDialog(null);
          setAllEntries((prev) => prev.filter((x) => (cp && cp.id ? x.clientId !== cp.id : x.clientName !== name)));
          if (sb) {
            if (cp && cp.id) await sb.from("workout_entries").delete().eq("client_id", cp.id);
            else await sb.from("workout_entries").delete().eq("client_name", name);
          }
        }
      });
    }





    // All four now take the roster row's id, resolved to a profile via
    // resolveClientById — never a bare name, since two clients can share a
    // display name and a name lookup could silently resolve to the wrong one.
    async function handleAssignTrainer(id, trainerId) {
      const cp = resolveClientById(id);
      if (!cp) return;
      const prevTrainerId = cp.trainer_id;
      setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, trainer_id: trainerId || null } : p)));
      if (sb) await sb.from("client_profiles").update({ trainer_id: trainerId || null }).eq("id", cp.id);
      // Sept 17 2026, Jimmy: "the trainers how they get notifications" — new
      // client assigned is one of the three events he wants pushed. Only
      // fires on an actual change to a real trainer (not a no-op re-save,
      // not unassigning) — notifyTrainer itself is a safe no-op for the
      // Self-Training bucket row since it never has a real login.
      if (trainerId && trainerId !== prevTrainerId) notifyTrainer(trainerId, `${cp.client_name} was assigned to you.`);
    }

    async function handleUpdateGoal(id, daysPerWeek) {
      const cp = resolveClientById(id);
      if (!cp) return;
      setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, days_per_week: daysPerWeek } : p)));
      if (sb) await sb.from("client_profiles").update({ days_per_week: daysPerWeek }).eq("id", cp.id);
      // This "Trains/week" dropdown is a separate control from the generic
      // EditableStat fields above (predates them) — it was missed when the
      // BMR/target recalc-on-edit fix went in, so activity level never
      // refreshed when someone changed training days here (Sept 6 2026 deep
      // bug search).
      recalcBmrAndTargets(cp.user_id, cp.client_name, {
        weight: cp.weight_kg, height: cp.height_cm, age: cp.age,
        gender: cp.gender, daysPerWeek, goal: cp.goal
      });
    }

    async function handleUpdateTotalDue(id, totalDue) {
      const cp = resolveClientById(id);
      if (!cp) return;
      setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, total_due: totalDue } : p)));
      if (sb) await sb.from("client_profiles").update({ total_due: totalDue }).eq("id", cp.id);
    }

    // Sept 18 2026 inspection fix: the onUnlockDietPlan callback below used
    // to compute "current total_due (from local state) + amount" and hand
    // that absolute number to handleUpdateTotalDue above — two near-
    // simultaneous unlocks for the same client (different devices/sessions)
    // could race, and whichever write landed last would silently clobber
    // the other's addition since neither read the OTHER write first. This
    // does the read+add atomically in one DB statement via an RPC instead,
    // with a same-shape fallback (a fresh read right before writing, not
    // whatever's already sitting in local state) if that RPC isn't deployed
    // yet — see supabase_increment_total_due.sql.
    async function handleIncrementTotalDue(id, amount) {
      const cp = resolveClientById(id);
      if (!cp) return;
      if (!sb) { setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, total_due: (Number(p.total_due) || 0) + amount } : p))); return; }
      const { data, error: rpcErr } = await sb.rpc("increment_client_total_due", { target_client_id: cp.id, amount });
      if (!rpcErr && data != null) {
        setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, total_due: Number(data) } : p)));
        return;
      }
      const { data: freshRow } = await sb.from("client_profiles").select("total_due").eq("id", cp.id).maybeSingle();
      const newTotal = (Number(freshRow && freshRow.total_due) || 0) + amount;
      await sb.from("client_profiles").update({ total_due: newTotal }).eq("id", cp.id);
      setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, total_due: newTotal } : p)));
    }

    async function handleUpdateProfileField(id, field, value) {
      const cp = resolveClientById(id);
      if (!cp) return;
      const prevValue = cp[field];
      setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, [field]: value } : p)));
      if (sb) {
        const { error: err } = await sb.from("client_profiles").update({ [field]: value }).eq("id", cp.id);
        // Sept 8 2026: revert on a failed save instead of leaving the
        // unsaved value showing — same fix as the trainer/client weight and
        // My Profile edit paths, applied here for consistency.
        if (err) {
          setProfiles((prev) => prev.map((p) => (p.id === cp.id ? { ...p, [field]: prevValue } : p)));
          return;
        }
      }
      // Keep BMR/macro targets fresh when a manager edits a client's body
      // stats on her behalf too, not just when she edits them herself.
      if (["weight_kg", "height_cm", "age", "gender", "days_per_week", "goal"].includes(field)) {
        const updated = { ...cp, [field]: value };
        recalcBmrAndTargets(updated.user_id, updated.client_name, {
          weight: updated.weight_kg, height: updated.height_cm, age: updated.age,
          gender: updated.gender, daysPerWeek: updated.days_per_week, goal: updated.goal
        });
      }
    }

  return {
    confirmDialog, setConfirmDialog, balanceFor,
    handleDeleteClient, handleDeletePayment, handleClearWorkouts,
    handleAssignTrainer, handleUpdateGoal,
    handleUpdateTotalDue, handleIncrementTotalDue, handleUpdateProfileField,
  };
}
