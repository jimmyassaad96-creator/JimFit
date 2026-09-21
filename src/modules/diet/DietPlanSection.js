// The "My plan" view of the Diet tab, moved out of DietPanel verbatim.
//
// Each hook result arrives as one object and is destructured back to the
// names the markup already used — the alternative was ninety individual
// props, which is the same closure with more typing.
import React from "react";
import { e } from "../../shared/react.js";
import { DIET_PLAN_PRICE, SELF_TRAIN_MONTHLY_PRICE } from "../../domain/access.js";
import { goalLabel } from "../../domain/group2.js";
import { DIET_GOALS, MEAL_GEN_SWAPS } from "../../domain/nutrition.js";
import { CalorieCalculator } from "./CalorieCalculator.js";
import { DietTargetTile, MealGroupHeader, MealItemForm, MealItemRow, mealTheme } from "./group1.js";
import { fmtDate } from "../../shared/lib/format.js";
import { C, styles, withAlpha } from "../../shared/theme.js";
import { Icon } from "../../shared/ui/Icon.js";
import { Segmented, WhishPayBox } from "../../shared/ui/group1.js";
import { PaymentStatusStepper } from "../../shared/widgets/PaymentStatusStepper.js";
import { VoiceMicButton } from "../../shared/widgets/VoiceMicButton.js";

