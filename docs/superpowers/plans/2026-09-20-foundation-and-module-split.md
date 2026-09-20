# Foundation & Module Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `index.html` (one file, 25,330 lines) into a buildable, tested, domain-modular `src/` tree without changing a single line of application behaviour.

**Architecture:** A domain-modular monolith in four layers — `platform/`, `data/`, `domain/`, `modules/` — over `shared/`, with an enforced dependency rule. The split itself is performed by a committed codemod (`tools/extract/extract.py`), not by hand, so it is reviewable as one mechanical diff.

**Tech Stack:** Bun 1.3 (runtime + package manager; **no node/npm on this machine**), Vite 7, TypeScript 5 (`allowJs`, incremental), Vitest 5, Playwright 1.63, dependency-cruiser, React 18 (already used, via `React.createElement`, no JSX).

**Spec:** `docs/superpowers/specs/2026-09-20-modular-architecture-and-test-foundation-design.md`

## Global Constraints

- **Behaviour-preserving.** No feature, copy, style or business-rule change. Any behavioural difference found is a bug in this work, not an improvement.
- **`index.html` stays the shipped artifact** for the whole of this plan. `src/` is built and tested but not deployed. Do not delete or edit `index.html`.
- **No commits to `main`.** All work lands on `refactor/modular-architecture-and-tests`.
- **Never push.** Commits only; the user pushes.
- **Bun only** — `bun install`, `bun x <tool>`. `npm`, `npx`, `node` do not exist here.
- Declaration bodies are **copied byte-for-byte** by the codemod. If a body needs editing, that is a separate commit after the split, never inside it.
- Target module sizes: no file over ~400 lines, no component over ~200, except the five known-oversized components listed in Task 9.

---

## Part A — Foundation (Phase 0)

### Task 1: Buildable project skeleton

**Files:**
- Create: `package.json`, `vite.config.js`, `tsconfig.json`, `index.dev.html`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: `bun run dev`, `bun run build`, `bun run typecheck`; a Vite root that serves `index.dev.html` against `src/main.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jimfit",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "boundaries": "depcruise src --config .dependency-cruiser.cjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@playwright/test": "^1.63",
    "@testing-library/react": "^16",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "dependency-cruiser": "^16",
    "happy-dom": "^20",
    "msw": "^2",
    "typescript": "^5",
    "vite": "^7",
    "vitest": "^5"
  }
}
```

- [ ] **Step 2: Install and confirm the toolchain runs**

Run: `bun install && bun x vite --version && bun x vitest --version && bun x playwright --version`
Expected: three version strings, no errors. Bun reports a node-compatible runtime; that is fine.

- [ ] **Step 3: Create `vite.config.js`**

```js
import { defineConfig } from "vite";

// index.html at the repo root is the SHIPPED app and must stay untouched, so
// the dev/build entry is a separate shell that loads the module tree instead.
export default defineConfig({
  root: ".",
  build: { rollupOptions: { input: "index.dev.html" }, outDir: "dist" },
  server: { port: 5173 },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.{js,ts}"],
  },
});
```

- [ ] **Step 4: Create `index.dev.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>JimFit (dev)</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `tsconfig.json`**

TypeScript is switched on but tolerant — `allowJs` with `checkJs` off, so `.js` modules from the codemod compile untouched and files convert to `.ts` one at a time later.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 6: Extend `.gitignore`**

```
.idea/
node_modules/
dist/
.DS_Store
test-results/
playwright-report/
bun.lockb
```

- [ ] **Step 7: Verify typecheck passes on an empty tree**

Run: `bun run typecheck`
Expected: exits 0 (no `src/` yet, nothing to check).

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js tsconfig.json index.dev.html .gitignore
git commit -m "build: add Vite + TypeScript + Vitest toolchain (bun)"
```

---

### Task 2: Boundary enforcement

**Files:**
- Create: `.dependency-cruiser.cjs`

