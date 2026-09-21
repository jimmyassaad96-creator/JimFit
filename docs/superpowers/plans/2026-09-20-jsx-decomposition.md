# JSX Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the remaining oversized components under the size budget by moving their render subtrees into sibling components, without changing what the app does.

**Architecture:** Hook results are passed as **one object per hook** and destructured back to their original names at the top of the receiving component. That keeps every moved line verbatim while collapsing the prop interface from dozens of names to a handful.

**Tech Stack:** React 18 (`React.createElement`, no JSX syntax), Vitest, Playwright, bun.

**Spec:** `docs/superpowers/specs/2026-09-20-modular-architecture-and-test-foundation-design.md`

**Prior plan:** `docs/superpowers/plans/2026-09-20-hooks-extraction.md` (all 15 tasks complete)

## Global Constraints

- **Behaviour-preserving.** Moved JSX is copied verbatim. The only new lines are the component wrapper, its destructure, and the call site.
- **`index.html` is never edited.** It remains the shipped artifact.
- **Do not re-run the codemod** (`tools/extract/README.md`).
- **One subtree per commit**, with `bun run typecheck && bun run boundaries && bun run order && bun run imports && bun run test && bun run e2e` green before each.
- **Never push.**
- Budget: no file over 400 lines, no component over 200.

## The measurement this plan is built on

Extracting DietPanel's largest render subtree (585 lines) as a conventional
component needs **87 props**. That is not a component; it is the same closure
with more typing, and it would make the code harder to change, not easier.

Those 87 names resolve to just six sources:

| source | names |
|---|---|
| `useDietPurchase` | 20 |
| `useMealItems` | 15 |
| `useDietPlan` | 14 |
| `useDietTemplates` | 13 |
| the component itself | 13 |
| `useBodyInfo` | 12 |

**So the interface is six objects, not eighty-seven values.** The component
stops destructuring each hook result and passes the whole bag down; the
receiving component destructures it back to the same names on its first line,
so every moved line is unchanged.

```js
// caller
const purchase = useDietPurchase({ ... });
...
e(DietPlanSection, { plan, purchase, templates, mealItems, bodyInfo, ui })

// receiver
function DietPlanSection({ plan, purchase, templates, mealItems, bodyInfo, ui }) {
  const { unlockAmount, setUnlockAmount, unlocking, handleUnlockPlan, ... } = purchase;
  ...  // moved verbatim
}
```

## Starting point

| file | lines | before return | in return |
|---|---|---|---|
| `modules/diet/DietPanel.js` | 1,428 | 515 | 913 |
| `app/CoachView.js` | 1,359 | 882 | 477 |
| `app/TrainingLog.js` | 1,252 | 549 | 703 |
| `app/TrainerView.js` | 907 | 585 | 322 |
| `modules/programs/ProgramsPanel.js` | 820 | 438 | 382 |

CoachView is the exception: most of its bulk is still logic, not JSX, so it
gets one more hook before any render work.

---

## Part A — CoachView: the logic that is left

### Task 1: `useClientAdmin`

**Files:**
- Create: `src/app/hooks/useClientAdmin.js`
- Modify: `src/app/CoachView.js`

**Interfaces:**
- Consumes: `profiles`, `setProfiles`, `allPayments`, `setAllPayments`, `setAllEntries`, `resolveClientById`, `trainers`
- Produces:
```js
useClientAdmin({ ... }) -> {
  confirmDialog, setConfirmDialog,
  handleDeleteClient, handleClearWorkouts, handleDeletePayment,
  handleAssignTrainer, handleUpdateGoal, handleUpdateProfileField,
  handleIncrementTotalDue, balanceFor,
}
```

This is the client-side mirror of `useTrainerAdmin`, and it carries the same
kind of weight: `handleDeleteClient` deletes a login, `handleIncrementTotalDue`
changes what someone owes.

- [ ] **Step 1: Size it**

```bash
python3 tools/extract/span.py src/app/CoachView.js handleDeleteClient handleClearWorkouts \
  handleDeletePayment handleAssignTrainer handleUpdateGoal handleUpdateProfileField \
  handleIncrementTotalDue balanceFor confirmDialog
python3 tools/extract/deps.py src/app/CoachView.js <ranges from above>
```

Expected: a short dependency list of roster data and setters. If it exceeds
about ten names, narrow the cluster rather than widening the parameter list.

- [ ] **Step 2: Move the blocks verbatim into the hook, and call it after the last name it reads**

Placement is not optional: four TDZ faults during the hooks extraction came
from calling a hook above a `const` it takes.

- [ ] **Step 3: Verify**

```bash
bun run typecheck && bun run boundaries && bun run order && bun run imports
bun run test && bun run e2e
```

- [ ] **Step 4: Commit** — `"refactor: extract useClientAdmin from CoachView"`

### Task 2: Move CoachView's pure derivations into `domain/`

**Files:**
- Modify: `src/app/CoachView.js`, `src/domain/roster.js` (create)

`categorize` (20 lines), `renewalFor` (19), `trainerPaymentSplit` (16) and the
`roster`/`dashboardEntries` memos are payment and grouping rules with no React
in them. In `domain/` they become unit-testable without a browser.

