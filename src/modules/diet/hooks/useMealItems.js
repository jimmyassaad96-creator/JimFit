import { useState, useEffect } from "react";
import { BLANK_MEAL_ITEM_FORM } from "../../../domain/group1.js";
import { sb } from "../../../platform/supabase.js";
import { macroFieldError } from "../../../domain/group3.js";

/**
 * The individual foods on a client's diet plan (`diet_meal_items`), grouped by
 * meal label, and the add/edit form over them.
 *
 * Needs `ensurePlanId` from the component because meal items hang off a
 * diet_plans row that is created lazily on first use.
 */
export function useMealItems({ plan, ensurePlanId }) {
    const [mealItems, setMealItems] = useState([]);
    const [mealItemsLoaded, setMealItemsLoaded] = useState(false);
    const [addMealTarget, setAddMealTarget] = useState(null); // meal_label — add a food item to this existing meal
    const [newMealOpen, setNewMealOpen] = useState(false); // adding a brand-new meal (with its own label)
    const [editMealItemId, setEditMealItemId] = useState(null);
    const [mealItemForm, setMealItemForm] = useState(BLANK_MEAL_ITEM_FORM);
    const [mealItemSaving, setMealItemSaving] = useState(false);
    const [mealItemError, setMealItemError] = useState("");

    useEffect(() => {
      if (!plan || !plan.id || !sb) { setMealItems([]); setMealItemsLoaded(true); return; }
      setMealItemsLoaded(false);
      sb.from("diet_meal_items").select("*").eq("plan_id", plan.id).order("order_index", { ascending: true }).then(({ data, error: err }) => {
        setMealItems(!err && data ? data : []);
        setMealItemsLoaded(true);
      });
    }, [plan && plan.id]);

    function mealGroups() {
      const byMeal = {};
      const order = [];
      mealItems.forEach((r) => {
        if (!byMeal[r.meal_label]) { byMeal[r.meal_label] = []; order.push(r.meal_label); }
        byMeal[r.meal_label].push(r);
      });
      return order.map((label) => ({ label, rows: byMeal[label] }));
    }

    function openAddToMeal(mealLabel) {
      setNewMealOpen(false); setEditMealItemId(null);
      setAddMealTarget(mealLabel);
      setMealItemForm({ ...BLANK_MEAL_ITEM_FORM, mealLabel });
      setMealItemError("");
    }
    function openAddNewMeal() {
      setAddMealTarget(null); setEditMealItemId(null);
      setNewMealOpen(true);
      setMealItemForm(BLANK_MEAL_ITEM_FORM);
      setMealItemError("");
    }
    function openEditMealItem(item) {
      setAddMealTarget(null); setNewMealOpen(false);
      setEditMealItemId(item.id);
      setMealItemForm({
        mealLabel: item.meal_label, foodItem: item.food_item, portion: item.portion || "",
        calories: item.calories != null ? String(item.calories) : "",
        protein: item.protein != null ? String(item.protein) : "",
        carbs: item.carbs != null ? String(item.carbs) : "",
        fat: item.fat != null ? String(item.fat) : "",
        notes: item.notes || ""
      });
      setMealItemError("");
    }
    function closeMealItemForm() {
      setAddMealTarget(null); setNewMealOpen(false); setEditMealItemId(null);
      setMealItemForm(BLANK_MEAL_ITEM_FORM); setMealItemError("");
    }

    async function handleSaveMealItem() {
      if (!mealItemForm.foodItem.trim()) { setMealItemError("Enter a food item."); return; }
      if (newMealOpen && !mealItemForm.mealLabel.trim()) { setMealItemError("Enter a meal name (e.g. Breakfast)."); return; }
      const macroErr = macroFieldError(mealItemForm);
      if (macroErr) { setMealItemError(macroErr); return; }
      if (!sb) { setMealItemError("Backend not configured yet."); return; }
      setMealItemError("");
      setMealItemSaving(true);

      if (editMealItemId) {
        const payload = {
          meal_label: mealItemForm.mealLabel.trim(),
          food_item: mealItemForm.foodItem.trim(),
          portion: mealItemForm.portion.trim() || null,
          calories: mealItemForm.calories === "" ? null : Number(mealItemForm.calories),
          protein: mealItemForm.protein === "" ? null : Number(mealItemForm.protein),
          carbs: mealItemForm.carbs === "" ? null : Number(mealItemForm.carbs),
          fat: mealItemForm.fat === "" ? null : Number(mealItemForm.fat),
          notes: mealItemForm.notes.trim() || null
        };
        const { data, error: err } = await sb.from("diet_meal_items").update(payload).eq("id", editMealItemId).select();
        setMealItemSaving(false);
        if (err || !data) { setMealItemError("Couldn't save those changes. Try again."); return; }
        setMealItems((prev) => prev.map((r) => (r.id === editMealItemId ? data[0] : r)));
        closeMealItemForm();
        return;
      }

      const planId = await ensurePlanId();
      if (!planId) { setMealItemSaving(false); setMealItemError("Couldn't save. Try again."); return; }
      const mealLabel = newMealOpen ? mealItemForm.mealLabel.trim() : addMealTarget;
      const existingInMeal = mealItems.filter((r) => r.meal_label === mealLabel);
      const payload = {
        plan_id: planId,
        meal_label: mealLabel,
        food_item: mealItemForm.foodItem.trim(),
        portion: mealItemForm.portion.trim() || null,
        calories: mealItemForm.calories === "" ? null : Number(mealItemForm.calories),
        protein: mealItemForm.protein === "" ? null : Number(mealItemForm.protein),
        carbs: mealItemForm.carbs === "" ? null : Number(mealItemForm.carbs),
        fat: mealItemForm.fat === "" ? null : Number(mealItemForm.fat),
        notes: mealItemForm.notes.trim() || null,
        order_index: existingInMeal.length
      };
      const { data, error: err } = await sb.from("diet_meal_items").insert([payload]).select();
      setMealItemSaving(false);
      if (err || !data) { setMealItemError("Couldn't save that item. Try again."); return; }
      setMealItems((prev) => [...prev, data[0]]);
      closeMealItemForm();
    }

    async function handleDeleteMealItem(id) {
      setMealItems((prev) => prev.filter((r) => r.id !== id));
      if (sb) await sb.from("diet_meal_items").delete().eq("id", id);
    }

  return {
    mealItems, setMealItems, mealItemsLoaded, mealGroups,
    addMealTarget, setAddMealTarget,
    newMealOpen, setNewMealOpen, editMealItemId, setEditMealItemId,
    mealItemForm, setMealItemForm, mealItemSaving, mealItemError,
    openAddToMeal, openAddNewMeal, openEditMealItem, closeMealItemForm,
    handleSaveMealItem, handleDeleteMealItem,
  };
}
