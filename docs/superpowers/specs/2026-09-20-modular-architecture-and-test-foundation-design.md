# JimFit — Modular Architecture & Test Foundation

**Date:** 2026-09-20
**Branch:** `refactor/modular-architecture-and-tests`
**Status:** Approved for planning

---

## 1. Context

JimFit is a live production app — workout logging, coaching, diet planning, and
client billing — used by paying trainers and their clients. It ships today as a
single static file.

Measured state of the codebase at the time of writing:

| Fact | Evidence |
|---|---|
| Entire app in one file | `index.html`, 25,330 lines / 1.75 MB |
| React 18 via CDN UMD, no build step, no JSX | `React.createElement` aliased to `e`; unpkg `<script src>` tags |
| ~250 components in one lexical scope | `grep -cE '^  function [A-Z]'` |
| Largest components | `DietPanel` 2,209 lines, `CoachView` 1,652, `TrainerView` 997, `ProgramsPanel` 993, root `TrainingLog` ~2,700 |
| Hooks | 680 `useState`, 89 `useEffect`, 90 `useMemo`, 0 `useCallback` |
| Backend | Hosted Supabase, 34 distinct tables reached by scattered `sb.from(...)` calls |
| Heaviest tables | `trainers` (38 call sites), `client_profiles` (37), `workout_entries` (26) |
| Routing | **None.** Zero `history.pushState` / `popstate` / `hashchange`; navigation is `useState("log")` |
| Tests | **None.** No `package.json`, no CI, no test config |
| Release process | 1,493 of 1,496 commits are GitHub web-UI uploads (`Add files via upload` → `Rename index_498.html to index.html`) |

The release process matters as much as the code: there is no local development
workflow. The app is shipped by dragging a complete `index.html` into
github.com, and GitHub Pages serves it at `jimfit.app`.

**Trigger for this work:** JimFit will be released as a mobile application on
iOS and Android using a WebView shell. Store submission requires signing,
versioning and review, which ends the hand-upload workflow regardless of what we
decide here. Shipping a 25,330-line untested monolith to two app stores would
put a store review queue in front of every bug fix.

## 2. Goals

1. Decompose the monolith into modules with enforced boundaries, so a change can
   be reasoned about, reviewed and tested in isolation.
2. Establish a test suite — characterization first, then unit and integration —
   that proves behavior is preserved through the refactor.
3. Put the boundaries that native release depends on (platform, routing,
   billing) in place *before* the first store submission, because they are the
   ones that cannot be retrofitted cheaply.
4. Keep `jimfit.app` and the iOS/Android builds on a single shared codebase.

## 3. Non-goals

- Rewriting to React Native, Next.js, or any other framework.
- Redesigning the UI or changing product behavior. **This refactor is
  behavior-preserving by definition;** any behavior change is a separate,
  explicitly-approved piece of work.
- Introducing a global state manager (Redux, Zustand, MobX).
- Monorepo, micro-frontends, or use-case/interactor classes.
- Rewriting the Supabase schema or RLS policies.

## 4. Constraints

- **C1.** Live paying users. Every step must ship working software; no big-bang
  cutover.
- **C2.** The database schema is *not* in this repository. The code references
  `supabase_push_notifications.sql` (`index.html:411`) but no `.sql` files are
  committed. Integration tests cannot assume a reproducible database.
- **C3.** `jimfit.app` must keep working throughout, served from the same repo.
- **C3a.** A large part of the system lives server-side and is absent from this
  repo: **7 Edge Functions** (`ai-chat`, `food-lookup`, `food-photo-lookup`,
  `voice-transcribe`, `voice-log-entry`, `voice-profile-entry`, `send-push`),
  **23 Postgres RPCs** (including `increment_client_total_due`,
  `switch_to_paid_diet_plan`, `delete_my_account`,
  `owner_delete_trainer_account`), and **2 storage buckets**
  (`progress-photos`, `trainer-photos`). The money and account-deletion logic
  is in that set. These should end up under `supabase/` in this repo.
