import { useState, useEffect, useMemo } from "react";
import { dietGoalKeyFromText } from "../../../domain/group2.js";
import { isRetiredTemplate } from "../../../domain/group3.js";
import { sb } from "../../../platform/supabase.js";
import { notifyTrainer } from "../../../data/group1.js";
import { notifyOwner } from "../../../data/notifyOwner.js";
import { mealGenFormatPortion } from "../../../domain/group3.js";
import { MEAL_GEN_FOODS, MEAL_GEN_GOALS, MEAL_GEN_MEAL_LABELS, MEAL_GEN_MEAL_ORDER } from "../../../domain/nutrition.js";
import { MEAL_GEN_DIETS } from "../MEAL_GEN_DIETS.js";
import { generateMealPlan } from "../group1.js";

/**
 * Ready-made diet plan templates: the library, which goal/diet tab is being
 * browsed, which templates this client has already paid for, and picking or
 * switching between them.
 *
 * `handleSwitchToPaidPlan` and `trainerRestricted` stay in the component and
 * are passed in — the first is shared with the instant generator, the second
 * is a role flag the whole panel reads.
 */
export function useDietTemplates({
  userId, clientName, profile, plan, setPlan, mapPlanRow,
  handleSwitchToPaidPlan, trainerRestricted,
}) {
    // Sept 12 2026, Jimmy: "a section alone for the client when he buys a
    // plan and a section if he wants to see other plans" — once a plan is
    // unlocked, split "My plan" (the hero/meal detail/notes/instant plan)
    // from "Other plans" (paid templates + browse/switch) behind the same
    // pill pattern as Progress/Diet's own tabs, instead of one long scroll.
    const [dietPlanView, setDietPlanView] = useState("mine");
    const [pickingTemplate, setPickingTemplate] = useState(null); // template id being requested/assigned right now
    const [templates, setTemplates] = useState([]);
    const [templatesLoaded, setTemplatesLoaded] = useState(false);

    // Ready diet plan templates — needed both for a client browsing/picking one
    // and for resolving the name/goal/macros of whichever one they've already
    // picked, so fetch the whole library once regardless of canManage.
    useEffect(() => {
      if (!sb) { setTemplatesLoaded(true); return; }
      sb.from("diet_plan_templates").select("*").order("goal", { ascending: true }).order("order_index", { ascending: true }).then(({ data, error: err }) => {
        setTemplates(!err && data ? data : []);
        setTemplatesLoaded(true);
      });
    }, []);
    // Sept 12 2026, Jimmy: "i dont feel at all thats its easy access for the
    // client... a lot less cluttered on the eyes... change the set up from
    // rectangles to other... as clear and as interactive as possible" — a
    // second pass on this same screen. The earlier chevron-hides-just-the-
    // description version still left every plan as its own bordered
    // rectangle with an icon box, a macro line, a lock/paid line, AND a
    // full-width button all visible at once, repeated per plan. This
    // replaces that with a single accordion list (one shared container,
    // thin-divider rows) where a row is just a name + one macro line until
    // tapped — only one plan open at a time keeps it readable with many
    // plans in a goal. Shared by the manager's picker, the client's own
    // browse-and-pick, and the "switch plan" screen (renderTemplateBrowser
    // is the one function behind all three).
    const [openTemplateId, setOpenTemplateId] = useState(null);
    function toggleTemplateOpen(id) {
      setOpenTemplateId((cur) => (cur === id ? null : id));
    }
    // Sept 10 2026 fix: this used to always start on DIET_GOALS[0] ("Fat
    // loss") no matter what — a client whose stated goal was "build muscle"
    // still got shown Fat Loss plans and a fat-loss calorie recommendation
    // by default. Now starts on whichever goal tab actually matches the
    // client's own profile.goal free text (same keyword read used
    // everywhere else a free-text goal needs a DIET_GOALS key) — still just
    // a starting tab, they can switch to any goal themselves.
    const [templateGoal, setTemplateGoal] = useState(dietGoalKeyFromText(profile && profile.goal));
    // Sept 11 2026, Jimmy: "merge the two so the client has the option to
    // choose his goal his diet preference... beside standard lactose free
    // vegetarian and vegan" — a second chip strip next to the goal tabs in
    // renderTemplateBrowser, reusing the same standard/lactose-free/
    // vegetarian/vegan options the free instant generator already has. The
    // real ready templates don't vary by diet type (confirmed via SQL —
    // one template per goal×calorie tier, no per-diet variants), so this
    // never changes WHICH template/meal-items a client gets; it only picks
    // which MEAL_GEN_SWAPS set shows once they've bought a plan (see
    // handleSetDietPreference + the "Show food swaps" toggle below the real
    // Meal plan section). Starts from whatever's already saved on their
    // plan row, else "standard".
    const [templateDiet, setTemplateDiet] = useState((plan && plan.dietPreference) || "standard");
    const [showAssignedSwaps, setShowAssignedSwaps] = useState(false); // client: "Show food swaps" toggle under a real purchased plan's meal list
    const [assignedTemplateItems, setAssignedTemplateItems] = useState([]);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false); // manager: swap to a different ready plan
    const [showInstantGenerator, setShowInstantGenerator] = useState(false); // client: the "build me a plan now" generator
    const [showClientTemplatePicker, setShowClientTemplatePicker] = useState(false); // self-train client: request switching to a different ready plan once already unlocked — requires manager approval + payment, same as the first pick

    const [paidTemplateIds, setPaidTemplateIds] = useState([]);
    // Sept 11 2026, Jimmy: "i cant see the instant meal plan" — the free
    // generator is a one-time entitlement ("once a client has paid for a
    // diet plan (any way)"), not tied to whichever plan happens to be live
    // right now. A client who removes their current plan still paid for it
    // once, so this tracks "ever paid for ANY diet plan" (template-based or
    // custom) separately from paidTemplateIds above, which only covers
    // template-tagged payments — everPaidDiet below is what keeps the
    // instant-plan section visible after a Remove.
    const [everPaidDiet, setEverPaidDiet] = useState(false);
    useEffect(() => {
      if (!userId || !sb) { setPaidTemplateIds([]); setEverPaidDiet(false); return; }
      sb.from("client_payments").select("template_id").eq("user_id", userId).eq("note", "Diet plan unlock").then(({ data, error: err }) => {
        setPaidTemplateIds(!err && data ? [...new Set(data.map((r) => r.template_id).filter(Boolean))] : []);
        setEverPaidDiet(!err && !!(data && data.length));
      });
    }, [userId]);
    const paidTemplates = useMemo(
      () => paidTemplateIds.map((id) => templates.find((t) => t.id === id)).filter(Boolean).filter((t) => !isRetiredTemplate(t)),
      [paidTemplateIds, templates]
    );
    const [switchingToPaidId, setSwitchingToPaidId] = useState(null);

    // Sept 11 2026, Jimmy's "merge the two" ask — persists the diet-type
    // chip (standard/lactose-free/vegetarian/vegan) picked in
    // renderTemplateBrowser so it survives a refresh and drives which
    // MEAL_GEN_SWAPS set shows under a real purchased plan's meal list.
    // Deliberately a small, separate write (new RPC for the self-serve
    // path) rather than folding it into request_diet_plan_template/
    // request_diet_plan_switch — those existing RPCs' bodies aren't
    // visible here to safely edit, and this choice isn't part of the
    // paid request/approval flow anyway, just a display preference.
    async function handleSetDietPreference(dietKey) {
      setTemplateDiet(dietKey);
      if (!sb || !userId) return;
      setPlan((p) => (p ? { ...p, dietPreference: dietKey } : p));
      if (canManage && !selfLog) {
        await sb.from("diet_plans").upsert([{ user_id: userId, client_name: clientName, diet_preference: dietKey }], { onConflict: "user_id" });
      } else {
        await sb.rpc("set_diet_preference", { p_client_name: clientName, p_diet_preference: dietKey });
      }
    }

    useEffect(() => {
      if (!plan || !plan.templateId || !sb) { setAssignedTemplateItems([]); return; }
      sb.from("diet_template_meal_items").select("*").eq("template_id", plan.templateId).order("order_index", { ascending: true }).then(({ data, error: err }) => {
        setAssignedTemplateItems(!err && data ? data : []);
      });
    }, [plan && plan.templateId]);

    // A client picking a ready plan for themselves goes through the same
    // "only ever writes your own row" SECURITY DEFINER pattern as
    // handleRequestPlan above, just also stamping which template they picked.
    // A manager/trainer assigning one directly (no client request needed —
    // e.g. after doing the body assessment in person) already has full write
    // access to diet_plans elsewhere in this component, so that path just
    // upserts directly instead. Either way this never touches plan_unlocked —
    // marking it paid stays a separate, deliberate step via Unlock below.
    // Sept 6 2026, Jimmy: a trainer's own pick was going through the FREE
    // canManage branch below (since selfLog still passes canManage:true for
    // other reasons — editable notes, editable targets once paid) — meaning
    // once unlocked once, he could re-pick any template forever for free.
    // He wants "pay per plan, same as a client," so selfLog now goes through
    // the paid request_diet_plan_template path even though canManage is true.
    async function handlePickTemplate(templateId) {
      if (!sb || !userId) return;
      // Sept 11 2026, Jimmy: matches Programs' "Request this program" —
      // picking a plan is allowed even before the monthly app-access
      // payment; only actually USING a picked plan needs the app-access
      // (and plan) payments, both still gated elsewhere.
      if (trainerRestricted) return; // trainers request via handleTrainerRequestPlan instead — see above
      // Sept 11 2026, Jimmy: "reopen the one already paid ... same as
      // programs" — if this exact template is one they've already paid for
      // (client_payments has a row for it), re-picking it from this first-
      // pick browse flow must not ask them to pay again either, same
      // free-reactivate path handleSwitchTemplate already uses below.
      if (!canManage && paidTemplateIds.includes(templateId)) { handleSwitchToPaidPlan(templateId); return; }
      setPickingTemplate(templateId);
      if (canManage && !selfLog) {
        const { data, error: err } = await sb.from("diet_plans").upsert([{ user_id: userId, client_name: clientName, template_id: templateId }], { onConflict: "user_id" }).select();
        if (!err && data && data[0]) setPlan(mapPlanRow(data[0]));
      } else {
        const { error: err } = await sb.rpc("request_diet_plan_template", { p_client_name: clientName, p_template_id: templateId });
        if (!err) {
          setPlan((p) => (p ? { ...p, templateId, requestedAt: new Date().toISOString() } : { templateId, requestedAt: new Date().toISOString(), unlocked: false }));
          // Sept 17 2026, Jimmy: same diet-plan-request notification as
          // handleRequestPlan above. This branch is also reachable for a
          // trainer's own selfLog pick (see the big comment above this
          // function) — that's the trainer requesting for themselves, not a
          // client, so explicitly excluded here rather than notifying them
          // about their own action.
          if (!selfLog && profile && profile.trainer_id) {
            notifyTrainer(profile.trainer_id, `${clientName} requested a diet plan.`);
            notifyOwner(`${clientName} requested a diet plan.`, { viaTrainerId: profile.trainer_id });
          } else if (!selfLog) {
            // Sept 18 2026, Jimmy: self-train clients (no trainer_id) have no
            // trainer to notify, but Jimmy still wants to know — same reasoning
            // as the self-train sign-up fix (see notifyOwner's allowGlobalFallback).
            notifyOwner(`${clientName} requested a diet plan (self-training, no trainer).`, { allowGlobalFallback: true });
          }
        }
      }
      setPickingTemplate(null);
      setShowTemplatePicker(false);
    }

    // Lets a self-train client REQUEST switching to a different ready plan
    // once they've already unlocked one — Jimmy's call: a switch charges
    // again, same as the first pick did (not a free swap). This only ever
    // stamps pending_switch_template_id + plan_requested_at, deliberately
    // leaving the LIVE template_id and plan_unlocked untouched — so the
    // client keeps seeing (and keeps access to) their current plan the
    // whole time this sits in the manager's Diet plan requests queue. The
    // new plan only ever becomes real once a manager marks it paid
    // (DietPlanRequestRow.handleUnlock promotes pending_switch_template_id
    // into template_id at that point) — never automatically, and never from
    // this function.
    async function handleSwitchTemplate(templateId) {
      if (!sb || !userId) return;
      // Sept 11 2026, Jimmy: matches the first-pick flow's same fix earlier
      // today — requesting a switch is allowed even before this month's
      // app-access payment; only actually USING the new plan needs it,
      // gated elsewhere (same reasoning as handleRequestPlan/handlePickTemplate).
      // Already paid for this exact template before (client_payments has a
      // row for it) — no reason to charge again or make them wait on a
      // manager, so this quietly takes the same free instant path the
      // "Your paid plans" list uses instead of opening a new paid request.
      if (paidTemplateIds.includes(templateId)) { handleSwitchToPaidPlan(templateId); return; }
      setPickingTemplate(templateId);
      const { error: err } = await sb.rpc("request_diet_plan_switch", { p_client_name: clientName, p_template_id: templateId });
      if (!err) setPlan((p) => (p ? { ...p, pendingSwitchTemplateId: templateId, requestedAt: new Date().toISOString() } : p));
      setPickingTemplate(null);
      setShowClientTemplatePicker(false);
    }

    function assignedTemplateMealGroups() {
      const byMeal = {};
      const order = [];
      assignedTemplateItems.forEach((r) => {
        if (!byMeal[r.meal_label]) { byMeal[r.meal_label] = []; order.push(r.meal_label); }
        byMeal[r.meal_label].push(r);
      });
      return order.map((label) => ({ label, rows: byMeal[label] }));
    }

    // Sept 11 2026, Jimmy, after testing the diet-preference chips: "i chose
    // vegan and muscle gain it only showed muscle gain and still showing
    // chicken and eggs and fish" — the chips alone only changed which
    // MEAL_GEN_SWAPS list showed; the actual meal items stayed whatever's
    // curated in diet_template_meal_items (always the same animal-inclusive
    // foods, since there's only one real template per goal×calorie tier).
    // This is the real fix: once a client's diet_preference is anything but
    // "standard", swap the DISPLAYED meal items for a live-computed plan
    // from the exact same generateMealPlan() engine the free instant
    // generator uses — same goal + same calorie target as the template
    // they bought — so picking Vegan actually returns vegan foods instead
    // of a swap suggestion tacked on under chicken and eggs. "standard"
    // (the default) keeps showing the real curated template rows exactly
    // as before — untouched, still the same trusted data Jimmy already
    // confirmed working. Reshapes generateMealPlan's {food, grams} output
    // into the same {food_item, portion, calories, protein, carbs, fat}
    // shape assignedTemplateMealGroups' real rows have, so every call site
    // below (client view, trainer view, manager view) can swap in this
    // function without any other change.
    function resolvedMealGroups() {
      if (!assignedTemplate) return assignedTemplateMealGroups();
      const dietPref = (plan && plan.dietPreference) || "standard";
      if (dietPref === "standard" || !MEAL_GEN_DIETS[dietPref] || assignedTemplate.calories_target == null || !MEAL_GEN_GOALS[assignedTemplate.goal]) {
        return assignedTemplateMealGroups();
      }
      const result = generateMealPlan(assignedTemplate.goal, dietPref, assignedTemplate.calories_target);
      return MEAL_GEN_MEAL_ORDER.filter((m) => result.meals[m].length > 0).map((m) => ({
        label: MEAL_GEN_MEAL_LABELS[m],
        rows: result.meals[m].map((it, i) => {
          const d = MEAL_GEN_FOODS[it.food];
          return {
            id: `gen-${m}-${it.food}-${i}`,
            food_item: d.label,
            portion: mealGenFormatPortion(it.food, it.grams),
            calories: Math.round((d.p * it.grams) / 100 * 4 + (d.c * it.grams) / 100 * 4 + (d.f * it.grams) / 100 * 9),
            protein: Math.round((d.p * it.grams) / 100),
            carbs: Math.round((d.c * it.grams) / 100),
            fat: Math.round((d.f * it.grams) / 100),
            notes: null
          };
        })
      }));
    }

  const assignedTemplate = plan && plan.templateId
    ? templates.find((t) => t.id === plan.templateId)
    : null;

  return {
    templates, templatesLoaded, assignedTemplate,
    dietPlanView, setDietPlanView,
    openTemplateId, toggleTemplateOpen,
    templateGoal, setTemplateGoal, templateDiet, setTemplateDiet,
    assignedTemplateItems, showAssignedSwaps, setShowAssignedSwaps,
    showTemplatePicker, setShowTemplatePicker,
    showInstantGenerator, setShowInstantGenerator,
    showClientTemplatePicker, setShowClientTemplatePicker,
    pickingTemplate, setPickingTemplate,
    paidTemplateIds, everPaidDiet, paidTemplates, switchingToPaidId,
    handleSetDietPreference, handlePickTemplate, handleSwitchTemplate,
    assignedTemplateMealGroups, resolvedMealGroups,
  };
}
