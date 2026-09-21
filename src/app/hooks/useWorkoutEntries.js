import { useState, useEffect } from "react";
import { todayISO } from "../../shared/lib/dates.js";
import { sb } from "../../platform/supabase.js";

/**
 * The client's own logged workouts and the two filters over them.
 *
 * Only the data half. handleDelete, handleDeleteSet and handleUndoDelete stay
 * in the component for now: they reset the entry form as part of deleting, so
 * they depend on state that still lives there. They move when the form does.
 */
export function useWorkoutEntries({ clientName, profile, profileChecked }) {
    const [loaded, setLoaded] = useState(false);
    const [entries, setEntries] = useState([]);

    const [titleFilter, setTitleFilter] = useState("All");
    // Defaults to today (not "none") — this is the active-logging screen, so
    // today's workout (and its "Add exercise" button) should already be on
    // screen without needing to manually pick a date first.
    const [dateFilter, setDateFilter] = useState(todayISO());

    // Sept 9 2026, Jimmy: "can i have a button to undo what i deleted like
    // excel" — see the matching note on ClientLogPanel's own handleDelete.
    const [lastDeleted, setLastDeleted] = useState(null);

    useEffect(() => {
      if (!clientName || !sb) { setLoaded(true); return; }
      // Wait for the profile to actually load before fetching by client_id —
      // querying by client_name alone would risk pulling in another gym's
      // same-named client's history once RLS is scoped by client_id.
      if (!profileChecked) return;
      if (!profile || !profile.id) { setEntries([]); setLoaded(true); return; }
      // Newest day first, but oldest-logged-first within a day — see the
      // matching note on the Owner's allEntries fetch above; this is what
      // actually feeds a client's own Log tab, so this is the one fixing
      // "I see the exercise I ended the workout with first."
      sb.from("workout_entries").select("*").eq("client_id", profile.id).order("date", { ascending: false }).order("created_at", { ascending: true }).then(({ data, error: err }) => {
        if (!err && data) setEntries(data.map((r) => ({ id: r.id, date: r.date, exercise: r.exercise, muscleGroup: r.muscle_group, sets: r.sets, workoutTitle: r.workout_title, createdAt: r.created_at })));
        setLoaded(true);
      });
    }, [clientName, profileChecked, profile && profile.id]);

  return {
    entries, setEntries, loaded,
    titleFilter, setTitleFilter, dateFilter, setDateFilter,
    lastDeleted, setLastDeleted,
  };
}
