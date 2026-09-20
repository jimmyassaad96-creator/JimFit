import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Every patch must match exactly once. index.html is regenerated wholesale on
// every release, so a silent zero-match would leave the harness serving an
// unpatched build and the suite asserting against the login screen.
const GATE_PATCHES = [
  [`const [clientName, setClientName] = useState(null);`,
   `const [clientName, setClientName] = useState(window.__DEMO.clientName);`],
  [`const [profile, setProfile] = useState(null);`,
   `const [profile, setProfile] = useState(window.__DEMO.profile);`],
  [`const [trainerInfo, setTrainerInfo] = useState(null);`,
   `const [trainerInfo, setTrainerInfo] = useState(window.__DEMO.trainer);`],
  [`const [pushGateSkipped, setPushGateSkipped] = useState(false);`,
   `const [pushGateSkipped, setPushGateSkipped] = useState(true);`],
  [`return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : null;`,
   `return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : window.__DEMO.clientName;`],
];

// Applied to every variant, including the one that keeps the real auth gates:
// the production Turnstile key is bound to jimfit.app and renders an error on
// localhost, and the service worker would serve a stale build between runs.
const ALWAYS = [
  [`const TURNSTILE_SITE_KEY = "0x4AAAAAAE4BdmWSch95dAg1";`,
   `const TURNSTILE_SITE_KEY = "";`],
  [`if ("serviceWorker" in navigator) {`, `if (false) {`],
];

const BOOT = `<script>window.__jimfitBootStart = Date.now();</script>`;

function apply(src, patches) {
  for (const [from, to] of patches) {
    const hits = src.split(from).length - 1;
    if (hits !== 1) throw new Error(`harness drift: ${hits} matches for "${from.slice(0, 70)}"`);
    src = src.replace(from, to);
  }
  return src;
}

/**
 * @param outDir   where the patched copy is written
 * @param role     "client" | "trainer" | "gates" ("gates" keeps the real
 *                 Welcome/Role/Auth/Profile chain in place)
 * @param patch    optional overrides merged into the seeded trainer/profile
 */
export function buildDemo(outDir, role = "client", patch = {}) {
  let src = apply(readFileSync("index.html", "utf8"), ALWAYS);
  if (role !== "gates") {
    const state = demoState(role, patch);
    src = src.replace(BOOT, `${BOOT}\n<script>window.__DEMO=${JSON.stringify(state)};</script>`);
    src = apply(src, GATE_PATCHES);
  }
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "index.html");
  writeFileSync(out, src);
  return out;
}

export function demoState(role, patch = {}) {
  const far = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const base = {
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
  if (patch.trainer) base.trainer = { ...base.trainer, ...patch.trainer };
  if (patch.profile) base.profile = { ...base.profile, ...patch.profile };
  return base;
}

// Named variants, each served under /<name>/ by serve.js.
export const VARIANTS = {
  client: ["client", {}],
  trainer: ["trainer", {}],
  gates: ["gates", {}],
  "trainer-unapproved": ["trainer", { trainer: { is_approved: false } }],
  "trainer-overdue": ["trainer", { trainer: { next_payment_date: "2020-01-01" } }],
  // trial expired and nothing paid through: the self-train access gate
  "client-locked": ["client", { profile: { trial_ends_at: "2020-01-01", access_paid_through: null } }],
};