- [ ] **Step 1: Confirm each is pure** — `python3 tools/extract/deps.py src/app/CoachView.js <range>` reporting only data arguments.
- [ ] **Step 2: Move them to `src/domain/roster.js` as functions taking their inputs explicitly.**
- [ ] **Step 3: Write unit tests** in `tests/unit/roster.test.js` covering: a client with no payments, one inside the renewal window, one overdue, and the trainer/self-train split.
- [ ] **Step 4: Verify and commit** — `"refactor: move coach roster rules into domain/"`

---

## Part B — DietPanel's render tree

The return has six top-level children. The two largest are the plan section
(585 lines) and the daily targets card (124 lines).

### Task 3: Stop destructuring the diet hooks

**Files:**
- Modify: `src/modules/diet/DietPanel.js`

- [ ] **Step 1: Replace each destructure with a named bag**

```js
const plan = useDietPlan({ userId, clientName, setSaving });
const foodLog = useFoodLog({ userId, clientName, setSaving, setError });
const mealItems = useMealItems({ plan: plan.plan, ensurePlanId });
const templates = useDietTemplates({ ... });
const bodyInfo = useBodyInfo({ ... });
const purchase = useDietPurchase({ ... });
```

- [ ] **Step 2: Re-destructure immediately below, so the body is untouched**

```js
const { plan: planRow, setPlan, planLoaded, mapPlanRow, ... } = plan;
const { logs, setLogs, logsLoaded, ... } = foodLog;
```

This step changes no behaviour and no JSX — it only makes the bags available
to pass down.

- [ ] **Step 3: Verify and commit** — `"refactor: keep the diet hook results as objects"`

### Task 4: Extract `DietPlanSection`

**Files:**
- Create: `src/modules/diet/DietPlanSection.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Props: `{ plan, purchase, templates, mealItems, bodyInfo, ui }` where `ui`
  carries the thirteen component-owned names the subtree reads
- Produces: the plan hero, meal detail, notes editors and template browser

- [ ] **Step 1: Copy the subtree verbatim into the new file**, wrapped in a function whose first lines destructure each bag back to the original names.
- [ ] **Step 2: Replace it in `DietPanel` with `e(DietPlanSection, { plan, purchase, templates, mealItems, bodyInfo, ui })`.**
- [ ] **Step 3: Verify.** The `src` sweep opens the Diet plan tab and asserts no page error; that is this task's gate.
- [ ] **Step 4: Commit** — `"refactor: extract DietPlanSection from DietPanel"`

### Task 5: Extract `DailyTargetsCard`

**Files:**
- Create: `src/modules/diet/DailyTargetsCard.js`
- Modify: `src/modules/diet/DietPanel.js`

**Interfaces:**
- Props: `{ foodLog, targets, ui }` — the 30 names this subtree reads resolve
  to `useFoodLog` plus the computed `eff*`/`todayHits` values

- [ ] **Step 1–4:** same shape as Task 4, committing as `"refactor: extract DailyTargetsCard from DietPanel"`.

- [ ] **Step 5: Confirm the budget** — `wc -l src/modules/diet/DietPanel.js`, expected under 600.

---

## Part C — TrainingLog's render tree

703 lines of return, holding the client shell: header, trial banner, check-in,
today card, the log feed and the entry sheet.

### Task 6: Stop destructuring the TrainingLog hooks

Same mechanical change as Task 3, for `useSession`, `useClientProfile`,
`useTrainerIdentity`, `useWorkoutEntries` and `useWorkoutEntryForm`.

- [ ] **Step 1–3:** replace destructures with bags, re-destructure below, verify, commit as `"refactor: keep the TrainingLog hook results as objects"`.

### Task 7: Extract `WorkoutEntrySheet`

**Files:**
- Create: `src/app/WorkoutEntrySheet.js`
- Modify: `src/app/TrainingLog.js`

**Interfaces:**
- Props: `{ form, entries, ui }` — `form` is the whole `useWorkoutEntryForm`
  result, which owns nearly everything this subtree reads

The sweep's entry-form test (opening the sheet, quick entry expanding to three
sets) is this task's gate, and it is the one that caught a silently broken
Apply button during the hooks extraction.

- [ ] **Step 1–4:** as Task 4, committing as `"refactor: extract WorkoutEntrySheet from TrainingLog"`.

### Task 8: Extract `ClientDashboard`

**Files:**
- Create: `src/app/ClientDashboard.js`
- Modify: `src/app/TrainingLog.js`

The today card, stat tiles, check-in panel and log feed — everything the client
sees above the sheet.

- [ ] **Step 1–4:** as Task 4, committing as `"refactor: extract ClientDashboard from TrainingLog"`.

- [ ] **Step 5: Confirm the budget** — `wc -l src/app/TrainingLog.js`, expected under 400.

---

## Task 9: Record where it landed

- [ ] **Step 1: Measure**

```bash
find src -name '*.js' | while read f; do echo "$(wc -l < "$f") $f"; done | sort -rn | head -15
```

- [ ] **Step 2: Update the spec's success criteria** with the result and every file still over 400 lines, with the reason.
- [ ] **Step 3: Run the full gate and commit** — `"docs: record post-decomposition component sizes"`.

## Out of scope

TypeScript conversion, the router, TanStack Query, the `platform/` adapters and
Capacitor shell, billing/entitlement, and `ClientCustomProgramCard` (857) and
`ClientLogPanel` (644), which were never part of the oversized five.
