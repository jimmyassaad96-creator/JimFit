import { useState, useEffect } from "react";
import { sb } from "../../platform/supabase.js";
import { ensureOwnerTrainerRow, ensureSelfTrainRow } from "../../data/group1.js";

/**
 * Everything the owner dashboard reads in one pass: every client's workouts
 * and profile, the trainer roster, and both payment ledgers.
 *
 * The request fetchers are passed in rather than owned here so that one
 * refresh covers the queues too — they come from useCoachRequests, which is
 * called first for exactly that reason.
 */
export function useCoachData({
  fetchTrainerRequests, fetchDietPlanRequests, fetchProgramRequests,
  fetchFirstPaymentClaims,
}) {
    const [loading, setLoading] = useState(false);
    const [allEntries, setAllEntries] = useState([]);

    const [profiles, setProfiles] = useState([]);
    // ids of client_profiles rows excluded from `profiles` above because
    // is_trainer_self_log is true (a trainer's own personal tracking, not a
    // real client — see the fetch below). Needed separately because
    // `allEntries` is fetched globally (every workout_entries row, not just
    // this gym's real clients), and the roster builder below used to treat
    // any entry whose client_id didn't match a *visible* profile as
    // "unmatched legacy data" and synthesize a fake "Unassigned" client row
    // for it — which is exactly what a self-log row's own entries look like
    // once its profile is filtered out. Excluding these ids up front, before
    // that matching happens, is what actually stops a trainer's own workouts
    // from resurfacing as one of Jimmy's clients.
    const [selfLogClientIds, setSelfLogClientIds] = useState(() => new Set());
    const [trainers, setTrainers] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [allTrainerPayments, setAllTrainerPayments] = useState([]);

    useEffect(() => {
      if (!sb) return;
      setLoading(true);
      // Sorted newest day first, but oldest-logged-first *within* a day (see
      // the same secondary order on every workout_entries fetch) — otherwise
      // ties on date alone come back in whatever order Postgres feels like,
      // which is what made a day's exercise list look shuffled/reversed.
      sb.from("workout_entries").select("*").order("date", { ascending: false }).order("created_at", { ascending: true }).then(({ data, error }) => {
        if (!error && data) {
          // clientId carried through so local-state cleanup (delete/clear a
          // client) can filter by the real id instead of client_name — two
          // clients can share a display name, and name-based filtering would
          // wipe both of them locally. See handleDeleteClient/handleClearWorkouts.
          setAllEntries(data.map((r) => ({ id: r.id, date: r.date, exercise: r.exercise, muscleGroup: r.muscle_group, sets: r.sets, clientName: r.client_name, clientId: r.client_id || null, workoutTitle: r.workout_title, createdAt: r.created_at })));
        }
        setLoading(false);
      });
      sb.from("client_profiles").select("*").then(({ data, error }) => {
        // is_trainer_self_log rows are a real trainer's own personal
        // workout/diet tracking (Sept 5 2026 — see TrainerView's "My Log"/
        // "My Diet" tabs), not an actual client of anyone's — excluded here
        // at the source so it can never show up in Jimmy's rosters, self-
        // train billing, or any trainer's own client list, all of which
        // read from this same profiles state. Their ids are kept separately
        // (selfLogClientIds) so the roster builder below can also drop their
        // workout_entries rows, not just their profile — see that comment.
        if (!error && data) {
          setProfiles(data.filter((p) => !p.is_trainer_self_log));
          setSelfLogClientIds(new Set(data.filter((p) => p.is_trainer_self_log).map((p) => p.id)));
        }
      });
      Promise.all([ensureOwnerTrainerRow(), ensureSelfTrainRow()]).then(([ownerRow]) => {
        sb.from("trainers").select("*").order("name", { ascending: true }).then(({ data, error }) => {
          if (!error && data) setTrainers(data);
          else if (ownerRow) setTrainers([ownerRow]);
        });
      });
      sb.from("client_payments").select("*").then(({ data, error }) => {
        if (!error && data) setAllPayments(data);
      });
      sb.from("trainer_payments").select("*").then(({ data, error }) => {
        if (!error && data) setAllTrainerPayments(data);
      });
      fetchTrainerRequests();
      fetchDietPlanRequests();
      fetchProgramRequests();
      fetchFirstPaymentClaims();
    }, []);

  return {
    loading, allEntries, setAllEntries, profiles, setProfiles,
    selfLogClientIds, trainers, setTrainers,
    allPayments, setAllPayments, allTrainerPayments, setAllTrainerPayments,
  };
}