export function DietPlanSection({ dietPlan, foodLog, meals, dietTemplates, bodyInfo, purchase, ui }) {
  const {
    dietaryNotesDraft, editingDietaryNotes, editingMealPlan,
    handleCancelDietaryNotes, handleCancelMealPlan, handleSaveDietaryNotes,
    handleSaveMealPlan, mealPlanDraft, plan, savingDietaryNotes,
    setDietaryNotesDraft, setEditingDietaryNotes, setEditingMealPlan,
    setMealPlanDraft,
  } = dietPlan;

  const {
    addMealTarget, closeMealItemForm, editMealItemId, handleDeleteMealItem,
    handleSaveMealItem, mealGroups, mealItemError, mealItemForm,
    mealItemSaving, mealItemsLoaded, newMealOpen, openAddNewMeal,
    openAddToMeal, openEditMealItem, setMealItemForm,
  } = meals;
  const {
    assignedTemplate, dietPlanView, handlePickTemplate,
    handleSwitchTemplate, paidTemplates, resolvedMealGroups,
    setDietPlanView, setShowAssignedSwaps, setShowTemplatePicker,
    showAssignedSwaps, showInstantGenerator, showTemplatePicker,
    switchingToPaidId,
  } = dietTemplates;
  const {
    bodyInfoError, bodyInfoForm, editingBodyInfo, handleSubmitBodyInfo,
    latestAssessment, openBodyInfoEditor, setBodyInfoError, setBodyInfoForm,
    setEditingBodyInfo, setSkipBodyInfo, skipBodyInfo, submittingBodyInfo,
  } = bodyInfo;
  const {
    cancelingRequest, cancelingSwitch, confirmUnassignPlan,
    handleCancelRequest, handleCancelSwitch, handleNudgeTrainer,
    handleUnassignPlan, handleUnlockPlan, nudgeSent, requestingPlan,
    setConfirmUnassignPlan, setUnlockAmount, setUnlockDate, setUnlocking,
    unassigningPlan, unlockAmount, unlockDate, unlockError, unlockSaving,
    unlocking,
  } = purchase;
  const {
    canManage, isSelfTrain, selfLog, showTargets, userEmail, profile, userId, clientName,
    browsePlansRef, commitPlanField, commitPlanFields, effCalories,
    handleSwitchToPaidPlan, handleTrainerRequestPlan, hasTrainer,
    mealPlanRef, pendingRequest, pendingSwitchTemplate, purchaseLocked,
    renderInstantPlanSection, renderTemplateBrowser, templateMacroSummary,
    trainerLocked, trainerRestricted,
  } = ui;

  return e(React.Fragment, null,
      // Sept 13 2026, Jimmy: "diet plan looks i sent earlier ... like that"
      // — 3 equal GOAL/TRAINS-WK/BMR tiles matching jimfit-flow_15.html,
      // instead of one card with "Goal" on top and a 2x2 grid underneath.
      // Same profile.goal/days_per_week/latestAssessment.bmr data as
      // before — Body fat is no longer shown in this specific row (it's
      // still on file and still visible on the Assessments tab/body info
      // form, this just isn't the place for a 4th tile anymore).
      e("div", { style: { display: "flex", gap: 8 } },
        e("div", { style: styles.dietStatTile },
          e("span", { style: styles.dietStatTileLabel }, "🎯 Goal"),
          // profile.goal is free text and can run much longer than the
          // mockup's short "Muscle gain" — clamped to 3 lines so a long
          // goal doesn't blow out this tile's height next to Trains/wk
          // and BMR. Full text is unchanged/untruncated everywhere else
          // it's shown (e.g. the "Update my info" editor).
          e("span", { style: { ...styles.dietStatTileValue, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } }, (profile && profile.goal) || "—")
        ),
        e("div", { style: styles.dietStatTile },
          e("span", { style: styles.dietStatTileLabel }, "📅 Trains/wk"),
          e("span", { style: styles.dietStatTileValue }, `${(profile && profile.days_per_week) || 3}x`)
        ),
        e("div", { style: styles.dietStatTile },
          e("span", { style: styles.dietStatTileLabel }, "🔥 BMR"),
          e("span", { style: styles.dietStatTileValue }, latestAssessment && latestAssessment.bmr != null ? latestAssessment.bmr : "—")
        )
      ),
      // Sept 6 2026, Jimmy: "he can pay once and see all the targets no! i
      // want him the target he set first to see only for this and if he
      // wants to change he will pay" — this calculator lets you preview
      // every goal's numbers (Cut/Maintain/Lean bulk/Bulk) and instantly
      // overwrite the saved target for free. That's fine as a free staff
      // tool for a manager setting a REAL client's target (canManage &&
      // !selfLog), but it was also reachable by a selfLog trainer once
      // unlocked — letting him recompute and reapply a different target as
      // many times as he wants after paying once, defeating "pay per
      // plan." Excluded for selfLog entirely now, locked or not.
      canManage && !selfLog && !trainerLocked && (
        latestAssessment && latestAssessment.bmr != null
          ? e(CalorieCalculator, {
              latestAssessment, profile,
              onApply: (vals) => commitPlanFields({ calories: vals.calories, protein: vals.protein, carbs: vals.carbs, fat: vals.fat })
            })
          : e("div", { style: styles.setupNotice },
              e(Icon, { name: "alert", size: 14, color: C.ink3 }),
              "No body assessment with a BMR on file yet, so there's nothing to calculate from — add one on the Assessments tab to unlock the calorie calculator, or just set targets manually below."
            )
      ),
      e("div", { style: styles.sectionHead }, e("span", { style: styles.sectionTitle }, "Daily targets")),
      // Sept 6 2026, Jimmy: a trainer's own BMR (above) and day-to-day food
      // log stay free, but the CALCULATED targets are the paid product —
      // showing them for free gave him no reason to ever buy the plan. Same
      // request → WhishPayBox → wait-for-Jimmy-to-confirm flow a client
      // goes through; once this plan's marked unlocked, the real numbers
      // (and the meal plan below) show exactly as they did before this.
      // Sept 6 2026: simplified to a plain notice, no button here anymore —
      // the actual pick-a-plan-and-pay flow now lives entirely in the Meal
      // plan section below (same ready-plan browser + recommendation a
      // client gets), so this doesn't duplicate a second, different request
      // path (the old button here used a template-less "custom" request
      // Jimmy has no admin screen to fulfill for a trainer's own row).
      trainerLocked
        ? e("div", { style: { ...styles.setupNotice, flexDirection: "column", alignItems: "flex-start", gap: 6 } },
            e("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
              e(Icon, { name: "lock", size: 14, color: C.ink3 }),
              e("span", { style: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.02em", color: C.ink } }, "Calorie & macro targets")
            ),
            // Sept 14 2026, Jimmy: "make here more clear ... the calories
            // and macros and the $30 in it" — the price used to sit buried
            // at the end of a long plain-gray sentence; now its own bold,
            // brand-colored piece so it's the thing that actually stands
            // out when skimming.
            e("p", { style: { margin: 0 } },
              pendingRequest
                ? "Waiting on Jimmy to confirm your requested plan below — your targets unlock the moment it's marked paid."
                : e("span", null,
                    "A diet plan built specifically for you — your calorie and macro targets plus a full meal plan. Pick one below for ",
                    e("span", { style: { fontWeight: 700, color: C.brand } }, `$${DIET_PLAN_PRICE}`),
                    "."
                  )
            )
          )
        : !showTargets
        // Sept 11 2026: this now fires for a self-train client (no
        // trainer) instead of a trainer-attached one — see the flipped
        // showTargets rule above. Points at the browse/pick section
        // below rather than "ask your trainer," since there isn't one.
        // Sept 14 2026, Jimmy: "make here more clear ... the calories and
        // macros and the $30 in it" — the price used to sit buried at the
        // end of a long sentence in the same plain gray text as everything
        // else; now called out as its own bold, brand-colored piece so
        // it's the one thing that actually pops when skimming.
        ? e("p", { style: { ...styles.profileGoalText, fontSize: 12.5 } },
            "Pick a diet plan below to see your calorie and macro targets — they're included once you unlock a plan for ",
            e("span", { style: { fontWeight: 700, color: C.brand } }, `$${DIET_PLAN_PRICE}`),
            "."
          )
        : e(React.Fragment, null,
            // Clarifies these numbers are the client's own fixed target (set from
            // their actual goal), not tied to whichever tab they're browsing in
            // "Choose a ready diet plan" below — those tabs are just for shopping
            // by goal and don't move this card. Without this line the two sections
            // sitting back-to-back read as if one drives the other.
            e("p", { style: { ...styles.profileGoalText, fontSize: 12, marginTop: -6, marginBottom: 10 } },
              (profile && profile.goal) ? `Based on your goal: ${profile.goal}` : "Set your goal under “Update my info” to personalize these."
            ),
            // Sept 6 2026, Jimmy: same ask as the calculator above — once a
            // selfLog trainer has paid, he sees the ONE target that came
            // with the plan he picked (read-only), not a free-editable
            // number he can keep changing. So these now read from the
            // template he actually bought (assignedTemplate) instead of the
            // separately-editable plan.* columns, and editable is switched
            // off for selfLog — a real client's row (canManage && !selfLog,
            // a manager/trainer setting numbers for someone else) keeps the
            // old free-editable behavior untouched.
            e("div", { style: styles.assessmentSummaryGrid },
              e(DietTargetTile, { label: "Calories", value: plan ? effCalories : null, suffix: " kcal", editable: canManage && !selfLog, onCommit: (v) => commitPlanField("calories", v), emoji: "🔥" }),
              e(DietTargetTile, { label: "Protein", value: plan ? effProtein : null, suffix: " g", editable: canManage && !selfLog, onCommit: (v) => commitPlanField("protein", v), emoji: "🍗" }),
              e(DietTargetTile, { label: "Carbs", value: plan ? effCarbs : null, suffix: " g", editable: canManage && !selfLog, onCommit: (v) => commitPlanField("carbs", v), emoji: "🍞" }),
              e(DietTargetTile, { label: "Fat", value: plan ? effFat : null, suffix: " g", editable: canManage && !selfLog, onCommit: (v) => commitPlanField("fat", v), emoji: "🥑" })
            ),
            e("div", { style: { marginTop: 10, marginBottom: 4 } }, e(DietTargetTile, { label: "Water goal", value: plan ? effWater : null, suffix: " ml", editable: canManage && !selfLog, onCommit: (v) => commitPlanField("water", v), full: true, emoji: "💧" }))
          ),
      // Sept 6 2026, Jimmy ("where to pick one below!"): trainerLocked used
      // to null out this whole Meal plan section, but that's exactly where
      // the "Choose a ready diet plan" browser + pick buttons live — a
      // locked trainer had the paywall notice above but literally nothing
      // to tap to pay. Branch B below already renders the right thing on
      // its own via plan.unlocked (browse-and-pick UI when locked, the real
      // plan once paid), same as a first-time client sees, so trainerLocked
      // doesn't need to gate this section at all — removed.
      // Sept 6 2026, Jimmy: once unlocked, selfLog now falls through to the
      // SAME branch a real client uses (below), not the free manager editor
      // — that's what makes "pick a different plan later" cost $30 again
      // instead of being a free re-pick, and it's what brings in the
      // ready-plan browser, the recommendation, and the Instant plan
      // generator (vegan / lactose-free / food-swap options) for free once
      // paid — all the same machinery a client already gets, not rebuilt
      // here. selfLog trainers keep editable general/allergies notes
      // further down specifically because of this branch choice — see the
      // selfLog-only note-editing block added into the client branch below.
      canManage && !selfLog
        ? e("div", { style: { marginTop: 14 } },
            e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
              e("span", { style: styles.progressCardTitle }, "\ud83c\udf7d\ufe0f Meal plan"),
              // No "client" to hide this from on a trainer's own self-log \u2014
              // the lock badge/status only makes sense when this plan
              // belongs to someone else.
              // Sept 13 2026, Jimmy: "the locked client cant see this yet
              // more clear" \u2014 was a barely-there gray label easy to miss
              // next to the section title. Now a proper tinted pill
              // (amber/warning while locked, green once unlocked) matching
              // the status-banner language used elsewhere in this tab.
              !selfLog && (() => {
                const unlocked = !!(plan && plan.unlocked);
                const tint = unlocked ? C.good : C.warning;
                return e("span", {
                  style: {
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 9px", borderRadius: 20,
                    color: tint, background: withAlpha(tint, 0.14), border: `1px solid ${withAlpha(tint, 0.35)}`
                  }
                },
                  e(Icon, { name: "lock", size: 11, color: tint }),
                  unlocked ? "Unlocked" : "Locked \u2014 client can't see this yet"
                );
              })()
            ),
            trainerRestricted
              ? (assignedTemplate
                  ? e("div", { style: { marginTop: 10 } },
                      e("div", { style: styles.programHeader },
                        e("span", { style: styles.demoNote }, goalLabel(assignedTemplate.goal)),
                        e("span", { style: { ...styles.sectionTitle, display: "block", marginTop: 2 } }, assignedTemplate.name)
                      ),
                      resolvedMealGroups().map((meal) => e("div", { key: meal.label, style: { marginTop: 14 } },
                        e(MealGroupHeader, { label: meal.label }),
                        e("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 } },
                          meal.rows.map((item) => e(MealItemRow, { key: item.id, item, canManage: false, onEdit: () => {}, onDelete: () => {}, accentColor: mealTheme(meal.label).color }))
                        )
                      ))
                    )
                  : (mealItemsLoaded && mealGroups().length > 0
                      ? e("div", { style: { marginTop: 10 } },
                          mealGroups().map((meal) => e("div", { key: meal.label, style: { marginTop: 14 } },
                            e(MealGroupHeader, { label: meal.label }),
                            e("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 } },
                              meal.rows.map((item) => e(MealItemRow, { key: item.id, item, canManage: false, onEdit: () => {}, onDelete: () => {}, accentColor: mealTheme(meal.label).color }))
                            )
                          ))
                        )
                      : e("p", { style: { ...styles.emptyText, marginTop: 10 } }, "No diet plan set up for this client yet \u2014 request one below.")
                    )
                )
              : showTemplatePicker
              ? e("div", { style: { marginTop: 10 } },
                  renderTemplateBrowser(),
                  e("button", { style: { ...styles.demoLinkBtn, marginTop: 10 }, onClick: () => setShowTemplatePicker(false) }, "Cancel")
                )
              : assignedTemplate
              ? e("div", { style: { marginTop: 10 } },
                  e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 } },
                    e("div", { style: styles.programHeader },
                      e("span", { style: styles.demoNote }, goalLabel(assignedTemplate.goal)),
                      e("span", { style: { ...styles.sectionTitle, display: "block", marginTop: 2 } }, assignedTemplate.name)
                    ),
                    e("div", { style: { display: "flex", gap: 8, flexShrink: 0 } },
                      e("button", { style: styles.demoLinkBtn, onClick: () => setShowTemplatePicker(true) }, "Change"),
                      e("button", { style: styles.deleteBtn, onClick: () => handlePickTemplate(null), "aria-label": "Remove ready plan" }, e(Icon, { name: "trash", size: 14 }))
                    )
                  ),
                  resolvedMealGroups().map((meal) => e("div", { key: meal.label, style: { marginTop: 14 } },
                    e(MealGroupHeader, { label: meal.label }),
                    e("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 } },
                      meal.rows.map((item) => e(MealItemRow, { key: item.id, item, canManage: false, onEdit: () => {}, onDelete: () => {}, accentColor: mealTheme(meal.label).color }))
                    )
                  )),
                  e("p", { style: { ...styles.emptyText, marginTop: 10 } }, "This plan's food items are shared \u2014 edit them from Diet Plans in the menu, not here.")
                )
              : e(React.Fragment, null,
                  e("button", { style: { ...styles.demoLinkBtn, marginTop: 10 }, onClick: () => setShowTemplatePicker(true) }, "Assign a ready plan instead \u2192"),
                  mealItemsLoaded && mealGroups().map((meal) => e("div", { key: meal.label, style: { marginTop: 14 } },
                    e(MealGroupHeader, { label: meal.label }),
                    e("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 } },
                      meal.rows.map((item) => (
                        editMealItemId === item.id
                          ? e(MealItemForm, { key: item.id, values: mealItemForm, onChange: setMealItemForm, onSave: handleSaveMealItem, onCancel: closeMealItemForm, saving: mealItemSaving, showMealField: true, saveLabel: "Save changes" })
                          : e(MealItemRow, { key: item.id, item, canManage: true, onEdit: openEditMealItem, onDelete: handleDeleteMealItem, accentColor: mealTheme(meal.label).color })
                      ))
                    ),
                    addMealTarget === meal.label
                      ? e(MealItemForm, { values: mealItemForm, onChange: setMealItemForm, onSave: handleSaveMealItem, onCancel: closeMealItemForm, saving: mealItemSaving, showMealField: false })
                      : e("button", { style: styles.demoLinkBtn, onClick: () => openAddToMeal(meal.label) }, "+ Add food item")
                  )),
                  mealItemsLoaded && mealGroups().length === 0 && !newMealOpen && e("p", { style: { ...styles.emptyText, marginTop: 10 } }, "No meals added yet \u2014 start with breakfast, lunch, dinner, or snacks."),
                  e("div", { style: { marginTop: 14 } },
                    newMealOpen
                      ? e(MealItemForm, { values: mealItemForm, onChange: setMealItemForm, onSave: handleSaveMealItem, onCancel: closeMealItemForm, saving: mealItemSaving, showMealField: true, saveLabel: "Add meal" })
                      : e("button", { style: styles.demoLinkBtn, onClick: openAddNewMeal }, "+ Add a new meal")
                  ),
                  mealItemError && e("span", { style: styles.inlineError }, mealItemError)
                ),
            e("div", { style: { marginTop: 18 } },
              e("span", { style: styles.progressCardTitle }, "📝 General notes"),
              editingMealPlan
                ? e(React.Fragment, null,
                    e("textarea", {
                      style: { ...styles.input, minHeight: 70, resize: "vertical", fontFamily: "'Inter', sans-serif", marginTop: 6 },
                      value: mealPlanDraft, onChange: (ev) => setMealPlanDraft(ev.target.value), placeholder: "Hydration, supplements, cheat-day rules, anything that doesn't belong to one meal\u2026"
                    }),
                    e("div", { style: { marginTop: 6 } }, e(VoiceMicButton, { title: "Add a note by voice", onTranscribed: (text) => setMealPlanDraft((prev) => (prev ? `${prev} ${text}` : text)) })),
                    e("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                      e("button", { style: { ...styles.saveBtn, marginTop: 0, flex: 1 }, onClick: handleSaveMealPlan }, "Save notes"),
                      e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, onClick: handleCancelMealPlan }, "Cancel")
                    )
                  )
                : e("p", { style: { ...styles.profileGoalText, cursor: "pointer", marginTop: 6 }, onClick: () => setEditingMealPlan(true) }, (plan && plan.mealPlan) || "Tap to add general notes")
            ),
            e("div", { style: { marginTop: 18 } },
              e("span", { style: styles.progressCardTitle }, selfLog ? "⚠️ Allergies / notes" : "⚠️ Allergies / notes for this client"),
              e("p", { style: { ...styles.profileGoalText, fontSize: 12, marginTop: 2, marginBottom: 6 } }, selfLog ? "Your own notes \u2014 swaps, allergies, anything you want on file." : "Shown to the client alongside their plan \u2014 use it for swaps, allergies, anything specific to them."),
              editingDietaryNotes
                ? e(React.Fragment, null,
                    e("textarea", {
                      style: { ...styles.input, minHeight: 60, resize: "vertical", fontFamily: "'Inter', sans-serif" },
                      value: dietaryNotesDraft, onChange: (ev) => setDietaryNotesDraft(ev.target.value), placeholder: "e.g. No dairy \u2014 swap Greek yogurt for coconut yogurt"
                    }),
                    e("div", { style: { marginTop: 6 } }, e(VoiceMicButton, { title: "Add a note by voice", onTranscribed: (text) => setDietaryNotesDraft((prev) => (prev ? `${prev} ${text}` : text)) })),
                    e("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                    e("button", { style: { ...styles.saveBtn, marginTop: 0, flex: 1, ...(savingDietaryNotes ? styles.btnDisabled : {}) }, disabled: savingDietaryNotes, onClick: handleSaveDietaryNotes }, savingDietaryNotes ? "Saving\u2026" : "Save notes"),
                    e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, disabled: savingDietaryNotes, onClick: handleCancelDietaryNotes }, "Cancel")
                  )
                  )
                : e("p", { style: { ...styles.profileGoalText, cursor: "pointer", marginTop: 6 }, onClick: () => setEditingDietaryNotes(true) }, (plan && plan.dietaryNotes) || "Tap to add allergy/substitution notes")
            ),
            pendingRequest && e("div", { style: { ...styles.setupNotice, marginTop: 14, background: C.brandSoft, borderColor: C.brand } },
              e(Icon, { name: "alert", size: 14, color: C.brand }),
              assignedTemplate
                ? `${clientName} requested "${assignedTemplate.name}" on ${fmtDate(plan.requestedAt.slice(0, 10))}`
                : `${clientName} requested a diet plan on ${fmtDate(plan.requestedAt.slice(0, 10))}`
            ),
            // Trainer's own version of the manager-only Unlock control below \u2014
            // they can't mark it paid themselves, only flag that the client
            // wants a (new) ready plan. JimFit picks the actual template and
            // confirms payment from the "Diet plan requests" inbox, same as
            // any other pending request.
            trainerRestricted && e(React.Fragment, null,
              pendingRequest
                ? e(WhishPayBox, { amount: DIET_PLAN_PRICE, note: "waiting for JimFit to pick a plan and confirm payment" })
                // Sept 14 2026, Jimmy: "show that is tappable" \u2014 this used to
                // be demoLinkBtn (plain blue text, no background), which read
                // as a caption rather than the actual $30 call-to-action it
                // is. Now the same solid pill treatment as "Apply to daily
                // targets" above, so it's unmistakably a button.
                : e("button", {
                    style: { ...styles.saveBtn, marginTop: 14, ...(requestingPlan ? styles.btnDisabled : {}) },
                    disabled: requestingPlan,
                    onClick: handleTrainerRequestPlan
                  }, requestingPlan ? "Requesting\u2026" : `\ud83e\udd57 Request a diet plan for ${clientName} ($${DIET_PLAN_PRICE}) \u2192`)
            ),
            // Never a "$30 unlock" prompt on a trainer's own self-log \u2014 there's
            // no one to charge for their own notes/targets.
            !selfLog && !trainerRestricted && !(plan && plan.unlocked) && !unlocking && e("button", { style: { ...styles.saveBtn, marginTop: 14 }, onClick: () => setUnlocking(true) }, `\ud83d\udd13 Unlock full diet plan ($${DIET_PLAN_PRICE}) \u2192`),
            !selfLog && !trainerRestricted && unlocking && e("div", { style: { ...styles.sessionForm, marginTop: 10 } },
              e("label", { style: { ...styles.formLabel, marginTop: 0 } }, "Amount received"),
              e("input", { style: styles.input, type: "number", placeholder: "Amount", value: unlockAmount, onChange: (ev) => setUnlockAmount(ev.target.value) }),
              e("input", { style: { ...styles.input, marginTop: 8 }, type: "date", value: unlockDate, onChange: (ev) => setUnlockDate(ev.target.value) }),
              unlockError && e("span", { style: styles.inlineError }, unlockError),
              e("div", { style: { display: "flex", gap: 8, marginTop: 10 } },
                e("button", { style: { ...styles.saveBtn, marginTop: 0, flex: 1, ...(unlockSaving ? styles.btnDisabled : {}) }, disabled: unlockSaving, onClick: handleUnlockPlan }, unlockSaving ? "Unlocking\u2026" : "Unlock"),
                e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, onClick: () => { setUnlocking(false); setUnlockError(""); setUnlockAmount(String(DIET_PLAN_PRICE)); } }, "Cancel")
              )
            )
          )
        : (plan && plan.unlocked
            ? e("div", { style: { marginTop: 14 } },
                // "My plan" vs "Other plans" pills — only when there's an
                // Other plans section to show at all (a trainer-attached
                // client with no browse/switch ability just sees "My plan"'s
                // content directly, no pill row).
                (isSelfTrain || selfLog) && e("div", { style: { ...styles.chipScrollRow, marginBottom: 14 } },
                  [
                    { id: "mine", label: "My plan" },
                    { id: "other", label: "Other plans" }
                  ].map((s) => e("button", {
                    key: s.id,
                    style: { ...styles.browseChip, ...(dietPlanView === s.id ? styles.browseChipActive : {}), flexShrink: 0, scrollSnapAlign: "start" },
                    onClick: () => setDietPlanView(s.id)
                  }, s.label))
                ),
                (!(isSelfTrain || selfLog) || dietPlanView === "mine") && e(React.Fragment, null,
                // Sept 11 2026, Jimmy: "Your plan" hero card, matching the
                // reference mockup — same underlying plan/template data as
                // before, just framed with the brand ring + CURRENT badge.
                // "View full plan" scrolls to the existing macro/meal detail
                // below rather than opening a separate screen.
                e("span", { style: styles.profileLabel }, "Your plan"),
                e("div", { style: { ...styles.planHeroCard, marginTop: 8, marginBottom: 14 } },
                  e("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 } },
                    e("div", { style: { display: "flex", alignItems: "center", gap: 11 } },
                      e("div", { style: styles.planHeroIconWrap }, e(Icon, { name: "apple", size: 18, color: C.brand })),
                      e("div", null,
                        e("span", { style: { fontWeight: 700, fontSize: 14.5, color: C.ink, display: "block" } }, assignedTemplate ? assignedTemplate.name : (plan.instantPlanGoal ? "Your custom plan" : "Your diet plan")),
                        (assignedTemplate ? templateMacroSummary(assignedTemplate) : (effCalories != null ? `${effCalories} kcal/day` : null)) && e("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: C.brand, display: "block", marginTop: 2 } }, assignedTemplate ? templateMacroSummary(assignedTemplate) : `${effCalories} kcal/day`)
                      )
                    ),
                    e("span", { style: styles.currentBadge }, e(Icon, { name: "check", size: 9, color: C.brandInk }), "CURRENT")
                  ),
                  plan.dietaryNotes && e("p", { style: { margin: 0, fontSize: 12.5, color: C.ink2, lineHeight: 1.5 } }, plan.dietaryNotes),
                  confirmUnassignPlan
                    ? e("div", { style: { ...styles.deleteConfirmBar, flexDirection: "column", alignItems: "stretch", gap: 8 } },
                        e("span", { style: styles.deleteConfirmText }, `Remove ${assignedTemplate ? `"${assignedTemplate.name}"` : "your current plan"}? Picking it again later won't charge you again.`),
                        e("div", { style: { display: "flex", gap: 8 } },
                          e("button", { style: { ...styles.confirmCancelBtn, flex: 1 }, onClick: () => setConfirmUnassignPlan(false) }, "Cancel"),
                          e("button", { style: { ...styles.confirmDangerBtn, flex: 1, ...(unassigningPlan ? styles.btnDisabled : {}) }, disabled: unassigningPlan, onClick: handleUnassignPlan }, unassigningPlan ? "…" : "Remove")
                        )
                      )
                    : e("div", { style: { display: "flex", gap: 8 } },
                        e("button", { style: { ...styles.ghostPillBtn, flex: 1 }, onClick: () => mealPlanRef.current && mealPlanRef.current.scrollIntoView({ behavior: "smooth", block: "start" }) },
                          "View full plan", e(Icon, { name: "chevron", size: 13, color: C.ink, strokeWidth: 2.4 })
                        ),
                        // Sept 11 2026, Jimmy: "change or delete this plan ...
                        // same as the program" — Change scrolls straight to the
                        // existing "Browse other plans"/"Your paid plans"
                        // sections below (same paid-switch and free-reopen
                        // flows, just a visible entry point on the card itself,
                        // matching Programs' Change+trash pair on its own card).
                        (isSelfTrain || selfLog) && e(React.Fragment, null,
                          e("button", { style: styles.deleteBtnGhost, onClick: () => setDietPlanView("other") }, "Change"),
                          e("button", {
                            style: styles.deleteBtn,
                            onClick: () => setConfirmUnassignPlan(true),
                            "aria-label": "Remove this plan"
                          }, e(Icon, { name: "trash", size: 14 }))
                        )
                      )
                ),
                e("span", { style: styles.progressCardTitle, ref: mealPlanRef }, "🍽️ Meal plan"),
                (assignedTemplate ? resolvedMealGroups() : mealGroups()).length > 0
                  ? (assignedTemplate ? resolvedMealGroups() : mealGroups()).map((meal) => e("div", { key: meal.label, style: { marginTop: 14 } },
                      e(MealGroupHeader, { label: meal.label }),
                      e("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 } },
                        meal.rows.map((item) => e(MealItemRow, { key: item.id, item, canManage: false, onEdit: () => {}, onDelete: () => {}, accentColor: mealTheme(meal.label).color }))
                      )
                    ))
                  : e("p", { style: { ...styles.emptyText, marginTop: 6 } }, isSelfTrain ? "Your gym hasn't added your meal plan yet." : "Your trainer hasn't added your meal plan yet."),
                // Sept 11 2026, Jimmy: "when he buy the plan include the
                // food swipes inside the plan" — the instant generator has
                // always had "Show food swaps"; real bought templates never
                // did. Reuses the exact same MEAL_GEN_SWAPS data, keyed by
                // whichever diet type the client picked while browsing
                // (plan.dietPreference, defaults to "standard").
                assignedTemplate && e("div", { style: { marginTop: 16 } },
                  e("button", {
                    style: { ...styles.energyPillBtn, display: "inline-flex", alignItems: "center", gap: 6 },
                    onClick: () => setShowAssignedSwaps((v) => !v)
                  }, e(Icon, { name: "swap", size: 13, color: C.brand }), showAssignedSwaps ? "Hide food swaps" : "Show food swaps"),
                  showAssignedSwaps && e("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 } },
                    (MEAL_GEN_SWAPS[(plan && plan.dietPreference) || "standard"] || MEAL_GEN_SWAPS.standard).map((s, i) => e("div", { key: i },
                      e("span", { style: { ...styles.goalChip, color: C.brand, background: C.brandSoft } }, s.group),
                      e("p", { style: { ...styles.profileGoalText, fontSize: 12, marginTop: 4 } }, s.text)
                    ))
                  )
                ),
                // selfLog gets the SAME editable notes UI branch A already
                // has (this is otherwise the read-only client view, where
                // notes are the trainer's/manager's to set, not the
                // client's) — a trainer's own general/allergy notes on his
                // own log are still his to write, per Jimmy's original ask,
                // even though the plan itself now works like a client's paid
                // plan in every other way.
                selfLog
                  ? e(React.Fragment, null,
                      e("div", { style: { marginTop: 14 } },
                        e("span", { style: styles.progressCardTitle }, "📝 General notes"),
                        editingMealPlan
                          ? e(React.Fragment, null,
                              e("textarea", {
                                style: { ...styles.input, minHeight: 70, resize: "vertical", fontFamily: "'Inter', sans-serif", marginTop: 6 },
                                value: mealPlanDraft, onChange: (ev) => setMealPlanDraft(ev.target.value), placeholder: "Hydration, supplements, cheat-day rules, anything that doesn't belong to one meal…"
                              }),
                              e("div", { style: { marginTop: 6 } }, e(VoiceMicButton, { title: "Add a note by voice", onTranscribed: (text) => setMealPlanDraft((prev) => (prev ? `${prev} ${text}` : text)) })),
                              e("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                      e("button", { style: { ...styles.saveBtn, marginTop: 0, flex: 1 }, onClick: handleSaveMealPlan }, "Save notes"),
                      e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, onClick: handleCancelMealPlan }, "Cancel")
                    )
                            )
                          : e("p", { style: { ...styles.profileGoalText, cursor: "pointer", marginTop: 6 }, onClick: () => setEditingMealPlan(true) }, (plan && plan.mealPlan) || "Tap to add general notes")
                      ),
                      e("div", { style: { marginTop: 14 } },
                        e("span", { style: styles.progressCardTitle }, "⚠️ Allergies / notes"),
                        e("p", { style: { ...styles.profileGoalText, fontSize: 12, marginTop: 2, marginBottom: 6 } }, "Your own notes — swaps, allergies, anything you want on file."),
                        editingDietaryNotes
                          ? e(React.Fragment, null,
                              e("textarea", {
                                style: { ...styles.input, minHeight: 60, resize: "vertical", fontFamily: "'Inter', sans-serif" },
                                value: dietaryNotesDraft, onChange: (ev) => setDietaryNotesDraft(ev.target.value), placeholder: "e.g. No dairy — swap Greek yogurt for coconut yogurt"
                              }),
                              e("div", { style: { marginTop: 6 } }, e(VoiceMicButton, { title: "Add a note by voice", onTranscribed: (text) => setDietaryNotesDraft((prev) => (prev ? `${prev} ${text}` : text)) })),
                              e("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                      e("button", { style: { ...styles.saveBtn, marginTop: 0, flex: 1, ...(savingDietaryNotes ? styles.btnDisabled : {}) }, disabled: savingDietaryNotes, onClick: handleSaveDietaryNotes }, savingDietaryNotes ? "Saving…" : "Save notes"),
                      e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, disabled: savingDietaryNotes, onClick: handleCancelDietaryNotes }, "Cancel")
                    )
                            )
                          : e("p", { style: { ...styles.profileGoalText, cursor: "pointer", marginTop: 6 }, onClick: () => setEditingDietaryNotes(true) }, (plan && plan.dietaryNotes) || "Tap to add allergy/substitution notes")
                      )
                    )
                  : plan.mealPlan && e("div", { style: { marginTop: 14 } },
                      e("span", { style: styles.progressCardTitle }, "📝 General notes"),
                      e("p", { style: { ...styles.profileGoalText, marginTop: 6 } }, plan.mealPlan)
                    ),
                // Included with the $30 unlock — the instant generator is
                // part of "my plan" too, so it stays on this pill rather
                // than moving to Other plans.
                renderInstantPlanSection()
                ), // end "My plan" fragment
                // "Other plans" pill: paid templates + browse/switch — only
                // reachable when that pill exists at all (see the pill row
                // above) and is the one currently selected.
                (isSelfTrain || selfLog) && dietPlanView === "other" && e(React.Fragment, null,
                // Self-train only, same reasoning as programs' own "Change"
                // button (canAssign is self-train-or-manager there too) — a
                // trainer-owned client's plan is the trainer's call, so they
                // go through "Or request a custom plan instead" / ask their
                // trainer rather than swapping it themselves. Switching
                // charges again, same as the first pick (Jimmy's call) — a
                // pick here only ever creates a pending request
                // (pendingSwitchTemplate) that sits in the manager's Diet
                // plan requests queue; the client's current plan above stays
                // exactly as-is, unaffected, until a manager approves and
                // marks it paid.
                // Sept 6 2026, Jimmy: "i want him to see for each plan he
                // paid... if he bought 2 he see two no?" — every ready
                // template ever actually paid for, listed so switching back
                // to one they already own is visible and one tap, not
                // buried behind "Change my diet plan" (which still treats
                // an unpaid pick as a new $30 request). Only shown once
                // there's more than one to choose from.
                // Sept 12 2026, Jimmy: same "rectangles -> one slim list"
                // treatment as the browse accordion below — every owned plan
                // used to be its own bordered box; now they're divider rows
                // in one shared container. No accordion needed here (nothing
                // to reveal, just a fast switch), so rows stay one line.
                (isSelfTrain || selfLog) && paidTemplates.length > 1 && e("div", { style: { marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.cardBorder}` } },
                  e("span", { style: styles.profileLabel }, "Your paid plans"),
                  e("p", { style: { ...styles.profileGoalText, fontSize: 12, marginTop: 2, marginBottom: 8 } }, "Switch between plans you've already paid for — free, any time."),
                  e("div", { style: { ...styles.workoutCard, margin: 0, padding: "2px 16px 2px" } },
                    paidTemplates.map((t, i) => {
                      const isActive = plan && plan.templateId === t.id;
                      const isLast = i === paidTemplates.length - 1;
                      // Sept 13 2026, Jimmy: "every diet plan make it to look
                      // like that" — same treatment as the browse accordion:
                      // no colored per-goal icon badge, just the plain name
                      // and goal label the reference photos show.
                      return e("div", { key: t.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 2px", borderBottom: isLast ? "none" : `1px solid ${C.cardBorder}` } },
                        e("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 } },
                          e("div", { style: { minWidth: 0 } },
                            e("span", { style: styles.demoNote }, goalLabel(t.goal)),
                            e("span", { style: { ...styles.exerciseName, display: "block", marginTop: 2, wordBreak: "break-word" } }, t.name)
                          )
                        ),
                        isActive
                          ? e("span", { style: { ...styles.planStatusPill, color: C.brand, background: C.brandSoft } }, "ACTIVE")
                          : e("button", {
                              style: { ...styles.demoLinkBtn, padding: "0 10px", flexShrink: 0, ...(switchingToPaidId === t.id ? styles.btnDisabled : {}) },
                              disabled: switchingToPaidId === t.id,
                              onClick: () => handleSwitchToPaidPlan(t.id)
                            }, switchingToPaidId === t.id ? "Switching…" : "Switch →")
                      );
                    })
                  )
                ),
                (isSelfTrain || selfLog) && e("div", { ref: browsePlansRef, style: { marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.cardBorder}` } },
                  pendingSwitchTemplate || plan.pendingSwitchTemplateId
                    ? e("div", { style: { ...styles.setupNotice, flexDirection: "column", alignItems: "flex-start", gap: 6 } },
                        e("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                          e(Icon, { name: "alert", size: 14, color: C.ink3 }),
                          e("span", { style: { fontWeight: 600, fontSize: 12.5 } }, "Plan switch requested")
                        ),
                        e("p", { style: { margin: 0 } },
                          pendingSwitchTemplate
                            ? `Switching to "${pendingSwitchTemplate.name}" — ${isSelfTrain ? "your gym" : "your trainer"} will confirm once paid. Your current plan above stays active until then.`
                            : `Switch requested — ${isSelfTrain ? "your gym" : "your trainer"} will confirm once paid.`
                        ),
                        // Same real stepper as the program-purchase lock —
                        // one context per client covers both the first pick
                        // and a switch, since only one diet request/switch is
                        // ever pending at a time.
                        e(PaymentStatusStepper, { email: userEmail, context: "diet_plan", amount: DIET_PLAN_PRICE, approvedCopy: "Approved — unlocked" }),
                        e("button", {
                          style: { ...styles.demoLinkBtn, padding: "0", marginTop: 2, ...(cancelingSwitch ? styles.btnDisabled : {}) },
                          disabled: cancelingSwitch,
                          onClick: handleCancelSwitch
                        }, cancelingSwitch ? "Canceling…" : "Wrong pick? Cancel this request →")
                      )
                    // Sept 11 2026, Jimmy: "Browse other plans" is now always
                    // visible under the current plan (matching the reference
                    // mockup) instead of hidden behind a "Change my diet
                    // plan" link — same renderTemplateBrowser/handleSwitchTemplate
                    // flow as before, just no toggle gating it.
                    // Sept 11 2026, Jimmy: "clicked change but didn't see the
                    // other meal plans" — this used to hide the whole browse
                    // list behind a "pay app access first" notice, same bug
                    // as the first-pick flow had before that one got fixed
                    // earlier today. Same treatment here: the pay notice
                    // (still shown while purchaseLocked) sits ABOVE the same
                    // always-browsable list instead of replacing it.
                    : e(React.Fragment, null,
                        // Sept 13 2026, Jimmy: "to be clear that the $10 is
                        // subscription before he buys the program" — same
                        // clarity fix as ClientProgramCard's purchaseLocked
                        // notice, applied here too since it's the exact same
                        // monthly app subscription (not the diet plan itself).
                        purchaseLocked && e("p", { style: { ...styles.emptyText, fontSize: 12, marginBottom: 10 } }, `This $${SELF_TRAIN_MONTHLY_PRICE} is your monthly app subscription — not the diet plan — and needs to be paid to actually use a different plan once picked. You can still browse and switch below in the meantime.`),
                        // Sept 14 2026, Jimmy: same "make the $30 clear"
                        // pass as the first-pick browser below — also
                        // fixes this line silently missing its "$" before
                        // the price (was rendering as a bare "(30)").
                        e("span", { style: { ...styles.progressCardTitle, display: "block" } }, "🥗 Browse other plans"),
                        e("p", { style: { ...styles.profileGoalText, fontSize: 12.5, marginTop: 4, marginBottom: 10 } },
                          "Switching to a different ready plan is a new pick for ",
                          e("span", { style: { fontWeight: 700, color: C.brand } }, `$${DIET_PLAN_PRICE}`),
                          ` — it goes to ${isSelfTrain ? "your gym" : "your trainer"} to confirm, same as your first plan did.`
                        ),
                        renderTemplateBrowser({ onPick: handleSwitchTemplate, showPrice: true })
                      )
                )
              ) // end "Other plans" fragment
              )
            : (pendingRequest
                ? e("div", { style: { ...styles.setupNotice, marginTop: 14, flexDirection: "column", alignItems: "flex-start", gap: 6 } },
                    e("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                      e(Icon, { name: "lock", size: 14, color: C.ink3 }),
                      e("span", { style: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.02em", color: C.ink } }, "Full Diet Plan")
                    ),
                    e("p", { style: { margin: 0 } }, `A complete, personalized meal plan from your coach, plus the instant plan generator. ($${DIET_PLAN_PRICE})`),
                    e("p", { style: { margin: 0, color: C.good, fontWeight: 600, fontSize: 12.5 } },
                      assignedTemplate
                        ? `\u2713 Requested "${assignedTemplate.name}"`
                        : "\u2713 Requested"
                    ),
                    e(PaymentStatusStepper, { email: userEmail, context: "diet_plan", amount: DIET_PLAN_PRICE, approvedCopy: "Approved \u2014 unlocked" }),
                    e("button", {
                      style: { ...styles.demoLinkBtn, padding: "0", marginTop: 2, ...(cancelingRequest ? styles.btnDisabled : {}) },
                      disabled: cancelingRequest,
                      onClick: handleCancelRequest
                    }, cancelingRequest ? "Canceling\u2026" : "Wrong pick? Cancel this request \u2192")
                  )
                : e("div", { style: { marginTop: 6 } },
                    // Sept 11 2026, Jimmy: "fix the request like the one in
                    // the program" — Programs' browse list stays visible
                    // and requestable even before the monthly app-access
                    // payment (only "Your program" itself shows a pay
                    // notice); Diet used to hide the whole browse section
                    // behind a "pay first" wall instead. Now it matches:
                    // the pay notice (still shown while purchaseLocked)
                    // sits ABOVE the same always-browsable plan list.
                    purchaseLocked && e("div", { style: { ...styles.setupNotice, marginBottom: 14, flexDirection: "column", alignItems: "flex-start", gap: 6 } },
                      e("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                        e(Icon, { name: "lock", size: 14, color: C.ink3 }),
                        e("span", { style: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.02em", color: C.ink } }, "Pay to unlock diet plans")
                      ),
                      // Sept 13 2026, Jimmy: same "$10 is a subscription,
                      // not the program/plan" clarity fix as
                      // ClientProgramCard above.
                      e("p", { style: { margin: 0 } }, `This $${SELF_TRAIN_MONTHLY_PRICE} is your monthly app subscription — not the diet plan — and needs to be paid to actually use a plan once picked. You can still browse and request one below in the meantime.`),
                      // Same app-access claim as the Log tab / Programs
                      // subscriptionLocked view — it's the same monthly
                      // payment, so marking it sent on any of them clears
                      // all three.
                      e(PaymentStatusStepper, { email: userEmail, context: "self_train_access", amount: SELF_TRAIN_MONTHLY_PRICE, approvedCopy: "Approved — unlocked" })
                    ),
                    // Sept 11 2026, Jimmy: restyled to match the "Find the
                    // right plan" reference mockup — "Browse other plans"
                    // (chip filter + cards) up top, a single "Not seeing the
                    // right fit? Build me a plan" card at the bottom instead
                    // of two separate links doing the same handleRequestPlan
                    // call. Same gating/handlers as before throughout.
                    !showInstantGenerator && (((latestAssessment && latestAssessment.bmr != null) || skipBodyInfo) && !editingBodyInfo
                      ? e(React.Fragment, null,
                          // Sept 14 2026, Jimmy: "make here more clear ...
                          // pick one below by goal $30" — was a tiny
                          // barely-there mono caption (same issue this
                          // session already fixed for "Meal plan"/"General
                          // notes"), with the price buried at the very end
                          // of the line in the same plain gray as
                          // everything else. Now a real section title plus
                          // a bold, brand-colored price called out on its
                          // own.
                          e("span", { style: { ...styles.progressCardTitle, display: "block" } }, "🥗 Browse other plans"),
                          e("p", { style: { ...styles.profileGoalText, fontSize: 12.5, marginTop: 4, marginBottom: 10 } },
                            "Each plan is ",
                            e("span", { style: { fontWeight: 700, color: C.brand } }, `$${DIET_PLAN_PRICE}`),
                            " — pick the one that matches your goal below."
                          ),
                          renderTemplateBrowser(),
                          latestAssessment && latestAssessment.bmr != null && e("button", {
                            style: { ...styles.demoLinkBtn, padding: "0", marginTop: 12 },
                            onClick: openBodyInfoEditor
                          }, "Update my info \u2192"),
                          // Sept 11 2026, Jimmy: "youre puting the instant
                          // plan inside the ready meal plan and u deleted
                          // the instant plan from outside... the plans were
                          // different than the instant plan" -- this used to
                          // SWAP the paid "Build me a plan" request card out
                          // for the free instant-plan section once eligible,
                          // which merged two things Jimmy wants kept visibly
                          // separate: ready goal-based plans (real food +
                          // swaps, built by him) vs. the instant generator
                          // (numbers-only, self-service). Reverted to always
                          // keep the request card, and the instant-plan
                          // section (still gated on everPaidDiet, still the
                          // fix for "i cant see the instant meal plan") now
                          // renders as its OWN separate block underneath
                          // instead of replacing this one -- same as how the
                          // unlocked view above keeps them as two blocks.
                          // Sept 11 2026, Jimmy: a trainer-attached client
                          // can't request a custom/instant plan at all —
                          // their trainer sets their macros directly, not a
                          // written diet plan through this self-service
                          // flow — so they see this phrase instead. Then,
                          // for self-train clients too: "delete here the
                          // built me a plan both and keep everything the
                          // same" — the paid custom-plan-request card (this
                          // one) and the free instant generator's own card
                          // (renderInstantPlanSection below) are both gone
                          // now, for every client, not just trainer-attached
                          // ones. Ready-template browsing/purchase above is
                          // unaffected — only these two self-service cards.
                          hasTrainer && e("div", { style: { marginTop: 14 } },
                            e("p", { style: { ...styles.emptyText, fontSize: 12, marginBottom: nudgeSent ? 0 : 8 } }, "Ask your trainer to set your macros based on your goals."),
                            !nudgeSent
                              ? e("button", { type: "button", style: { ...styles.demoLinkBtn, padding: "0" }, onClick: handleNudgeTrainer }, "Nudge my trainer →")
                              : e("p", { style: { ...styles.emptyText, fontSize: 11.5, color: C.good } }, "Nudge sent — your trainer's been notified.")
                          ),
                          renderInstantPlanSection()
                        )
                      : e("div", { style: { marginTop: 8 } },
                          e("p", { style: { ...styles.profileGoalText, fontSize: 12, marginBottom: 10 } }, "Enter your numbers once and we'll suggest the ready plan that fits you best — and set your daily Calorie/Protein/Carb/Fat targets automatically."),
                          e("span", { style: { ...styles.profileLabel, display: "block", marginBottom: 6 } }, "Your goal"),
                          e(Segmented, { options: DIET_GOALS, value: bodyInfoForm.dietGoal, onChange: (v) => setBodyInfoForm((prev) => ({ ...prev, dietGoal: v })) }),
                          e("div", { style: { ...styles.sessionFormRow, marginTop: 8 } },
                            e("input", { style: styles.input, type: "number", placeholder: "Weight (kg)", value: bodyInfoForm.weight, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, weight: ev.target.value })) }),
                            e("input", { style: styles.input, type: "number", placeholder: "Height (cm)", value: bodyInfoForm.height, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, height: ev.target.value })) })
                          ),
                          e("div", { style: { ...styles.sessionFormRow, marginTop: 8 } },
                            e("input", { style: styles.input, type: "number", placeholder: "Age", value: bodyInfoForm.age, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, age: ev.target.value })) }),
                            e("select", { style: styles.input, value: bodyInfoForm.gender, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, gender: ev.target.value })) },
                              ["Male", "Female", "Other"].map((g) => e("option", { key: g, value: g }, g))
                            )
                          ),
                          e("div", { style: { ...styles.sessionFormRow, marginTop: 8 } },
                            e("input", { style: styles.input, type: "number", placeholder: "Days trained/week", min: 0, max: 7, value: bodyInfoForm.daysPerWeek, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, daysPerWeek: ev.target.value })) }),
                            e("select", { style: styles.input, value: bodyInfoForm.activeLifestyle, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, activeLifestyle: ev.target.value })) },
                              e("option", { value: "sedentary" }, "Sedentary day-to-day (desk job)"),
                              e("option", { value: "active" }, "Active day-to-day (on your feet)")
                            )
                          ),
                          e("p", { style: { ...styles.profileGoalText, fontSize: 11, marginTop: 10, marginBottom: 4 } }, "Already know your BMR, body fat %, or muscle mass — from a smart scale or a scan? Add them too (optional, all three):"),
                          e("div", { style: styles.sessionFormRow },
                            e("input", { style: styles.input, type: "number", placeholder: "BMR (kcal, optional)", value: bodyInfoForm.bmr, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, bmr: ev.target.value })) }),
                            e("input", { style: styles.input, type: "number", placeholder: "Body fat % (optional)", value: bodyInfoForm.bodyFat, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, bodyFat: ev.target.value })) })
                          ),
                          e("div", { style: { ...styles.sessionFormRow, marginTop: 8 } },
                            e("input", { style: styles.input, type: "number", placeholder: "Muscle mass (kg, optional)", value: bodyInfoForm.muscleMass, onChange: (ev) => setBodyInfoForm((prev) => ({ ...prev, muscleMass: ev.target.value })) })
                          ),
                          bodyInfoError && e("span", { style: styles.inlineError }, bodyInfoError),
                          e("div", { style: { display: "flex", gap: 8, marginTop: 10, alignItems: "center" } },
                            e("button", { style: { ...styles.saveBtn, marginTop: 0, ...(submittingBodyInfo ? styles.btnDisabled : {}) }, disabled: submittingBodyInfo, onClick: handleSubmitBodyInfo }, submittingBodyInfo ? "Saving\u2026" : "Get my targets"),
                            editingBodyInfo
                              ? e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, onClick: () => { setEditingBodyInfo(false); setBodyInfoError(""); } }, "Cancel")
                              : e("button", { style: { ...styles.demoLinkBtn, padding: "0 10px" }, onClick: () => setSkipBodyInfo(true) }, "Skip \u2014 just let me browse")
                          )
                        )
                    )
                  )
              )
          ),
  );
}
