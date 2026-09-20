// Slice of the stylesheet built by buildStyles(). Split out purely for
// file size -- the entries are unchanged and the object is reassembled
// by spreading these together, so the result is identical.
import { C, withAlpha, MEAL_THEME } from "../palette.js";

export function chromeStyles() {
  return {
    // paddingBottom needs to clear the fixed bottomNav (its own padding +
    // icon + label + env(safe-area-inset-bottom) on notched phones can add
    // up to ~90-100px) plus leave a visible gap below the last element on
    // long screens like the diet "Update my info" form — 84 was cutting it
    // close enough that the last field's helper text peeked out from behind
    // the nav's blurred background on some devices.
    // Sept 13 2026: a "box the app to a centered column on wide screens"
    // pass (matching a mockup's boxed-card presentation) went through a
    // few rounds here — first app-wide (shrank every tab), then scoped to
    // just My Profile — but the boxed tab ended up reading as broken/
    // smaller next to every other full-width tab: "every tab look fine
    // but the profile tab look smaller! can we make it fit like all the
    // tabs". Reverted in full — every tab, My Profile included, is back
    // to plain full-bleed, exactly as it rendered before any of that.
    app: { minHeight: "100vh", background: `radial-gradient(130% 100% at 50% -12%, ${C.bgTop} 0%, ${C.bg} 55%)`, color: C.ink, fontFamily: "'Inter', sans-serif", paddingBottom: 120 },

    // Sept 14 2026 fix, Jimmy: "on other tabs the logo also is on very top
    // on the screen cant be seen clearly" — this sticky header (and its
    // logo) sat flush at padding-top:18px with no allowance for a phone's
    // status bar/notch, so it rendered partly behind/under it. Same fix as
    // bottomNav already gets for the bottom inset, mirrored at the top.
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "max(18px, calc(8px + env(safe-area-inset-top))) 18px 16px", borderBottom: `1px solid ${C.cardBorder}`, flexWrap: "wrap", gap: 14, position: "sticky", top: 0, background: withAlpha(C.bg, 0.85), backdropFilter: "blur(10px)", zIndex: 30 },
    headerLeft: { display: "flex", alignItems: "center", gap: 10 },
    title: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: "0.05em", color: C.ink, cursor: "pointer" },
    titleInput: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: "0.05em", color: C.ink, background: "transparent", border: "none", borderBottom: `1px solid ${C.brand}`, padding: "0 0 2px", outline: "none", maxWidth: 220 },
    headerRight: { display: "flex", alignItems: "center", gap: 14 },
    // Sept 12 2026, Jimmy: new phone-first stacked header for the client
    // dashboard only (see the "keep the logo the same" comment above it) —
    // separate from header/headerLeft/headerRight so TrainerView's header
    // is unaffected.
    // Sept 14 2026 fix, Jimmy: same top-inset fix as styles.header, for the
    // client app's own logo header.
    clientHeader: { display: "flex", flexDirection: "column", gap: 10, padding: "max(16px, calc(6px + env(safe-area-inset-top))) 18px 14px", borderBottom: `1px solid ${C.cardBorder}`, position: "sticky", top: 0, background: withAlpha(C.bg, 0.85), backdropFilter: "blur(10px)", zIndex: 30 },
    clientHeaderBrandRow: { display: "flex", alignItems: "center", gap: 10 },
    clientHeaderInfoRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
    clientHeaderLogoutRow: { display: "flex", justifyContent: "flex-end" },
    // Same bordered/tinted circle ThemeToggle already uses — paired together
    // so Support and the theme switch read as one matching icon-button group.
    clientHeaderIconBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${withAlpha(C.brand, 0.35)}`, background: withAlpha(C.brand, 0.1), color: C.brand, cursor: "pointer", flexShrink: 0 },
    // Sept 12 2026, Jimmy: design audit — "today's plan / PR moment" card
    // on the Log tab. Brand-tinted gradient card (same brandSoft tint used
    // elsewhere, just as a gradient instead of a flat fill) so it reads as
    // the "hero" of the tab without introducing a new color.
    todayCard: { background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.14)}, ${withAlpha(C.brand, 0.04)})`, border: `1px solid ${withAlpha(C.brand, 0.35)}`, borderRadius: 18, padding: "18px 20px" },
    todayCardLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: C.brand },
    todayCardGreeting: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, marginTop: 5, lineHeight: 1.35 },
    // Sept 12 2026 (jimfit-flow_12.html restyle): each stat used to just be
    // bare text side-by-side — now an actual tile (bordered card, own tap
    // target, faint ambient pulse) so it reads as a small dashboard, matching
    // the prototype's "Volume / Sets done / New PRs" tile row exactly.
    todayCardStats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 },
    todayCardTile: { background: withAlpha(C.ink, 0.03), border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "10px 6px", textAlign: "center", animation: "tileReady 2.6s ease-in-out infinite", transition: "background 0.15s ease, border-color 0.15s ease" },
    todayCardTileActive: { background: withAlpha(C.brand, 0.14), borderColor: withAlpha(C.brand, 0.4), animationPlayState: "paused" },
    todayCardStatValue: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink },
    todayCardStatLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: "0.05em", textTransform: "uppercase", color: C.ink3, marginTop: 4, whiteSpace: "nowrap" },
    todayCardTileTip: { fontSize: 10.5, color: C.brand, textAlign: "center", marginTop: 12, lineHeight: 1.4 },
    unitToggle: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", background: C.card, color: C.ink2, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 20, padding: "8px 12px", cursor: "pointer" },

    statTile: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
    statTileLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.ink3, letterSpacing: "0.09em", textTransform: "uppercase" },
    statTileValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 700, color: C.brand },
    statTileValueLg: { fontFamily: "'Inter', sans-serif", fontSize: 30, fontWeight: 700, color: C.ink, fontVariantNumeric: "proportional-nums" },
    statTileUnit: { fontSize: 11, color: C.ink3 },
    statUnit: { fontSize: 11, color: C.ink3 },
    deltaChip: { display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10, letterSpacing: "0.02em" },

    // Sept 11 2026, Jimmy: "can we make it look like a branded app like we
    // did for the program and diet to look less cluttery?" — the filter
    // row used to sit directly on the page background as two bare form
    // fields; wrapped it in the same rounded card treatment every other
    // grouped control on Programs/Diet already uses (browseCard's
    // radius/border/shadow), so it reads as one grouped control instead of
    // loose fields floating at the top of the screen.
    // Sept 12 2026, Jimmy: "boxes to be blue... easy on the eyes, like the
    // progress tab" — the filter toolbar now gets the same soft brand-tinted
    // gradient card as the Log tab's "Today" hero card (styles.todayCard)
    // instead of a plain neutral card, so it reads as one family with the
    // rest of the brand pass below.
    toolbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, margin: "16px 18px 14px", padding: 14, background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.14)}, ${withAlpha(C.brand, 0.04)})`, border: `1px solid ${withAlpha(C.brand, 0.35)}`, borderRadius: 16, boxShadow: C.cardShadow },
    // Sept 13 2026: an explicit minWidth smaller than this column's own
    // content (the date-picker + "All dates" button together need ~224px)
    // let flexbox shrink the column below what its children actually need
    // — so instead of the toolbar's flexWrap correctly stacking the two
    // filters on a narrow phone, "Filter by date" silently overflowed the
    // right edge of the screen. minWidth:auto (the default for a flex item,
    // removed here) sizes it off its own content instead, so wrap triggers
    // exactly when it's needed.
    filterWrap: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
    filterLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.ink3, letterSpacing: "0.08em", textTransform: "uppercase" },

    // Sept 11 2026, Jimmy: brand pass, step 4 — dropdowns/date filters/text
    // inputs were still at the old 8-9px "boxy" radius while cards (14),
    // buttons (pill) and the side menu had all already moved to a rounder,
    // softer family. Bumping these to 12px keeps them visually distinct
    // from cards/buttons (form fields shouldn't be full pills — harder to
    // scan as click/type targets) while no longer looking like a leftover
    // screen next to everything else.
    // Sept 12 2026, Jimmy: borders now carry a visible brand-blue tint
    // (same family as the chip/pill borders) instead of the old neutral
    // gray — same "easy on the eyes" pass as the toolbar card above.
    select: { background: C.card, color: C.ink, border: `1px solid ${withAlpha(C.brand, 0.4)}`, borderRadius: 12, padding: "9px 30px 9px 12px", fontFamily: "'Inter', sans-serif", fontSize: 13, minWidth: 140, width: "100%" },
    selectChevron: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
    dateFilterRow: { display: "flex", alignItems: "center", gap: 8 },
    dateFilterInput: { background: C.card, color: C.ink, border: `1px solid ${withAlpha(C.brand, 0.4)}`, borderRadius: 12, padding: "9px 10px", fontFamily: "'Inter', sans-serif", fontSize: 13, minWidth: 140 },
    // "All dates"/unselected now matches a browseChip at rest; the active
    // state below matches browseChipActive's solid brand-gradient fill —
    // same chosen-vs-not-chosen blue language as the Progress tab pills.
    dateAllBtn: { background: C.card, color: C.ink2, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "8px 12px", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
    dateAllBtnActive: { border: "none", color: C.brandInk, fontWeight: 700, background: `linear-gradient(135deg, ${C.brand}, ${C.brandDim})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px -6px ${withAlpha(C.brand, 0.6)}` },

    // Sept 11 2026, Jimmy: brand pass, step 1 — the app's two primary blue
    // gradient CTAs (this "+ New ..." button and Save below) were the only
    // buttons left with a boxy 10-11px radius while every secondary button
    // (filters, chips, demo toggles) was already a full pill (radius 20+).
    // Pulling these two into pills too makes every screen read as one
    // consistent brand instead of two competing button shapes.
    newBtn: { display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(180deg, ${C.brand}, ${C.brandDim})`, color: C.brandInk, border: "none", borderRadius: 999, padding: "11px 20px", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.03em", cursor: "pointer", boxShadow: "0 4px 14px rgba(62,123,250,0.25)" },
    // Client dashboard Log tab's "New exercise" CTA only (jimfit-flow_12.html) —
    // full-width gradient pill in Space Grotesk, deliberately separate from the
    // shared newBtn above so trainer-side "New program"/"Add a week" etc. stay untouched.
    clientNewExerciseBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", boxSizing: "border-box", background: `linear-gradient(135deg, ${C.brandDim}, ${C.brand})`, color: C.brandInk, border: "none", borderRadius: 14, padding: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: `0 12px 26px -10px ${withAlpha(C.brand, 0.55)}` },
    // Sept 19 2026 inspection fix: all three of this error-red family
    // (errorBanner here, inlineError, medicalNotice below) hardcoded the
    // same pale-pink "#F1C7C2" text color instead of the theme-aware
    // C.critical token every OTHER criticalSoft-background element in this
    // file correctly pairs it with (see goalChipBad, the "over" macro tint,
    // deltaChip) — low contrast against the light theme's near-white cards,
    // worse in dark mode.
    errorBanner: { display: "flex", alignItems: "center", gap: 8, margin: "10px 18px 0", padding: "9px 12px", background: C.criticalSoft, border: `1px solid ${withAlpha(C.criticalStrong, 0.4)}`, borderRadius: 8, fontSize: 12.5, color: C.critical },

    // Sept 9 2026, Jimmy: "can i have an option if i delete a workout a
    // button to undo what i deleted like excel" — a bottom-of-screen toast
    // that briefly offers to put a just-deleted exercise back. Sits above
    // bottomNav (z 40) but below overlay/sideMenuOverlay (z 50/60).
    undoToast: { position: "fixed", left: "50%", bottom: "calc(84px + env(safe-area-inset-bottom))", transform: "translateX(-50%)", zIndex: 45, display: "flex", alignItems: "center", gap: 14, background: C.panel, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 12, padding: "12px 16px", boxShadow: "0 10px 30px rgba(0,0,0,0.45)", maxWidth: "calc(100vw - 32px)", animation: "riseIn 0.2s ease-out" },
    undoToastText: { fontSize: 13, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    undoToastBtn: { background: "transparent", border: "none", color: C.brand, fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.03em", cursor: "pointer", padding: 0, flexShrink: 0 },
    undoToastClose: { background: "transparent", border: "none", color: C.ink3, cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" },

    feed: { padding: "14px 18px 0" },
    empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "56px 20px", color: C.ink3, textAlign: "center" },
    emptyText: { margin: 0, fontSize: 15, color: C.ink2, fontWeight: 500 },
    emptySub: { margin: 0, fontSize: 12.5, color: C.ink3 },

    dayBlock: { marginBottom: 24, animation: "riseIn 0.25s ease-out" },
    dayHeader: { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 },
    dayDate: { fontFamily: "'Oswald', sans-serif", fontSize: 14.5, fontWeight: 600, color: C.brand, letterSpacing: "0.05em" },
    dayRule: { flex: 1, height: 1, background: C.cardBorder },
    dayFull: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ink3 },

    // Sept 11 2026, Jimmy: brand pass, step 2 — a soft shadow (C.cardShadow)
    // + a touch more radius so list rows read as floating cards instead of
    // flat bordered boxes, matching the reference mockups. Logo/wordmark
    // color untouched — this only affects card containers.
    card: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "13px 15px", marginBottom: 10, boxShadow: C.cardShadow, transition: "border-color 0.15s ease" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 },
    cardHeaderLeft: { display: "flex", flexDirection: "column", gap: 6 },
    cardHeaderActions: { display: "flex", alignItems: "center", gap: 2 },
    // Space Grotesk (jimfit-flow_12.html's .log-exercise-name) — was Oswald;
    // matches the Today card / New exercise button font swap just above.
    exerciseName: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em", color: C.ink },
    muscleTag: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.04em", color: C.ink2, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "3px 8px 3px 6px", width: "fit-content" },
    entryTime: { display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.02em", color: C.ink3, width: "fit-content" },
    deleteBtn: { background: "transparent", border: "none", color: C.ink3, cursor: "pointer", padding: 5, borderRadius: 6 },
    // Sept 12 2026, Jimmy: design audit — a logged workout used to delete
    // on one tap with only an auto-expiring undo toast as a safety net.
    // This inline bar replaces that first tap with an explicit "are you
    // sure" right on the entry's own card — the undo toast still exists
    // underneath for the "wrong one" case, this just stops the accidental
    // one.
    deleteConfirmBar: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: C.criticalSoft, border: `1px solid ${withAlpha(C.critical, 0.3)}`, borderRadius: 10, padding: "9px 10px", margin: "8px 0" },
    deleteConfirmText: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: C.ink },
    // Sept 11 2026: a text-label sibling of deleteBtn for a "Change" action
    // that sits inline next to a full-width ghostPillBtn (e.g. the diet
    // plan hero card) — same transparent/no-border treatment, just with
    // visible padding so it doesn't collide with the button beside it.
    deleteBtnGhost: { background: "transparent", border: "none", color: C.ink2, cursor: "pointer", padding: "0 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, flexShrink: 0 },
    editBtn: { background: "transparent", border: "none", color: C.ink3, cursor: "pointer", padding: 5, borderRadius: 6 },
    // Sept 12 2026, Jimmy: "the programs is cluttered... show only [name]
    // and an arrow ... to press and see this description below" — a round
    // chevron toggle for any browse-card list (programs, ready diet plans)
    // that's collapsed to just its name by default. The rotation on tap is
    // the "something fun to press" — flips 180° via expandToggleBtnOpen
    // below, no icon swap needed.
    expandToggleBtn: { background: C.subtleFill, border: `1px solid ${C.cardBorder}`, color: C.ink2, cursor: "pointer", padding: 0, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, border-color 0.15s ease, color 0.15s ease" },
    expandToggleBtnOpen: { background: C.brandSoft, borderColor: C.brand, color: C.brand, transform: "rotate(180deg)" },
    // Sept 12 2026, Jimmy: "make something fun and pro to tap the client and
    // see this description" — the second pass on the Programs browse cards.
    // A labeled pill (icon + "See details" + a chevron that flips open)
    // reads as an obvious, friendly invitation to tap, replacing the bare
    // circular arrow — used together with IconBadge's per-program "logo".
    detailsPill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px 7px 11px", borderRadius: 999, border: `1px solid ${C.cardBorder}`, background: C.subtleFill, color: C.ink2, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 10, transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease" },
    detailsPillOpen: { background: C.brandSoft, borderColor: C.brand, color: C.brand },
    detailsPillChevron: { display: "flex", transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)" },
    // Sept 12 2026, Jimmy: "easy to tap" — a proper blue pill button (bigger
    // hit target, visible fill) for the Energy balance card's Steps
    // Edit/Add/Save controls, instead of the tiny ghost editBtn used for
    // compact inline icon buttons elsewhere.
    energyPillBtn: { background: withAlpha(C.brand, 0.14), color: C.brand, border: `1px solid ${withAlpha(C.brand, 0.35)}`, borderRadius: 20, padding: "8px 14px", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" },
    titleSubHead: { display: "flex", alignItems: "center", gap: 6, color: C.brand, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.07em", textTransform: "uppercase", margin: "4px 0 8px" },
    // Sept 11 2026, Jimmy: brand pass on the Log tab — radius/shadow bumped
    // to match browseCard/planHeroCard (18 + cardShadow) instead of the
    // older, boxier 14px/no-shadow card, and the title row now carries a
    // rounded icon-wrap badge (same anatomy as a browseCard's icon) instead
    // of a small inline tag glyph.
    workoutCard: { background: C.card, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 18, padding: "16px 16px 2px", marginBottom: 12, boxShadow: C.cardShadow },
    workoutTitleBig: { display: "flex", alignItems: "center", gap: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15.5, letterSpacing: "0.03em", textTransform: "uppercase", color: C.ink, paddingBottom: 13, marginBottom: 2, borderBottom: `1px solid ${C.cardBorder}` },
    exerciseRow: { padding: "14px 0", borderBottom: `1px solid ${C.cardBorder}` },
    exerciseRowLast: { padding: "14px 0 12px" },

    sessionForm: { background: C.card, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 14, padding: 16, marginBottom: 20 },
    sessionFormRow: { display: "flex", gap: 10, marginBottom: 10 },
    // Sept 13 2026, Jimmy: "more interactive and fun...looks pro and
    // functional and branded" — the calendar card now floats (cardShadow,
    // same as the rest of the app's brand pass) instead of sitting flat.
    calendarWrap: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "14px 12px", marginBottom: 4, boxShadow: C.cardShadow },
    calendarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" },
    calendarNavBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, background: "transparent", border: "none", color: C.ink2, cursor: "pointer" },
    calendarMonthLabel: { fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "0.03em", color: C.ink },
    calendarWeekRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 },
    calendarWeekday: { textAlign: "center", fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: C.ink3, letterSpacing: "0.04em" },
    calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
    calendarCellEmpty: { padding: "6px 0" },
    calendarCell: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "transparent", border: "1px solid transparent", borderRadius: 8, color: C.ink2, cursor: "pointer", fontSize: 12.5, padding: "6px 0", fontFamily: "'Inter', sans-serif" },
    // Today used to be a plain outline — now brand-tinted fill + brand text
    // too, so "today" reads at a glance instead of blending into every
    // other unselected day.
    calendarCellToday: { border: `1px solid ${C.brand}`, background: withAlpha(C.brand, 0.08), color: C.brand, fontWeight: 600 },
    calendarCellSelected: { background: `linear-gradient(155deg, ${C.brand}, ${C.brandDim})`, color: C.brandInk, fontWeight: 700, border: "1px solid transparent", boxShadow: `0 6px 14px -6px ${withAlpha(C.brand, 0.55)}` },
    calendarCellDot: { width: 4, height: 4, borderRadius: 999, background: C.brand },
    // A day with more than one session gets an actual count instead of an
    // identical dot — "3 sessions today" is worth knowing before tapping in.
    calendarCellBadge: { minWidth: 14, height: 14, padding: "0 3px", borderRadius: 999, background: C.brand, color: C.brandInk, fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
    timelineWrap: { marginTop: 2 },
    timelineRow: { display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 8 },
    timelineHourCol: { width: 44, flexShrink: 0, paddingTop: 3, display: "flex", alignItems: "center", gap: 4 },
    timelineHourLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.ink3 },
    // The current hour, on today only — a small pulsing brand dot next to
    // its label so "where am I right now" is visible without hunting for a
    // date, the same ambient-pulse language the Log tab's tiles already use.
    timelineHourLabelNow: { color: C.brand, fontWeight: 700 },
    timelineNowDot: { width: 6, height: 6, borderRadius: 999, background: C.brand, flexShrink: 0, animation: "tileReady 2.2s ease-in-out infinite" },
    timelineBody: { flex: 1, borderLeft: `1px solid ${C.cardBorder}`, paddingLeft: 10, minHeight: 24 },
    // Sept 13 2026: an empty hour used to be an inert 1px line — now a real
    // tap target ("+ Tap to add") that quick-fills the form above with this
    // exact date/hour, so scheduling a slot you're already looking at
    // doesn't mean scrolling up and re-picking the date and time by hand.
    timelineSlot: { display: "flex", alignItems: "center", gap: 6, height: 24, width: "100%", marginTop: 2, padding: "0 8px", borderRadius: 8, background: "transparent", border: `1px dashed ${C.cardBorder}`, color: C.ink3, fontSize: 11, fontFamily: "'Inter', sans-serif", textAlign: "left", cursor: "pointer", opacity: 0.7 },
    timelineOtherHeading: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.ink3, marginBottom: 8 },
    // Session cards (Rota day view): a brand-colored time chip + a
    // left accent bar so a day full of sessions reads as a real branded
    // schedule, not a stack of identical bordered boxes.
    sessionTimeChip: { flexShrink: 0, background: C.brandSoft, color: C.brand, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11.5, borderRadius: 8, padding: "4px 8px", letterSpacing: "0.01em" },
    todayJumpBtn: { background: "transparent", border: "none", color: C.brand, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer", padding: 0 },
    sendReminderBtn: { display: "flex", alignItems: "center", gap: 6, background: "transparent", color: C.brand, border: `1px solid ${withAlpha(C.brand, 0.4)}`, borderRadius: 20, padding: "7px 13px", fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
    sentTag: { display: "inline-flex", alignItems: "center", gap: 5, color: C.good, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
    demoToggleBtn: { display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", color: C.ink3, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "4px 10px", fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginTop: 8 },
    demoPanel: { marginTop: 8, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 10 },
    demoImg: { display: "block", width: "100%", maxWidth: 260, borderRadius: 8, background: "#0B1526" },
    demoNote: { fontSize: 12, color: C.ink3 },
    demoLinkBtn: { display: "block", marginTop: 6, background: "transparent", border: "none", color: C.brand, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 },
    // Sept 11 2026: a slim, low-key "insert an exercise right here" control
    // between program rows — kept deliberately quiet (dashed, dim by
    // default) so a long day's exercise list doesn't turn into a wall of
    // buttons; it only needs to be noticeable enough to find on purpose.
    // Sept 12 2026, Jimmy: swapped the plain gray dashed outline for the
    // same soft brand-blue tint as the rest of this pass — a light fill
    // instead of a dashed border reads less "placeholder", more "tap me".
    insertRowBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", background: withAlpha(C.brand, 0.08), border: `1px solid ${withAlpha(C.brand, 0.3)}`, borderRadius: 10, padding: "6px 8px", color: C.brand, fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 700, cursor: "pointer" },
    setupNotice: { display: "flex", alignItems: "flex-start", gap: 8, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 12.5, color: C.ink2, lineHeight: 1.5 },
    // Sept 12 2026, Jimmy: "do this for the payment" — the real timestamped
    // stepper (PaymentStatusStepper) replacing the old numbered paymentStep
    // rows on the "pay, then wait for confirmation" screens.
    stepperTitle: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13.5, color: C.ink, marginBottom: 4 },
    stepperSub: { margin: "4px 0 0", fontSize: 11.5, color: C.ink3, lineHeight: 1.5 },
    // Sept 13 2026, Jimmy: "when i unlock and buy its something else" —
    // jimfit-flow_15.html's compact payment-status readout: a small row of
    // dots instead of the old 3-item vertical list.
    stepperDotsRow: { display: "flex", gap: 6, marginTop: 14, justifyContent: "center" },
    stepperDotSmall: { width: 8, height: 8, borderRadius: "50%", background: C.cardBorder, transition: "background 0.2s ease" },
    stepperDotSmallLit: { background: C.brand },
    stepperHintLine: { margin: "8px 0 0", fontSize: 12, color: C.ink2, textAlign: "center" },

    setsRow: { display: "flex", flexWrap: "wrap", gap: 8 },
    setChip: { display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.ink2, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "6px 12px" },
    // Sept 14 2026, Jimmy: brand-tinted chip for WeeklyRecapCard's new-PR
    // list — same pill shape as setChip, accented instead of neutral since
    // this is a small celebration, not a plain data value.
    prChip: { display: "inline-flex", alignItems: "center", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: C.brand, background: C.brandSoft, border: `1px solid ${withAlpha(C.brand, 0.3)}`, borderRadius: 20, padding: "5px 11px" },
    setChipReps: { color: C.ink, fontWeight: 600 },
    setChipPR: { position: "relative", color: C.brand, borderColor: withAlpha(C.brand, 0.4), background: C.brandSoft, overflow: "visible" },
    // Floats above the top-right corner of the chip, right over the weight
    // number, instead of sitting inline before the reps — bigger and bolder
    // so it actually reads as a badge, not a small inline abbreviation.
    setChipPRBadge: {
      position: "absolute", top: -11, right: -6, background: C.brand, color: "#fff",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800, letterSpacing: "0.03em",
      padding: "1px 7px", borderRadius: 10, lineHeight: 1.5, boxShadow: "0 2px 6px rgba(0,0,0,0.35)"
    },
  };
}
