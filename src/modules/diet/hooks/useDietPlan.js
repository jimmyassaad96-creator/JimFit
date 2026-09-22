import { useState, useEffect } from "react";
import { sb } from "../../../platform/supabase.js";

/**
 * The client's diet plan row: the targets and meal-plan text on `diet_plans`,
 * plus the two inline editors that write back to it.
 *
 * Extracted from DietPanel. `setSaving` is passed in rather than owned here
 * because the meal-plan editor shares the food log's saving flag, and that
 * flag drives a spinner both of them render.
 */
export function useDietPlan({ userId, clientName, setSaving }) {
    // Sept 6 2026, Jimmy: keep a trainer's BMR (Assessments) and daily food
    // logging (DietLogPanel, the separate log-what-you-ate tool) free and
    // automatic — but the CALCULATED calorie/macro targets and the actual
    // meal plan are the paid product, same $30 a client pays, same
    // request-and-wait-for-Jimmy flow. His reasoning: if the macros are
    // free, there's no reason to ever buy the plan. Computed below (not
    // passed in) since it depends on `plan`, which only exists once loaded.
    const [plan, setPlan] = useState(null);
    const [planLoaded, setPlanLoaded] = useState(false);

    const [mealPlanDraft, setMealPlanDraft] = useState("");
    const [editingMealPlan, setEditingMealPlan] = useState(false);

    const [editingDietaryNotes, setEditingDietaryNotes] = useState(false);
    const [dietaryNotesDraft, setDietaryNotesDraft] = useState("");
    const [savingDietaryNotes, setSavingDietaryNotes] = useState(false);

    function mapPlanRow(row) {
      return {
        id: row.id, calories: row.calories_target, protein: row.protein_target, carbs: row.carbs_target, fat: row.fat_target, water: row.water_target_ml,
        mealPlan: row.meal_plan, unlocked: !!row.plan_unlocked, requestedAt: row.plan_requested_at || null,
        templateId: row.template_id || null, dietaryNotes: row.dietary_notes || null,
        // Set while an already-unlocked client has a switch-to-a-different-
        // plan request pending payment — the LIVE templateId above stays
        // untouched (and their current plan stays visible) the whole time,
        // this only gets promoted into templateId once a manager marks the
        // switch as paid. See handleSwitchTemplate/request_diet_plan_switch.
        pendingSwitchTemplateId: row.pending_switch_template_id || null,
        // Set once a client confirms a plan out of the instant generator —
        // from then on this is what's shown instead of the picker, so they
        // see the same plan every time they open the app rather than being
        // asked to choose again. Null until they've confirmed one.
        instantPlanGoal: row.instant_plan_goal || null, instantPlanDiet: row.instant_plan_diet || null, instantPlanCalories: row.instant_plan_calories || null,
        // Which food-swap set (MEAL_GEN_SWAPS) to show under a real,
        // purchased ready-template plan — see templateDiet/handleSetDietPreference.
        // Independent of instantPlanDiet, which is the instant generator's
        // own saved choice for ITS plan.
        dietPreference: row.diet_preference || "standard"
      };
    }

    function fetchPlan() {
      if (!userId || !sb) { setPlan(null); setPlanLoaded(true); return; }
      setPlanLoaded(false);
      sb.from("diet_plans").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).then(({ data, error: err }) => {
        const row = !err && data && data.length ? data[0] : null;
        if (row) { setPlan(mapPlanRow(row)); setMealPlanDraft(row.meal_plan || ""); setDietaryNotesDraft(row.dietary_notes || ""); } else { setPlan(null); setMealPlanDraft(""); setDietaryNotesDraft(""); }
        setPlanLoaded(true);
      });
    }
    useEffect(fetchPlan, [userId]);

    async function handleSaveMealPlan() {
      if (!sb || !userId) return;
      setSaving(true);
      const text = mealPlanDraft.trim() || null;
      const { data, error: err } = await sb.from("diet_plans").upsert([{ user_id: userId, client_name: clientName, meal_plan: text }], { onConflict: "user_id" }).select();
      if (!err && data && data[0]) setPlan(mapPlanRow(data[0]));
      setSaving(false);
      setEditingMealPlan(false);
    }

    // Sept 10 2026: the "General notes" editor had a Save button but no way
    // to back out of an edit without saving — tapping into it, changing your
    // mind, and wanting to leave it as it was meant either saving the edit
    // anyway or leaving the field open. Discards the in-progress draft back
    // to whatever's actually saved and closes the editor.
    function handleCancelMealPlan() {
      setMealPlanDraft((plan && plan.mealPlan) || "");
      setEditingMealPlan(false);
    }

    async function handleSaveDietaryNotes() {
      if (!sb || !userId) return;
      setSavingDietaryNotes(true);
      const text = dietaryNotesDraft.trim() || null;
      const { data, error: err } = await sb.from("diet_plans").upsert([{ user_id: userId, client_name: clientName, dietary_notes: text }], { onConflict: "user_id" }).select();
      if (!err && data && data[0]) setPlan(mapPlanRow(data[0]));
      setSavingDietaryNotes(false);
      setEditingDietaryNotes(false);
    }

    // Same Sept 10 2026 fix as handleCancelMealPlan above, for the
    // allergies/substitution-notes editor right below it — same missing
    // "back out without saving" gap.
    function handleCancelDietaryNotes() {
      setDietaryNotesDraft((plan && plan.dietaryNotes) || "");
      setEditingDietaryNotes(false);
    }

  return {
    plan, setPlan, planLoaded, mapPlanRow,
    mealPlanDraft, setMealPlanDraft, editingMealPlan, setEditingMealPlan,
    dietaryNotesDraft, setDietaryNotesDraft,
    editingDietaryNotes, setEditingDietaryNotes, savingDietaryNotes,
    fetchPlan, handleSaveMealPlan, handleCancelMealPlan,
    handleSaveDietaryNotes, handleCancelDietaryNotes,
  };
}
