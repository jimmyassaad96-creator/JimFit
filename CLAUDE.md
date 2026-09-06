# JimFit

## What it is

A **single-file, no-build-step React app** (`index.html`, ~13,500 lines) deployed as a static PWA at **jimfit.app** (GitHub Pages, custom domain via `CNAME`). No bundler/JSX transform — React is loaded via CDN as UMD and all elements are built with `React.createElement` aliased to `e(...)`.

**Stack:**
- React 18 (UMD, production build) + ReactDOM — client-side only, single root, one giant `TrainingLog()` component tree
- **Supabase** (Postgres + Auth + Storage + Edge Functions) as the entire backend — URL/anon key are hardcoded in the file (this is fine, it's a publishable key)
- EmailJS (client-side email sending, e.g. session reminders)
- A service worker (`sw.js`) — network-first caching so the app degrades gracefully on flaky gym wifi, and updates always reach clients without needing a reinstall
- Custom inline design system: dark navy theme (`#0B1526`), Oswald/Inter/JetBrains Mono fonts, hand-rolled `Icon` component (no icon library)

## What the app does

It's a **workout logging + personal training / gym management platform** with three user roles gated at signup (`RoleGate` / `AuthGate`):

1. **Client** — logs workouts (voice-to-text supported via `VoiceMicButton`/`SmartVoiceEntryButton`), tracks diet/macros, body measurements, progress photos, body assessments, check-ins with a coach, personal records, training streaks/heatmap, scheduled sessions calendar, and can browse/request training programs and diet plans.
2. **Trainer/Coach** — manages a client roster (`CoachView`), assigns training programs and diet plans, reviews client check-ins, diet logs, progress photos, handles trainer payments/billing, has their own profile, and can self-train (log their own workouts).
3. **Gym Owner / Manager** — oversees gyms, trainer rosters, trainer approval/payment status (`GymOwnerView`, `ManagerDashboard`, `TrainersBillingPanel`, `GymsBillingPanel`).

There's also an **AI chat panel** (general Q&A about training/nutrition/app usage) that calls a Supabase Edge Function `ai-chat` — so the actual LLM call is server-side, not in this file.

**Data model (Supabase tables inferred from `.from(...)` calls):** `trainers`, `client_profiles`, `client_program_assignments`, `client_custom_programs`, `client_program_items`, `training_programs`, `program_exercises`, `workout_entries`, `exercise_catalog`, `exercise_gifs`, `diet_plans`, `diet_plan_templates`, `diet_template_meal_items`, `diet_meal_items`, `diet_logs`, `client_food_logs`, `client_steps`, `body_assessments`, `body_measurements`, `progress_photos`, `client_check_ins`, `client_payments`, `trainer_payments`, `trainer_requests`, `scheduled_sessions`, `client_notifications`, `gyms`.

**Payment flow:** references "WhishPay" (`WhishPayBox`) — looks like a Lebanese/MENA payment method — plus gated access screens for overdue/first-payment/pending-approval trainers, and paid-access gates on programs/diet plans.

The repo history shows this file has been iteratively re-uploaded many times (index_180 → index_186), consistent with an app being built/edited outside a normal dev workflow and pushed as full-file replacements.

## Business rules

- **Trainer approval ≠ access.** A trainer being approved (added to the roster) does not by itself grant them access to the app — they must also have made at least one payment. Approved-but-unpaid trainers hit `TrainerFirstPaymentDueScreen`; approved-and-previously-paid-but-now-overdue trainers hit `TrainerPaymentOverdueScreen`. Don't conflate "approved" with "has access" anywhere in the code.
- **Phone numbers must be unique across trainer accounts.** A trainer's phone number is how JimFit matches their first payment to them, so it must not collide with another trainer's phone number — treat this as a uniqueness constraint on signup/edit, not just a formatting check.
- **The deployed file must be named exactly `index.html`.** GitHub Pages serves this repo as a static site; if the app's HTML file isn't named `index.html` at the repo root, the whole site 404s. This is why past commits show a repeated upload-then-rename pattern (`index_18X.html` → `index.html`) — always land on `index.html`, never leave the app under a numbered filename.
