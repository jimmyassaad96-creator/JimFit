// Slice of the stylesheet built by buildStyles(). Split out purely for
// file size -- the entries are unchanged and the object is reassembled
// by spreading these together, so the result is identical.
import { C, withAlpha, MEAL_THEME } from "../palette.js";

export function panelsStyles() {
  return {

    // Sept 12 2026, Jimmy: "can we make the workout exercise look to look
    // like this" — a design-audit mockup ("SAFER DELETE") asking for the
    // logged sets under an exercise to render as a numbered list (not
    // wrapped pill chips), each with its own bigger red-tinted delete
    // target, and tapping it expands an inline "are you sure" right on
    // that row instead of deleting the set on one tap.
    setListCol: { display: "flex", flexDirection: "column", gap: 2, marginTop: 2 },
    setListRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", borderRadius: 10 },
    setListRowActive: { background: C.criticalSoft, border: `1px solid ${withAlpha(C.critical, 0.3)}`, padding: "10px", margin: "2px 0" },
    setListText: { flex: 1, minWidth: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
    setListPRTag: { color: C.brand, fontWeight: 800 },
    setListTextStrike: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: C.ink3, textDecoration: "line-through", marginBottom: 4 },
    setListTime: { flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.ink3 },
    setDeleteBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 10, background: withAlpha(C.critical, 0.14), border: `1px solid ${withAlpha(C.critical, 0.3)}`, color: C.critical, cursor: "pointer", flexShrink: 0 },
    setDeleteBtnDisabled: { opacity: 0.35, cursor: "not-allowed" },
    setConfirmCancelBtn: { flex: "none", background: "transparent", border: `1.5px solid ${C.cardBorderStrong}`, borderRadius: 999, padding: "7px 14px", color: C.ink, fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" },
    setConfirmDangerBtn: { flex: "none", background: C.criticalStrong, border: "none", borderRadius: 999, padding: "7px 14px", color: "#fff", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" },

    // Sept 6 2026, Jimmy: "the column doesnt fit" — with 4 goal options
    // (Fat Loss/Recomp/Maintenance/Muscle Gain), inline-flex + nowrap let
    // "Muscle Gain" run past the screen edge on narrow phones instead of
    // wrapping. flex+wrap keeps one row when it fits, wraps to a second
    // row when it doesn't — same look, no more cutoff.
    segmented: { display: "flex", flexWrap: "wrap", gap: 4, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 4 },
    segmentedBtn: { flex: "0 0 auto", background: "transparent", border: "1px solid transparent", borderRadius: 7, padding: "7px 12px", color: C.ink3, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", cursor: "pointer", textTransform: "uppercase" },

    muscleList: { display: "flex", flexDirection: "column", gap: 18, marginTop: 18 },
    muscleRow: { display: "flex", flexDirection: "column", gap: 7 },
    muscleRowTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
    muscleName: { fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "0.02em", color: C.ink },
    muscleVolText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.ink2 },
    muscleShare: { color: C.ink3 },
    muscleSubText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.ink3 },
    barTrack: { width: "100%", height: 9, borderRadius: 6, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.18)" },
    barFill: { height: "100%", borderRadius: 6, transition: "width 0.3s ease", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)" },

    // Muscles tab restyle (jimfit-flow_12.html) — MuscleBalanceCard's new
    // Front/Back toggle and its tap-to-reveal detail card, plus the donut
    // chart that replaces the old muscleList bars below. All scoped to this
    // one tab; nothing here is reused elsewhere.
    muscleViewToggle: { display: "flex", background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 999, padding: 2, flexShrink: 0 },
    muscleViewToggleBtn: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, padding: "6px 12px", borderRadius: 999, color: C.ink3, background: "transparent", border: "none", cursor: "pointer" },
    muscleViewToggleBtnActive: { background: C.brand, color: C.brandInk },
    muscleDetailCard: { marginTop: 10, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transition: "opacity 0.2s ease" },
    muscleDetailCardHidden: { opacity: 0, pointerEvents: "none" },
    muscleDetailName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12.5, color: C.ink },
    muscleDetailSub: { fontFamily: "'Manrope', sans-serif", fontSize: 10.5, color: C.ink3, marginTop: 2 },
    donutRow: { display: "flex", alignItems: "center", gap: 14, marginTop: 4 },
    donutLegend: { flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
    donutLegendItem: { display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.ink2, cursor: "pointer", transition: "opacity 0.15s ease", background: "transparent", border: "none", padding: 0, width: "100%", textAlign: "left" },
    donutLegendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
    donutLegendName: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    donutLegendValue: { color: C.ink3, flexShrink: 0 },

    // Sept 11 2026, Jimmy: brand pass, step 5 (phase 2 — typography/
    // hierarchy) — every section heading in the app (39 places share this
    // one wrapper) looked exactly like a slightly bigger line of body text,
    // with nothing marking it as "this is where a new section starts."
    // Same accent-bar device as the side menu's active row, reused here so
    // it reads as one consistent visual language instead of a one-off: a
    // thin brand-colored bar to the left of every section title. This is
    // the single biggest scannability win available without rewriting each
    // section's copy — no per-screen text changes needed.
    sectionHead: { display: "flex", flexDirection: "column", gap: 3, marginTop: 30, marginBottom: 14, paddingLeft: 11, borderLeft: `3px solid ${C.brand}` },
    sectionTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: "0.03em", color: C.ink },
    sectionSub: { fontSize: 12, color: C.ink3 },
    progressList: { display: "flex", flexDirection: "column", gap: 10 },
    progressCard: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "13px 15px" },
    progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    progressFooter: { display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ink3, marginTop: 2 },

    bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: withAlpha(C.panel, 0.92), backdropFilter: "blur(10px)", borderTop: `1px solid ${C.cardBorder}`, padding: "10px 0 max(10px, env(safe-area-inset-bottom))", zIndex: 40 },
    // minWidth: 0 is the load-bearing bit here — without it, a flex:1 item
    // won't shrink below its label's natural width, so once a 7th tab
    // (Trainer) got added, "Programs"/"AI Chat" refused to shrink and pushed
    // the whole bar wider than the screen, clipping the last tab off the
    // right edge on narrower phones. Smaller font/letter-spacing + an
    // ellipsis fallback on the label keep every tab actually readable at
    // that shrunk width instead of visually mashed together.
    navBtn: { position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "6px 2px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.01em" },
    navBtnLabel: { maxWidth: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
    navIndicator: { position: "absolute", top: -10, width: 28, height: 2, borderRadius: 2, background: "transparent" },
    navIndicatorActive: { background: C.brand },

    overlay: { position: "fixed", inset: 0, background: C.scrim, display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, backdropFilter: "blur(2px)" },
    sheet: { background: C.panel, borderTop: `1px solid ${C.cardBorderStrong}`, borderRadius: "18px 18px 0 0", padding: "20px 20px 26px", width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 -12px 40px rgba(0,0,0,0.5)" },
    sheetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    sheetTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: "0.04em", color: C.ink },
    closeBtn: { background: "transparent", border: "none", color: C.ink3, cursor: "pointer" },

    // Sept 13 2026, Jimmy: "its not clear the hamburger where is written log
    // how we can make this more easy on the eye and easy to use" — this is
    // the client-detail section switcher (Log/Muscles/Progress/Program/
    // Assessments/Measurements/Payments/Diet), and it used to be the same
    // plain card color/border as every other card on the page, with no
    // visual signal that it opens something. Now brand-tinted (same
    // "obviously tappable" treatment as the Programs browse cards'
    // detailsPill, e.g. C.brandSoft/C.brand) instead of blending into the
    // surrounding cards, and menuBtnChevron below adds a trailing down-arrow
    // — the universal "tap to switch/open a list" signal — next to the
    // hamburger + current section name.
    menuBtn: { display: "flex", alignItems: "center", gap: 8, background: C.brandSoft, border: `1px solid ${withAlpha(C.brand, 0.4)}`, borderRadius: 10, padding: "10px 14px", color: C.brand, fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "0.02em", cursor: "pointer" },
    menuBtnLabel: { flex: 1 },
    menuBtnChevron: { display: "flex", flexShrink: 0 },
    // Sept 11 2026, Jimmy: brand pass, bigger step — the Owner page's ONLY
    // way to switch sections was one "☰ [current section]" button that
    // opened the full-screen SideMenu every single time, even to flip
    // between the two or three sections used constantly (Clients,
    // Dashboard, Rota). That's the flat, buried navigation from the
    // reference mockups. Can't copy the mockup's literal bottom tab bar —
    // the app already has one fixed bottom nav bar (Log/Diet/Owner/etc.)
    // and stacking a second one on top of it would eat a lot of small-phone
    // screen space for two bars of tabs. This gets the same "most-used
    // sections always one tap away" result with a horizontal pill strip at
    // the TOP of the Owner page instead: Clients/Dashboard/Rota/Trainers
    // always visible, "More" opens the same SideMenu (now holding only the
    // less-frequent sections) for everything else.
    coachTabStrip: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 },
    coachTabBtn: { flex: "0 0 auto", display: "flex", alignItems: "center", gap: 5, background: "transparent", color: C.ink3, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "8px 14px", fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
    coachTabBtnActive: { color: C.brand, borderColor: C.brand, background: C.brandSoft },
    // Sept 11 2026, Jimmy: brand pass, step 3 — this is the "☰ Clients"
    // menu on the Owner page (and every other hamburger menu in the app,
    // including a client detail page's own sub-menu — all share this one
    // SideMenu component). It was still the flat, same-weight, no-accent
    // list from before the rest of the brand pass touched anything: a
    // hard-edged panel and rows with no visual distinction beyond a plain
    // background tint on the active one. Rounding the panel's open edge and
    // giving the active row a brand-colored left accent bar (the same
    // "accent bar marks where you are" idea as the bottom nav's indicator)
    // brings it in line with the rest of the app without restructuring it
    // into a different kind of navigation.
    sideMenuOverlay: { position: "fixed", inset: 0, background: C.scrim, display: "flex", alignItems: "stretch", justifyContent: "flex-start", zIndex: 60 },
    sideMenuPanel: { background: C.panel, borderRight: `1px solid ${C.cardBorderStrong}`, borderTopRightRadius: 18, borderBottomRightRadius: 18, width: "78%", maxWidth: 280, height: "100%", padding: "20px 14px", overflowY: "auto", boxShadow: "12px 0 40px rgba(0,0,0,0.5)" },
    sideMenuList: { display: "flex", flexDirection: "column", gap: 3 },
    sideMenuItem: { textAlign: "left", background: "transparent", border: "none", borderLeft: "3px solid transparent", color: C.ink2, fontFamily: "'Inter', sans-serif", fontSize: 14.5, padding: "12px 10px 12px 12px", borderRadius: 8, cursor: "pointer" },
    sideMenuItemActive: { background: C.brandSoft, borderLeftColor: C.brand, color: C.brand, fontWeight: 600 },
    sideMenuGroupLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: C.ink3, textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 10px 4px" },

    confirmCancelBtn: { flex: 1, background: "transparent", border: `1.5px solid ${C.cardBorderStrong}`, borderRadius: 999, padding: "13px", color: C.ink, fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 13.5, letterSpacing: "0.03em", cursor: "pointer" },
    confirmDangerBtn: { flex: 1, background: C.criticalStrong, border: "none", borderRadius: 999, padding: "13px", color: "#fff", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 13.5, letterSpacing: "0.03em", cursor: "pointer" },

    formLabel: { display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ink3, letterSpacing: "0.08em", marginTop: 16, marginBottom: 7, textTransform: "uppercase" },
    // Sept 11 2026, Jimmy: "make it look like a branded app... less
    // cluttery" — the New/Edit exercise sheet used to be one continuous
    // stack of labeled fields (Date, Workout title, Exercise, Muscle
    // group, Quick entry, Sets — 6+ sections with no visual separation).
    // Grouping the related fields into their own rounded cards (same
    // radius/border as every other card in the app) breaks that wall of
    // fields into a few clear chapters instead.
    // Sept 12 2026, Jimmy: "still the same" — C.card (the first cut's
    // background) sits only one notch lighter than the sheet's own
    // C.panel, so the card boundary all but disappeared and the sheet
    // still read as one flat list. Using C.bg instead — a full step
    // darker (light mode: a step lighter) than the sheet background,
    // same recessed-panel technique as a native settings screen — plus
    // the stronger border and a soft inset shadow makes each section
    // actually read as its own card at a glance instead of on close
    // inspection only.
    formSection: { background: C.bg, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 16, padding: "14px 14px 16px", marginTop: 16, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.18)" },
    // Sept 11 2026, Jimmy: "less cluttery... easy to use and on the eyes" —
    // WORKOUT_TITLES has 12 options, which as a wrapping pill grid ate up
    // 3 full rows before you even reached Exercise/Sets. A single
    // horizontally-scrollable strip (same pattern as a category rail in a
    // polished fitness app) keeps every option one tap/swipe away without
    // the wall of chips dominating the sheet.
    chipScrollRow: { display: "flex", flexWrap: "nowrap", gap: 6, overflowX: "auto", overflowY: "hidden", paddingBottom: 4, marginBottom: -4, scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" },
    input: { width: "100%", background: C.bg, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 12, padding: "11px 12px", color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 14 },
    // Sept 14 2026, Jimmy (app walkthrough): a long placeholder in a
    // narrow <input> — e.g. AI Chat's "Ask about training, nutrition, or
    // the app…" or Rota's "Note (optional) — e.g. "Upper body day"",
    // both squeezed next to the mic/Send buttons on a normal phone width
    // — was getting hard-clipped mid-word with no "…". This variant adds
    // the ellipsis (single-line inputs never wrap regardless, so this is
    // safe); it's separate from styles.input rather than added to it
    // directly because styles.input is also spread onto several
    // <textarea> fields (bulk exercise import, program/diet descriptions,
    // meal-plan notes) where forcing single-line/no-wrap would break
    // typing multi-line text.
    inputEllipsis: { width: "100%", background: C.bg, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 12, padding: "11px 12px", color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    inlineError: { display: "block", marginTop: 8, color: C.critical, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" },
    inlineNotice: { display: "block", marginTop: 8, color: C.good, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" },
    switchModeBtn: { display: "block", width: "100%", background: "transparent", border: "none", color: C.ink2, fontSize: 12.5, fontFamily: "'Inter', sans-serif", textDecoration: "underline", cursor: "pointer", marginTop: 14, padding: 4 },
    forgotBtn: { display: "block", width: "100%", textAlign: "right", background: "transparent", border: "none", color: C.ink3, fontSize: 11.5, fontFamily: "'Inter', sans-serif", cursor: "pointer", margin: "-4px 0 4px", padding: 4 },
    // Sept 12 2026, Jimmy: "log out to be more clear button" — this used to
    // be fully borderless/transparent, which read as plain text rather than
    // a button. Now a visible bordered pill, matching Support beside it
    // (both bumped to the same rounded-pill radius as the rest of the
    // header's buttons for one consistent, more "branded" family).
    logoutBtn: { display: "flex", alignItems: "center", gap: 5, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, color: C.ink2, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", padding: "7px 12px" },
    // Sept 15 2026, Jimmy: "show here the user is opened like me the owner
    // to know which account i opened even for trainers and clients down
    // the logo jim fit and i want the log out button to be beside the
    // user" — a plain, neutral badge (deliberately NOT the brand-blue
    // "myTrainerName" pill, which shows who's COACHING this account, a
    // different fact) stating whose account this actually is and what
    // role it has, placed on its own row directly under the logo row in
    // both the trainer/owner header and the client header, with Log out
    // right beside it on that same row instead of off on its own.
    // Sept 15 2026, same-day follow-up: "i want the log out to be shown
    // beside the owner or under it" — space-between had them on opposite
    // ends of the row (badge pinned left, Log out pinned all the way
    // right), which still read as "two unrelated things," not "beside."
    // flex-start groups them right next to each other on the left instead.
    accountIdRow: { display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10, flexWrap: "wrap" },
    accountIdBadge: { display: "flex", alignItems: "center", gap: 6, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 20, color: C.ink, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 0.3, padding: "5px 12px" },
    accountIdRole: { color: C.ink3, fontWeight: 600 },
    // Sept 7 2026, Jimmy: this used to be icon-only with just a `title`
    // tooltip — invisible on a phone, since there's no hover on touch. Widened
    // to fit a short "Support" label next to the icon, same look/feel as the
    // header's "Log out" button (uppercase mono, no fixed square width) so
    // people actually know what tapping it does.
    supportBtn: { display: "flex", alignItems: "center", gap: 5, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, color: C.ink2, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", padding: "7px 12px" },

    setRows: { display: "flex", flexDirection: "column", gap: 7 },
    setRowHeader: { display: "grid", gridTemplateColumns: "26px 1fr 1fr 1fr 24px", gap: 8, padding: "0 2px" },
    setColLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.ink3, letterSpacing: "0.06em" },
    setRow: { display: "grid", gridTemplateColumns: "26px 1fr 1fr 1fr 24px", gap: 8, alignItems: "center" },
    setIndex: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.ink3, textAlign: "center" },
    // Sept 12 2026, Jimmy: "less cluttery" — three fully-boxed inputs side by
    // side per row (each with its own strong border) read as busy, especially
    // stacked 3+ rows deep. Borderless with just a faint fill now — the grid
    // header labels above already say what each column is, so the box lines
    // were mostly just visual noise, not information.
    setInput: { background: withAlpha(C.brand, 0.05), border: "1px solid transparent", borderRadius: 8, padding: "9px 8px", color: C.ink, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, width: "100%", textAlign: "center" },
    rowDelete: { background: "transparent", border: "none", color: C.ink3, cursor: "pointer" },
    // "Add set" is the button someone taps most on this whole sheet (every
    // set of every exercise) — upgraded from a faint dashed outline to the
    // same inviting solid-fill blue pill as the rest of this pass, instead
    // of looking like a disabled/secondary option.
    addSetBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: withAlpha(C.brand, 0.14), border: `1px solid ${withAlpha(C.brand, 0.35)}`, borderRadius: 20, padding: "10px 12px", color: C.brand, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: "0.02em", cursor: "pointer", marginTop: 12, width: "100%" },
    // Only used by the two exercise-sheet "Quick entry" rows, so restyled in
    // place rather than forked: Space Grotesk + brand-tinted fill/border to
    // match jimfit-flow_12.html's .ex-apply-btn.
    quickEntryApplyBtn: { flexShrink: 0, background: withAlpha(C.brand, 0.22), border: `1px solid ${withAlpha(C.brand, 0.5)}`, borderRadius: 9, padding: "0 16px", color: C.ink, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12.5, cursor: "pointer" },
    saveBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: `linear-gradient(180deg, ${C.brand}, ${C.brandDim})`, color: C.brandInk, border: "none", borderRadius: 999, padding: "14px", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "0.04em", cursor: "pointer", marginTop: 22, boxShadow: "0 6px 18px rgba(62,123,250,0.25)" },
    // New/Edit-exercise sheet only (jimfit-flow_12.html's .ex-save-btn /
    // .ex-sheet-title) — a rounded-rect gradient CTA in Space Grotesk instead
    // of the shared saveBtn's full pill, and the sheet title in the same
    // font. Scoped so the other ~58 places saveBtn is used (every other
    // "Save" button in the app) and the generic confirm/menu dialog that
    // also shares sheetTitle are both untouched.
    exSheetSaveBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: `linear-gradient(135deg, ${C.brandDim}, ${C.brand})`, color: C.brandInk, border: "none", borderRadius: 12, padding: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginTop: 22, boxShadow: `0 12px 26px -10px ${withAlpha(C.brand, 0.55)}` },
    // Sept 14 2026, Jimmy: secondary "Save & add another" button on the
    // New/Edit exercise sheet — bordered/tinted instead of the solid
    // gradient exSheetSaveBtn gets, so the sheet's one solid-fill CTA stays
    // "Finish & close" while this reads as the lighter, repeatable action.
    exSheetSaveAddAnotherBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: withAlpha(C.brand, 0.14), border: `1px solid ${withAlpha(C.brand, 0.4)}`, borderRadius: 12, padding: 13, color: C.brand, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginTop: 22 },
    exSheetTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15.5, letterSpacing: "0.02em", color: C.ink },
    btnDisabled: { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" },

    gateWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: `radial-gradient(130% 100% at 50% -10%, ${C.bgTop} 0%, ${C.bg} 55%)` },
    // Sept 13 2026, Jimmy: the "< Back" link on the role-picker and login/
    // signup screens used to be the first item inside the vertically-
    // centered gateCard — so its on-screen spot drifted with the card's
    // height and the viewport size, reading as a stray link floating alone
    // with a big gap above it instead of a normal top-anchored back
    // control (confirmed on an actual phone size, not just a tall desktop
    // window). Now rendered as a sibling of gateCard, absolutely positioned
    // to the top-left corner of gateWrap (which is already position:
    // relative) — the standard place a mobile back control lives, always
    // in the same spot regardless of how much content is below it.
    gateBackBtn: { position: "absolute", top: 20, left: 22, zIndex: 2, display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: C.ink2, fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 },
    // Sept 12 2026, Jimmy: went back and forth on this twice — removed the
    // boxed-card look, then restored it after "keep everything exactly like
    // the video!! and i want to pop up like the video" was (wrongly) read as
    // "bring the card back." Re-checked the actual reference video frame by
    // frame (frame_000/001/003/018 — welcome, role, signup, wizard) and
    // pixel-sampled the background behind the text on each: it's perfectly
    // flat, no border/panel-fill/shadow anywhere — the content just floats
    // on the page gradient. "pop up" was about the entrance animation (added
    // separately), not a modal/card look. Removed the box for good this time;
    // kept centering + the gatePop animation.
    gateCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center", maxWidth: 320, width: "100%" },
    roleBtn: { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", marginTop: 6 },
    roleBtnTitle: { display: "block", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "0.02em", color: C.ink },
    roleBtnSub: { display: "block", fontSize: 11.5, color: C.ink3, marginTop: 2, fontFamily: "'Inter', sans-serif" },
    // Sept 12 2026, Jimmy: "the same design... of what im sending you" —
    // jimfit-flow_1.html sets its headings in Space Grotesk and body copy in
    // Manrope (not the app's usual Oswald/Inter). Scoped to these gate/
    // wizard-only styles so onboarding matches the reference exactly without
    // re-branding the rest of the app (dashboard, trainer view, etc. keep
    // Oswald/Inter). The logo mark itself is untouched either way.
    gateTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: "-0.01em", margin: "4px 0 0", color: C.ink },
    gateTitleSmall: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", color: C.ink },
    gateSub: { fontFamily: "'Manrope', sans-serif", fontSize: 13, color: C.ink2, marginBottom: 4, maxWidth: 260 },

    // Sept 12 2026, Jimmy: "the get started on client page... i want it to
    // look like that by details every detail" — visual pass on the
    // welcome/role/auth/onboarding screens matching a reference flow he
    // shared: a small "JF" mark instead of the logo tile, a faint dumbbell +
    // floating-ring texture behind every gate screen, circular role
    // buttons, a nested bordered "form card" wrapping labeled fields, and
    // (biggest piece) the old single long ProfileGate form replaced by a
    // one-question-at-a-time wizard with its own progress bar.
    gateDecor: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 },
  };
}