**Interfaces:**
- Consumes: Task 1's `bun run boundaries` script
- Produces: a CI-failing check for every violation of the spec's §5.2 dependency rule

- [ ] **Step 1: Create `.dependency-cruiser.cjs`**

```js
// Encodes the dependency rule from the spec, §5.2. An unenforced boundary is
// a comment, so these are errors, not warnings.
module.exports = {
  forbidden: [
    {
      name: "domain-imports-nothing",
      severity: "error",
      comment: "domain/ is pure: no React, no network, no Supabase, no UI.",
      from: { path: "^src/domain" },
      to: { pathNot: "^src/domain" },
    },
    {
      name: "no-upward-imports",
      severity: "error",
      comment: "data/ and platform/ must not reach up into modules/ or app/.",
      from: { path: "^src/(data|platform)" },
      to: { path: "^src/(modules|app)" },
    },
    {
      name: "modules-are-siblings",
      severity: "error",
      comment: "Cross-module needs go down through domain/ or data/.",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/(?!$1/)[^/]+/" },
    },
    {
      name: "shared-stays-shared",
      severity: "error",
      from: { path: "^src/shared" },
      to: { path: "^src/(modules|app|data|domain|platform)" },
    },
    { name: "no-circular", severity: "warn", from: {}, to: { circular: true } },
    { name: "no-orphans", severity: "warn", from: { orphan: true }, to: {} },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

- [ ] **Step 2: Run it against the empty tree**

Run: `bun x depcruise src --config .dependency-cruiser.cjs`
Expected: "no dependency violations found" (or a no-such-directory notice before Task 8 — that is acceptable here).

- [ ] **Step 3: Commit**

```bash
git add .dependency-cruiser.cjs
git commit -m "build: enforce the layer dependency rule with dependency-cruiser"
```

---

### Task 3: CI that runs the gates

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the scripts from Tasks 1–2
- Produces: a required check on every PR

**NOTE:** Pushing a file under `.github/workflows/` requires the **Workflows** permission on the fine-grained PAT. If the push is rejected, that is the cause — it is not a repo-permission problem. Report it and continue; this task is not a blocker for Tasks 4–10.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [refactor/modular-architecture-and-tests]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: latest }
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run boundaries
      - run: bun run test
      - run: bun x playwright install --with-deps chromium
      - run: bun run e2e
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run typecheck, boundaries, unit and e2e gates on every PR"
```

---

## Part B — Characterization (Phase 1)

The only testable surface before the split is the running app: every component
lives inside one IIFE with no exports. These tests therefore drive a browser
against the current `index.html`, and they are the regression gate for Part C.

### Task 4: Test harness that makes the app reachable

**Files:**
- Create: `tests/harness/demo-build.js`, `tests/harness/fixtures.js`, `playwright.config.js`

**Interfaces:**
- Consumes: `index.html`
- Produces: `buildDemo({ role })` → path to a patched copy with auth gates bypassed; `installSupabaseFixtures(page)` → route interception returning synthetic rows

- [ ] **Step 1: Write `tests/harness/demo-build.js`**

Patches a throwaway copy of `index.html`: seeds `window.__DEMO` with a fake client/trainer, blanks `TURNSTILE_SITE_KEY` so the captcha gate is off, and disables the service worker so nothing is served stale. Each patch asserts it matched exactly once, so a drifting `index.html` fails loudly instead of silently producing an unpatched build.

