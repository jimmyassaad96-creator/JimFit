import { useState, useEffect, useRef } from "react";
import { fetchLatestDisplayAssessment } from "../../../data/fetchLatestDisplayAssessment.js";
import { dietGoalKeyFromText, defaultActivityKey } from "../../../domain/group2.js";
import { sb } from "../../../platform/supabase.js";
import { ACTIVITY_LEVELS, AGE_RANGE, HEIGHT_CM_RANGE, WEIGHT_KG_RANGE } from "../../../domain/body.js";
import { bmrFromBody } from "../../../domain/group1.js";
import { inRange, leanMassKgFrom, macroTargetsFromCalories } from "../../../domain/group3.js";
import { waterTargetMlFromWeight } from "../../../domain/group4.js";
import { DIET_GOAL_CAL_MULT } from "../../../domain/nutrition.js";

/**
 * The self-serve body-info form on the Diet tab: the client's latest
 * assessment, the weight/height/age/gender/activity inputs behind it, and the
 * submit that writes a fresh BMR through a SECURITY DEFINER RPC.
 *
 * `templateGoal` comes from useDietTemplates — opening the editor pre-fills
 * the goal from whichever plan tab the client is browsing.
 */
export function useBodyInfo({
  userId, clientName, profile,
  templateGoal, setTemplateGoal, setPlan, mapPlanRow, fetchPlan,
}) {
    const [latestAssessment, setLatestAssessment] = useState(null);

    const [activityKey, setActivityKey] = useState(defaultActivityKey(profile && profile.days_per_week));
    const [bodyInfoForm, setBodyInfoForm] = useState({
      dietGoal: dietGoalKeyFromText(profile && profile.goal), // drives the auto-calculated Daily Targets below, not just the browse-list filter — same Sept 10 2026 fix as templateGoal above, no longer hardcoded to "Fat loss"
      weight: (profile && profile.weight_kg != null) ? String(profile.weight_kg) : "",
      height: (profile && profile.height_cm != null) ? String(profile.height_cm) : "",
      age: (profile && profile.age != null) ? String(profile.age) : "",
      gender: (profile && profile.gender) || "Male",
      daysPerWeek: (profile && profile.days_per_week != null) ? String(profile.days_per_week) : "",
      activeLifestyle: "sedentary", // besides training — "sedentary" or "active" (desk job vs. on your feet all day)
      bmr: "", // optional — from a smart scale/DEXA scan; overrides the calculated BMR below if given
      bodyFat: "", // optional, %
      muscleMass: "" // optional, kg
    });
    const [submittingBodyInfo, setSubmittingBodyInfo] = useState(false);
    const [bodyInfoError, setBodyInfoError] = useState("");
    const [skipBodyInfo, setSkipBodyInfo] = useState(false); // client chose "just let me browse"
    const [editingBodyInfo, setEditingBodyInfo] = useState(false); // client chose "Update my info" to redo the form after already submitting once

    // Body info was already submitted once (weight went up, goal changed, a typo,
    // etc.) — re-opens the same form, pre-filled with whatever's on file now
    // (current profile fields + the latest assessment's body fat/muscle mass),
    // so the client isn't retyping everything from scratch just to fix one field.
    // BMR is deliberately left blank rather than pre-filled from the last
    // assessment — that stored number was usually calculated, not measured, and
    // pre-filling it would make the form treat it as a manual override forever,
    // freezing the calculation instead of recomputing it from the fresh numbers.
    function openBodyInfoEditor() {
      setBodyInfoForm((prev) => ({
        ...prev,
        dietGoal: templateGoal,
        weight: (profile && profile.weight_kg != null) ? String(profile.weight_kg) : prev.weight,
        height: (profile && profile.height_cm != null) ? String(profile.height_cm) : prev.height,
        age: (profile && profile.age != null) ? String(profile.age) : prev.age,
        gender: (profile && profile.gender) || prev.gender,
        daysPerWeek: (profile && profile.days_per_week != null) ? String(profile.days_per_week) : prev.daysPerWeek,
        bmr: "",
        bodyFat: (latestAssessment && latestAssessment.bodyFat != null) ? String(latestAssessment.bodyFat) : "",
        muscleMass: (latestAssessment && latestAssessment.muscleMass != null) ? String(latestAssessment.muscleMass) : ""
      }));
      setBodyInfoError("");
      setEditingBodyInfo(true);
    }

    function fetchLatestAssessment() {
      if (!userId || !sb) { setLatestAssessment(null); return; }
      fetchLatestDisplayAssessment(userId, clientName, profile).then((data) => {
        setLatestAssessment(data ? { date: data.assessed_on, weight: data.weight_kg, bodyFat: data.body_fat_pct, muscleMass: data.muscle_mass_kg, bmr: data.bmr } : null);
      });
    }
    // Sept 10 2026, Jimmy: "when i edit the weight in her profile i cant see
    // the new bmr, i need to go to assessment to see the change and when i
    // go back to diet tab [then] the last change i can see" — this only ever
    // re-fetched on [userId], i.e. once when a client's Diet tab first mounts.
    // Editing weight/height/age/gender via "Edit profile" DOES correctly
    // recalculate and save a fresh BMR (confirmed working via the Assessments
    // tab, which reads its own live list) — but this tile's own `profile`
    // prop updating with the new numbers was never enough to make it re-fetch,
    // since none of those fields were in the dependency array. Leaving/
    // re-entering the tab "fixed" it only because that remounts the component,
    // which re-runs this effect from scratch. Now it re-fetches on any of the
    // fields a profile edit can change and BMR depends on, not just on first
    // load.
    useEffect(fetchLatestAssessment, [userId, profile && profile.weight_kg, profile && profile.height_cm, profile && profile.age, profile && profile.gender]);

    // Self-train clients have no trainer to measure them, so they're the one
    // audience the manager-only CalorieCalculator above never reaches. This
    // is the self-serve equivalent — weight/height/age/gender in, a BMR out,
    // via the same Mifflin-St Jeor formula, computed server-side so the
    // client never needs to see or trust client-side math. Writes go through
    // a SECURITY DEFINER RPC (own client_profiles row + a new body_assessments
    // row) rather than a direct table write, same reasoning as every other
    // client-facing write in this file.
    async function handleSubmitBodyInfo() {
      setBodyInfoError("");
      const w = Number(bodyInfoForm.weight), h = Number(bodyInfoForm.height), a = Number(bodyInfoForm.age), d = Number(bodyInfoForm.daysPerWeek);
      if (!bodyInfoForm.weight || isNaN(w) || !inRange(w, WEIGHT_KG_RANGE)) { setBodyInfoError(`Enter a valid weight (${WEIGHT_KG_RANGE[0]}-${WEIGHT_KG_RANGE[1]} kg).`); return; }
      if (!bodyInfoForm.height || isNaN(h) || !inRange(h, HEIGHT_CM_RANGE)) { setBodyInfoError(`Enter a valid height (${HEIGHT_CM_RANGE[0]}-${HEIGHT_CM_RANGE[1]} cm).`); return; }
      if (!bodyInfoForm.age || isNaN(a) || !inRange(a, AGE_RANGE)) { setBodyInfoError(`Enter a valid age (${AGE_RANGE[0]}-${AGE_RANGE[1]}).`); return; }
      if (bodyInfoForm.daysPerWeek === "" || isNaN(d) || d < 0 || d > 7) { setBodyInfoError("Enter how many days a week you train (0-7)."); return; }
      // BMR/body fat/muscle mass are optional — only validated if the client actually typed something.
      const bmrEntered = bodyInfoForm.bmr.trim() !== "";
      const bodyFatEntered = bodyInfoForm.bodyFat.trim() !== "";
      const muscleEntered = bodyInfoForm.muscleMass.trim() !== "";
      const bmr = bmrEntered ? Number(bodyInfoForm.bmr) : null;
      const bodyFat = bodyFatEntered ? Number(bodyInfoForm.bodyFat) : null;
      const muscleMass = muscleEntered ? Number(bodyInfoForm.muscleMass) : null;
      if (bmrEntered && (isNaN(bmr) || bmr <= 0)) { setBodyInfoError("BMR should be a positive number, or leave it blank."); return; }
      if (bodyFatEntered && (isNaN(bodyFat) || bodyFat < 0 || bodyFat > 100)) { setBodyInfoError("Body fat % should be between 0 and 100, or leave it blank."); return; }
      if (muscleEntered && (isNaN(muscleMass) || muscleMass <= 0)) { setBodyInfoError("Muscle mass should be a positive number, or leave it blank."); return; }
      if (!sb || !userId) { setBodyInfoError("Backend not configured yet."); return; }
      setSubmittingBodyInfo(true);
      // Uses body fat % / muscle mass (whichever was given) for a more accurate
      // lean-mass-based BMR and protein target — same formula the RPC computes
      // server-side (mirrored here so we can turn it straight into Daily Targets
      // without waiting on a round trip). A manually entered BMR (smart scale /
      // scan) always wins over any calculated formula.
      const leanMassKg = leanMassKgFrom(w, bodyFat, muscleMass);
      const computedBmr = bmr != null ? bmr : bmrFromBody(w, h, a, bodyInfoForm.gender, leanMassKg);
      // Same training-days -> activity-tier logic already used to seed the browse
      // screen's activity dropdown after submitting, just computed a little earlier
      // here so it can feed straight into the calorie/macro math below too.
      const trainingTierIdx = ACTIVITY_LEVELS.findIndex((lvl) => lvl.key === defaultActivityKey(d));
      const bumpedIdx = bodyInfoForm.activeLifestyle === "active" ? Math.min(trainingTierIdx + 1, ACTIVITY_LEVELS.length - 1) : trainingTierIdx;
      const activityMult = ACTIVITY_LEVELS[Math.max(bumpedIdx, 0)].mult;
      const targetCalories = Math.round(computedBmr * activityMult * (DIET_GOAL_CAL_MULT[bodyInfoForm.dietGoal] || 1));
      const targets = macroTargetsFromCalories(targetCalories, w, bodyInfoForm.gender, leanMassKg);
      const { error: err } = await sb.rpc("submit_self_body_info", {
        p_client_name: clientName, p_weight_kg: w, p_height_cm: h, p_age: a, p_gender: bodyInfoForm.gender,
        p_days_per_week: d, p_bmr: bmr, p_body_fat_pct: bodyFat, p_muscle_mass_kg: muscleMass,
        p_calories_target: targets.calories, p_protein_target: targets.protein, p_carbs_target: targets.carbs, p_fat_target: targets.fat
      });
      setSubmittingBodyInfo(false);
      if (err) { setBodyInfoError("Couldn't save that — try again."); return; }
      // submit_self_body_info doesn't take a water target, so it never sets
      // one — and with no water target, the water-logging card below has
      // nothing to measure against and stays hidden entirely. Best-effort
      // follow-up write, same 35ml/kg default used everywhere else (Sept 6
      // 2026 — Jimmy: "i also want to see the water log").
      sb.from("diet_plans").upsert([{
        user_id: userId, client_name: clientName, water_target_ml: waterTargetMlFromWeight(w)
      }], { onConflict: "user_id" }).then(() => {});
      // Seed the activity-level dropdown from training days, bumped up a tier if their
      // day-to-day routine is active too (not persisted — the client can still adjust
      // it directly with the dropdown on the browse screen).
      setActivityKey(ACTIVITY_LEVELS[Math.max(bumpedIdx, 0)].key);
      setTemplateGoal(bodyInfoForm.dietGoal);
      setEditingBodyInfo(false); // back to the browse screen, now showing the refreshed targets
      fetchLatestAssessment();
      fetchPlan();
    }

  return {
    latestAssessment, setLatestAssessment, fetchLatestAssessment,
    activityKey, setActivityKey,
    bodyInfoForm, setBodyInfoForm,
    submittingBodyInfo, bodyInfoError, setBodyInfoError,
    skipBodyInfo, setSkipBodyInfo, editingBodyInfo, setEditingBodyInfo,
    openBodyInfoEditor, handleSubmitBodyInfo,
  };
}