- **C4.** The Supabase anon key is public by design; all data protection rests on
  RLS policies that are not reviewable from this repo.
- **C5.** Apple App Store guideline 4.2 (Minimum Functionality) rejects
  wrapped-website apps with no native integration.
- **C6.** Apple IAP rules apply to digital content sold in-app. Current pricing
  is `SELF_TRAIN_MONTHLY_PRICE = 10`, `PROGRAM_PRICE = 35`,
  `DIET_PLAN_PRICE = 30`, collected via Whish Money with a manual "mark as paid"
  step (`index.html:1361-1370`).

## 5. Architecture

A **domain-modular monolith with four horizontal layers**, enforced by a
dependency rule. Chosen over Feature-Sliced Design (its entity/feature/widget
split fights the role-based product surfaces, and it is ceremony for a two-person
team) and over Clean Architecture with use-case classes (Supabase plus a query
cache already fills that role).

### 5.1 Layout

```
src/
  app/          composition root — providers, router, role gate chain, theme
  platform/     every API that differs across web / iOS / Android
    push/       web-push.ts | native-push.ts behind one interface
    camera/     file input | Camera plugin
    audio/      MediaRecorder | native recorder
    storage/    localStorage | Preferences plugin
    captcha/    Turnstile | native attestation | no-op
    billing/    Whish | StoreKit IAP | Play Billing
  data/         the ONLY place `sb.from(...)` may appear
    supabase.ts   client + generated Database types
    clients.ts  trainers.ts  programs.ts  diet.ts  payments.ts  ...
  domain/       pure TypeScript — no React, no network, no Supabase
    access.ts     trial / paid-through / overdue gating
    volume.ts     sets, tonnage, PR detection
    nutrition.ts  BMR, macros, calorie targets
    muscles.ts    lift → muscle-group mapping
  modules/      one folder per product domain: hooks + components
    auth/ onboarding/ logging/ programs/ diet/ assessments/
    clients/ trainers/ gyms/ payments/ notifications/ ai-chat/
  shared/
    ui/           Icon, StatTile, Segmented, Select, empty-state art
    hooks/ lib/ types/
```

### 5.2 The dependency rule

This rule *is* the architecture; the folders only make it visible.

```
app     → modules, domain, data, platform, shared
modules → domain, data, platform, shared
data    → platform (supabase client), shared/types
domain  → (nothing)
shared  → (nothing, except other shared)
```

- Nothing imports upward.
- **Modules never import each other.** Cross-domain needs go down through
  `domain/` or `data/`.
- `domain/` importing nothing is what makes it testable without mocks.

**Enforcement:** `dependency-cruiser` rules run in CI and fail the build. An
unenforced boundary is a comment.

### 5.3 Why each boundary exists

**`platform/` — the boundary that cannot be retrofitted.** Web Push does not
exist in any iOS WebView. The 24 `Notification` references, the `PushManager`
registration, the VAPID key and the `push_subscriptions` table all need a second
native implementation on APNs/FCM. The same divergence hits the 6 `getUserMedia`
and 10 `MediaRecorder` call sites, the 3 `type:"file"` camera inputs feeding the
`progress-photos` and `trainer-photos` storage buckets, and Cloudflare Turnstile
— which cannot allowlist the `capacitor://localhost` origin at all. Left inline
in components, each of these forks the codebase per platform.

**`data/` — one place per table.** A column rename today is a grep across 25,330
lines. One repository module per table group, typed by
`supabase gen types typescript`, makes schema drift a compile error.

**`domain/` — where the unit tests pay off.** Pure functions need no mocks, no
jsdom, no network. These are the rules that decide whether someone is charged or
locked out (`isTrainerPaymentOverdue`, trial gating, volume and PR math, macro
targets), and they are currently tangled into render functions.

**`modules/` — writing down a decomposition that already exists.** The large
components are already domain-clustered; this records the seams rather than
inventing them.

## 6. Platform strategy

