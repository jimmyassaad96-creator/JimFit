// The workout entry sheet, moved out of TrainingLog verbatim.
//
// Nearly everything it reads comes from useWorkoutEntryForm, so that whole
// result arrives as one object; ui carries the handful the component owns.
import { e } from "../shared/react.js";
import { guessMuscleGroup, musclesForWorkoutTitle } from "../domain/group3.js";
import { summarizeSetsForFlash } from "../domain/group4.js";
import { MUSCLE_GROUPS, WORKOUT_TITLES } from "../domain/muscles.js";
import { InjuryReminderBanner } from "../modules/notifications/index.js";
import { VoiceConfirmPopup } from "../modules/voice/index.js";
import { fmtDateMed } from "../shared/lib/format.js";
import { C, styles } from "../shared/theme.js";
import { Icon } from "../shared/ui/Icon.js";
import { Select } from "../shared/ui/group1.js";
import { ExercisePicker } from "../shared/widgets/ExercisePicker.js";
import { SmartVoiceEntryButton } from "../shared/widgets/SmartVoiceEntryButton.js";

export function WorkoutEntrySheet({ entryForm, ui }) {
  const {
    addSetRow, applyQuickEntry, closeSheet, confirmSetIdx, date,
    editingId, exercise, handleSave, isBodyweight, isTimed, muscleGroup,
    muscleTouched, quickEntry, quickEntryError, removeSetRow, savedFlash,
    savedFlashText, saving, sessionTitle, setConfirmSetIdx, setDate,
    setIsBodyweight, setIsTimed, setMuscleGroup, setQuickEntry,
    setSessionTitle, setSets, setTitleStepDone, setVoiceConfirmPending,
    sets, showForm, titleStepDone, updateSetRow, voiceConfirmPending,
  } = entryForm;
  const {
    unit, userId,
  } = ui;

  return (
      showForm && e("div", { style: styles.overlay, onClick: closeSheet },
        e("div", { style: styles.sheet, onClick: (ev) => ev.stopPropagation() },
          e("div", { style: styles.sheetHeader },
            e("span", { style: styles.exSheetTitle }, editingId ? "Edit exercise" : "New exercise"),
            e("button", { style: styles.closeBtn, onClick: closeSheet }, e(Icon, { name: "x", size: 18 }))
          ),
          e(SmartVoiceEntryButton, {
            onParsed: (result) => {
              let gotExercise = false, gotSets = false;
              if (result.workoutTitle) setSessionTitle(result.workoutTitle);
              if (result.exerciseName) { setExercise(result.exerciseName); if (!muscleTouched) setMuscleGroup(guessMuscleGroup(result.exerciseName)); gotExercise = true; }
              if (Array.isArray(result.sets) && result.sets.length) {
                setSets(result.sets.map((s) => ({ reps: s.reps != null ? String(s.reps) : "", weight: s.weight != null ? String(s.weight) : "", rest: s.rest != null ? String(s.rest) : "" })));
                gotSets = true;
              }
              // Sept 18 2026, Jimmy: see the matching note on ClientLogPanel
              // — voice fills the fields but never saves on its own; this
              // just raises the review card below.
              if (gotExercise && gotSets && !editingId) setVoiceConfirmPending(true);
            }
          }),
          // Sept 18 2026, Jimmy: see the matching note on ClientLogPanel —
          // VoiceConfirmPopup renders as a real centered popup over this
          // sheet, one labeled row per field so everything (workout,
          // exercise, sets) can be checked before it saves.
          voiceConfirmPending && e(VoiceConfirmPopup, {
            fields: [
              { label: "Workout", value: sessionTitle.trim() || "—" },
              { label: "Exercise", value: exercise.trim() || "—" },
              { label: "Sets", value: summarizeSetsForFlash(sets.map((s) => ({ reps: Number(s.reps) || 0, weight: isBodyweight ? 0 : Number(s.weight) || 0, duration: Number(s.reps) || 0, isBodyweight })).filter((s) => (isTimed ? s.duration > 0 : s.reps > 0)), isTimed) || "No sets heard" }
            ],
            saving,
            onConfirm: () => { setVoiceConfirmPending(false); handleSave(true, true); },
            onDiscard: () => { setVoiceConfirmPending(false); setExercise(""); setMuscleTouched(false); setSets([{ reps: "", weight: "", rest: "" }]); }
          }),
          // Sept 18 2026, Jimmy: see the matching note on ClientLogPanel —
          // Date now gets the same formSection card as the other sections
          // in this sheet instead of sitting bare, AND the same invisible-
          // input-over-a-styled-box trick as BodyAssessment's date field so
          // the native date control's own rendering doesn't poke past the
          // card.
          e("div", { style: { ...styles.formSection, marginTop: 14 } },
            e("label", { style: { ...styles.formLabel, marginTop: 0 } }, "Date"),
            e("div", { style: { position: "relative" } },
              e("div", { style: { ...styles.input, display: "flex", alignItems: "center", pointerEvents: "none", color: date ? C.ink : C.ink3 } },
                date ? fmtDateMed(date) : "Pick a date"
              ),
              e("input", {
                type: "date", value: date, onChange: (ev) => setDate(ev.target.value),
                style: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, padding: 0, margin: 0, cursor: "pointer" }
              })
            )
          ),
          // Sept 11 2026, Jimmy: brand pass — Workout title / Exercise+Muscle
          // group / Quick entry+Sets are now their own rounded formSection
          // cards instead of one continuous stack of labeled fields, and
          // the title pills switched from the plain demoToggleBtn treatment
          // to the same browseChip/browseChipActive gradient used for goal
          // chips on Diet/Programs.
          // Sept 18 2026, Jimmy: "see the workout title once" — once
          // titleStepDone (set on "Save & add another" / "Add exercise" from
          // an existing card), this collapses to a one-line summary instead
          // of re-showing the full picker for every exercise in the session.
          titleStepDone
            ? e("div", { style: { ...styles.formSection, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
                e("div", { style: { minWidth: 0 } },
                  e("div", { style: { ...styles.formLabel, marginTop: 0, marginBottom: 2 } }, "Workout"),
                  e("div", { style: { fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, sessionTitle.trim() || "No title")
                ),
                e("button", { type: "button", style: { ...styles.demoLinkBtn, marginTop: 0, flexShrink: 0 }, onClick: () => setTitleStepDone(false) }, "Change")
              )
            : e("div", { style: styles.formSection },
                e("label", { style: { ...styles.formLabel, marginTop: 0 } }, "Workout title (optional)"),
                // See the matching note on ClientLogPanel's own title field above.
                e("div", { style: styles.chipScrollRow },
                  WORKOUT_TITLES.map((t) => e("button", {
                    key: t, type: "button",
                    style: { ...styles.browseChip, flexShrink: 0, scrollSnapAlign: "start", padding: "7px 13px", fontSize: 11.5, ...(sessionTitle.trim().toLowerCase() === t.toLowerCase() ? styles.browseChipActive : {}) },
                    onClick: () => setSessionTitle(t)
                  }, t))
                ),
                // Sept 10 2026, Jimmy: see the matching note on ClientLogPanel's
                // own title field — removed the native <input list>/<datalist>
                // combo (its dropdown hides once the text exactly matches an
                // option, forcing a clear-and-retype to see it again); the pill
                // row above already covers the full list without that quirk.
                e("input", { type: "text", value: sessionTitle, placeholder: "Or type a custom title", onChange: (ev) => setSessionTitle(ev.target.value), style: { ...styles.input, marginTop: 10 } })
              ),
          e("div", { style: styles.formSection },
            e("label", { style: { ...styles.formLabel, marginTop: 0 } }, "Exercise"),
            e(InjuryReminderBanner, { userId }),
            e(ExercisePicker, {
              value: exercise, placeholder: "Search exercises… e.g. Bench Press",
              onSelect: (name, mg) => { setExercise(name); if (!muscleTouched) setMuscleGroup(mg); },
              scopeMuscles: musclesForWorkoutTitle(sessionTitle), scopeLabel: sessionTitle.trim(),
              showMic: false
            }),
            e("label", { style: styles.formLabel }, "Muscle group"),
            e(Select, { value: muscleGroup, onChange: (v) => { setMuscleGroup(v); setMuscleTouched(true); }, options: MUSCLE_GROUPS, style: { width: "100%" } })
          ),
          e("div", { style: styles.formSection },
            e("label", { style: { ...styles.formLabel, marginTop: 0 } }, "Quick entry (optional)"),
            e("div", { style: { display: "flex", gap: 8 } },
              e("input", {
                style: { ...styles.input, flex: 1 }, placeholder: "e.g. 3x8 or 3x8x60",
                value: quickEntry,
                onChange: (ev) => { setQuickEntry(ev.target.value); if (quickEntryError) setQuickEntryError(""); },
                onKeyDown: (ev) => { if (ev.key === "Enter") { ev.preventDefault(); applyQuickEntry(); } }
              }),
              e("button", { type: "button", style: styles.quickEntryApplyBtn, onClick: applyQuickEntry }, "Apply")
            ),
            quickEntryError && e("span", { style: styles.inlineError }, quickEntryError),
            e("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 16 } },
              e("label", { style: { ...styles.formLabel, marginTop: 0, marginBottom: 0 } }, "Sets"),
              e("div", { style: { display: "flex", gap: 6 } },
                e("button", {
                  type: "button",
                  style: { ...styles.demoToggleBtn, marginTop: 0, ...(isTimed ? { background: C.brandSoft, color: C.brand, borderColor: C.brand } : {}) },
                  onClick: () => setIsTimed((v) => !v)
                }, e(Icon, { name: "clock", size: 12 }), " Timed"),
                e("button", {
                  type: "button",
                  style: { ...styles.demoToggleBtn, marginTop: 0, ...(isBodyweight ? { background: C.brandSoft, color: C.brand, borderColor: C.brand } : {}) },
                  onClick: () => setIsBodyweight((v) => !v)
                }, "Bodyweight")
              )
            ),
            e("div", { style: { ...styles.setRows, marginTop: 8 } },
              e("div", { style: { ...styles.setRowHeader, gridTemplateColumns: isBodyweight ? "26px 1fr 1fr 34px" : "26px 1fr 1fr 1fr 34px" } },
                e("span", { style: styles.setColLabel }, "SET"),
                e("span", { style: styles.setColLabel }, isTimed ? "SECONDS" : "REPS"),
                !isBodyweight && e("span", { style: styles.setColLabel }, `WEIGHT (${unit.toUpperCase()})`),
                e("span", { style: styles.setColLabel }, "REST (S)"),
                e("span", null)
              ),
              // Sept 12 2026, Jimmy: "not only the delete the shape when
              // they log exercises" — same bigger red-tinted delete target
              // and inline "are you sure" as the read-only log card, right
              // here in the set-editing rows too. Editing an already-logged
              // exercise (editingId set) still asks first; a brand-new,
              // not-yet-saved draft removes instantly, same as before.
              sets.map((s, i) => {
                if (confirmSetIdx === i) {
                  const amountStr = isTimed ? `${s.reps || "0"}s` : `${s.reps || "0"} × ${isBodyweight ? "Bodyweight" : `${s.weight || "0"}${unit}`}`;
                  return e("div", { key: i, style: { ...styles.setListRow, ...styles.setListRowActive } },
                    e("span", { style: styles.setIndex }, i + 1),
                    e("div", { style: { flex: 1, minWidth: 0 } },
                      e("div", { style: styles.setListTextStrike }, amountStr),
                      e("span", { style: styles.deleteConfirmText }, "Delete this set? Can't be undone.")
                    ),
                    e("div", { style: { display: "flex", gap: 6, flexShrink: 0 } },
                      e("button", { type: "button", style: styles.setConfirmCancelBtn, onClick: () => setConfirmSetIdx(null) }, "Cancel"),
                      e("button", { type: "button", style: styles.setConfirmDangerBtn, onClick: () => { removeSetRow(i); setConfirmSetIdx(null); } }, "Delete")
                    )
                  );
                }
                return e("div", { key: i, style: { ...styles.setRow, gridTemplateColumns: isBodyweight ? "26px 1fr 1fr 34px" : "26px 1fr 1fr 1fr 34px" } },
                  e("span", { style: styles.setIndex }, i + 1),
                  e("input", { type: "number", min: "0", value: s.reps, onChange: (ev) => updateSetRow(i, "reps", ev.target.value), style: styles.setInput, placeholder: isTimed ? "30" : "8" }),
                  !isBodyweight && e("input", { type: "number", min: "0", step: "0.5", value: s.weight, onChange: (ev) => updateSetRow(i, "weight", ev.target.value), style: styles.setInput, placeholder: "60" }),
                  e("input", { type: "number", min: "0", value: s.rest, onChange: (ev) => updateSetRow(i, "rest", ev.target.value), style: styles.setInput, placeholder: "90" }),
                  e("button", {
                    type: "button",
                    style: { ...styles.setDeleteBtn, ...(sets.length === 1 ? styles.setDeleteBtnDisabled : {}) },
                    disabled: sets.length === 1,
                    onClick: () => { if (editingId) setConfirmSetIdx(i); else removeSetRow(i); },
                    "aria-label": "Remove set"
                  }, e(Icon, { name: "trash", size: 14 }))
                );
              })
            ),
            e("button", { style: styles.addSetBtn, onClick: addSetRow }, e(Icon, { name: "plus", size: 13, strokeWidth: 3 }), "Add set")
          ),
          // Sept 14 2026, Jimmy: "i want to be able to save as many
          // exercises as i want its hard to record each exercise and save
          // entry then open a new tab" — "Save & add another" saves this
          // exercise and keeps the sheet open with a fresh form (date +
          // workout title kept) instead of closing it, so a whole session
          // can be logged back to back. Only makes sense for a brand-new
          // entry, not while editing an existing one.
          !editingId && e("button", {
            style: { ...styles.exSheetSaveAddAnotherBtn, ...(saving ? styles.btnDisabled : {}) },
            onClick: () => handleSave(true), disabled: saving
          }, e(Icon, { name: "plus", size: 15, strokeWidth: 3 }), saving ? "Saving…" : "Save & add another"),
          savedFlash && e("div", { style: { display: "flex", alignItems: "center", gap: 6, color: C.good, fontSize: 12.5, fontWeight: 600, marginTop: 10 } },
            e(Icon, { name: "check", size: 14, color: C.good }), savedFlashText ? `Saved: ${savedFlashText}` : "Added — log the next exercise below."
          ),
          // Sept 11 2026, Jimmy: "no back arrow to go back" — same fix as
          // the other copy of this sheet: a back-styled Cancel next to Save
          // so leaving doesn't mean scrolling back up to the header's X.
          e("div", { style: { display: "flex", gap: 8, marginTop: 10, alignItems: "center" } },
            e("button", { style: { ...styles.exSheetSaveBtn, marginTop: 0, flex: 1, ...(saving ? styles.btnDisabled : {}) }, onClick: () => handleSave(false), disabled: saving }, e(Icon, { name: "flame", size: 16 }), saving ? "Saving…" : editingId ? "Save changes" : "Finish & close"),
            e("button", { style: { ...styles.demoLinkBtn, marginTop: 0, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }, onClick: closeSheet }, e(Icon, { name: "back", size: 13 }), "Cancel")
          )
        )
      )
  );
}
