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
