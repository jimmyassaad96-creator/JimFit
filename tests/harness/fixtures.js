// Hand-authored, never recorded. Production traffic carries real client health
// and payment data and must not enter this repo (spec 8.3).
export const FIXTURES = {
  // Shape mirrors the real insert payload built in ClientLogPanel's handleSave:
  // `sets` is an ARRAY of {reps, weight, rest}, not a count. A scalar here
  // crashes the render with "x.sets.map is not a function".
  workout_entries: [
    {
      id: "w1", client_id: "demo-profile", client_name: "Demo Client",
      date: "2026-09-19", exercise: "Bench Press", muscle_group: "chest",
      workout_title: "Push", created_at: "2026-09-19T10:00:00Z",
      sets: [
        { reps: "8", weight: "60", rest: "90" },
        { reps: "8", weight: "60", rest: "90" },
        { reps: "6", weight: "65", rest: "90" },
      ],
    },
  ],
  client_profiles: [], trainers: [], diet_plans: [], client_payments: [],
  body_assessments: [], scheduled_sessions: [], training_programs: [],
  exercise_catalog: [], client_notifications: [], trainer_notifications: [],
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
  // Auth is deliberately NOT intercepted: supabase-js treats a synthetic {}
  // session response as a protocol error and throws before the app renders.
  // The demo build already bypasses the auth gates, so the real (anonymous)
  // auth call failing is the same path the app takes in the browser today.
}

/** Sept 22 2026, Jimmy: the trainer bottom nav was consolidated to
 *  Members/Stats/Rota/Diet/My Log + a "More" button that opens a sheet with
 *  Muscles/AI Chat/Profile/My gym. Those four labels aren't in the bottom
 *  nav directly anymore, so open "More" first when the label isn't already
 *  on screen â every other caller (client nav, direct trainer tabs) is
 *  unaffected since its label is already visible and this is a no-op. */
const TRAINER_MORE_LABELS = ["Muscles", "AI Chat", "Profile", "My gym"];

/** Bottom-nav tabs are plain buttons; the label also appears in page copy, so
 *  take the last match â the nav sits at the end of the tree. */
export async function openTab(page, label) {
  if (TRAINER_MORE_LABELS.includes(label)) {
    const alreadyVisible = await page.getByText(label, { exact: true }).last().isVisible().catch(() => false);
    if (!alreadyVisible) {
      await page.getByText("More", { exact: true }).last().click();
      await page.waitForTimeout(200);
    }
  }
  await page.getByText(label, { exact: true }).last().click();
  await page.waitForTimeout(400);
}

export async function boot(page, variant) {
  await installSupabaseFixtures(page);
  await page.goto(`/${variant}/`);
  await page.locator("#root").waitFor({ state: "attached" });
  // The splash paints "Loadingâ¦" first, and some gated screens resolve several
  // seconds later â waiting only for non-empty text catches the splash.
  await page.waitForFunction(() => {
    const t = document.getElementById("root").innerText.trim();
    return t.length > 40 && !/loadingâ¦?$/i.test(t);
  }, null, { timeout: 20000 });
}
