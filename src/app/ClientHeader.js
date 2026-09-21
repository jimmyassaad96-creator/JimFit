// The client shell header: brand row, coach/solo badge, 7-day volume, and
// the support/theme/log-out controls. Moved out of TrainingLog verbatim.
import { e } from "../shared/react.js";
import { SELF_TRAIN_NAME } from "../domain/access.js";
import { openSupportEmail } from "../domain/group3.js";
import { BrandMark } from "../shared/brand.js";
import { C, ThemeToggle, styles, withAlpha } from "../shared/theme.js";
import { Icon } from "../shared/ui/Icon.js";

export function ClientHeader({ ui }) {
  const {
    clientName, handleLogout, isManager, isSelfTrainClient, myTrainerName,
    setProgressSubTab, setTab, theme, toggleTheme,
  } = ui;

  return (
      e("header", { style: styles.clientHeader },
        e("div", { style: styles.clientHeaderBrandRow },
          e(BrandMark, { size: 34 }),
          // Sept 17 2026 fix, Jimmy: "jimfit name here its changable and
          // clients can change it! fix that" — this used to be tap-to-rename
          // (a per-device-only cosmetic, saved to that browser's localStorage,
          // never touching the server or anyone else's view), but Jimmy
          // doesn't want the JimFit branding editable at all, by anyone.
          // Now always just the fixed title — editingName/nameDraft/
          // startEditingName/commitName are kept (harmless, unused) rather
          // than ripped out, in case this needs to come back as an
          // owner-only setting later.
          e("h1", { style: styles.title }, "JimFit"),
          e("div", { style: { flex: 1 } }),
          // Sept 13 2026, Jimmy: "beside the email can we insert like email
          // for support or something like that?" — the mail icon was
          // icon-only (no visible label, and there's no hover to reveal the
          // title tooltip on a touch phone), so its purpose wasn't obvious
          // at a glance. Swapped in the same icon+"Support" pill the
          // trainer/manager header already uses for this exact button
          // (styles.supportBtn) instead of inventing a new look.
          e("button", { style: styles.supportBtn, onClick: () => openSupportEmail(clientName), title: "Email support" }, e(Icon, { name: "mail", size: 14 }), "Support"),
          // Sept 17 2026, Jimmy: "its hard for the client to see the logout
          // button, put it also down the support and moon" — restored here
          // (same pill style as Support, not a bare icon — a plain icon was
          // already found too easy to miss on a touch phone, see the
          // Support note above) alongside the copy still at the bottom of
          // My info for anyone who lands there first.
          e("button", { style: styles.logoutBtn, onClick: handleLogout }, e(Icon, { name: "logout", size: 13 }), "Log out"),
          e(ThemeToggle, { theme, onToggle: toggleTheme })
        ),
        // Sept 15 2026, Jimmy: "show here the user is opened like me the
        // owner to know which account i opened even for trainers and
        // clients down the logo jim fit" — neutral badge stating whose
        // account this actually is (deliberately separate from the
        // brand-blue pill below, which shows who's COACHING this account —
        // a different fact; conflating the two is exactly what made "which
        // account is this" unclear before).
        //
        // Sept 17 2026, Jimmy: "when i tap the user above ... to see his
        // info page directly like others app and scroll down for log out"
        // — the standalone Log out button that used to sit right here is
        // gone; tapping this badge now jumps straight to the My info page
        // (Progress → Info) the same way tapping your name does in most
        // apps, and Log out lives at the very bottom of that page instead
        // (after Account/Delete — see progressSubTab === "info" further
        // down), reached by scrolling rather than a separate header button.
        e("div", { style: styles.accountIdRow },
          e("button", {
            type: "button", style: { ...styles.accountIdBadge, cursor: "pointer" },
            title: "Tap to see your account info",
            onClick: () => { setTab("progress"); setProgressSubTab("info"); }
          },
            // Sept 18 2026, Jimmy: "make more alive the profile icon" — was a
            // flat monochrome outline; now a small brand-gradient avatar
            // bubble (same gradient as the self-train pill and the app's own
            // JF mark) instead of a plain line icon.
            e("span", {
              style: {
                display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.brand}, ${C.brandDim})`, flexShrink: 0,
                boxShadow: `0 2px 6px -1px ${withAlpha(C.brand, 0.55)}`
              }
            }, e(Icon, { name: "user", size: 11, color: C.brandInk })),
            clientName || "Unnamed",
            // Sept 18 2026, Jimmy: "duplication in self training, delete the
            // one beside the profile and keep the one in blue" — the
            // self-train pill just below already says "Self-Training (no
            // trainer)" clearly, so this badge no longer repeats it; Owner
            // and regular Client still show here since neither is said
            // anywhere else on this row.
            !isSelfTrainClient && e("span", { style: styles.accountIdRole }, `· ${isManager ? "Owner" : "Client"}`),
            e("span", { style: { display: "flex", transform: "rotate(-90deg)" } }, e(Icon, { name: "chevron", size: 13, color: C.ink3 }))
          )
        ),
        e("div", { style: styles.clientHeaderInfoRow },
          e("div", null,
            // Sept 12 2026, Jimmy: "the place where self training no trainer
            // to be more clear... more branded" — the self-train case now
            // gets the bolder solid-fill pill (same family as browseChipActive)
            // plus a sparkle icon, instead of blending in with the same soft
            // tint the real-trainer-name badge uses.
            // Sept 12 2026, restyle to match jimfit-flow_14.html's header
            // pill ("Training with a coach ›" — checkmark icon, trailing
            // chevron, tappable) — visuals/interaction only, still showing
            // the real trainer name (richer than the mockup's generic
            // label) instead of replacing it, and now tapping the pill jumps
            // straight to the existing Trainer tab (FindTrainerPanel) to
            // manage/switch — same screen the bottom nav's Trainer icon
            // already opens, just reachable from here too.
            myTrainerName && e("button", {
              type: "button",
              title: myTrainerName === SELF_TRAIN_NAME ? "You're training yourself — no coach assigned. Tap to find a trainer." : "Your trainer — tap to manage",
              onClick: () => { if (!isManager) setTab("findTrainer"); },
              style: myTrainerName === SELF_TRAIN_NAME
                ? {
                    display: "flex", alignItems: "center", gap: 6, cursor: isManager ? "default" : "pointer",
                    background: `linear-gradient(135deg, ${C.brand}, ${C.brandDim})`, color: C.brandInk, borderRadius: 20, padding: "5px 12px", border: "none",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px -6px ${withAlpha(C.brand, 0.6)}`
                  }
                : {
                    display: "flex", alignItems: "center", gap: 6, cursor: isManager ? "default" : "pointer",
                    background: withAlpha(C.brand, 0.12), color: C.brand, borderRadius: 20, padding: "4px 10px", border: "none",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 0.5
                  }
            },
              myTrainerName === SELF_TRAIN_NAME ? e(Icon, { name: "sparkle", size: 11, color: C.brandInk }) : e(Icon, { name: "check", size: 11, color: C.brand }),
              myTrainerName,
              !isManager && e(Icon, { name: "chevron", size: 11, color: myTrainerName === SELF_TRAIN_NAME ? C.brandInk : C.brand })
            )
          )
          // Sept 13 2026, Jimmy: "the volume 7 day above log out i dont
          // want to be shown there anymore" — dropped the "7-day volume"
          // StatTile from the header's info row. weekVolume/unit/delta are
          // still computed further up (StatsPanel and other screens use
          // the same numbers), only this header tile is gone.
        ),
        // Sept 13 2026, Jimmy: "or i can hide it when they first get
        // started the clients" — required attribution for the RepDB free
        // exercise-icon dataset (repdb.co), moved here from the Welcome
        // screen (see WelcomeGate). Its free-tier license just requires a
        // visible credit link somewhere in the app — this header shows on
        // every client visit, so it's covered without cluttering the very
        // first "Get started" screen.
        e("a", {
          href: "https://repdb.co", target: "_blank", rel: "noopener noreferrer",
          style: { display: "block", textAlign: "right", marginTop: 6, fontSize: 10, color: C.ink3, textDecoration: "underline" }
        }, "Exercise data by RepDB (repdb.co)")
      )
  );
}
