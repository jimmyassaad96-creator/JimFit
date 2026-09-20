// Slice of the stylesheet built by buildStyles(). Split out purely for
// file size -- the entries are unchanged and the object is reassembled
// by spreading these together, so the result is identical.
import { C, withAlpha, MEAL_THEME } from "../palette.js";

export function formsStyles() {
  return {
    jfMark: { width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.cardBorderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontStyle: "italic", fontSize: 15, letterSpacing: "0.02em", color: C.ink, background: withAlpha(C.brand, 0.05), position: "relative", zIndex: 1 },
    gatePillBadge: { display: "inline-flex", alignItems: "center", padding: "5px 14px", borderRadius: 999, border: `1px solid ${withAlpha(C.brand, 0.4)}`, background: withAlpha(C.brand, 0.12), color: C.brand, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", position: "relative", zIndex: 1 },
    gateFormCard: { display: "flex", flexDirection: "column", background: withAlpha(C.brand, 0.05), border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "18px 18px 20px", marginTop: 16, width: "100%", boxSizing: "border-box", position: "relative", zIndex: 1 },
    gateBanner: { fontFamily: "'Manrope', sans-serif", background: withAlpha(C.brand, 0.1), border: `1px solid ${withAlpha(C.brand, 0.3)}`, borderRadius: 12, padding: "11px 14px", fontSize: 12, lineHeight: 1.4, color: C.ink2, textAlign: "left", marginTop: 14, width: "100%", boxSizing: "border-box", position: "relative", zIndex: 1 },
    gateLabel: { display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ink3, letterSpacing: "0.08em", marginTop: 14, marginBottom: 7, textTransform: "uppercase", textAlign: "left" },
    roleCircleBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 4, position: "relative", zIndex: 1 },
    roleCircle: { width: 86, height: 86, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: withAlpha(C.brand, 0.06), border: `1px solid ${C.cardBorderStrong}`, transition: "border-color .15s, box-shadow .15s" },
    // Sept 12 2026 — per-role tint so Client/Trainer read as two distinct
    // choices, plus a slow idle "breathe" animation on each (see
    // roleBreatheClient/roleBreatheTrainer keyframes).
    roleCircleClient: { background: C.clientAccentSoft, border: `1px solid ${withAlpha(C.clientAccent, 0.35)}`, animation: "roleBreatheClient 2.4s ease-in-out infinite" },
    roleCircleTrainer: { background: withAlpha(C.brand, 0.12), border: `1px solid ${withAlpha(C.brand, 0.35)}`, animation: "roleBreatheTrainer 2.4s ease-in-out infinite" },
    roleCircleActive: { borderColor: C.brand, boxShadow: `0 0 0 5px ${withAlpha(C.brand, 0.12)}` },
    roleCircleLabel: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: C.ink },
    wizardProgressRow: { display: "flex", alignItems: "center", gap: 10, width: "100%", position: "relative", zIndex: 1 },
    wizardBackCircle: { flexShrink: 0, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `1px solid ${C.cardBorderStrong}`, color: C.ink2, cursor: "pointer" },
    wizardProgressTrack: { display: "flex", gap: 5, flex: 1 },
    wizardProgressSeg: { flex: 1, height: 4, borderRadius: 2, background: C.cardBorderStrong, overflow: "hidden" },
    wizardProgressSegFill: { height: "100%", background: C.brand, borderRadius: 2 },
    wizardBody: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "56px 4px", position: "relative", zIndex: 1, minHeight: 320, width: "100%" },
    wizardQuestion: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, color: C.ink, margin: "0 0 4px", letterSpacing: "-0.01em" },
    wizardSub: { fontFamily: "'Manrope', sans-serif", fontSize: 12.5, color: C.ink3, margin: "0 0 18px", maxWidth: 260 },
    stepperRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16 },
    stepperBtn: { width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `1px solid ${C.cardBorderStrong}`, color: C.brand, cursor: "pointer" },
    stepperValueWrap: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 },
    stepperValue: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 34, color: C.ink, lineHeight: 1 },
    stepperUnit: { fontSize: 10.5, color: C.ink3, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 },
    // Height/weight step only — two side-by-side columns, each a smaller
    // self-contained stepper with its own unit label underneath.
    bodyRow: { display: "flex", gap: 28 },
    bodyCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
    bodyStepperRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
    bodyStepperBtn: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `1px solid ${C.cardBorderStrong}`, color: C.brand, cursor: "pointer" },
    bodyStepperValue: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: C.ink, minWidth: 46, textAlign: "center" },
    wizardDateRow: { display: "flex", gap: 10, justifyContent: "center" },
    wizardDateInput: { width: 62, textAlign: "center", background: C.bg, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 10, padding: "11px 4px", color: C.ink, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 },
    wizardPhoneRow: { display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 12, padding: "11px 14px", maxWidth: 280, margin: "0 auto" },
    wizardPhonePrefix: { color: C.ink3, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, flexShrink: 0 },
    wizardPhoneInput: { border: "none", background: "transparent", color: C.ink, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, width: "100%", outline: "none" },
    chipRow: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 300 },
    // Always exactly 2 per row (Male/Female, Prefer not to say/Other), matching
    // the reference flow, regardless of how long "Prefer not to say" runs —
    // a plain flex-wrap chipRow would sometimes fit 3 across on a wider screen.
    genderChipGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 340 },
    chipBtn: { padding: "10px 16px", borderRadius: 999, background: C.card, border: `1px solid ${C.cardBorderStrong}`, color: C.ink2, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    chipBtnActive: { background: withAlpha(C.brand, 0.16), border: `1px solid ${C.brand}`, color: C.brand },
    dayChip: { width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: withAlpha(C.brand, 0.08), border: `1px solid ${C.cardBorderStrong}`, color: C.ink2, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" },
    dayChipActive: { background: C.brand, border: `1px solid ${C.brand}`, color: C.brandInk },
    wizardTextInput: { width: "100%", maxWidth: 280, background: C.bg, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 12, padding: "11px 14px", color: C.ink, fontFamily: "'Manrope', sans-serif", fontSize: 13.5, textAlign: "center" },
    wizardActionBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(180deg, ${C.brand}, ${C.brandDim})`, color: C.brandInk, border: "none", borderRadius: 999, padding: "13px 34px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.01em", cursor: "pointer", marginTop: 20, boxShadow: "0 6px 18px rgba(62,123,250,0.25)" },
    wizardSkipBtn: { background: "transparent", border: "none", color: C.ink3, fontSize: 11.5, fontFamily: "'Manrope', sans-serif", textDecoration: "underline", cursor: "pointer", marginTop: 14, padding: 4, position: "relative", zIndex: 1 },
    wizardSuccessCircle: { width: 66, height: 66, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.goodSoft, border: `1px solid ${withAlpha(C.good, 0.4)}`, marginBottom: 4 },

    // Sept 12 2026, Jimmy: QA pass while verifying the reference-flow rebuild
    // — this was missing the alignItems:"center" that gateWrap (Welcome/
    // Role/Auth) already has, so every wizard step hugged the top of the
    // screen with a big dead gap below on a normal phone height instead of
    // sitting centered like the other three gate screens.
    profileGateWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: `radial-gradient(130% 100% at 50% -10%, ${C.bgTop} 0%, ${C.bg} 55%)`, overflowY: "auto" },
    // See gateCard note above — same fix: no box, content floats on the
    // page background, matching the wizard steps in the reference video.
    profileGateCard: { display: "flex", flexDirection: "column", alignItems: "stretch", textAlign: "left", maxWidth: 380, width: "100%", height: "fit-content" },
    // Sept 12 2026, Jimmy: "the name and everything to be more better to the
    // eye" — same soft brand-tinted card as the toolbar/today-card family
    // instead of a plain neutral box.
    profileSummary: { background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.1)}, ${withAlpha(C.brand, 0.02)})`, border: `1px solid ${withAlpha(C.brand, 0.3)}`, borderRadius: 16, padding: "14px 15px", marginBottom: 4 },
    // Sept 6 2026, Jimmy: "make the columns more organized" — this grid was
    // repeat(3, 1fr), which on a phone gives each column ~110px. That's
    // narrower than a native <input type="date"> or <select> can render, so
    // Safari/Chrome refuse to shrink them and the column grows past its
    // 1fr share, dragging the whole row out of alignment (classic CSS grid
    // "auto" min-width trap). minmax(0, 1fr) caps every track at its fair
    // share no matter what a child wants to be, and dropping to 2 columns
    // gives each one enough room for those controls to actually fit.
    profileSummaryGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 16px" },
    // Sept 13 2026, Jimmy (screenshot of the real trainer "My Profile"
    // screen): "can we make this a bit more attractive on the eyes and
    // more accessable and branded" — a small icon-badge + label header
    // dropped inside profileSummary/assessmentFormCard-style cards, same
    // icon-badge language assessmentMetricIcon already established on the
    // Diet tab, so a profile card reads as its own labeled section
    // instead of just a wall of fields.
    profileSectionHeaderRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
    profileSectionIconBadge: { width: 24, height: 24, borderRadius: 7, background: C.brandSoft, border: `1px solid ${withAlpha(C.brand, 0.32)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    profileSectionHeaderText: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 12.5, fontWeight: 700, color: C.ink },
    // Sept 13 2026, Jimmy (jimfit-trainer-profile.html mockup, round 2 —
    // "adjust it the same as i sent u the layout"): the mockup's cards are
    // a flat neutral navy with a barely-visible border, not the blue-tinted
    // gradient profileSummary uses elsewhere. Scoped to My Profile's own 3
    // cards (billing / personal details / coaching) only — profileSummary
    // itself is left alone since it's reused all over the rest of the app
    // (client info, assessments, etc.) and nothing there was asked to change.
    profileCardFlat: { background: C.card, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 16, padding: "14px 15px" },
    // Sept 13 2026, Jimmy (jimfit-trainer-profile.html mockup): a small
    // "PUBLIC" chip next to "Shown to clients" — a plain-language flag that
    // this specific card (unlike the rest of the profile screen) is visible
    // to clients browsing for a trainer, reusing the existing warning/amber
    // token rather than a new color.
    publicChip: { marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: C.warning, background: C.warningSoft, border: `1px solid ${withAlpha(C.warning, 0.35)}`, padding: "3px 8px", borderRadius: 999 },
    compactSelect: { display: "block", width: "100%", marginTop: 2, background: C.bg, color: C.ink, border: `1px solid ${withAlpha(C.brand, 0.35)}`, borderRadius: 8, padding: "4px 20px 4px 6px", fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600 },
    // jimfit-flow_14.html restyle (Sept 2026): 16px radius + roomier padding,
    // matching the prototype's uniform boxed-card treatment across every
    // Overview block (This week / Training calendar / Personal records).
    // Scoped to the Progress tab's own cards only (goalCard's only 3 callers
    // are SessionGoalCard, ThisWeekCard, WeeklyRecapCard).
    goalCard: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: "16px 16px 14px", marginTop: 10, marginBottom: 4 },
    goalRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    goalChip: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap" },
    goalChipGood: { color: C.good, background: C.goodSoft },
    goalChipBad: { color: C.critical, background: C.criticalSoft },
    // jimfit-flow_12.html restyle — small streak pill next to "This week",
    // reusing the weeks-in-a-row streak SessionGoalCard already computes.
    streakBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: C.brandSoft, border: `1px solid ${withAlpha(C.brand, 0.35)}`, color: C.brand, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" },
    // jimfit-flow_14.html restyle — bold card-title style shared by every
    // boxed card in the Progress tab's Overview stack (This week / Training
    // calendar / Personal records), matching the prototype's muscles-card-title.
    progressCardTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14.5, color: C.ink },
    progressCardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 },
    macroStatusGrid: { display: "flex", flexDirection: "column", gap: 8 },
    macroStatusRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "10px 12px" },
    goalBarTrack: { marginTop: 8, height: 6, borderRadius: 999, background: C.cardBorder, overflow: "hidden" },
    goalBarFill: { height: "100%", borderRadius: 999, transition: "width 0.3s ease" },
    // Sept 12 2026, Jimmy: "also for the payments" — same brand-tinted card
    // treatment as profileSummary above.
    paymentSummaryCard: { background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.1)}, ${withAlpha(C.brand, 0.02)})`, border: `1px solid ${withAlpha(C.brand, 0.3)}`, borderRadius: 16, padding: "14px 15px" },
    waterAddBtn: { flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${C.cardBorderStrong}`, background: "transparent", color: C.ink2, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
    dashGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 4 },
    dashTile: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "14px 15px" },
    dashTileValue: { display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: C.brand, marginTop: 4 },
    trainerStatCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "13px 15px" },
    // Sept 11 2026, Jimmy: "Your plan"/"Your program" hero card + "Browse
    // other plans/programs" card shared between DietPanel and ProgramsPanel
    // (client-facing) — matches the reference mockups. Kept as their own
    // tokens rather than reusing `card`/`trainerStatCard` so this specific
    // brand-ring treatment doesn't ripple into every other card in the app.
    planHeroCard: { background: C.card, borderRadius: 18, padding: 17, display: "flex", flexDirection: "column", gap: 12, position: "relative", boxShadow: `inset 0 0 0 1.5px ${C.brand}, ${C.cardShadow}` },
    planHeroIconWrap: { width: 38, height: 38, borderRadius: 11, background: `linear-gradient(150deg, ${withAlpha(C.brand, 0.16)}, ${withAlpha(C.brand, 0.04)})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `inset 0 0 0 1px ${withAlpha(C.brand, 0.25)}` },
    // Sept 13 2026, Jimmy: "diet plan looks i sent earlier ... work on them
    // to slide to unlock" — jimfit-flow_15.html's Diet plan tab: 3 equal
    // GOAL/TRAINS-WK/BMR tiles up top, and a "Recommended for you" hero card
    // (kcal + macro tiles + a leaner/bulkier readout + a drag-to-confirm
    // paywall slider) inside the ready-plan browser.
    dietStatTile: { flex: 1, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "10px 6px", textAlign: "center" },
    dietStatTileLabel: { display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.ink3, letterSpacing: "0.08em", textTransform: "uppercase" },
    dietStatTileValue: { display: "block", marginTop: 4, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: C.ink },
    // Sept 13 2026, Jimmy: "make every diet plan to look like the pic ...
    // and one of them is recommended" — every plan template now renders
    // as its own bordered card; recCard is that treatment for whichever
    // one is currently recommended (brand-tinted gradient border), and
    // planCard is the plain version every other plan gets — same box
    // shape, no highlight tint.
    recCard: { background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.14)}, ${withAlpha(C.brand, 0.02)})`, border: `1px solid ${withAlpha(C.brand, 0.32)}`, borderRadius: 18, padding: "16px 16px 14px" },
    planCard: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: "16px 16px 14px" },
    recBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: C.brandSoft, color: C.brand, borderRadius: 20, padding: "5px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em" },
    slideUnlockTrack: { position: "relative", marginTop: 14, height: 48, borderRadius: 24, background: withAlpha(C.ink, 0.08), border: `1px solid ${C.cardBorder}`, overflow: "hidden", touchAction: "none", cursor: "pointer", userSelect: "none" },
    slideUnlockFill: { position: "absolute", top: 0, left: 0, bottom: 0, background: C.brandSoft },
    slideUnlockLabel: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: C.ink, pointerEvents: "none" },
    slideUnlockKnob: { position: "absolute", top: 3, left: 3, width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(150deg, ${C.brand}, ${C.brandDim})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(0,0,0,0.35)" },
    currentBadge: { display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: C.brandInk, background: `linear-gradient(135deg, ${C.brand}, ${C.brandDim})`, padding: "5px 10px", borderRadius: 20, flexShrink: 0, border: "none", whiteSpace: "nowrap" },
    ghostPillBtn: { width: "100%", padding: 12, borderRadius: 999, border: "none", background: C.subtleFill, color: C.ink, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" },
    browseCard: { background: C.card, borderRadius: 18, padding: 17, display: "flex", flexDirection: "column", gap: 12, boxShadow: C.cardShadow },
    browseCardIconWrap: { width: 38, height: 38, borderRadius: 11, background: C.subtleFill, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    // maskImage fades the row's own right edge to transparent instead of
    // overlaying a solid-color gradient — sidesteps having to match this
    // row's background color across every screen it's used on (diet goal/
    // preference chips, program style filter). A light scroll hint for
    // whichever of these currently overflow; harmless on ones that don't.
    browseChipStrip: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, maskImage: "linear-gradient(to right, black calc(100% - 24px), transparent 100%)", WebkitMaskImage: "linear-gradient(to right, black calc(100% - 24px), transparent 100%)" },
    browseChip: { flexShrink: 0, whiteSpace: "nowrap", padding: "9px 16px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, color: C.ink2, background: C.card, border: `1px solid ${C.cardBorder}`, cursor: "pointer" },
    browseChipActive: { border: "none", color: C.brandInk, fontWeight: 700, background: `linear-gradient(135deg, ${C.brand}, ${C.brandDim})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px -6px ${withAlpha(C.brand, 0.6)}` },
    tintCtaCard: { background: `linear-gradient(150deg, ${withAlpha(C.brand, 0.14)}, ${withAlpha(C.brand, 0.03)})`, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 10, boxShadow: `inset 0 0 0 1px ${withAlpha(C.brand, 0.2)}` },
    planCtaBtn: { width: "100%", padding: 12, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${C.brand}, ${C.brandDim})`, color: C.brandInk, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 20px -8px ${withAlpha(C.brand, 0.55)}` },
    planStatusPill: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 },
    // Sept 10 2026, Jimmy: "Find a trainer" profile card redesign — a
    // dedicated style (not the shared trainerStatCard, which many simple
    // one-line rows elsewhere still rely on) so this card can carry its own
    // slightly roomier padding/radius without touching anything else.
    trainerProfileCard: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: "15px 16px" },
    trainerSectionLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ink3 },
    // Sept 13 2026, Jimmy: "more pro... less cluttery" — replaces the old
    // two-tone trainerChipSpecialty (blue)/trainerChipCert (green) pair with
    // one quiet neutral chip used for specialties; certifications moved to
    // plain text in the expanded section below, so chips are reserved for
    // the one thing worth scanning at a glance.
    trainerChipNeutral: { display: "inline-block", fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 500, color: C.ink2, background: C.subtleFill, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 20, padding: "4px 10px" },
    // Sept 13 2026, Jimmy: "easy and pro and fun to select a trainer" —
    // same specialty data, just the FIRST (top) specialty gets a touch of
    // brand color so each card has one point of visual interest to catch
    // the eye instead of every chip reading identically flat/gray.
    trainerChipPrimary: { display: "inline-block", fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 600, color: C.brand, background: C.brandSoft, border: `1px solid ${C.brand}40`, borderRadius: 20, padding: "4px 10px" },
    // Sept 13 2026, Jimmy: "certification and about... more fun and clearer
    // on each one, add a color or emoji related to them" — certifications
    // get their own green badge chip (paired with a 🏅 in the section
    // label) instead of a plain comma-joined sentence.
    trainerChipCert: { display: "inline-block", fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 600, color: C.good, background: C.goodSoft, border: `1px solid ${C.good}40`, borderRadius: 20, padding: "4px 10px" },
    // Paired with a 💬 in the "About" section label — a soft accent
    // callout instead of a bare paragraph, so the trainer's own words read
    // as distinct from the factual chip rows above it.
    trainerBioCallout: { marginTop: 6, borderLeft: `3px solid ${withAlpha(C.brand, 0.4)}`, background: C.subtleFill, borderRadius: "0 10px 10px 0", padding: "9px 12px" },
    monthBackBtn: { display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.ink2, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.04em", cursor: "pointer", padding: 0 },
    monthDetailList: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "2px 15px" },
    monthDetailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.cardBorder}` },
    profileLabel: { display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 },
    profileValue: { fontSize: 13.5, color: C.ink, fontWeight: 600 },
    profileGoalText: { margin: "2px 0 0", fontSize: 13, color: C.ink2, lineHeight: 1.4 },
    medicalNotice: { display: "flex", alignItems: "flex-start", gap: 7, marginTop: 10, padding: "8px 10px", background: C.criticalSoft, border: `1px solid ${withAlpha(C.criticalStrong, 0.35)}`, borderRadius: 8, fontSize: 12, color: C.critical, lineHeight: 1.4 },

    beforeAfterRow: { display: "flex", gap: 10 },
    beforeAfterCol: { flex: 1, display: "flex", flexDirection: "column", gap: 6, alignItems: "center" },
    beforeAfterImg: { width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: C.card },
    photoGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
    photoCard: { position: "relative", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: "hidden" },
    photoThumb: { width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" },
    photoMeta: { padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 },

    // Sept 13 2026, Jimmy: "more pro and fun...branded" — same gradient
    // card language as DietLogPanel's Energy balance card (Sept 12), so
    // the assessment form doesn't read as a leftover unstyled screen next
    // to an otherwise-branded Diet tab.
    assessmentFormCard: { background: `linear-gradient(160deg, ${withAlpha(C.brand, 0.1)}, ${withAlpha(C.brand, 0.02)})`, border: `1px solid ${withAlpha(C.brand, 0.3)}`, borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: C.cardShadow },
    assessmentFormGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 10px" },
    assessmentSummaryGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
    // Sept 13 2026: kept as a plain block (NOT flex) — MeasurementsPanel
    // reuses this exact style with a different (stacked label-then-value)
    // child shape, so the icon-row layout AssessmentPanel now wants is
    // applied locally at that one call site instead of here (the
    // trainerStatCard lesson: never change a shared base style's layout
    // for one caller's needs).
    assessmentMetricCard: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "10px 12px" },
    assessmentMetricIcon: { width: 30, height: 30, borderRadius: 9, background: C.brandSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
    assessmentDelta: { display: "flex", alignItems: "center", gap: 2, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.ink3 },
    assessmentRow: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "10px 12px" },
    assessmentRowValues: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
    assessmentRowChip: { fontSize: 11.5, color: C.ink2, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: "3px 7px" },

    // Sept 14 2026 fix, Jimmy: "the my clients tab is annoying and cant be
    // reachable" — this is the very first thing rendered on a client's own
    // detail page (no styles.header above it here), so its fixed
    // padding-top:16px put "All clients"/"My clients" right under/behind a
    // phone's status bar — hard to see and hard to tap. Same top-inset fix
    // as styles.header/clientHeader.
    backBtn: { display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.ink2, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.04em", cursor: "pointer", padding: "max(16px, calc(6px + env(safe-area-inset-top))) 18px 6px" },
    deleteClientBtn: { display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${withAlpha(C.criticalStrong, 0.4)}`, borderRadius: 8, color: C.critical, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", cursor: "pointer", padding: "7px 12px", margin: "12px 18px 0" },
    clientCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "15px 16px", cursor: "pointer", textAlign: "left", boxShadow: C.cardShadow },
    // jimfit-flow_12.html restyle — horizontal-scrolling "PR reel" of cards,
    // replacing PersonalRecordsPanel's vertical list. Same computePersonalRecords
    // data, just laid out like the prototype's .pr-card row.
    prReel: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollSnapType: "x proximity" },
    // jimfit-flow_14.html restyle — pr-card now nests inside the boxed
    // goalCard wrapper, so its own fill is the subtler tone (matching the
    // prototype's rgba(255,255,255,.03) pr-card on top of its muscles-card).
    prCard: { scrollSnapAlign: "start", flexShrink: 0, width: 150, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 13, display: "flex", flexDirection: "column", gap: 8 },
    prCardWeight: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: C.brand },
    prSearchBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, color: C.ink2, cursor: "pointer", flexShrink: 0 },
    prSearchBtnActive: { color: C.brand, background: C.brandSoft, borderColor: withAlpha(C.brand, 0.35) },
    // jimfit-flow_14.html restyle — gold "trophy" chip Jimmy specifically
    // called out ("i like this more"), a fixed semantic accent color (like
    // MUSCLE_COLORS) rather than a theme token, since it reads as a medal.
    prCardIcon: { width: 28, height: 28, borderRadius: 9, background: "rgba(255,209,102,0.14)", border: "1px solid rgba(255,209,102,0.3)", color: "#ffd166", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    // jimfit-flow_14.html restyle — Diet tab's food-log-list/food-card, used
    // by DietLogPanel's entries (nests inside a plain styles.card wrapper).
    foodLogList: { display: "flex", flexDirection: "column", gap: 9 },
    foodCard: { display: "flex", alignItems: "center", gap: 11, background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 13, padding: "10px 12px" },
    foodCardIcon: { width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    foodCardName: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12.5, color: C.ink },
    foodCardMacros: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.ink3, marginTop: 3, display: "block" },
    foodCardTime: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.ink3, flexShrink: 0 },
    waterBtn: { flex: 1, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11, color: C.brandInk, background: C.brand, border: "none", padding: "9px 4px", borderRadius: 10, cursor: "pointer" },
    clientCardLeft: { display: "flex", alignItems: "center", gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: C.brandSoft, color: C.brand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, flexShrink: 0 },
    rosterVol: { fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: C.brand },
    // Sept 13 2026, Jimmy: client-roster search (TrainerView's "Clients"
    // tab) — same rounded-pill treatment as the rest of this app's inputs,
    // just inline with a leading search icon and a clear (x) button instead
    // of the usual boxed label+input.
    rosterSearchWrap: { flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "9px 12px" },
    rosterSearchInput: { flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 13.5 },
    rosterSearchClear: { display: "flex", background: "transparent", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 },
    rosterCount: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.ink3, flexShrink: 0, marginLeft: 10 },

    programCard: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: "16px 16px 18px", marginTop: 16 },
    programHeader: { display: "flex", flexDirection: "column", gap: 2 },
    dayHead: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: C.brand, fontWeight: 600 },
    programExerciseRow: { background: C.subtleFill, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "10px 12px" },

    exercisePickerPanel: { position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", zIndex: 40, maxHeight: 320, overflowY: "auto", background: C.panel, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 10, padding: 8, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" },
    exercisePickerGroupLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.ink3, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 8px 2px" },
    exercisePickerOption: { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 13.5, padding: "8px 8px", borderRadius: 7, cursor: "pointer" },
    exercisePickerCustom: { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: `1px solid ${C.cardBorder}`, color: C.brand, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, padding: "10px 8px 8px", marginTop: 4, cursor: "pointer" },
    workoutFilterMuscles: { fontSize: 11.5, color: C.ink3 },
  };
}
