# Pattern 9 — Offline-first feedback: quiet sync status, visible pending work

**Concrete visual pattern:** a small always-present status line in the header ("Connecté · Tout est enregistré" / "Hors ligne · 3 modifications à envoyer") with an icon + text; unsynced rows/cards get a small "En attente" badge; saves are shown locally immediately, with a discreet toast only when a change fails or is rolled back; long operations run in a background drawer so the user can keep working. Avoid fake spinner-only success.

**Why it fits ACSF:** low connectivity means users cannot tell whether data was saved. Explicit status and pending badges prevent duplicate entry and panic; immediate local feedback keeps the app fast; honest failure messages build trust. This is additive — a status strip and badges can be introduced without changing existing workflows.

**Sources:**
- Pencil & Paper, "UX Design Patterns for Loading" (Fanny Vassilatos & Ceara Crawshaw): https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback — Google Drive's subtle always-on sync indicator for frequent updates; full-width banner/toast for rare refreshes; background upload drawer; immediate feedback; no spinner for <1s; percent-done for long waits.
- SignalDB, "Optimistic UI: What It Is, Examples and How to Implement It": https://signaldb.js.org/optimistic-ui — persist pending changes in a local queue, never silently fail, show global "Saving… / All changes saved" indicator, don't fake irreversible actions.
- STRV, "Optimistic UI in Offline-First Apps: Two Writes Per Tap": https://www.strv.com/blog/two-writes-for-every-tap-optimistic-ui-in-offline-first-apps — immutable local event log + provisional local projection so UI behaves the same online/offline (useful mental model, not a prescription for this app).
- Smashing Magazine, "True Lies Of Optimistic User Interfaces" (Denys Mishunov): https://www.smashingmagazine.com/2016/11/true-lies-of-optimistic-user-interfaces — why a success state shown while offline erodes trust.

**Attribution/licence:** all editorial/blog sources — **inspiration only — do not copy**. Paraphrased only; no code copied.