**Capacitor**, with web assets bundled into the binary and served from
`capacitor://localhost`.

Rejected alternatives: Cordova (legacy, declining plugin ecosystem); a
hand-rolled `WKWebView`/`WebView` shell (a `file://` origin is not a secure
context, which breaks `getUserMedia` and the camera inputs outright); TWA
(Android-only, no iOS equivalent).

Capacitor is also the answer to constraint **C5** — native push, camera and
haptics are the native integration that guideline 4.2 looks for.

`sw.js` is retired for the native builds; bundled assets plus the query cache
replace what the service worker was doing. It remains for the PWA on
`jimfit.app`.

## 7. Cross-cutting decisions

### 7.1 Routing (blocking for Android release)

There is no routing today, so the Android hardware/gesture back button will exit
the app from every screen. Introduce URL-addressable routes covering the gate
chain (`WelcomeGate` → `RoleGate` → `AuthGate` → `ProfileGate`), the role
surfaces (client / trainer / gym owner / manager) and every tab currently held in
`useState`. This also supplies deep links for push notification taps.

### 7.2 Server cache

TanStack Query over the `data/` repositories, replacing hand-rolled fetching in
89 `useEffect` blocks. On mobile this supplies the offline and retry behavior a
WebView app needs.

### 7.3 Billing and entitlement (blocking for iOS release)

Entitlement — "may this person see this screen" — becomes a single `domain/`
function over a single entitlement state. *How* someone paid moves behind
`platform/billing`: Whish on web and Android, StoreKit IAP on iOS. This is a
prerequisite for resolving **C6**, not a consequence of it.

## 8. Testing strategy

### 8.1 Sequencing: characterization first

Approved approach. The refactor is only safe if the current behavior is pinned
down *before* anything moves. Characterization tests describe what the app does
today — including any bugs — and are the regression gate for every later phase.

### 8.2 The only testable surface today is the running app

Nothing in `index.html` is importable: every component lives inside one IIFE with
no exports. Characterization therefore starts as **end-to-end tests driven
through a browser**, not unit tests.

The demo harness already built for this branch (auth gates bypassed via a
`window.__DEMO` seed, Turnstile disabled, service worker off) becomes the test
fixture that makes those flows reachable without real credentials.

### 8.3 Determinism without the schema

Constraint **C2** rules out a reproducible live database. Characterization tests
therefore intercept the Supabase REST boundary (`*.supabase.co/rest/v1/*`) and
serve **hand-authored synthetic fixtures** — never recorded production traffic,
which would contain real client health and payment data.

### 8.4 The pyramid, once modules exist

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `domain/` pure functions — no mocks needed |
| Unit | Vitest + Testing Library | `shared/ui` components |
| Integration | Vitest + Testing Library + MSW | `modules/` — a module against faked Supabase responses |
| Contract | Vitest + MSW | `data/` repositories against fixture payloads |
| E2E | Playwright | the characterization suite, kept as the regression gate |

### 8.5 Flows the characterization suite must cover

1. Welcome → role pick → signup → profile wizard → dashboard
2. Login → client dashboard → log a workout (picker → sets → feed)
3. Diet: food logging, targets, instant meal plan
4. Trainer: roster, client detail, assign a program
5. Trainer gates: first payment due, pending approval, payment overdue, not on roster
6. Coach/manager: billing panels, program and diet requests
7. Gym owner surface
8. Payments: request → Whish claim → mark paid → access unlocked
9. Assessments, measurements, progress photos
10. Push onboarding gate
11. Password recovery
12. Self-train trial and access-locked screen

## 9. Migration sequencing

Strangler pattern. Each phase ends with working software, a green suite, and a
deployable app.

