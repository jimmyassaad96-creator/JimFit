# JimFit — notes for the next agent

JimFit is a live fitness app: workout logging, diet plans, coaching, and client
billing, used by real paying trainers and their clients.

**Read this before touching anything.** Most of what follows was learned the
expensive way.

## The two source trees

There are two copies of this app and they are not interchangeable.

- **`index.html`** — 25,330 lines, one file, React 18 from a CDN, no build
  step. **This is the app that ships.** It is byte-identical to `main` and
  must stay that way until someone decides otherwise.
- **`src/`** — 130 ES modules, the same app split up. Built with Vite, tested,
  **not deployed to anyone**.

Every change so far has gone into `src/` only. If you edit `index.html` you are
editing production.

## If you are checking this branch for Jimmy

Jimmy owns this app and does not work from a terminal. If he has asked you to
check this branch, this is what he wants to know: **does the live app still
work, and did anything he ships change?**

Answer those two, in this order.

### 1. Prove the live app was not touched

```bash
git fetch origin
git checkout refactor/modular-architecture-and-tests
git diff main --stat -- index.html
```

**Expected: no output at all.** `index.html` is the entire shipped app, and an
empty diff means it is byte-for-byte what is on `main`. If anything prints
here, stop and tell him — that would mean the live app was modified, which this
branch is not supposed to do.

Also worth showing him:

```bash
git diff main --stat -- index.html privacy.html sw.js manifest.json CNAME
```

Same expectation. Every file GitHub Pages actually serves is untouched; all the
new work is in `src/`, `tests/`, `tools/` and `docs/`, none of which is served
to anyone.

### 2. Run the checks

Needs Node 20+ or bun. With bun:

```bash
bun install
bun x playwright install chromium
bun run typecheck && bun run boundaries && bun run order && bun run imports
bun run test
bun run e2e
```

With npm, substitute `npm install`, `npx playwright install chromium`, and
`npm run <script>` — the scripts are the same.

Expected: every command exits 0. **23 unit tests and 77 end-to-end tests pass.**
The end-to-end ones open the real app in a browser and click through it: the
client dashboard, logging a workout, the diet tabs, the trainer roster, the
payment screens, the owner menu. 60 of them drive the shipped `index.html` and
17 drive the new split-up version, which is how we know the two behave the same.

If something fails, the message names the file and the assertion. Report it
verbatim rather than trying to fix it.

### 3. Let him see it running

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. That serves the shipped `index.html`
straight from the repo — the same file, same login, same data. It is the
simplest demonstration that the branch did not break the app.

### What to tell him

In plain terms: the app he ships is unchanged, the code behind it has been
split into smaller pieces with tests around it, and nothing goes live until he
merges. If he asks whether it is safe to merge, the honest answer is that
merging this branch alone changes nothing users can see — `index.html` is
identical — but the follow-up work (actually serving `src/` instead) is a
separate decision that has not been made.

### What is NOT proven

Say so if he asks. Signing up, resetting a password, and the payment-claim
round trip have no test coverage — they need a real Supabase login. The
approve-a-trainer action, which sets approval and records the first payment in
one step, is also untested. Those need a human clicking through with a real
account.

## Hard rules

- **Never push.** A `git-guard` hook enforces it; Said pushes himself.
- **Never commit unless asked.**
- **Do not re-run the codemod.** `tools/extract/extract.py` regenerates `src/`
  from `index.html` and would erase every hand edit since. See
  `tools/extract/README.md`. To compare after a hot-fix, run it into a scratch
  directory and diff.
- **bun only.** There is no `node`, `npm` or `npx` on this machine. `bun x <tool>`
  runs everything; bun ships a node-compatible runtime.

## The gate

```
bun run typecheck && bun run boundaries && bun run order && bun run imports \
  && bun run test && bun run e2e
```

All six must pass before a commit. They are also the CI workflow.

- `boundaries` — dependency-cruiser, `.dependency-cruiser.cjs`. The rule that
  matters is `domain/` importing nothing but `domain/` and `shared/lib/`.
- `order` — `tools/extract/check-order.py`. Catches a hook called above a
  `const` it takes as an argument.
- `imports` — `tools/extract/check-imports.py`. Catches a module using a name
  it never imported.
- `e2e` — 77 Playwright tests. 60 drive `index.html`; 17 drive a patched build
  of `src/`. **Both matter** — see below.
