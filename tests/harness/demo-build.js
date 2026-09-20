import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Every patch must match exactly once. index.html is regenerated wholesale on
// every release, so a silent zero-match would leave the harness serving an
// unpatched build and the suite asserting against the login screen.
const PATCHES = [
  [`const TURNSTILE_SITE_KEY = "0x4AAAAAAE4BdmWSch95dAg1";`,
   `const TURNSTILE_SITE_KEY = "";`],
  [`const [clientName, setClientName] = useState(null);`,
   `const [clientName, setClientName] = useState(window.__DEMO.clientName);`],
  [`const [profile, setProfile] = useState(null);`,
   `const [profile, setProfile] = useState(window.__DEMO.profile);`],
  [`const [trainerInfo, setTrainerInfo] = useState(null);`,
   `const [trainerInfo, setTrainerInfo] = useState(window.__DEMO.trainer);`],
  // The three "have we checked yet" flags are set inside promise callbacks on
  // the real Supabase session call. Under test that call is anonymous and can
  // reject, leaving the gate chain parked on `return null` forever.
  [`const [nameChecked, setNameChecked] = useState(false);`,
   `const [nameChecked, setNameChecked] = useState(true);`],
  [`const [trainerChecked, setTrainerChecked] = useState(false);`,
   `const [trainerChecked, setTrainerChecked] = useState(true);`],
  [`const [profileChecked, setProfileChecked] = useState(false);`,
   `const [profileChecked, setProfileChecked] = useState(true);`],
  [`const [pushGateSkipped, setPushGateSkipped] = useState(false);`,
   `const [pushGateSkipped, setPushGateSkipped] = useState(true);`],
  [`if ("serviceWorker" in navigator) {`, `if (false) {`],
  [`return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : null;`,
   `return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : window.__DEMO.clientName;`],
];

const BOOT = `<script>window.__jimfitBootStart = Date.now();</script>`;

export function buildDemo(outDir, role = "client") {
  let src = readFileSync("index.html", "utf8");
  src = src.replace(BOOT, BOOT + `\n<script>window.__DEMO=${JSON.stringify(demoState(role))};</script>`);
  for (const [from, to] of PATCHES) {
    const hits = src.split(from).length - 1;
    if (hits !== 1) {
      throw new Error(`harness drift: ${hits} matches for "${from.slice(0, 70)}"`);
    }
    src = src.replace(from, to);
  }
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