```js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PATCHES = [
  [`<script>window.__jimfitBootStart = Date.now();</script>`, null], // demo seed injected after this
  [`const TURNSTILE_SITE_KEY = "0x4AAAAAAE4BdmWSch95dAg1";`, `const TURNSTILE_SITE_KEY = "";`],
  [`const [clientName, setClientName] = useState(null);`, `const [clientName, setClientName] = useState(window.__DEMO.clientName);`],
  [`const [profile, setProfile] = useState(null);`, `const [profile, setProfile] = useState(window.__DEMO.profile);`],
  [`const [trainerInfo, setTrainerInfo] = useState(null);`, `const [trainerInfo, setTrainerInfo] = useState(window.__DEMO.trainer);`],
  [`const [pushGateSkipped, setPushGateSkipped] = useState(false);`, `const [pushGateSkipped, setPushGateSkipped] = useState(true);`],
  [`if ("serviceWorker" in navigator) {`, `if (false) {`],
];

export function buildDemo(outDir, role = "client") {
  let src = readFileSync("index.html", "utf8");
  const seed = `<script>window.__DEMO=${JSON.stringify(demoState(role))};</script>`;
  src = src.replace(PATCHES[0][0], PATCHES[0][0] + seed);
  for (const [from, to] of PATCHES.slice(1)) {
    const n = src.split(from).length - 1;
    if (n !== 1) throw new Error(`harness drift: ${n} matches for ${from.slice(0, 60)}`);
    src = src.replace(from, to);
  }
  src = src.replace(
    `return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : null;`,
    `return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : window.__DEMO.clientName;`
  );
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "index.html");
  writeFileSync(out, src);
  return out;
}

function demoState(role) {
  const far = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  return {
    role,
    clientName: role === "trainer" ? "Demo Trainer" : "Demo Client",
    profile: role === "trainer" ? null : {
      id: "demo-profile", client_name: "Demo Client", last_name: "User",
      client_email: "demo@example.com", age: 28, birthday: "1998-01-01",
      gender: "Male", phone: "+96170000000", height_cm: 178, weight_kg: 76,
      days_per_week: 4, goal: "Build muscle", trainer_id: null,
      trial_ends_at: far, access_paid_through: far,
    },
    trainer: role !== "trainer" ? null : {
      id: "demo-trainer", name: "Demo Trainer", email: "demo.trainer@example.com",
      phone: "+96171000000", is_approved: true, next_payment_date: null, gym_id: null,
    },
  };
}
```

- [ ] **Step 2: Write `tests/harness/fixtures.js`**

Fixtures are **hand-authored**. Never record production traffic — it contains real client health and payment data (spec §8.3).

```js
export const FIXTURES = {
  workout_entries: [
    { id: "w1", user_id: "demo-user", exercise: "Bench Press", weight_kg: 60,
      reps: 8, sets: 3, performed_at: "2026-09-19T10:00:00Z", workout_title: "Push" },
  ],
  client_profiles: [], trainers: [], diet_plans: [], client_payments: [],
  body_assessments: [], scheduled_sessions: [], training_programs: [],
};

export async function installSupabaseFixtures(page) {
  await page.route("**/*.supabase.co/rest/v1/**", (route) => {
    const table = new URL(route.request().url()).pathname.split("/").pop();
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FIXTURES[table] ?? []),
    });
  });
  await page.route("**/*.supabase.co/auth/v1/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
}
```

- [ ] **Step 3: Write `playwright.config.js`**

```js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "on-first-retry" },
  webServer: {
    command: "bun x vite preview --outDir .demo --port 4173 --strictPort",
    port: 4173,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 4: Prove the harness renders the app**

Write `tests/e2e/smoke.spec.js`:

```js
import { test, expect } from "@playwright/test";
import { buildDemo } from "../harness/demo-build.js";
import { installSupabaseFixtures } from "../harness/fixtures.js";

test.beforeAll(() => buildDemo(".demo", "client"));

test("client dashboard renders past the auth gate", async ({ page }) => {
  await installSupabaseFixtures(page);
  await page.goto("/");
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByText("Demo Client")).toBeVisible();
});
```

- [ ] **Step 5: Run it**

Run: `bun x playwright install chromium && bun run e2e`
Expected: 1 passed. A failure here means the harness patches no longer match `index.html` — fix the patch strings, do not weaken the assertion.

- [ ] **Step 6: Commit**

```bash
git add tests/harness playwright.config.js tests/e2e/smoke.spec.js
git commit -m "test: add characterization harness that boots the app past its auth gates"
```

---

### Task 5: Characterize the client flows

**Files:**
- Create: `tests/e2e/client-dashboard.spec.js`, `tests/e2e/client-logging.spec.js`, `tests/e2e/client-diet.spec.js`

**Interfaces:**
- Consumes: `buildDemo`, `installSupabaseFixtures`
- Produces: the regression gate for every client-facing change in Part C

- [ ] **Step 1: Write the dashboard characterization**

```js
import { test, expect } from "@playwright/test";
import { buildDemo } from "../harness/demo-build.js";
import { installSupabaseFixtures } from "../harness/fixtures.js";

test.beforeAll(() => buildDemo(".demo", "client"));
test.beforeEach(async ({ page }) => installSupabaseFixtures(page));

test("today card shows the three stat tiles", async ({ page }) => {
  await page.goto("/");
  for (const label of ["Volume", "Sets done", "New PRs"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});

test("bottom navigation exposes every client tab", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).toContainText(/Log/);
  await expect(page.locator("#root")).toContainText(/Diet/);
});
```

- [ ] **Step 2: Run and confirm green**

Run: `bun run e2e`
Expected: all pass. Anything failing describes real current behaviour differently from the assertion — correct the assertion to match the app, not the app to match the assertion. These tests describe what **is**, bugs included.

- [ ] **Step 3: Repeat for logging and diet**

Cover, one assertion per behaviour: opening the exercise picker, adding a set and seeing it in the feed, switching Diet sub-tabs, the calorie/macro tiles rendering.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e
git commit -m "test: characterize client dashboard, logging and diet flows"
```

---

### Task 6: Characterize the trainer and gating flows

**Files:**
- Create: `tests/e2e/trainer.spec.js`, `tests/e2e/gates.spec.js`

- [ ] **Step 1: Trainer surface**

```js
import { test, expect } from "@playwright/test";
import { buildDemo } from "../harness/demo-build.js";
import { installSupabaseFixtures } from "../harness/fixtures.js";

test.beforeAll(() => buildDemo(".demo-trainer", "trainer"));
test.beforeEach(async ({ page }) => installSupabaseFixtures(page));

test("trainer lands on the roster, not the client dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo Trainer")).toBeVisible();
});
```

- [ ] **Step 2: Payment and approval gates**

Seed `trainer` with `is_approved: false` → expect `TrainerPendingApprovalScreen`; with `next_payment_date` in the past → expect the overdue screen. These encode the rules in `isTrainerPaymentOverdue` and the gate chain, and are the highest-value tests in the suite: they decide who gets charged and who gets locked out.

- [ ] **Step 3: Run, then commit**

```bash
bun run e2e
git add tests/e2e && git commit -m "test: characterize trainer surface and payment/approval gates"
```

---

## Part C — The split (Phase 6)

**GATE: do not start Part C until `bun run e2e` is green.** The suite is the only thing that will tell you the split preserved behaviour.

### Task 7: Unit-test the pure rules before they move

**Files:**
- Create: `tests/unit/access.test.js`

- [ ] **Step 1: Write failing tests against the extracted domain rules**

```js
import { describe, it, expect } from "vitest";
import { isTrainerPaymentOverdue } from "../../src/domain/access.js";

describe("isTrainerPaymentOverdue", () => {
  it("is false when no payment date is set", () => {
    expect(isTrainerPaymentOverdue({ next_payment_date: null })).toBe(false);
  });
  it("is false for the internal owner account", () => {
    expect(isTrainerPaymentOverdue({ email: "__owner__@jimfit.internal",
      next_payment_date: "2020-01-01" })).toBe(false);
  });
  it("is true once the date has passed", () => {
    expect(isTrainerPaymentOverdue({ next_payment_date: "2020-01-01" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `bun run test`
Expected: FAIL — `src/domain/access.js` does not exist yet.

- [ ] **Step 3: Run the codemod (Task 8), then re-run**

Expected: PASS, with no edit to the rule itself.

---

### Task 8: Run the codemod

**Files:**
- Create: `src/**` (43 modules, generated)
- Modify: `tools/extract/module-map.json` only if a symbol lands badly

- [ ] **Step 1: Generate the tree**

```bash
python3 tools/extract/extract.py --out src
```

Expected output: `394 declarations`, `43 modules`, `99.9%` coverage, `0` conflicts.

- [ ] **Step 2: Verify structurally**

```bash
for f in $(find src -name '*.js'); do bun build --no-bundle "$f" >/dev/null || echo "FAIL $f"; done
bun run typecheck
bun run boundaries
```

Expected: no syntax failures, typecheck clean, and a **list of boundary violations** — the first run will have them, because the map is a first pass. That list is the work item for Task 9, not a reason to weaken the rules.

- [ ] **Step 3: Confirm behaviour is unchanged**

```bash
bun run test && bun run e2e
```

Expected: everything that was green stays green. `index.html` is untouched, so the E2E suite still characterizes the shipped app; the unit tests now exercise the extracted modules.

- [ ] **Step 4: Commit the split on its own**

```bash
git add src tools/extract/module-map.json
git commit -m "refactor: split index.html into 43 ES modules by codemod

Generated by tools/extract/extract.py. Declaration bodies copied verbatim;
only import/export headers are new. index.html is unchanged and still the
shipped artifact."
```

---

### Task 9: Triage the fallback bucket and fix boundaries

**Files:**
- Modify: `tools/extract/module-map.json`

- [ ] **Step 1: List what landed in the fallback**

```bash
bun x depcruise src --config .dependency-cruiser.cjs
grep -c '^export' src/shared/lib/misc.js
```

`shared/lib/misc.js` holds ~117 symbols / ~1,393 lines. Sort them by prefix: `fetch*`/`load*`/`ensure*`/`sync*` → `data/queries.js`; `save*`/`insert*`/`update*`/`delete*` → `data/mutations.js`; anything pure and rule-shaped → the matching `domain/` file; the rest stays in `shared/lib`.

- [ ] **Step 2: Move symbols by editing the map, never by hand-editing `src/`**

Add entries to `overrides`, re-run `python3 tools/extract/extract.py --out src`, re-run the three verification commands. Repeat until `bun run boundaries` is clean.

- [ ] **Step 3: Commit each coherent group separately**

```bash
git add tools/extract/module-map.json src
git commit -m "refactor: move data-access helpers out of the fallback bucket"
```

---

### Task 10: Split the five oversized components

**Files:**
- Modify: `src/modules/diet/DietPanel.js` (2,215), `src/app/TrainingLog.js` (1,840), `src/app/CoachView.js` (1,646), `src/modules/programs/ProgramsPanel.js` (986), `src/modules/trainers/TrainerView.js` (955)

This is the only hand-editing in the plan. One component per commit, E2E green between each.

- [ ] **Step 1: Pick one component. Identify its sub-views by the panels it renders.**
- [ ] **Step 2: Move one sub-view into a sibling file, importing what it needs.**
- [ ] **Step 3: Run `bun run test && bun run e2e && bun run boundaries`.** All green, or revert.
- [ ] **Step 4: Commit.** `git commit -m "refactor: extract <SubView> from <Component>"`
- [ ] **Step 5: Repeat** until every file is under ~400 lines and every component under ~200.

---

## Out of scope for this plan

Deliberately deferred, each needing its own plan: converting `.js` to `.ts`
(Task 1 enables it via `allowJs`; do it file-by-file afterwards), the router
(spec §7.1), TanStack Query (§7.2), the `platform/` adapters and Capacitor
shell (Phase 4), billing/entitlement (§7.3), and switching the deploy from
`index.html` to the built `dist/`, which needs repo admin and Jimmy's
agreement (spec R5, R7).
