// Builds the src/ module tree into something the characterization suite can
// drive. Without this the suite only ever exercises index.html, which means it
// cannot see a refactor of src/ at all — the gate would be theatre.
//
// src/ is patched in a throwaway copy exactly as index.html is: the auth gates
// read a seeded window.__DEMO, Turnstile is off. One build serves every
// variant, because the seed lives in the HTML rather than the bundle.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".demo-src";

const PATCHES = [
  ["src/platform/captcha.js",
   [[`const TURNSTILE_SITE_KEY = "0x4AAAAAAE4BdmWSch95dAg1";`,
     `const TURNSTILE_SITE_KEY = "";`, 1]]],
  ["src/domain/selectors.js",
   [[`return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : null;`,
     `return user ? (user.user_metadata && user.user_metadata.display_name) || user.email || user.phone : (globalThis.__DEMO ? globalThis.__DEMO.clientName : null);`, 1]]],
  // clientName and the session email moved into useSession in task 9; the
  // gate seeds follow the state rather than the file.
  ["src/app/hooks/useSession.js",
   [[`const [clientName, setClientName] = useState(null);`,
     `const [clientName, setClientName] = useState(window.__DEMO.clientName);`, 1],
    [`const [userEmail, setUserEmail] = useState(null);`,
     `const [userEmail, setUserEmail] = useState(window.__DEMO.userEmail || null);`, 1],
    [`setUserEmail(user ? user.email : null);`,
     `setUserEmail(user ? user.email : (window.__DEMO.userEmail || null));`, 3]]],
  ["src/app/hooks/useTrainerIdentity.js",
   [[`const [trainerInfo, setTrainerInfo] = useState(null);`,
     `const [trainerInfo, setTrainerInfo] = useState(window.__DEMO.trainer);`, 1]]],
  ["src/app/TrainingLog.js",
   [[`const [profile, setProfile] = useState(null);`,
     `const [profile, setProfile] = useState(window.__DEMO.profile);`, 1],
    [`const [pushGateSkipped, setPushGateSkipped] = useState(false);`,
     `const [pushGateSkipped, setPushGateSkipped] = useState(true);`, 1]]],
];

// src/platform/supabase.js still reads window.supabase.createClient, the CDN
// global index.html provides with a <script> tag. Nothing in src/ imports the
// npm package yet, so the harness supplies the global before main.js runs.
// Worth fixing properly in platform/ later; shimming it here keeps the test
// build honest about what src/ currently expects.
const ENTRY = `import { createClient } from "@supabase/supabase-js";
window.supabase = { createClient };
await import("./src/main.js");
`;

const HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>JimFit (src)</title>
<script>window.__jimfitBootStart = Date.now(); window.__DEMO = __SEED__;</script>
</head><body><div id="root"></div>
<script type="module" src="/entry.js"></script></body></html>
`;

export function buildSrc() {
  rmSync(ROOT, { recursive: true, force: true });
  mkdirSync(ROOT, { recursive: true });
  cpSync("src", join(ROOT, "src"), { recursive: true });

  for (const [file, patches] of PATCHES) {
    const path = join(ROOT, file);
    let text = readFileSync(path, "utf8");
    for (const [from, to, expected] of patches) {
      const hits = text.split(from).length - 1;
      if (hits !== expected) {
        throw new Error(`src harness drift in ${file}: ${hits} matches (expected ${expected}) for "${from.slice(0, 60)}"`);
      }
      text = text.split(from).join(to);
    }
    writeFileSync(path, text);
  }
  writeFileSync(join(ROOT, "entry.js"), ENTRY);
  writeFileSync(join(ROOT, "index.html"), HTML);
  return ROOT;
}

export function builtHtml(seed) {
  const path = join(ROOT, "dist", "index.html");
  if (!existsSync(path)) throw new Error("run `bun run build:src` first");
  return readFileSync(path, "utf8").replace("__SEED__", JSON.stringify(seed));
}
