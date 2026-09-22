# Hooks Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the five remaining oversized components under the size budget by moving their state and effects into custom hooks, without changing what the app does.

**Architecture:** Each component's `useState`/`useEffect` clusters move into `use*` hooks beside it. A hook closes over nothing external, so nothing is threaded as props — this is the one decomposition that works on a component whose closure holds 72–196 names. Once the state is out, the JSX shrinks enough that subtrees become extractable; that is a later plan, not this one.

**Tech Stack:** React 18 (`React.createElement`, no JSX), Vitest 5 + happy-dom, Playwright 1.63, all on bun.

**Spec:** `docs/superpowers/specs/2026-09-20-modular-architecture-and-test-foundation-design.md`

**Prior plan:** `docs/superpowers/plans/2026-09-20-foundation-and-module-split.md` (Tasks 1–9 done; this replaces its Task 10, which assumed a sub-view move that the measurements showed does not exist)

## Global Constraints

- **Behaviour-preserving.** Same state, same effects, same order — relocated only. Any visible difference is a bug in this work.
- **Hook call order is load-bearing.** React matches state to call position. A hook must call its `useState`/`useEffect` in the same relative order the component did, and the component must call its hooks in the order those blocks appeared. Reordering silently rebinds state to the wrong variable.
- **`index.html` stays the shipped artifact** and must not be edited.
- **Do not re-run the codemod.** `src/` is the source of truth (`tools/extract/README.md`).
- **One hook per commit**, with `bun run test && bun run e2e && bun run boundaries` green before each.
- **Never push.** Commits only.
- Size budget: no file over 400 lines, no component over 200.
- Hooks live in `<module>/hooks/use<Name>.js` and may import `data/`, `domain/`, `platform/` and `shared/` — the same layers their component may.

## Measured starting point

| file | lines | in inner fns | in one JSX return | hooks | closure names |
|---|---|---|---|---|---|
| `modules/diet/DietPanel.js` | 2,244 | 581 | 913 | 76 | 196 |
| `app/TrainingLog.js` | 1,897 | 351 | 703 | 85 | 172 |
| `app/CoachView.js` | 1,702 | 425 | 477 | 71 | 141 |
| `modules/programs/ProgramsPanel.js` | 1,008 | 417 | 382 | 34 | 82 |
| `app/TrainerView.js` | 998 | 102 | 322 | 40 | 72 |

---

## Part A — Interaction coverage (prerequisite)

The existing 35 tests assert that the right screen renders. They would not
catch a hook that rebinds state to the wrong variable, because the screen
still renders. Part B must not start until these pass.

### Task 1: Drive the workout entry form

**Files:**
- Create: `tests/e2e/client-logging.spec.js`
- Modify: `tests/harness/fixtures.js` (fixtures for a saved entry)

**Interfaces:**
- Consumes: `boot`, `openTab`, `installSupabaseFixtures`
- Produces: proof that opening the form, entering an exercise and sets, and saving reaches the feed

- [ ] **Step 1: Write the failing test**

```js
import { test, expect } from "@playwright/test";
import { boot } from "../harness/fixtures.js";

test.beforeEach(async ({ page }) => boot(page, "client"));

test("new exercise opens the entry form", async ({ page }) => {
  await page.getByText("New exercise", { exact: true }).first().click();
  await expect(page.getByPlaceholder(/exercise/i).first()).toBeVisible();
});

test("typing an exercise and a set enables saving", async ({ page }) => {
  await page.getByText("New exercise", { exact: true }).first().click();
  await page.getByPlaceholder(/exercise/i).first().fill("Bench Press");
  const reps = page.getByPlaceholder(/reps/i).first();
  const weight = page.getByPlaceholder(/weight|kg/i).first();
  await reps.fill("8");
  await weight.fill("60");
  await expect(reps).toHaveValue("8");
  await expect(weight).toHaveValue("60");
});
```

- [ ] **Step 2: Run it**

Run: `bun run e2e -- client-logging`
Expected: FAIL on the placeholder locators — they are guesses.

- [ ] **Step 3: Discover the real form**

