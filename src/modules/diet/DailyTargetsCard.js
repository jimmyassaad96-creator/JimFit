// The "Food log" view of the Diet tab, moved out of DietPanel verbatim.
//
// Same shape as DietPlanSection: hook results arrive as objects and are
// destructured back to the names the markup already used.
import React from "react";
import { e } from "../../shared/react.js";
import { macroHit } from "../../domain/group3.js";
import { MacroStatusRow, macroDeltaTag } from "./group1.js";
import { fmtDate, fmtDateMed } from "../../shared/lib/format.js";
import { C, styles, withAlpha } from "../../shared/theme.js";
import { Icon } from "../../shared/ui/Icon.js";

export function DailyTargetsCard({ foodLog, dietPlan, ui }) {
  const {
    addingWater, confirmDeleteLogId, confirmResetWater, deletingLogId,
    handleAddWater, handleDeleteLog, handleResetWater, handleSaveTodayLog,
    logCalories, logCarbs, logDate, logFat, logProtein, logs, selectedLog,
    setConfirmDeleteLogId, setConfirmResetWater, setLogCalories,
    setLogCarbs, setLogDate, setLogFat, setLogProtein,
  } = foodLog;

  const {
    allMacrosHit, canManage, effCalories, effCarbs, effFat, effProtein,
    effWater, error, hasAnyTarget, saving, selfLog, today, todayHits,
    trainerLocked,
  } = ui;

  return e(React.Fragment, null,
      // Sept 12 2026, Jimmy: "make this section more like app branded on
      // todays log" — this manual entry card now uses the same soft
      // brand-gradient treatment as the Log tab's "Today" card and the
      // Energy balance card above it, instead of a plain neutral box, with
      // rounder/tinted inputs and pill buttons matching that same family.
      e("div", { style: { ...styles.card, marginTop: 22, marginBottom: 4, background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.14)}, ${withAlpha(C.brand, 0.04)})`, border: `1px solid ${withAlpha(C.brand, 0.35)}` } },
        e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 } },
          e("span", { style: styles.todayCardLabel }, logDate === today ? "Today" : fmtDate(logDate)),
          e("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            e("input", { style: { ...styles.input, width: "auto", padding: "8px 12px", fontSize: 12.5, fontWeight: 600, borderRadius: 20, border: `1px solid ${withAlpha(C.brand, 0.4)}`, background: C.card }, type: "date", value: logDate, max: today, onChange: (ev) => setLogDate(ev.target.value) }),
            logDate !== today && e("button", { type: "button", style: styles.energyPillBtn, onClick: () => setLogDate(today) }, "Today")
          )
        ),
        // Sept 19 2026 inspection fix: this banner used to live inside the
        // hasAnyTarget branch below, so an error from History's delete (or
        // water-add/reset) had nowhere to render once every target got
        // cleared — the row/count would correctly revert, just with zero
        // visible explanation why. Hoisted above the branch so it's always
        // mounted regardless of which one shows.
        error && e("div", { style: { ...styles.errorBanner, marginTop: 12 } }, e(Icon, { name: "x", size: 13, color: C.critical }), error),
        !hasAnyTarget
          // logs.length > 0 only happens here if a target existed at some
          // point (it's the only way a diet_logs row with real numbers gets
          // created) and was since removed — e.g. a trainer unassigned the
          // plan. Without this branch the copy read as if nothing had ever
          // been logged, directly above a History list proving otherwise.
          ? e("div", { style: { ...styles.setupNotice, marginTop: 12 } }, e(Icon, { name: "alert", size: 14, color: C.ink3 }), logs.length > 0
              ? "Add a daily target above to keep tracking new entries against it — your past logs below aren't affected."
              : "Set at least one daily target above before logging intake.")
          : e(React.Fragment, null,
              e("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 } },
                e("input", { style: styles.setInput, type: "number", placeholder: "Calories", value: logCalories, onChange: (ev) => setLogCalories(ev.target.value) }),
                e("input", { style: styles.setInput, type: "number", placeholder: "Protein (g)", value: logProtein, onChange: (ev) => setLogProtein(ev.target.value) }),
                e("input", { style: styles.setInput, type: "number", placeholder: "Carbs (g)", value: logCarbs, onChange: (ev) => setLogCarbs(ev.target.value) }),
                e("input", { style: styles.setInput, type: "number", placeholder: "Fat (g)", value: logFat, onChange: (ev) => setLogFat(ev.target.value) })
              ),
              // Sept 8 2026, Jimmy: from a trainer/manager's own view of a
              // real client (canManage && !selfLog — a trainer logging his
              // own self-train diet keeps the client-facing wording), this
              // button reads as setting what the client needs to hit that
              // day rather than "logging a day" on the trainer's own behalf.
              e("button", { style: { ...styles.saveBtn, marginTop: 14, ...(saving ? styles.btnDisabled : {}) }, disabled: saving, onClick: handleSaveTodayLog },
                saving ? "Saving…" : (canManage && !selfLog
                  ? (selectedLog ? "Update target to hit" : "Set target to hit")
                  : (selectedLog ? "Update this day's log" : "Log intake for this date"))
              ),
              // trainerLocked: this compares logged intake against plan.calories
              // etc — exactly the numbers being paywalled above, so it has to
              // stay hidden too (Sept 6 2026, caught this leak on review — the
              // targets card said "locked" but logging today's food here would
              // have quietly shown the real target numbers right next to it).
              !trainerLocked && todayHits.length > 0 && e("div", { style: { marginTop: 14 } },
                e("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 } },
                  e("span", { style: { ...styles.goalChip, ...(allMacrosHit ? styles.goalChipGood : styles.goalChipBad) } }, allMacrosHit ? "Hitting macros" : "Off target")
                ),
                e("div", { style: styles.macroStatusGrid },
                  e(MacroStatusRow, { label: "Calories", suffix: " kcal", actual: selectedLog && selectedLog.calories, target: effCalories, tolerancePct: 0, floorOnly: false }),
                  e(MacroStatusRow, { label: "Protein", suffix: " g", actual: selectedLog && selectedLog.protein, target: effProtein, tolerancePct: 0, floorOnly: true }),
                  e(MacroStatusRow, { label: "Carbs", suffix: " g", actual: selectedLog && selectedLog.carbs, target: effCarbs, tolerancePct: 0, floorOnly: false }),
                  e(MacroStatusRow, { label: "Fat", suffix: " g", actual: selectedLog && selectedLog.fat, target: effFat, tolerancePct: 0, floorOnly: false })
                )
              ),
            )
      ),
      // Sept 12 2026, restyle to match jimfit-flow_14.html's Diet tab
      // screenshot (Jimmy: "energy balance and water intake and history the
      // ones i sent") — Water intake pulled out of the manual-log card into
      // its own boxed "💧 Water intake" card (same header/title treatment
      // as Energy balance/Food log above), and History wrapped in one card
      // too, instead of a bare heading floating over separately-carded
      // rows. Same handleAddWater/handleResetWater/logs data and logic
      // throughout — purely a visual regrouping, matching the prototype's
      // stacked muscles-card layout.
      //
      // Sept 6 2026, Jimmy: water tracking (logging + its own target)
      // stays free even while locked — it isn't part of the paid diet
      // plan the way the calorie/macro targets are, it's just a basic
      // hydration goal off his weight.
      // Sept 8 2026, Jimmy: a trainer/manager viewing a real client
      // (canManage && !selfLog) can see how much water she's logged,
      // but no longer adds it on her behalf — only she (or a self-log
      // trainer logging his own) can. Same person gets the reset icon,
      // for a mis-tap (e.g. +750ml instead of +250ml).
      effWater != null && (() => {
        const canAddWater = !(canManage && !selfLog);
        return e("div", { style: styles.card },
          e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
            e("span", { style: styles.progressCardTitle }, "💧 Water intake")
          ),
          e("div", { style: styles.goalRow },
            // jimfit-flow_14.html restyle — plain "Today" (matching the
            // prototype's water-fill-label) instead of repeating "Water"
            // right under a card already titled "💧 Water intake".
            e("span", { style: styles.profileLabel }, logDate === today ? "Today" : fmtDateMed(logDate)),
            e("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
              // Sept 13 2026, Jimmy: "i want the exact same as the photo i
              // sent u" — jimfit-flow_15.html's Water intake row shows just
              // the running ml count (no "/ target" suffix, no fill bar
              // underneath); the water target itself keeps being tracked
              // and used everywhere else (waterHit, Daily targets), this is
              // only how today's row displays it. Count animates via
              // displayedWaterMl above instead of snapping straight to the
              // new total.
              e("span", { style: styles.profileValue }, `${displayedWaterMl} ml`),
              // Sept 8 2026: always show the reset icon (not just once
              // water > 0) — it was hiding itself at 0ml, the exact
              // moment right after a mis-tap has already been reset,
              // which made it look missing entirely. handleResetWater
              // already no-ops safely at 0.
              canAddWater && selectedLog && !confirmResetWater && e("button", { style: styles.deleteBtn, onClick: () => setConfirmResetWater(true), "aria-label": "Reset water" }, e(Icon, { name: "trash", size: 13 }))
            )
          ),
          confirmResetWater && e("div", { style: { ...styles.deleteConfirmBar, marginTop: 8 } },
            e("span", { style: styles.deleteConfirmText }, "Reset today's water back to 0ml?"),
            e("div", { style: { display: "flex", gap: 6, flexShrink: 0 } },
              e("button", { type: "button", style: styles.setConfirmCancelBtn, onClick: () => setConfirmResetWater(false) }, "Cancel"),
              e("button", { type: "button", style: styles.setConfirmDangerBtn, onClick: handleResetWater }, "Reset")
            )
          ),
          // jimfit-flow_14.html restyle — solid full-width block
          // buttons (matching the prototype's water-btn-row) instead
          // of outlined pills, same handleAddWater/+ml amounts. Sept 13
          // 2026: each button gets its own 💧 next to the amount too
          // ("the water drop to each one"), matching jimfit-flow_15.html.
          canAddWater && e("div", { style: { display: "flex", gap: 8, marginTop: 10 } }, [250, 500, 750].map((ml) => e("button", {
            key: ml, style: styles.waterBtn, disabled: addingWater, onClick: () => handleAddWater(ml)
          }, `💧 +${ml}ml`)))
        );
      })(),
      e("div", { style: styles.card },
        e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
          e("span", { style: styles.progressCardTitle }, "History")
        ),
        logs.length === 0
          // Sept 13 2026, Jimmy: "history is not looking the same" —
          // jimfit-flow_15.html's History empty state is just the italic
          // hint line (same treatment as the food log's empty state right
          // above it), no illustration above it like DietEmptyArt was
          // rendering here.
          ? e("p", { style: { ...styles.emptyText, fontStyle: "italic", fontSize: 13 } }, "No past days yet — once you log food or water, your history shows up here 📅")
          : e("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, logs.map((l) => {
            // trainerLocked: same leak as the "Today" section above — a
            // Hit/Missed chip or a delta tag next to a logged day still
            // reveals (or lets you back out) the paywalled target, so all of
            // that is nulled out here too until the plan's unlocked.
            const hits = trainerLocked ? [] : [
              macroHit(l.calories, effCalories, 0, false),
              macroHit(l.protein, effProtein, 0, true),
              macroHit(l.carbs, effCarbs, 0, false),
              macroHit(l.fat, effFat, 0, false)
            ].filter((h) => h !== null);
            const dayHit = hits.length > 0 && hits.every(Boolean);
            return e("div", { key: l.id, style: { ...styles.card, ...(l.date === logDate ? { border: `1px solid ${C.brand}` } : {}) } },
              e("div", { style: styles.cardHeader },
                e("div", { style: { ...styles.cardHeaderLeft, cursor: "pointer" }, onClick: () => setLogDate(l.date), title: "Tap to edit this day's log" },
                  e("span", { style: styles.exerciseName }, fmtDate(l.date)),
                  e("span", { style: styles.muscleSubText },
                    l.calories != null ? `${l.calories} kcal` : "—",
                    !trainerLocked && macroDeltaTag(l.calories, effCalories, 0, false),
                    " · P", l.protein != null ? l.protein : "—",
                    !trainerLocked && macroDeltaTag(l.protein, effProtein, 0, true),
                    " C", l.carbs != null ? l.carbs : "—",
                    !trainerLocked && macroDeltaTag(l.carbs, effCarbs, 0, false),
                    " F", l.fat != null ? l.fat : "—",
                    !trainerLocked && macroDeltaTag(l.fat, effFat, 0, false),
                    " · ", l.water || 0, "ml water"
                  )
                ),
                e("div", { style: styles.cardHeaderActions },
                  hits.length > 0 && e("span", { style: { ...styles.goalChip, ...(dayHit ? styles.goalChipGood : styles.goalChipBad) } }, dayHit ? "Hit" : "Missed"),
                  confirmDeleteLogId !== l.id && e("button", { style: styles.deleteBtn, disabled: deletingLogId === l.id, onClick: () => setConfirmDeleteLogId(l.id), "aria-label": "Delete log" }, e(Icon, { name: "trash", size: 14 }))
                )
              ),
              confirmDeleteLogId === l.id && e("div", { style: { ...styles.deleteConfirmBar, marginTop: 8 } },
                e("span", { style: styles.deleteConfirmText }, `Delete ${fmtDate(l.date)}'s log? This can't be undone.`),
                e("div", { style: { display: "flex", gap: 6, flexShrink: 0 } },
                  e("button", { type: "button", style: styles.setConfirmCancelBtn, onClick: () => setConfirmDeleteLogId(null) }, "Cancel"),
                  e("button", { type: "button", style: styles.setConfirmDangerBtn, disabled: deletingLogId === l.id, onClick: () => handleDeleteLog(l.id) }, deletingLogId === l.id ? "Deleting…" : "Delete")
                )
              )
            );
          }))
      )
  );
}
