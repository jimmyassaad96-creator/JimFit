import { useState, useEffect, useRef, useMemo } from "react";
import { todayISO } from "../../shared/lib/dates.js";
import { sb } from "../../platform/supabase.js";
import { notifyTrainer } from "../../data/group1.js";
import { guessMuscleGroup, parseQuickSets } from "../../domain/group3.js";
import { summarizeSetsForFlash } from "../../domain/group4.js";

/**
 * The workout entry sheet: which entry is being edited, every field in it, the
 * save, and the deletes that reset it.
 *
 * The largest cluster in the codebase — twenty pieces of state and a save that
 * has to cope with editing, inserting above a sibling, voice-parsed sets and
 * "save & add another" all at once. It owns `error` and its auto-clear timer
 * because the sheet is where almost every one of them is raised.
 *
 * The delete handlers live here rather than with the entries data: deleting
 * also resets the form, so they read the fields above.
 */
export function useWorkoutEntryForm({
  clientName, profile, isManager,
  entries, setEntries, lastDeleted, setLastDeleted,
}) {
    const [showForm, setShowForm] = useState(false);

    const [editingId, setEditingId] = useState(null);
    // Sept 12 2026, Jimmy: "add an exercise below or above the other
    // exercise option" — see the matching note on ClientLogPanel's own
    // addBeforeId. Same idea here for the client's own self-logged workouts.
    const [addBeforeId, setAddBeforeId] = useState(null);
    const [date, setDate] = useState(todayISO());
    const [sessionTitle, setSessionTitle] = useState("");
    // Sept 18 2026, Jimmy: "see the workout title once if i saved and added
    // another exercise" — once a title's been picked for the exercise
    // currently being logged back-to-back (via "Save & add another" or
    // tapping "Add exercise" on an existing workout card), the full
    // title picker collapses to a small summary so it isn't re-asked for
    // every single exercise; it re-expands automatically for a genuinely
    // new session (resetForm — fresh "+ New exercise", or editing/
    // duplicating an entry) or if the client taps "Change".
    const [titleStepDone, setTitleStepDone] = useState(false);
    const [exercise, setExercise] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("Full Body");
    const [muscleTouched, setMuscleTouched] = useState(false);
    const [sets, setSets] = useState([{ reps: "", weight: "", rest: "" }]);
    // Sept 18 2026, Jimmy: "can we do an option before to save ... to see
    // what he will save because what it saved wrong" — see the matching
    // note on ClientLogPanel. A voice parse fills the fields and flips
    // this on instead of saving by itself; the review card in the sheet
    // JSX is the only thing that actually calls handleSave for a voice
    // entry.
    const [voiceConfirmPending, setVoiceConfirmPending] = useState(false);
    // Sept 12 2026, Jimmy: same per-set safer-delete as ClientLogPanel's
    // own New/Edit exercise sheet — see its comment.
    const [confirmSetIdx, setConfirmSetIdx] = useState(null);
    // Sept 10 2026, Jimmy: see the matching note on ClientLogPanel — same
    // Timed/Bodyweight toggles, mirrored here for the self-log form.
    const [isTimed, setIsTimed] = useState(false);
    const [isBodyweight, setIsBodyweight] = useState(false);
    const [quickEntry, setQuickEntry] = useState("");
    const [quickEntryError, setQuickEntryError] = useState("");
    const [saving, setSaving] = useState(false);
    const errorTimer = useRef(null);
    const [error, setError] = useState("");
    // Sept 14 2026, Jimmy: "i want to be able to save as many exercises as
    // i want its hard to record each exercise and save entry then open a
    // new tab" — "Save & add another" (next to the sheet's handleSave
    // callers below) keeps the sheet open after a save instead of closing
    // it, so a whole session's worth of exercises can be logged back to
    // back. Since the sheet no longer closes to confirm the save happened,
    // this is a brief "Added ✓" flash in its place — same auto-dismiss
    // pattern as `error` above (savedFlashTimer/clearTimeout/setTimeout).
    // Sept 18 2026: now carries a one-line summary of what actually got
    // saved (see summarizeSetsForFlash) so a voice auto-save — which
    // clears the fields the instant it fires — still leaves clear proof
    // behind of exactly what was logged.
    const savedFlashTimer = useRef(null);
    const [savedFlash, setSavedFlash] = useState(false);
    const [savedFlashText, setSavedFlashText] = useState("");
    const undoTimer = useRef(null);

    function updateSetRow(idx, field, val) {
      // Guard against min="0" being bypassed by typing a leading "-" directly
      // (HTML min/max are only advisory on number inputs) — strip it so a
      // negative rep/weight/rest can never reach a saved set.
      const sanitized = (field === "reps" || field === "weight" || field === "rest") ? val.replace(/^-+/, "") : val;
      setSets((p) => p.map((s, i) => (i === idx ? { ...s, [field]: sanitized } : s)));
    }
    // Sept 12 2026, Jimmy: "easier to add them" — most sets repeat the same
    // reps/weight/rest as the one before, so a new row now starts pre-filled
    // with the last set's values instead of blank. Still fully editable —
    // this just saves retyping "8, 60, 90" three times for a typical 3x8.
    function addSetRow() { setSets((p) => [...p, p.length > 0 ? { ...p[p.length - 1] } : { reps: "", weight: "", rest: "" }]); }
    function removeSetRow(idx) { setSets((p) => (p.length === 1 ? p : p.filter((_, i) => i !== idx))); }
    function handleExerciseChange(val) { setExercise(val); if (!muscleTouched) setMuscleGroup(guessMuscleGroup(val)); }
    // Sept 18 2026, Jimmy: resetForm now also clears sessionTitle/titleStepDone
    // — a genuinely fresh session (opened via "+ New exercise" after closing)
    // should ask for the workout title again, not silently carry over
    // whatever was last typed. See resetFormKeepSession below for the
    // opposite case (still the same session, title stays).
    function resetForm() { setDate(todayISO()); setSessionTitle(""); setTitleStepDone(false); setExercise(""); setMuscleGroup("Full Body"); setMuscleTouched(false); setSets([{ reps: "", weight: "", rest: "" }]); setIsTimed(false); setIsBodyweight(false); setQuickEntry(""); setQuickEntryError(""); setEditingId(null); setAddBeforeId(null); setVoiceConfirmPending(false); }
    // Sept 14 2026, Jimmy: the partial reset behind "Save & add another" —
    // same as resetForm but keeps Date and Workout title as they are (the
    // next exercise almost always belongs to the same session) and only
    // clears the exercise-specific fields, so logging a whole workout is
    // back-to-back instead of retyping the date/title each time. Sept 18
    // 2026: also collapses the title picker (titleStepDone) — the title's
    // already set for this session, so it doesn't need to be shown again
    // for every exercise; "Change" in the sheet re-expands it if needed.
    function resetFormKeepSession() { setTitleStepDone(true); setExercise(""); setMuscleGroup("Full Body"); setMuscleTouched(false); setSets([{ reps: "", weight: "", rest: "" }]); setIsTimed(false); setIsBodyweight(false); setQuickEntry(""); setQuickEntryError(""); setAddBeforeId(null); setVoiceConfirmPending(false); }
    function openNewExercise() { setEditingId(null); resetForm(); setShowForm(true); }
    function openAddToWorkout(d, title, beforeId = null) {
      // Same as "New exercise" but pre-fills the date and workout title from the
      // card that was tapped, so it lands in the same session instead of
      // needing the title retyped from scratch. beforeId, when set, is the
      // sibling exercise the new one should land right above.
      setEditingId(null);
      resetForm();
      setDate(d);
      setSessionTitle(title);
      setTitleStepDone(true);
      setAddBeforeId(beforeId);
      setShowForm(true);
    }
    function closeSheet() { setShowForm(false); setEditingId(null); setAddBeforeId(null); setVoiceConfirmPending(false); }
    function startEdit(entry) {
      setEditingId(entry.id);
      setAddBeforeId(null);
      setTitleStepDone(false);
      setDate(entry.date);
      setSessionTitle(entry.workoutTitle || "");
      setExercise(entry.exercise);
      setMuscleGroup(entry.muscleGroup || "Full Body");
      setMuscleTouched(true);
      const timed = entry.sets.some((s) => s.isTimed);
      const bw = entry.sets.some((s) => s.isBodyweight);
      setIsTimed(timed);
      setIsBodyweight(bw);
      setSets(entry.sets.map((s) => ({ reps: String(timed ? (s.duration != null ? s.duration : s.reps) : s.reps), weight: String(s.weight), rest: s.rest != null ? String(s.rest) : "" })));
      setShowForm(true);
    }
    function startDuplicate(entry) {
      setEditingId(null);
      setAddBeforeId(null);
      setTitleStepDone(false);
      setDate(todayISO());
      setSessionTitle(entry.workoutTitle || "");
      setExercise(entry.exercise);
      setMuscleGroup(entry.muscleGroup || "Full Body");
      setMuscleTouched(true);
      const timed = entry.sets.some((s) => s.isTimed);
      const bw = entry.sets.some((s) => s.isBodyweight);
      setIsTimed(timed);
      setIsBodyweight(bw);
      setSets(entry.sets.map((s) => ({ reps: String(timed ? (s.duration != null ? s.duration : s.reps) : s.reps), weight: String(s.weight), rest: s.rest != null ? String(s.rest) : "" })));
      setShowForm(true);
    }

    // Sept 14 2026, Jimmy: "i want to be able to save as many exercises as
    // i want its hard to record each exercise and save entry then open a
    // new tab" — keepOpen (true from the new "Save & add another" button)
    // saves this exercise same as before, but leaves the sheet open with a
    // fresh exercise/sets form (date + workout title carried over) instead
    // of closing it, so a whole session gets logged back to back. Plain
    // "Save entry"/"Save changes" (keepOpen false/omitted) behaves exactly
    // as before.
    async function handleSave(keepOpen, fromVoice) {
      // Sept 10 2026, Jimmy: see the matching note on ClientLogPanel's own
      // handleSave — timed sets store `duration` instead of `reps`, and
      // bodyweight forces weight to 0 and tags the set.
      function cleanSetsFrom(setsArr) {
        return setsArr.map((s) => {
          const rest = s.rest ? Number(s.rest) : null;
          const weight = isBodyweight ? 0 : Number(s.weight);
          return isTimed
            ? { duration: Number(s.reps), weight, rest, isTimed: true, ...(isBodyweight ? { isBodyweight: true } : {}) }
            : { reps: Number(s.reps), weight, rest, ...(isBodyweight ? { isBodyweight: true } : {}) };
        }).filter((s) => (isTimed ? s.duration > 0 : s.reps > 0) && !Number.isNaN(s.weight) && s.weight >= 0);
      }
      let cleanSets = cleanSetsFrom(sets);
      // Sept 12 2026, Jimmy: "i cant save entry here" — turned out the Sets
      // grid was still empty placeholders because Quick entry was typed but
      // never applied (no tap on Apply, no Enter). Save used to fail
      // silently against that instead of just using what was typed — now
      // it falls back to parsing the quick-entry text itself, same as
      // Apply would, so typing it is enough.
      if (cleanSets.length === 0 && quickEntry.trim()) {
        const parsedFromQuickEntry = parseQuickSets(quickEntry);
        if (parsedFromQuickEntry) cleanSets = cleanSetsFrom(parsedFromQuickEntry);
      }
      // Sept 14 2026, Jimmy: "i click finish and close nothing happen" —
      // same fix as ClientLogPanel's own handleSave. After "Save & add
      // another" the form resets to a blank exercise, and tapping "Finish
      // & close" with nothing new typed used to hit the validation error
      // below instead of just closing — that error banner sits at the very
      // bottom of a long sheet, off-screen on a phone, so it looked like
      // the button did nothing. Nothing typed for a would-be new exercise
      // means nothing to validate or save — just close.
      const formIsEmpty = !exercise.trim() && !quickEntry.trim() && sets.every((s) => !String(s.reps).trim() && !String(s.weight).trim() && !String(s.rest).trim());
      if (!keepOpen && !editingId && formIsEmpty) { resetForm(); setShowForm(false); return; }
      if (!exercise.trim() || cleanSets.length === 0) {
        setError("Add an exercise and at least one valid set.");
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(""), 3000);
        return;
      }
      if (!sb) { setError("Backend not configured yet."); return; }
      setSaving(true);
      const payload = { date, exercise: exercise.trim(), muscle_group: muscleGroup, workout_title: sessionTitle.trim() || null, sets: cleanSets };
      // Sept 12 2026, Jimmy: "add an exercise below or above the other
      // exercise option" — see the matching note on ClientLogPanel's own
      // handleSave. Same synthetic-created_at trick here.
      let insertPayload = { ...payload, client_name: clientName, client_id: profile ? profile.id : null };
      if (!editingId && addBeforeId) {
        const siblings = entries
          .filter((x) => x.date === date && (x.workoutTitle || "") === (sessionTitle.trim() || ""))
          .slice()
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const idx = siblings.findIndex((x) => x.id === addBeforeId);
        if (idx !== -1) {
          const targetTs = new Date(siblings[idx].createdAt).getTime();
          const prevTs = idx > 0 ? new Date(siblings[idx - 1].createdAt).getTime() : null;
          const newTs = prevTs != null && targetTs - prevTs > 1 ? prevTs + Math.floor((targetTs - prevTs) / 2) : targetTs - 1000;
          insertPayload.created_at = new Date(newTs).toISOString();
        }
      }
      const { data, error: err } = editingId
        ? await sb.from("workout_entries").update(payload).eq("id", editingId).select()
        : await sb.from("workout_entries").insert([insertPayload]).select();
      setSaving(false);
      if (err || !data) {
        setError("Couldn't save. Try again.");
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(""), 3000);
        return;
      }
      const row = data[0];
      const mapped = { id: row.id, date: row.date, exercise: row.exercise, muscleGroup: row.muscle_group, sets: row.sets, workoutTitle: row.workout_title, createdAt: row.created_at };
      // Sept 18 2026, Jimmy: "a client who logged a workout ... trainer/
      // client to see also requests" — same shape as the check-in
      // notification further up this file, gated the same way (!isManager,
      // so a trainer/owner logging on a client's BEHALF via ClientLogPanel
      // never notifies themselves — this only fires for a real client
      // logging their own session). Only on a brand-new entry, not every
      // edit to an existing one's sets.
      if (!editingId && !isManager && profile && profile.trainer_id) {
        notifyTrainer(profile.trainer_id, `${clientName} logged "${row.exercise}"${sessionTitle.trim() ? ` (${sessionTitle.trim()})` : ""}.`);
      }
      setEntries((prev) => {
        if (editingId) return prev.map((x) => (x.id === editingId ? mapped : x));
        if (addBeforeId) {
          const idx = prev.findIndex((x) => x.id === addBeforeId);
          if (idx !== -1) { const next = [...prev]; next.splice(idx, 0, mapped); return next; }
        }
        // Append (not prepend) — see matching note on the manager-side handleSave above:
        // a newly logged exercise is the newest by created_at, so it belongs at the end.
        return [...prev, mapped];
      });
      if (keepOpen && !editingId) {
        const flashText = `${exercise.trim()} — ${summarizeSetsForFlash(cleanSets, isTimed)}`;
        resetFormKeepSession();
        clearTimeout(savedFlashTimer.current);
        setSavedFlashText(flashText);
        setSavedFlash(true);
        // Sept 18 2026, Jimmy: "I need to know that it is saved" — voice
        // saves get a longer flash than a manual tap since there's no
        // button-press to already confirm intent from.
        savedFlashTimer.current = setTimeout(() => setSavedFlash(false), fromVoice ? 4500 : 2000);
      } else {
        resetForm();
        setShowForm(false);
      }
    }

    // Sept 18 2026, Jimmy: "we can by voice to save and add another?" then
    // "I want to see it before it saved" then "can we do an option before
    // to save ... because what it saved wrong" — see the matching note on
    // ClientLogPanel. Voice no longer saves on its own at all; the review
    // card in the sheet JSX (right under the mic button) is the only path
    // from a voice parse to an actual save.

    async function handleDelete(id) {
      // Sept 9 2026, Jimmy: keep the row's array position too, not just the
      // row itself — restoring it later needs to land back exactly where it
      // was, not at the bottom of the list under other exercises.
      const idx = entries.findIndex((x) => x.id === id);
      const target = idx !== -1 ? entries[idx] : null;
      setEntries((prev) => prev.filter((x) => x.id !== id));
      clearTimeout(undoTimer.current);
      function scheduleUndo() {
        if (!target) return;
        setLastDeleted({ entry: target, index: idx });
        undoTimer.current = setTimeout(() => setLastDeleted(null), 6000);
      }
      if (!sb) { scheduleUndo(); return; }
      const { error: err } = await sb.from("workout_entries").delete().eq("id", id);
      if (err) {
        if (target) setEntries((prev) => { const next = [...prev]; next.splice(Math.min(idx, next.length), 0, target); return next; });
        setError("Couldn't delete that — try again.");
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(""), 3000);
        return;
      }
      scheduleUndo();
    }

    // Sept 12 2026, Jimmy: same per-set delete as ClientLogPanel's own
    // handleDeleteSet — see its comment.
    async function handleDeleteSet(entryId, setIdx) {
      const idx = entries.findIndex((x) => x.id === entryId);
      if (idx === -1) return;
      const target = entries[idx];
      if (!target.sets || target.sets.length <= 1) return;
      const newSets = target.sets.filter((_, i) => i !== setIdx);
      setEntries((prev) => prev.map((x) => (x.id === entryId ? { ...x, sets: newSets } : x)));
      if (!sb) return;
      const { error: err } = await sb.from("workout_entries").update({ sets: newSets }).eq("id", entryId);
      if (err) {
        setEntries((prev) => prev.map((x) => (x.id === entryId ? { ...x, sets: target.sets } : x)));
        setError("Couldn't delete that set — try again.");
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(""), 3000);
      }
    }

    async function handleUndoDelete() {
      const pending = lastDeleted;
      if (!pending) return;
      const { entry, index } = pending;
      clearTimeout(undoTimer.current);
      setLastDeleted(null);
      if (!sb) return;
      const payload = { date: entry.date, exercise: entry.exercise, muscle_group: entry.muscleGroup, workout_title: entry.workoutTitle || null, sets: entry.sets };
      const { data, error: err } = await sb.from("workout_entries").insert([{ ...payload, client_name: clientName, client_id: profile ? profile.id : null }]).select();
      if (err || !data) {
        setError("Couldn't undo that delete — try again.");
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(""), 3000);
        return;
      }
      const row = data[0];
      const mapped = { id: row.id, date: row.date, exercise: row.exercise, muscleGroup: row.muscle_group, sets: row.sets, workoutTitle: row.workout_title, createdAt: row.created_at };
      // See the matching note on ClientLogPanel's own handleUndoDelete —
      // reinserts at the original array position instead of appending.
      setEntries((prev) => { const next = [...prev]; next.splice(Math.min(index, next.length), 0, mapped); return next; });
    }
    function dismissUndo() { clearTimeout(undoTimer.current); setLastDeleted(null); }

    function applyQuickEntry() {
      const parsed = parseQuickSets(quickEntry);
      if (!parsed) { setQuickEntryError("Try “sets x reps” or “sets x reps x weight” — e.g. 3x8 or 3x8x60."); return; }
      setQuickEntryError("");
      setSets(parsed);
    }

  return {
    showForm, setShowForm, editingId, addBeforeId,
    date, setDate, sessionTitle, setSessionTitle,
    titleStepDone, setTitleStepDone,
    exercise, muscleGroup, setMuscleGroup, muscleTouched,
    sets, setSets, voiceConfirmPending, setVoiceConfirmPending,
    confirmSetIdx, setConfirmSetIdx, isTimed, setIsTimed,
    isBodyweight, setIsBodyweight, quickEntry, setQuickEntry, quickEntryError,
    applyQuickEntry,
    saving, error, setError, errorTimer, savedFlash, savedFlashText,
    updateSetRow, addSetRow, removeSetRow, handleExerciseChange,
    resetForm, resetFormKeepSession, openNewExercise, openAddToWorkout,
    closeSheet, startEdit, startDuplicate,
    handleSave, handleDelete, handleDeleteSet, handleUndoDelete, dismissUndo,
  };
}