```js
// tests/e2e/_discover.spec.js — delete once the selectors are known
import { test } from "@playwright/test";
import { boot } from "../harness/fixtures.js";
test("form", async ({ page }) => {
  await boot(page, "client");
  await page.getByText("New exercise", { exact: true }).first().click();
  await page.waitForTimeout(800);
  console.log("PLACEHOLDERS " + JSON.stringify(
    await page.locator("input,textarea").evaluateAll(
      els => els.map(e => ({ ph: e.placeholder, type: e.type, label: e.getAttribute("aria-label") })))));
  console.log("TEXT " + (await page.locator("#root").innerText()).replace(/\n+/g, " | ").slice(0, 800));
});
```

Run: `bun x playwright test tests/e2e/_discover.spec.js --reporter=list`
Then rewrite Step 1's locators from the output and delete the discovery spec.

- [ ] **Step 4: Run to green**

Run: `bun run e2e`
Expected: all pass. Assertions describe what the form does today, not what it should do.

- [ ] **Step 5: Commit**

```bash
git add tests && git commit -m "test: characterize the workout entry form"
```

---

### Task 2: Drive the diet food log and meal items

**Files:**
- Create: `tests/e2e/client-diet-interaction.spec.js`

**Interfaces:**
- Consumes: `boot`, `openTab`
- Produces: the regression gate for `useFoodLog` and `useMealItems` in Tasks 5 and 6

- [ ] **Step 1: Discover the food-log controls**

Reuse the discovery spec from Task 1, but after `openTab(page, "Diet")` and clicking "Food log". Record the real control labels, then delete it.

- [ ] **Step 2: Write assertions for the three behaviours the hooks own**

Cover: switching `logDate` changes which day's totals show; entering calories/protein/carbs/fat updates the inputs; the water control increments the displayed amount. One assertion per behaviour, using the discovered locators.

- [ ] **Step 3: Run to green, then commit**

```bash
bun run e2e
git add tests && git commit -m "test: characterize diet food logging and meal items"
```

---

### Task 3: Drive the coach roster selection

**Files:**
- Create: `tests/e2e/coach.spec.js`
- Modify: `tests/harness/demo-build.js` (a `coach` variant)

**Interfaces:**
- Consumes: `VARIANTS`
- Produces: coverage for `CoachView`, which currently has none

- [ ] **Step 1: Add the variant**

`CoachView` renders when the signed-in email is in `MANAGER_EMAILS`. The demo seed sets no `userEmail`, so add a variant that seeds one and patch `const [userEmail, setUserEmail] = useState(null);` to read `window.__DEMO.userEmail`, exactly as the other gate patches do — one match asserted.

- [ ] **Step 2: Discover what the coach surface renders**, then assert the roster list, the client-detail tabs and the trainers panel.

- [ ] **Step 3: Run to green, then commit**

```bash
bun run e2e
git add tests tests/harness && git commit -m "test: characterize the coach roster and trainer admin"
```

---

## Part B — Extract the hooks

Each task: create the hook, move the state and effects verbatim, call it from
the component, delete the moved lines, verify, commit.

### Task 4: `useDietPlan`

**Files:**
- Create: `src/modules/diet/hooks/useDietPlan.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Consumes: `sb` from `platform/supabase.js`, `mapPlanRow` (moves into the hook file)
- Produces:
```js
useDietPlan({ userId, clientName }) -> {
  plan, setPlan, planLoaded,
  mealPlanDraft, setMealPlanDraft, editingMealPlan, setEditingMealPlan,
  dietaryNotesDraft, setDietaryNotesDraft, editingDietaryNotes, setEditingDietaryNotes,
  savingDietaryNotes,
  fetchPlan, handleSaveMealPlan, handleCancelMealPlan,
  handleSaveDietaryNotes, handleCancelDietaryNotes,
}
```

- [ ] **Step 1: Create the hook file with the state moved verbatim**

```js
import { useState, useEffect } from "react";
import { sb } from "../../../platform/supabase.js";

