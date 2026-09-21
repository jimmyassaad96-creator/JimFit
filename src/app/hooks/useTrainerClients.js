import { useState } from "react";
import { sb } from "../../platform/supabase.js";
import { recalcBmrAndTargets } from "../../data/recalcBmrAndTargets.js";

/**
 * A trainer's view of one of their clients: which client is open, the fields
 * they may edit on that client, and the running balance owed.
 *
 * handleIncrementTotalDue and handleUpdateTotalDue write what a client owes,
 * so they go through the same increment RPC the owner side uses rather than a
 * direct column write.
 */
export function useTrainerClients({
  profiles, setProfiles, setAllPayments,
  resolveClientById, paidByUserId, paidByNameNoUserId,
}) {
    const [selectedClient, setSelectedClient] = useState(null);

    // All three now take the roster row's id — see resolveClientById above.
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
      // Keep BMR/macro targets fresh when a trainer edits a client's body
      // stats on her behalf too, not just when she edits them herself.
      if (["weight_kg", "height_cm", "age", "gender", "days_per_week", "goal"].includes(field)) {
        const updated = { ...cp, [field]: value };
        recalcBmrAndTargets(updated.user_id, updated.client_name, {
          weight: updated.weight_kg, height: updated.height_cm, age: updated.age,
          gender: updated.gender, daysPerWeek: updated.days_per_week, goal: updated.goal
        });
      }
    }

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

    function goBackToRoster() {
      setSelectedClient(null);
      if (sb) {
        sb.from("client_profiles").select("*").eq("trainer_id", trainer.id).eq("is_trainer_self_log", false).then(({ data, error }) => {
          if (error || !data) return;
          setProfiles(data);
          const userIds = data.map((p) => p.user_id).filter(Boolean);
          if (userIds.length === 0) { setAllPayments([]); return; }
          sb.from("client_payments").select("*").in("user_id", userIds).then(({ data: pData, error: pErr }) => { if (!pErr && pData) setAllPayments(pData); });
        });
      }
    }

  return {
    selectedClient, setSelectedClient,
    handleUpdateGoal, handleUpdateTotalDue, handleIncrementTotalDue,
    handleUpdateProfileField, balanceFor, goBackToRoster,
  };
}
