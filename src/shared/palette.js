// Colour tokens and the live `C` object every stylesheet slice reads.
// Kept dependency-free so the slices and theme.js can both import it
// without a cycle.

  const DARK_THEME = {
    // Sept 9 2026: lets the new calendar date-filter input (and any other
    // native form control that reads it) render its built-in icon/picker in
    // a color that's actually visible against this theme's surfaces —
    // browsers otherwise assume light and can draw a dark-on-dark icon.
    colorScheme: "dark",
    // Sept 17 2026, Jimmy: "the color of the app inside its too dark, can
    // we make it better in aesthetics way?" — the old values here (bg
    // #0B1526, card #152238) sat too close together in brightness, so
    // cards barely separated from the background and the whole app read as
    // one flat black slab. Lifted the whole scale a step, widened the gap
    // between bg/panel/card so real depth shows, brightened the brand blue,
    // and swapped the muddy olive "good" green for a fresher one. Approved
    // by Jimmy from a side-by-side preview ("Option A") before landing here.
    bg: "#121B30",
    bgTop: "#1B2745",
    panel: "#18213C",
    card: "#1E2C4A",
    cardBorder: "#2E4064",
    cardBorderStrong: "#3D5580",
    scrim: "rgba(8,12,24,0.82)",
    ink: "#F6F8FF",
    ink2: "#BFC9E0",
    ink3: "#8592AE",
    brand: "#4C86FF",
    brandDim: "#3A68D6",
    brandSoft: "rgba(76,134,255,0.18)",
    brandInk: "#0F1830",
    // Sept 12 2026: role-picker only — a distinct lighter "baby blue" for
    // the Client bubble so the two roles read as visually different at a
    // glance, not just two identical circles with different labels.
    clientAccent: "#8FC4FF",
    clientAccentSoft: "rgba(143,196,255,0.16)",
    good: "#8CD678",
    goodSoft: "rgba(140,214,120,0.16)",
    critical: "#DD7268",
    criticalStrong: "#C94F44",
    criticalSoft: "rgba(201,79,68,0.16)",
    // Sept 13 2026, Jimmy: "pending" phrasing (trainer request awaiting
    // review) reads as a caution/waiting state rather than good or bad —
    // gets its own amber token instead of borrowing critical/good.
    warning: "#EABD4C",
    warningSoft: "rgba(234,189,76,0.15)",
    subtleFill: "rgba(255,255,255,0.045)",
    // Sept 11 2026, Jimmy: brand pass, step 2 — cards were flat (border
    // only, no depth), unlike the "floating card" look in the reference
    // mockups. A pure black shadow barely reads on a dark navy bg, so this
    // is intentionally soft/low-opacity rather than the light theme's.
    // Sept 17 2026: deepened slightly alongside the richer palette above,
    // for a bit more lift under cards now that they sit lighter than bg.
    cardShadow: "0 6px 20px rgba(0,0,0,0.35)"
  };

  // Light-mode counterpart — same roles, swapped for a bright surface.
  // Brand/good/critical are pulled a shade darker than their dark-mode
  // versions so they still hold contrast against white instead of washing out.
  const LIGHT_THEME = {
    colorScheme: "light",
    // Sept 18 2026, Jimmy: "the light mode colors its too light" — bg, panel
    // and card were all sitting within a few points of pure white, so cards
    // barely separated from the background and the app read as one flat,
    // glary white slab (same underlying issue the dark theme had in the
    // other direction, fixed Sept 17 2026 — see DARK_THEME's own comment).
    // Approved by Jimmy from a side-by-side preview ("Option A" — deepen
    // the background, keep cards white so they actually float above it)
    // before landing here.
    bg: "#E9ECF3",
    bgTop: "#F2F4F9",
    panel: "#F2F4F9",
    card: "#FFFFFF",
    cardBorder: "#D3DAEA",
    cardBorderStrong: "#BFC8DE",
    scrim: "rgba(15,23,42,0.45)",
    ink: "#12172A",
    ink2: "#48526C",
    ink3: "#6B7488",
    brand: "#2C5BC7",
    brandDim: "#25479C",
    brandSoft: "rgba(44,91,199,0.10)",
    brandInk: "#FFFFFF",
    clientAccent: "#0EA5E9",
    clientAccentSoft: "rgba(14,165,233,0.10)",
    good: "#54802A",
    goodSoft: "rgba(84,128,42,0.14)",
    critical: "#C1443A",
    criticalStrong: "#A5372E",
    criticalSoft: "rgba(193,68,58,0.10)",
    warning: "#B7791F",
    warningSoft: "rgba(183,121,31,0.10)",
    subtleFill: "rgba(15,23,42,0.035)",
    cardShadow: "0 4px 16px rgba(15,23,42,0.10)"
  };

  // Mutated in place (never reassigned) whenever the theme changes, so every
  // C.xxx reference throughout the app — hundreds of them, in styles and
  // inline styles alike — picks up the new palette automatically on the next
  // render without needing to touch each usage.
  const C = Object.assign({}, DARK_THEME);

  // Small icon button that flips the app between dark/light — dropped into
  // every header. `theme`/`onToggle` are threaded down from TrainingLog,
  // the one place the actual preference lives and gets saved.
  // Sept 12 2026, Jimmy: "add also to the moon dark mode and to switch to
  // light mode... to be more clear" — same problem the Support button had
  // (Sept 7 comment below): icon-only with no visible boundary reads as
  // decoration, not a button. Bumped size and given the same brand-blue
  // tinted border as the rest of this pass so it's clearly tappable and
  // matches the header's other controls, while staying icon-only (a label
  // would fight with "Support"/"Log out" for space and the sun/moon glyph
  // plus the title tooltip already says what it does).
  const MEAL_THEME = {
    breakfast: { color: "#F0A937", soft: "rgba(240,169,55,0.16)", icon: "sun" },
    lunch: { color: "#3FAE68", soft: "rgba(63,174,104,0.16)", icon: "activity" },
    snack: { color: "#B36BE0", soft: "rgba(179,107,224,0.16)", icon: "apple" },
    snacks: { color: "#B36BE0", soft: "rgba(179,107,224,0.16)", icon: "apple" },
    dinner: { color: "#6A5CF5", soft: "rgba(106,92,245,0.16)", icon: "moon" }
  };

  const THEME_KEY = "jimfit-theme";

  function withAlpha(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // `styles` used to be a plain object literal, built once at script load —
  // meaning every color pulled from C.xxx in here got baked in as a fixed
  // string at that moment and would never move if C changed later. Wrapping
  // it in a function lets TrainingLog rebuild it (via Object.assign, so the
  // object identity every component already closed over stays the same)
  // whenever the theme flips, without touching any of the many `styles.xxx`
  // call sites below.

export { DARK_THEME, LIGHT_THEME, C, MEAL_THEME, THEME_KEY, withAlpha };