// Extracted from DietPanel. The useState calls keep the order they had in the
// component — React matches state to call position, so reordering them
// silently rebinds a value to the wrong variable.
export function useDietPlan({ userId, clientName }) {
  const [plan, setPlan] = useState(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [mealPlanDraft, setMealPlanDraft] = useState("");
  const [editingMealPlan, setEditingMealPlan] = useState(false);
  const [editingDietaryNotes, setEditingDietaryNotes] = useState(false);
  const [dietaryNotesDraft, setDietaryNotesDraft] = useState("");
  const [savingDietaryNotes, setSavingDietaryNotes] = useState(false);

  // ...mapPlanRow, fetchPlan, handleSaveMealPlan, handleCancelMealPlan,
  // handleSaveDietaryNotes and handleCancelDietaryNotes move here unchanged...

  return {
    plan, setPlan, planLoaded,
    mealPlanDraft, setMealPlanDraft, editingMealPlan, setEditingMealPlan,
    dietaryNotesDraft, setDietaryNotesDraft,
    editingDietaryNotes, setEditingDietaryNotes, savingDietaryNotes,
    fetchPlan, handleSaveMealPlan, handleCancelMealPlan,
    handleSaveDietaryNotes, handleCancelDietaryNotes,
  };
}
```

- [ ] **Step 2: Call it from `DietPanel`, at the position the first moved `useState` occupied**

```js
const {
  plan, setPlan, planLoaded,
  mealPlanDraft, setMealPlanDraft, editingMealPlan, setEditingMealPlan,
  dietaryNotesDraft, setDietaryNotesDraft,
  editingDietaryNotes, setEditingDietaryNotes, savingDietaryNotes,
  fetchPlan, handleSaveMealPlan, handleCancelMealPlan,
  handleSaveDietaryNotes, handleCancelDietaryNotes,
} = useDietPlan({ userId, clientName });
```

- [ ] **Step 3: Delete the moved declarations and functions from `DietPanel`**

Nothing else in the JSX changes — the destructured names are identical to the ones it already reads.

- [ ] **Step 4: Verify**

Run: `bun run typecheck && bun run boundaries && bun run test && bun run e2e`
Expected: all green. A test failing here means a name or an order changed.

- [ ] **Step 5: Commit**

```bash
git add src/modules/diet
git commit -m "refactor: extract useDietPlan from DietPanel"
```

---

### Task 5: `useFoodLog`

**Files:**
- Create: `src/modules/diet/hooks/useFoodLog.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Produces:
```js
useFoodLog({ userId, clientName }) -> {
  logs, setLogs, logsLoaded, logDate, setLogDate,
  logCalories, setLogCalories, logProtein, setLogProtein,
  logCarbs, setLogCarbs, logFat, setLogFat,
  saving, error, setError,
  addingWater, confirmResetWater, setConfirmResetWater,
  displayedWaterMl, confirmDeleteLogId, setConfirmDeleteLogId, deletingLogId,
  selectedLog, handleSaveLog, handleDeleteLog, handleAddWater, handleResetWater,
}
```

State moved: `logs`, `logsLoaded`, `logDate`, `logCalories`, `logProtein`,
`logCarbs`, `logFat`, `saving`, `error`, `addingWater`, `confirmResetWater`,
`confirmDeleteLogId`, `deletingLogId`, `displayedWaterMl`, plus the
`waterAnimFrame` / `waterAnimDate` refs and the `selectedLog` derivation.

- [ ] **Step 1: Create the hook, moving those declarations in their existing order.**
- [ ] **Step 2: Call it from `DietPanel` at the position the first moved `useState` held.**
- [ ] **Step 3: Delete the moved lines.**
- [ ] **Step 4: Run `bun run typecheck && bun run boundaries && bun run test && bun run e2e`.** All green, or revert.
- [ ] **Step 5: Commit** — `git commit -m "refactor: extract useFoodLog from DietPanel"`

---

### Task 6: `useMealItems`

**Files:**
- Create: `src/modules/diet/hooks/useMealItems.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Produces:
```js
useMealItems({ userId, clientName, plan }) -> {
  mealItems, setMealItems, mealItemsLoaded,
  newMealOpen, setNewMealOpen, editMealItemId, setEditMealItemId,
  mealItemForm, setMealItemForm, mealItemSaving, mealItemError,
  mealGroups, openAddToMeal, openAddNewMeal, openEditMealItem,
  closeMealItemForm, handleSaveMealItem, handleDeleteMealItem,
}
```

State moved: `mealItems`, `mealItemsLoaded`, `newMealOpen`, `editMealItemId`,
`mealItemForm`, `mealItemSaving`, `mealItemError`.

- [ ] **Step 1–5:** same shape as Task 5 — create, call in position, delete, verify all four gates, commit as `"refactor: extract useMealItems from DietPanel"`.

---

### Task 7: `useDietTemplates`

**Files:**
- Create: `src/modules/diet/hooks/useDietTemplates.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Produces:
```js
useDietTemplates({ userId, profile, plan }) -> {
  templates, templatesLoaded, openTemplateId, toggleTemplateOpen,
  templateGoal, setTemplateGoal, templateDiet, setTemplateDiet,
  assignedTemplateItems, dietPlanView, setDietPlanView,
  paidTemplateIds, everPaidDiet, switchingToPaidId,
  paidTemplates, assignedTemplateMealGroups, resolvedMealGroups, handlePickTemplate,
}
```

State moved: `templates`, `templatesLoaded`, `openTemplateId`, `templateGoal`,
`templateDiet`, `assignedTemplateItems`, `dietPlanView`, `paidTemplateIds`,
`everPaidDiet`, `switchingToPaidId`, and the `paidTemplates` memo.

- [ ] **Step 1–5:** create, call in position, delete, verify, commit as `"refactor: extract useDietTemplates from DietPanel"`.

---

### Task 8: `useDietPurchase` and `useBodyInfo`

**Files:**
- Create: `src/modules/diet/hooks/useDietPurchase.js`, `src/modules/diet/hooks/useBodyInfo.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Produces:
```js
useDietPurchase({ userId, clientName, plan, setPlan }) -> {
  unlocking, setUnlocking, unlockAmount, setUnlockAmount,
  unlockDate, setUnlockDate, unlockSaving, unlockError,
  requestingPlan, cancelingRequest, cancelingSwitch,
  unassigningPlan, confirmUnassignPlan, setConfirmUnassignPlan,
  nudgeSent, handleUnlockPlan, handleNudgeTrainer,
}

useBodyInfo({ userId, profile }) -> {
  latestAssessment, activityKey, setActivityKey,
  submittingBodyInfo, bodyInfoError,
  fetchLatestAssessment, openBodyInfoEditor, handleSubmitBodyInfo,
}
```

Two hooks in one task because each is small and they share no state; splitting
them across commits would not give a reviewer anything extra to reject.

- [ ] **Step 1–5:** create both, call in position, delete, verify, commit as `"refactor: extract useDietPurchase and useBodyInfo from DietPanel"`.

- [ ] **Step 6: Confirm the budget is met**

Run: `wc -l src/modules/diet/DietPanel.js`
Expected: under 900, down from 2,244. Still over the 400-line budget — the
remainder is the 913-line JSX return, which the follow-up plan carves up.

---

### Task 9: `useSession` and `useClientProfile` (TrainingLog)

**Files:**
- Create: `src/app/hooks/useSession.js`, `src/app/hooks/useClientProfile.js`
- Modify: `src/app/TrainingLog.js`

**Interfaces:**
- Produces:
```js
useSession() -> {
  clientName, clientLastName, clientPhone, userId, userEmail,
  nameChecked, recoveryMode, setRecoveryMode, handleRecoveryDone, handleLogout,
}

useClientProfile({ userId, trainerInfo }) -> {
  profile, setProfile, profileChecked, profileFetchFailed, retry,
}
```

`useSession` owns the `sb.auth.getSession()` call and the
`onAuthStateChange` subscription including its unsubscribe. This is the
highest-risk extraction in the plan: the gate chain reads `nameChecked` and
`clientName` on the very first render, and getting the order wrong shows a
blank screen rather than a wrong value.

- [ ] **Step 1: Create `useSession` with the auth effect moved verbatim, subscription cleanup included.**
- [ ] **Step 2: Create `useClientProfile` with the profile fetch and its retry tick.**
- [ ] **Step 3: Call both at the top of `TrainingLog`, in the order the originals appeared.**
- [ ] **Step 4: Delete the moved lines.**
- [ ] **Step 5: Verify — `bun run typecheck && bun run boundaries && bun run test && bun run e2e`.** The `gates`, `client` and `client-locked` variants all exercise this path; if any renders blank, the hook order is wrong.
- [ ] **Step 6: Commit** — `"refactor: extract useSession and useClientProfile from TrainingLog"`

---

### Task 10: `useTrainerIdentity` and `useWorkoutEntries` (TrainingLog)

**Files:**
- Create: `src/app/hooks/useTrainerIdentity.js`, `src/app/hooks/useWorkoutEntries.js`
- Modify: `src/app/TrainingLog.js`

**Interfaces:**
- Produces:
```js
useTrainerIdentity({ userEmail }) -> {
  trainerChecked, trainerInfo, setTrainerInfo,
  trainerNotOnRoster, setTrainerNotOnRoster, trainerHasEverPaid,
}

useWorkoutEntries({ userId, clientName }) -> {
  entries, setEntries, loaded, titleFilter, setTitleFilter,
  dateFilter, setDateFilter, lastDeleted, setLastDeleted,
  handleDelete, handleUndoDelete,
}
```

`useTrainerIdentity` decides which of the four trainer gate screens shows, so
`trainer`, `trainer-unapproved` and `trainer-overdue` are its regression gate.

- [ ] **Step 1–6:** create both, call in position, delete, verify all four gates, commit as `"refactor: extract useTrainerIdentity and useWorkoutEntries from TrainingLog"`.

---

### Task 11: `useWorkoutEntryForm` (TrainingLog)

**Files:**
- Create: `src/app/hooks/useWorkoutEntryForm.js`
- Modify: `src/app/TrainingLog.js`

**Interfaces:**
- Produces:
```js
useWorkoutEntryForm({ userId, clientName, entries, setEntries }) -> {
  showForm, setShowForm, editingId, setEditingId, addBeforeId, setAddBeforeId,
  date, setDate, sessionTitle, setSessionTitle, titleStepDone, setTitleStepDone,
  exercise, setExercise, muscleGroup, setMuscleGroup, muscleTouched, setMuscleTouched,
  sets, setSets, voiceConfirmPending, setVoiceConfirmPending,
  confirmSetIdx, setConfirmSetIdx, isTimed, setIsTimed,
  isBodyweight, setIsBodyweight, quickEntry, setQuickEntry, quickEntryError,
  saving, error, setError, savedFlash, savedFlashText,
  resetForm, resetFormKeepSession, handleSave,
}
```

Twenty state values and the 107-line `handleSave` — the single largest cluster
in the codebase, and the one Task 1's tests exist for.

- [ ] **Step 1–6:** create, call in position, delete, verify, commit as `"refactor: extract useWorkoutEntryForm from TrainingLog"`.

- [ ] **Step 7: Confirm the budget**

Run: `wc -l src/app/TrainingLog.js`
Expected: under 800, down from 1,897.

---

### Task 12: `useCoachData` and `useCoachRequests` (CoachView)

**Files:**
- Create: `src/app/hooks/useCoachData.js`, `src/app/hooks/useCoachRequests.js`
- Modify: `src/app/CoachView.js`

**Interfaces:**
- Produces:
```js
useCoachData() -> {
  loading, allEntries, profiles, selfLogClientIds,
  trainers, setTrainers, allPayments, allTrainerPayments, refresh,
}

useCoachRequests() -> {
  trainerRequests, dietPlanRequests, programRequests,
  firstPaymentClaimsByEmail, fetchFirstPaymentClaims, refresh,
}
```

Task 3's coach tests are the gate.

- [ ] **Step 1–6:** create both, call in position, delete, verify, commit as `"refactor: extract useCoachData and useCoachRequests from CoachView"`.

---

### Task 13: `useTrainerAdmin` (CoachView)

**Files:**
- Create: `src/app/hooks/useTrainerAdmin.js`
- Modify: `src/app/CoachView.js`

**Interfaces:**
- Produces:
```js
useTrainerAdmin({ trainers, setTrainers, refresh }) -> {
  showAddTrainer, setShowAddTrainer, trainerSearch, setTrainerSearch,
  newTrainerName, setNewTrainerName, newTrainerEmail, setNewTrainerEmail,
  newTrainerPhone, setNewTrainerPhone, addTrainerError, addingTrainer,
  confirmDeleteTrainer, setConfirmDeleteTrainer, deleteTrainerError, deletingTrainer,
  trainerFieldError, approvingId, setApprovingId,
  approveAmount, setApproveAmount, approveDate, setApproveDate,
  approveSaving, approveError, confirmRejectId, setConfirmRejectId,
  handleAddTrainer, handleDeleteTrainer, handleUpdateTrainerField,
  handleApproveAndConfirmPayment,
}
```

This hook owns `handleApproveAndConfirmPayment`, which sets `is_approved` and
writes the first `trainer_payments` row together. That is money and access in
one call — verify the `trainer-unapproved` variant explicitly.

- [ ] **Step 1–6:** create, call in position, delete, verify, commit as `"refactor: extract useTrainerAdmin from CoachView"`.

---

### Task 14: `useProgramBuilder` (ProgramsPanel) and `useTrainerClients` (TrainerView)

**Files:**
- Create: `src/modules/programs/hooks/useProgramBuilder.js`, `src/app/hooks/useTrainerClients.js`
- Modify: `src/modules/programs/ProgramsPanel.js`, `src/app/TrainerView.js`

**Interfaces:**
- Produces:
```js
useProgramBuilder({ trainerId }) -> {
  programs, setPrograms, loaded, editing, setEditing, weeks, setWeeks,
  saving, error, handleSaveExercise, handleGenerateWeeks,
  handleDuplicateWeek, handleDeleteWeek, handleDuplicateDay,
  handleDuplicateProgram, handleRequestProgram,
}

useTrainerClients({ trainer }) -> {
  clients, setClients, loaded, selectedClient, setSelectedClient,
  goBackToRoster, balanceFor,
  handleUpdateProfileField, handleUpdateGoal,
  handleUpdateTotalDue, handleIncrementTotalDue,
}
```

`TrainerView` has the smallest closure of the five (72 names, 102 lines of
inner functions), so it is the cheapest of the pair; do it second as a
confidence check that the pattern holds at the small end.

- [ ] **Step 1–6:** create both, call in position, delete, verify, commit as `"refactor: extract useProgramBuilder and useTrainerClients"`.

---

### Task 15: Confirm the budget and record what is left

**Files:**
- Modify: `docs/superpowers/specs/2026-09-20-modular-architecture-and-test-foundation-design.md`

- [ ] **Step 1: Measure**

```bash
find src -name '*.js' | while read f; do echo "$(wc -l < "$f") $f"; done | sort -rn | head -15
```

- [ ] **Step 2: Record the result in the spec's success criteria**, including every file still over 400 lines and why.

- [ ] **Step 3: Run the full gate one final time**

```bash
bun run typecheck && bun run boundaries && bun run test && bun run e2e
git diff --quiet HEAD -- index.html && echo "index.html untouched"
```

- [ ] **Step 4: Commit** — `"docs: record post-extraction component sizes"`

---

## Expected outcome

State moves out; the JSX does not. Each component should land roughly at its
"in one JSX return" measurement plus its own wiring:

| file | now | expected after |
|---|---|---|
| `DietPanel` | 2,244 | ~950 |
| `TrainingLog` | 1,897 | ~750 |
| `CoachView` | 1,702 | ~520 |
| `ProgramsPanel` | 1,008 | ~420 |
| `TrainerView` | 998 | ~360 |

That clears the 200-line component budget for none of them and the 400-line
file budget for one or two. **This plan does not finish the job** — it makes
the remaining problem a pure JSX decomposition, which is tractable because the
state a subtree needs will by then be a named hook result rather than one of
196 closure bindings. That carve-up is the follow-up plan.

## Out of scope

TypeScript conversion, the router, TanStack Query, `platform/` adapters and
the Capacitor shell, billing/entitlement, and any change to what the app does.