- `test` — 23 Vitest unit tests over `domain/`.

## Why the gate looks like that

Each check exists because something got through everything before it.

**`imports` exists** because the codemod derived imports from a scan that
blanked template literals, so any name used only inside `${...}` was invisible.
23 names across 19 modules. Bundling does not catch it — an unresolved global is
a runtime `ReferenceError`, not a build error.

**`order` exists** because four separate times a hook was called above a `const`
it reads. typecheck, boundaries and imports all pass; the app renders nothing
and the browser says `Cannot access 'X' before initialization` with a minified
name. If you add a hook call, the declarations it reads must be above it.

**The `src/` half of `e2e` exists** because for a while the suite only drove
`index.html`, so it could not see a refactor of `src/` at all. Adding it found
an AI Chat tab that had been throwing `styles is not defined` since the codemod.

**None of it catches a silent wrong result.** A hook that returns the wrong
value, or a handler wired to nothing, renders fine and raises no error. That
happened once — a quick-entry button that did nothing — and the only thing that
caught it was a test asserting `3x8x60` expands to exactly three set rows.
Prefer assertions about outcomes over assertions that a screen rendered.

## Layout of `src/`

```
app/        composition root: TrainingLog, CoachView, TrainerView + their hooks
platform/   anything that differs web vs iOS vs Android (supabase, push, captcha)
data/       the only place `sb.from(...)` is allowed
domain/     pure rules — no React, no network. Imports nothing but domain/shared-lib
modules/    one folder per feature: diet, programs, clients, trainers, progress…
shared/     ui/, lib/, theme, palette, widgets
```

17 hooks hold the state. Components take **hook results as whole objects** and
destructure them back to the original names on their first lines — that is what
let a 718-line render subtree move without an 87-prop interface.

## Tools worth knowing

- `tools/extract/span.py <file> <name>...` — exact line span of a declaration,
  comments included. Boundaries guessed by eye cost two bugs.
- `tools/extract/deps.py <file> <start-end>...` — what a set of line ranges
  still needs from the component. Reads multi-line hook destructures **and the
  component's own props**; both were blind spots that produced blank screens.
- `tests/harness/` — `demo-build.js` patches a throwaway copy of `index.html` to
  seed a fake session; `build-src.js` does the same for `src/`. If a harness
  build fails with a match-count error, a patched declaration moved and the
  patch list needs updating.

## What was done here

Read `docs/superpowers/specs/2026-09-20-modular-architecture-and-test-foundation-design.md`
first — it has the measured starting state, the constraints and the outcome. Then
the three plans in `docs/superpowers/plans/`, in date order.

The short version: `index.html` was split by codemod into `src/`, layer
boundaries driven to zero errors, a characterization suite written against the
shipped app, then state pulled into hooks and render subtrees into components.

| file | before | now |
|---|---|---|
| `modules/diet/DietPanel.js` | 2,244 | 551 |
| `app/TrainingLog.js` | 1,897 | 941 |
| `app/CoachView.js` | 1,702 | 1,126 |
| `modules/programs/ProgramsPanel.js` | 1,009 | 819 |
| `app/TrainerView.js` | 998 | 906 |

16 files are still over 400 lines. The spec's §11 lists every one with the
reason — mostly render trees of tab branches that are separate components
rather than one, plus files that were never in scope.

## Things that are blocked, not forgotten

- **`jimfit.app` returns 404.** GitHub Pages is switched off. Said has push but
  not admin, so only the repo owner can fix it.
- **The backend is not in this repo.** 34 Supabase tables, 23 RPCs, 7 edge
  functions, 2 storage buckets. The RPCs are where the money logic lives
  (`increment_client_total_due`, `switch_to_paid_diet_plan`) and none of it can
  be read or tested from here. Test fixtures are hand-written, never recorded
  from production.
- **`src/platform/supabase.js` reads `window.supabase.createClient`**, a CDN
  global `index.html` provides. Nothing in `src/` imports the npm package; the
  test harness shims it. Worth fixing properly.
- **Apple IAP is unresolved.** The app sells a $10/month subscription and $35
  and $30 plans through Whish Money. If it ships on the App Store, Apple will
  likely require their own payment system. Decide before building more of it.

## Untouched by design

TypeScript conversion (`allowJs` is on, convert file by file), routing (there
is none — Android's back button will exit the app), TanStack Query, the
Capacitor shell, and billing/entitlement.
