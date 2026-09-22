import { useState, useEffect, useRef } from "react";
import { todayISO } from "../../../shared/lib/dates.js";
import { sb } from "../../../platform/supabase.js";

/**
 * A client's daily food and water log: the `diet_logs` rows, the day being
 * viewed, the macro fields for that day, and the water counter with its
 * count-up animation.
 *
 * `saving` and `error` stay in the component and their setters are passed in:
 * both are shared with the plan editors, and owning either here would make
 * this hook and useDietPlan mutually dependent.
 */
export function useFoodLog({ userId, clientName, setSaving, setError }) {
    const [logs, setLogs] = useState([]);
    const [logsLoaded, setLogsLoaded] = useState(false);

    const [logDate, setLogDate] = useState(todayISO());
    const [logCalories, setLogCalories] = useState("");
    const [logProtein, setLogProtein] = useState("");
    const [logCarbs, setLogCarbs] = useState("");
    const [logFat, setLogFat] = useState("");

    const [addingWater, setAddingWater] = useState(false);
    // Sept 13 2026, Jimmy: "every delete button in the app... show inside
    // the page not above like the jimfit app says reset todays whatever" —
    // was window.confirm(); this now drives the inline "are you sure" bar
    // under the Water intake card, same as every other delete in the app.
    const [confirmResetWater, setConfirmResetWater] = useState(false);
    // Sept 19 2026 inspection fix: a History day's delete used to fire
    // straight from the trash icon with no "are you sure" and no check on
    // whether the delete actually succeeded — same inline-confirm pattern
    // as confirmResetWater above, just per-row (holds the log id being
    // confirmed, or null).
    const [confirmDeleteLogId, setConfirmDeleteLogId] = useState(null);
    const [deletingLogId, setDeletingLogId] = useState(null);

    function mapLogRow(row) {
      return { id: row.id, date: row.log_date, calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat, water: row.water_ml, note: row.note };
    }



    // Sept 6 2026, Jimmy: "if he bought 2 he see two no?" — every ready
    // template this person has ever actually paid for (client_payments
    // rows tag template_id, same column the manager's free-restore check
    // already reads), so they can see all of them and jump back to any one
    // instantly, not just whichever happens to be live right now.

    useEffect(() => {
      if (!userId || !sb) { setLogs([]); setLogsLoaded(true); return; }
      setLogsLoaded(false);
      sb.from("diet_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).then(({ data, error: err }) => {
        setLogs(!err && data ? data.map(mapLogRow) : []);
        setLogsLoaded(true);
      });
    }, [userId]);

    const selectedLog = logs.find((l) => l.date === logDate);

    // Sept 13 2026, Jimmy: "when u add a one of ml to add the number like
    // dragging each other" — the water ml count now counts up smoothly to
    // its new total instead of snapping, same +250/500/750ml taps and
    // handleAddWater/handleResetWater logic underneath, purely a visual
    // easing on how the number displays.
    const [displayedWaterMl, setDisplayedWaterMl] = useState((selectedLog && selectedLog.water) || 0);
    const waterAnimFrame = useRef(null);
    const waterAnimDate = useRef(logDate);
    useEffect(() => {
      const target = (selectedLog && selectedLog.water) || 0;
      // Switching to a different logged day (not a +ml tap on the same
      // day) should just show that day's total right away, not count up
      // from whatever the previous day happened to show.
      if (waterAnimDate.current !== logDate) {
        waterAnimDate.current = logDate;
        if (waterAnimFrame.current) cancelAnimationFrame(waterAnimFrame.current);
        setDisplayedWaterMl(target);
        return;
      }
      setDisplayedWaterMl((start) => {
        if (start === target) return start;
        const from = start;
        const duration = 450;
        const startTime = performance.now();
        if (waterAnimFrame.current) cancelAnimationFrame(waterAnimFrame.current);
        const tick = (now) => {
          const t = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplayedWaterMl(Math.round(from + (target - from) * eased));
          if (t < 1) waterAnimFrame.current = requestAnimationFrame(tick);
        };
        waterAnimFrame.current = requestAnimationFrame(tick);
        return start;
      });
      return () => { if (waterAnimFrame.current) cancelAnimationFrame(waterAnimFrame.current); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLog && selectedLog.water, logDate]);

    useEffect(() => {
      if (selectedLog) {
        setLogCalories(selectedLog.calories != null ? String(selectedLog.calories) : "");
        setLogProtein(selectedLog.protein != null ? String(selectedLog.protein) : "");
        setLogCarbs(selectedLog.carbs != null ? String(selectedLog.carbs) : "");
        setLogFat(selectedLog.fat != null ? String(selectedLog.fat) : "");
      } else {
        setLogCalories(""); setLogProtein(""); setLogCarbs(""); setLogFat("");
      }
    }, [logs, logDate]);

    async function handleSaveTodayLog() {
      setError("");
      if (!sb || !userId) { setError("Backend not configured yet."); return; }
      if (!logDate) { setError("Pick a date first."); return; }
      setSaving(true);
      const payload = {
        calories: logCalories === "" ? null : Number(logCalories),
        protein: logProtein === "" ? null : Number(logProtein),
        carbs: logCarbs === "" ? null : Number(logCarbs),
        fat: logFat === "" ? null : Number(logFat)
      };
      if (selectedLog) {
        const { error: err } = await sb.from("diet_logs").update(payload).eq("id", selectedLog.id);
        setSaving(false);
        if (err) { setError("Couldn't save that day's log. Try again."); return; }
        setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, ...payload } : l)));
      } else {
        const { data, error: err } = await sb.from("diet_logs").insert([{ user_id: userId, client_name: clientName, log_date: logDate, water_ml: 0, ...payload }]).select();
        setSaving(false);
        if (err || !data) { setError("Couldn't save that day's log. Try again."); return; }
        setLogs((prev) => [mapLogRow(data[0]), ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)));
      }
    }

    async function handleAddWater(ml) {
      if (!sb || !userId) return;
      setError("");
      setAddingWater(true);
      if (selectedLog) {
        const prevWater = selectedLog.water || 0;
        const newWater = prevWater + ml;
        setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, water: newWater } : l)));
        const { error: err } = await sb.from("diet_logs").update({ water_ml: newWater }).eq("id", selectedLog.id);
        // Sept 19 2026 inspection fix: a failed update used to leave the
        // bumped-up water count showing with nothing wrong on screen — it
        // just silently reverted next time the log reloaded. Same
        // "revert + say so" pattern as handleResetWater right below.
        if (err) {
          setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, water: prevWater } : l)));
          setError("Couldn't add water — try again.");
        }
      } else {
        const { data, error: err } = await sb.from("diet_logs").insert([{ user_id: userId, client_name: clientName, log_date: logDate, water_ml: ml }]).select();
        if (!err && data && data[0]) {
          setLogs((prev) => [mapLogRow(data[0]), ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)));
        } else {
          setError("Couldn't add water — try again.");
        }
      }
      setAddingWater(false);
    }

    async function handleDeleteLog(id) {
      setConfirmDeleteLogId(null);
      setDeletingLogId(id);
      const removed = logs.find((l) => l.id === id) || null;
      setLogs((prev) => prev.filter((l) => l.id !== id));
      if (sb) {
        const { error: err } = await sb.from("diet_logs").delete().eq("id", id);
        if (err) {
          // Same "put it back and say so" pattern as handleResetWater —
          // a failed delete used to leave the row gone from the screen
          // with no sign the database still has it.
          if (removed) setLogs((prev) => [removed, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)));
          setError("Couldn't delete that day's log — try again.");
          setDeletingLogId(null);
          return;
        }
      }
      setDeletingLogId(null);
    }

    // Sept 8 2026, Jimmy: water is a running total for the day, not a list
    // of individual adds — so there's nothing to delete one-by-one. This
    // resets that day's total back to 0, for a mis-tap (e.g. hit +750ml
    // instead of +250ml) — same "confirm, optimistic update, revert on
    // failure" pattern used elsewhere in the app for a destructive action.
    async function handleResetWater() {
      if (!selectedLog || !selectedLog.water) return;
      setConfirmResetWater(false);
      const prevWater = selectedLog.water;
      setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, water: 0 } : l)));
      if (!sb) return;
      const { error: err } = await sb.from("diet_logs").update({ water_ml: 0 }).eq("id", selectedLog.id);
      if (err) {
        setLogs((prev) => prev.map((l) => (l.id === selectedLog.id ? { ...l, water: prevWater } : l)));
        setError("Couldn't reset water — try again.");
      }
    }

  return {
    logs, setLogs, logsLoaded, mapLogRow, selectedLog,
    logDate, setLogDate,
    logCalories, setLogCalories, logProtein, setLogProtein,
    logCarbs, setLogCarbs, logFat, setLogFat,
    addingWater, confirmResetWater, setConfirmResetWater,
    confirmDeleteLogId, setConfirmDeleteLogId, deletingLogId,
    displayedWaterMl,
    handleSaveTodayLog, handleAddWater, handleDeleteLog, handleResetWater,
  };
}
