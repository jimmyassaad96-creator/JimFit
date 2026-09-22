import { useState, useMemo } from "react";
import { sb } from "../../../platform/supabase.js";
import { nextWeekLabel, parseWeekNumber } from "../../../domain/group3.js";

/**
 * The shared program library and its week/day structure: which programs exist,
 * their exercises, which week is open on each, and duplicating a program, a
 * week or a day.
 *
 * Self-contained — it needs nothing from the component, which is why it came
 * out in one piece. The exercise form is a separate cluster and stays behind.
 */
export function useProgramBuilder() {
    const [programs, setPrograms] = useState([]);
    const [exercisesByProgram, setExercisesByProgram] = useState({});
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState("");

    // Draft "how many weeks total" text per program, for the bulk "Generate
    // weeks from Week 1" action next to "Add a week" below.
    const [weekCountDrafts, setWeekCountDrafts] = useState({});
    // Sept 15 2026, Jimmy: "here i want the client to be able to tap on
    // every week like the program the trainer assign so he's doesnt have
    // to scroll all the way down" — same week-chip filter as
    // ClientCustomProgramCard/ClientProgramCard, but this editor lists
    // (and can have several) programs expanded at once, so the active
    // week has to be tracked per program id rather than a single value.
    const [activeWeekByProgram, setActiveWeekByProgram] = useState({});
    // Sept 15 2026, Jimmy: "worked but when i click duplicate make it more
    // understandable what its happening" — every "Duplicate" icon here
    // (program/week/day/exercise) just silently inserted a new row
    // somewhere, giving no sign anything happened — same complaint already
    // fixed once for the client-program builder's own duplicate-exercise
    // button (see justDuplicatedId there). Reusing that idea here for all
    // four duplicate actions: briefly highlight + auto-scroll to whatever
    // was just created, and — for day/week — jump the week-chip filter
    // straight to it so the new content isn't hidden behind an unrelated
    // filtered tab.
    const [justDuplicated, setJustDuplicated] = useState(null); // { type: "program"|"week"|"day"|"exercise", programId, key }

    // Sept 12 2026, Jimmy: "the programs is cluttered so i want to show only
    // [the name] and an arrow ... to press and see this description below" —
    // every browse card used to dump its full description AND (once unlocked)
    // its entire day-by-day breakdown on screen at once, for every program in
    // the library simultaneously. Now each card starts collapsed to just its
    // name; tapping the chevron reveals the rest. Per-card so browsing one
    // program open doesn't collapse another.
    const [expandedProgramIds, setExpandedProgramIds] = useState(() => new Set());

    // Sept 15 2026: groups by week_label first, then day_label within it —
    // see the ClientProgramCard weekGroups() above for why grouping by
    // day_label alone isn't safe once a program has more than one week
    // (two weeks reusing the same day label used to merge into one group).
    function weekGroups(programId) {
      const rows = exercisesByProgram[programId] || [];
      const byWeek = {};
      const order = [];
      rows.forEach((r) => {
        const wl = r.week_label || "Week 1";
        if (!byWeek[wl]) { byWeek[wl] = { days: {}, dayOrder: [] }; order.push(wl); }
        const wk = byWeek[wl];
        if (!wk.days[r.day_label]) { wk.days[r.day_label] = []; wk.dayOrder.push(r.day_label); }
        wk.days[r.day_label].push(r);
      });
      return order.map((label) => ({ label, days: byWeek[label].dayOrder.map((d) => ({ label: d, rows: byWeek[label].days[d] })) }));
    }

    // Copies a whole program (same style) into a brand-new program — every day and
    // exercise cloned along with it. Handy for using one program as a starting point
    // for a variation instead of retyping everything.
    async function handleDuplicateProgram(p) {
      if (!sb) return;
      setError("");
      const sourceExercises = exercisesByProgram[p.id] || [];
      const payload = { style: p.style, name: `${p.name} (copy)`, description: p.description || null, order_index: programs.length };
      const { data: newProgs, error: err } = await sb.from("training_programs").insert([payload]).select();
      if (err || !newProgs) { setError("Couldn't duplicate that program. Try again."); return; }
      const newProgram = newProgs[0];
      setPrograms((prev) => [...prev, newProgram]);
      // A brand-new card with nothing expanded/visible below it doesn't
      // look "duplicated" — open it and scroll to it right away.
      setExpandedProgramIds((prev) => { const next = new Set(prev); next.add(newProgram.id); return next; });
      setJustDuplicated({ type: "program", programId: newProgram.id, key: newProgram.id });
      if (sourceExercises.length === 0) {
        setExercisesByProgram((prev) => ({ ...prev, [newProgram.id]: [] }));
        return;
      }
      const exPayload = sourceExercises.map((ex) => ({
        program_id: newProgram.id,
        day_label: ex.day_label,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: ex.order_index
      }));
      const { data: newExRows, error: exErr } = await sb.from("program_exercises").insert(exPayload).select();
      if (exErr) { setError("Program duplicated, but copying its exercises failed. You can add them manually."); }
      setExercisesByProgram((prev) => ({ ...prev, [newProgram.id]: newExRows || [] }));
    }

    // Copies a single day's exercises into a brand-new day within the SAME
    // week, labeled "<original> (copy)" so it's easy to spot and rename.
    async function handleDuplicateDay(programId, weekLabel, dayLabel) {
      if (!sb) return;
      setError("");
      const existing = exercisesByProgram[programId] || [];
      const dayRows = existing.filter((r) => (r.week_label || "Week 1") === weekLabel && r.day_label === dayLabel);
      if (dayRows.length === 0) return;
      const newLabel = `${dayLabel} (copy)`;
      const payload = dayRows.map((ex, i) => ({
        program_id: programId,
        week_label: weekLabel,
        day_label: newLabel,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: i
      }));
      const { data, error: err } = await sb.from("program_exercises").insert(payload).select();
      if (err || !data) { setError(`Couldn't duplicate that day. Try again.${err && err.message ? ` (${err.message})` : ""}`); return; }
      setExercisesByProgram((prev) => ({ ...prev, [programId]: [...(prev[programId] || []), ...data] }));
      // Whatever week-chip filter is currently active might not include
      // this new day (it's a fresh day_label, so a per-day filter tab in
      // particular would hide it entirely) — reset to "All weeks"/"All
      // days" so the new day is guaranteed visible, then scroll to it.
      setActiveWeekByProgram((prev) => ({ ...prev, [programId]: "all" }));
      setJustDuplicated({ type: "day", programId, key: newLabel });
    }

    // Sept 15 2026, Jimmy: "in the general resistance training can we
    // duplicate the weeks depends on the program duration so the client can
    // log the weight weekly not only for one week" — clones every day/
    // exercise under one week into a brand-new week, labeled with the next
    // available "Week N" (see nextWeekLabel above). Manual, one week at a
    // time — the bulk version below (handleGenerateWeeks) does several at
    // once from a target total.
    async function handleDuplicateWeek(programId, weekLabel) {
      if (!sb) return;
      setError("");
      const weeks = weekGroups(programId);
      const week = weeks.find((w) => w.label === weekLabel);
      const rows = week ? week.days.flatMap((d) => d.rows) : [];
      if (rows.length === 0) return;
      const existing = exercisesByProgram[programId] || [];
      const newLabel = nextWeekLabel(weeks.map((w) => w.label));
      const payload = rows.map((ex, i) => ({
        program_id: programId,
        week_label: newLabel,
        day_label: ex.day_label,
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        order_index: existing.length + i
      }));
      const { data, error: err } = await sb.from("program_exercises").insert(payload).select();
      if (err || !data) {
        // Sept 15 2026, Jimmy (screenshot: "Couldn't duplicate that week.
        // Try again."): surfacing the actual Supabase error text here too
        // (and logging it) so a real failure is diagnosable from a
        // screenshot instead of just the generic message.
        console.error("handleDuplicateWeek failed:", err);
        setError(`Couldn't duplicate that week.${err && err.message ? ` (${err.message})` : " Try again."}`);
        return;
      }
      setExercisesByProgram((prev) => ({ ...prev, [programId]: [...(prev[programId] || []), ...data] }));
      // Jump straight to the brand-new week's tab so it's the thing on
      // screen right after tapping "Duplicate week," instead of leaving
      // whatever week was already filtered in place with no visible change.
      setActiveWeekByProgram((prev) => ({ ...prev, [programId]: newLabel }));
      setJustDuplicated({ type: "week", programId, key: newLabel });
    }

    // Sept 15 2026, Jimmy: the actual "depends on the program duration" ask
    // — a trainer types the program's real length (e.g. 12 for a 12-week
    // program) and this fills in every remaining week by copying Week 1's
    // days/exercises straight across, instead of duplicating one week at a
    // time by hand. Only adds what's missing: a program that already has,
    // say, 5 numbered weeks and a target of 12 only generates 6 through 12.
    async function handleGenerateWeeks(programId) {
      if (!sb) return;
      const target = parseInt(weekCountDrafts[programId], 10);
      if (!target || target < 1 || target > 52) { setError("Enter a program length between 1 and 52 weeks."); return; }
      const weeks = weekGroups(programId);
      if (weeks.length === 0) { setError("Add Week 1's days and exercises first, then generate the rest."); return; }
      const numbered = weeks.map((w) => parseWeekNumber(w.label)).filter((n) => n != null);
      const currentMax = numbered.length ? Math.max(...numbered) : weeks.length;
      if (target <= currentMax) { setError(`This program already has ${currentMax} week${currentMax === 1 ? "" : "s"}.`); return; }
      const template = weeks.find((w) => parseWeekNumber(w.label) === 1) || weeks[0];
      const templateRows = template.days.flatMap((d) => d.rows);
      if (templateRows.length === 0) { setError("Add exercises to Week 1 before generating more weeks."); return; }
      setError("");
      const existing = exercisesByProgram[programId] || [];
      const payload = [];
      let idx = existing.length;
      for (let n = currentMax + 1; n <= target; n++) {
        templateRows.forEach((ex) => {
          payload.push({
            program_id: programId,
            week_label: `Week ${n}`,
            day_label: ex.day_label,
            exercise: ex.exercise,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
            order_index: idx++
          });
        });
      }
      const { data, error: err } = await sb.from("program_exercises").insert(payload).select();
      if (err || !data) { setError(`Couldn't generate those weeks. Try again.${err && err.message ? ` (${err.message})` : ""}`); return; }
      setExercisesByProgram((prev) => ({ ...prev, [programId]: [...(prev[programId] || []), ...data] }));
      setWeekCountDrafts((prev) => ({ ...prev, [programId]: "" }));
    }

  return {
    programs, setPrograms, exercisesByProgram, setExercisesByProgram,
    loaded, setLoaded, error, setError,
    weekCountDrafts, setWeekCountDrafts,
    activeWeekByProgram, setActiveWeekByProgram,
    justDuplicated, setJustDuplicated,
    expandedProgramIds, setExpandedProgramIds,
    weekGroups,
    handleDuplicateProgram, handleDuplicateDay,
    handleDuplicateWeek, handleGenerateWeeks,
  };
}