| Phase | Deliverable | Gate |
|---|---|---|
| 0 | Vite + TypeScript + Vitest + Playwright + CI; `index.html` still shipped verbatim | CI green on an empty suite |
| 1 | Characterization E2E suite over §8.5 | All flows pinned; suite green against current build |
| 2 | `domain/` extracted with unit tests | E2E still green |
| 3 | `data/` repositories + generated types; all `sb.from` moved | E2E still green |
| 4 | `platform/` boundary; Capacitor shell; native push | E2E green on web; app runs on both devices |
| 5 | Router + TanStack Query | E2E green; Android back button correct |
| 6 | `modules/` extracted domain by domain, by codemod | E2E green after each domain |
| 7 | Store release prep: billing adapters, store metadata | Submission-ready |

### 9.1 Phase 6 is a codemod, not hand-editing

`tools/extract/extract.py` performs the split mechanically, driven by
`tools/extract/module-map.json`. Declaration bodies are copied byte-for-byte;
only import/export headers are generated. Verified output on the current
`index.html`:

| Measure | Result |
|---|---|
| Declarations extracted | 394 into 43 modules |
| Source lines covered | 25,011 / 25,028 (99.9%) |
| Code preserved verbatim | 24,235 / 24,238 non-blank lines |
| Syntax check (`bun build --no-bundle`) | 43 files, 0 failures |
| Import graph | 332 relative imports, 0 unresolved |
| Bundle | 43 modules linked in 15ms |
| Non-declaration statements needing hand placement | 13 |

Three properties of the source make this possible: 398 top-level names with
**zero collisions**; no JSX, so extracted files need no transpiler; and `C` /
`styles` are mutated in place rather than reassigned, so ESM live bindings
carry theme switching across module boundaries unchanged.

**What the codemod does not prove:** nothing has rendered. Structural validity
is not behavioural equivalence — that is what the Phase 1 suite is for, and why
the split runs only after it is green.

Residual manual work after the codemod: triage of `shared/lib/misc.js`
(117 symbols / 1,393 lines in the fallback bucket), and hand-splitting the five
components that remain oversized — `DietPanel` 2,215, `TrainingLog` 1,840,
`CoachView` 1,646, `ProgramsPanel` 986, `TrainerView` 955.

## 10. Risks and open questions

| # | Item | Impact | Owner |
|---|---|---|---|
| R1 | **Apple IAP applicability** to self-train subscription and digital program/diet sales | Rejection; payments rework | Needs a decision before Phase 7, ideally before Phase 4 |
| R2 | **Database schema absent from repo** (C2) | Integration tests cannot use a real DB; RLS bugs stay uncaught | Request a schema dump; if obtained, revisit §8.3 |
| R3 | **Push migration to APNs/FCM** is a rewrite, not a config change | Phase 4 effort | Sized during planning |
| R4 | **Turnstile has no valid origin** under Capacitor | Signup/login blocked in native builds | Decide: drop for native, or native attestation |
| R5 | **Single maintainer's workflow ends** — hand-uploaded `index.html` is incompatible with a build pipeline | Release process change | Needs agreement before Phase 0 lands on `main` |
| R6 | Characterization tests pin bugs as "correct" | Refactor preserves defects | Acceptable and intended; log them separately for later fixes |
| R7 | **Hosting is a manually-toggled setting and has already failed.** GitHub Pages deployed `38cdc00` successfully at 2026-09-20T08:31Z; by 17:56Z `jimfit.app` served GitHub's "Site not found" and `has_pages` read `false` | Total outage, unfixable without repo admin | Needs repo admin (R5's ask) and, longer term, a deploy that is defined in code rather than in a settings toggle |
| R8 | Server-side surface (C3a) is unversioned and unreviewable | A refactor changes call sites against an interface nobody here can read | Get the functions into `supabase/` in this repo |

## 11. Success criteria

- No file in `src/` over ~400 lines; no component over ~200.
- `dependency-cruiser` passes in CI with zero boundary violations.
- Every flow in §8.5 covered by a passing Playwright test.
- `domain/` at 100% line coverage; overall coverage gate agreed in planning.
- A single `main` build produces the web deploy, the iOS app and the Android app.
- `jimfit.app` behavior is indistinguishable from today's at every phase boundary.
