# Pinterest / visual inspiration research — index & access log

Date accessed: **2026-11-20**
Scope: research only. No application code, config, or tracked files were changed.

## What could and could not be accessed

| Channel | Result |
| --- | --- |
| `websearch` on Pinterest-specific phrases | Worked. Search result snippets expose pin/board titles, owners, and descriptions. |
| `webfetch` on Pinterest **board** pages (e.g. `pinterest.com/linimg/grid-table-rows-ui`) | Partially worked. Visible: board title, owner, pin count, age, "Log in / Sign up" wall. Image grid content not exposed. |
| `webfetch` on individual **pin** pages (e.g. `pinterest.com/pin/...`) | Partially worked. Visible: pin title, description, author when indexed, outbound source domain (dribbble.com, behance.net, colorlib.com), related interests. Full-resolution image not exposed. |
| `pinterest.com/search/pins/?q=...` | Blocked/empty — returned only the word "Pinterest". Search results are effectively login-gated. |
| In-app browser (`browser` skill) | Unavailable: `[browser.disconnected] No desktop browser is connected to this session.` |
| Open-web fallback (design-system docs, blogs, Dribbble search pages, ACM review) | Worked well. Used to verify each pattern and identify original authors/sites. |

Nothing was invented from inaccessible Pinterest imagery. Every pattern below comes from a page that was actually fetched or a search result that was actually returned; original sources are named where Pinterest only reposted them.

## Saved material

No images were downloaded. Pinterest, Dribbble, and Behance pins are third-party copyrighted work with unclear reuse rights, so these are **link-and-note references only** (paraphrased patterns, not copied artwork or copy).

| File | Topic |
| --- | --- |
| `01-data-tables.md` | Sticky headers, frozen first column, subtle zebra rows, right-aligned numbers |
| `02-table-filters-and-column-chooser.md` | Filter panels, column chooser, expandable rows |
| `03-low-literacy-guidelines.md` | Minimal layout, recognition over recall, visibility of status, plain language |
| `04-multistep-forms-progress.md` | Named steps, step indicators, focus handling, save/resume |
| `05-errors-and-validation.md` | Error summary linked to fields, plain-language errors, no colour-only errors |
| `06-touch-targets-and-icon-labels.md` | 44–48px targets, icon + text label, spacing, visible focus |
| `07-dashboard-card-hierarchy.md` | Card layouts, metric hierarchy, scanning |
| `08-empty-states.md` | Plain-language empty states with one clear action |
| `09-offline-sync-feedback.md` | Always-on sync status, unsynced badges, background progress |
| `10-status-beyond-colour-and-warm-palette.md` | Status as icon + text, contrast caution for yellow-on-cream |

Each note has a matching `SOURCE.md` with URL, author/site, licence/attribution status, and access date.

## Copyright cautions

- **Pinterest / Dribbble / Behance**: individual designers retain copyright. "Inspiration only — do not copy." Do not copy screenshots, illustrations, layouts verbatim, or marketing copy into the app.
- **Free template claim**: the Pinterest pin for Colorlib "Responsive Table V2" says free, but the licence must be checked on colorlib.com before any asset reuse.
- **Reusable-with-attribution guidance**: GOV.UK Design System (Crown copyright, normally OGL v3.0), USWDS (U.S. government work, normally public domain), Material Design guidance (usually CC BY 4.0 for prose, Apache 2.0 for code). Verify licence text on each site before reusing text or code; nothing was copied here.
- **Editorial blogs and academic papers** (NN/g, ACM, Pencil & Paper, SignalDB, STRV, Figr, etc.): inspiration only unless explicitly licensed.
- No downloaded images, so no image licences are in play.
