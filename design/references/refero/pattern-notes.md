# Refero pattern notes — ACSF Desktop (research only)

Date accessed: 2026-11-20. See `SOURCE.md` for licensing. **All items are inspiration only** unless explicitly noted; none grant a code/assets license.

Context constraints: low literacy, low connectivity, 12px/1.5 global type, warm cream/yellow palette, keyboard + accessibility first, additive-only changes.

---

## 1. Dashboard overview: 3–4 KPIs, progressive disclosure, explicit states
- **URL:** https://refero.design/p/dashboard-ui-best-practices
- **What:** Emphasise only the top three or four indicators; reveal deeper data via expandable panels/tooltips. Use a consistent 12-column grid and ample whitespace. Provide role-based views, saved filter presets, and explicit *loading, empty, error and selected* states. Use line charts for trends and bar charts for categorical comparisons; avoid pies for complex data. WCAG contrast required.
- **Why it fits:** Low literacy → fewer competing numbers and one clear next step. Low connectivity → explicit states instead of blank/stalled UI. A11y → semantic hierarchy and text labels, not colour-only meaning.
- **Status:** **Inspiration only.** Public article; no component code or licensed asset. Screenshots saved locally for internal reference only.

## 2. Data tables with hairline borders and compact type
- **URLs:** https://refero.design/ (Research mode suggests "Data tables with filters"); https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5 (Visitors); https://styles.refero.design/style/6221ba67-26e7-4657-91b7-efd77cbb1f12 (Clearbit)
- **What:** Visitors: analytics data grid, white fill, 1px `#e8e8e8` gridlines, 24px container radius, **no row striping**, 12–14px weight 400–500, bold header row. Clearbit: 1px `#e1e9f0` border, **no shadow**, 14px labels left / values right, 12px row gap, checkmark icons in leading column.
- **Why it fits:** 12–14px matches our 12px/1.5 baseline; no zebra striping reduces visual noise for low-literacy users; hairlines are cheap to render on weak devices/connections; icons + text aid recognition.
- **Status:** **Inspiration only.** Style pages are public and readable; Refero Styles explicitly says these are generated analyses, not official brand guides, and copying a guide does not license third-party fonts/images/code. No public `/design.md` download endpoint.

## 3. Filter & Sorting as a first-class, combinable pattern
- **URL:** https://refero.design/search?design_patterns%5Bid%5D%5B%5D=111&page_elements%5Bid%5D%5B%5D=81
- **What:** Refero tags "Filter & Sorting" as a UX pattern that can be combined with element tags (Table, Dialog) to compare real implementations side by side.
- **Why it fits:** Makes filtering visible and reversible instead of hidden in menus; short labelled chips are easier to read and keyboard-operable than dense controls.
- **Status:** **Inspiration only.** Public search page; detailed screen access requires an account/paid plan (not used).

## 4. Dialog & Modal Window
- **URL:** https://refero.design/search?page_elements%5Bid%5D%5B%5D=81&order=trending
- **What:** Dedicated element tag; combine with Filter & Sorting for in-context confirmations. Refero's tag list also includes Toast/Tooltip/Breadcrumb and Pagination for supporting patterns.
- **Why it fits:** Use short, plain-language confirmations with an explicit cancel and one primary action; focus should move into the dialog and return on close; Esc must work. Critical for low-literacy users who fear destructive actions.
- **Status:** **Inspiration only.** Public search page; no code.

## 5. Empty State
- **URL:** https://refero.design/ (UI Elements tag list; searchable via `https://refero.design/search?query=empty%20state&order=trending`)
- **What:** Dedicated tag for illustration + guidance + single action. Refero's own dashboard guidance calls for explicit empty/error states, not blank areas.
- **Why it fits:** Low connectivity → offline/no-data is a normal state; show one short French sentence, a clear "Réessayer" button and a text explanation. Avoid decorative illustrations that cost bytes.
- **Status:** **Inspiration only.** Public tag/search page; no licensed asset.

## 6. Search field / Searching
- **URL:** https://refero.design/ (UX Patterns: "Searching"; UI Elements: "Search Field")
- **What:** Persistent, clearly labelled search with visible result counts and a clear/reset affordance.
- **Why it fits:** A labelled input with a plain placeholder works for low literacy; `role="search"`, a real `<label>`, and keyboard focus make it accessible; instant local filtering avoids network round-trips (low connectivity).
- **Status:** **Inspiration only.** Public tag list; no code.

## 7. Status badges / compact labels
- **URL:** https://styles.refero.design/style/30a8b128-a5bb-4d86-85eb-743b78091596 (Pravah)
- **What:** Uppercase tracked label component: white fill, 4px radius, 2px 8px padding, 12px weight 400, 0.10em letter-spacing. Pravah's palette is warm parchment `#f3f1ed`, ink `#181011`, white card, and it publishes measured contrast pairs (e.g. 16.61:1 ink on parchment = AAA; 2.32:1 ash on white = **fail**).
- **Why it fits:** Directly transferable to a warm cream/yellow app; the contrast table is a useful warning that muted greys fail. Always pair status colour with a text label (low literacy + colour-blind accessibility).
- **Status:** **Inspiration only.** Generated style analysis, not official brand guide; no font/image license.

## 8. Navigation bar / sidebar & drawer / toolbar
- **URL:** https://refero.design/ (UI Elements list); https://styles.refero.design/style/30a8b128-a5bb-4d86-85eb-743b78091596 (top-nav guidance: 64px height, 1px bottom border, 14px links, 12px gaps)
- **What:** Minimal top bar or sidebar with hairline separation, consistent iconography, clear active state.
- **Why it fits:** Always-visible text labels (never icon-only) for low literacy; predictable tab order and visible focus for keyboard users; hairline borders are lightweight.
- **Status:** **Inspiration only.**

## 9. Skeleton / loading states
- **URL:** https://refero.design/ (UI Elements: "Skeleton"); the public HTML of `styles.refero.design` itself uses `data-slot="skeleton"` with `animate-pulse` placeholders while content loads.
- **What:** Shape-preserving placeholders that reserve layout space.
- **Why it fits:** Low connectivity → reduces perceived wait and layout shift; announce with `aria-busy` on the container rather than reading every placeholder.
- **Status:** **Inspiration only.** Do not copy third-party code; implement with existing CSS.

## 10. Typography and spacing scale (8px base)
- **URLs:** https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5 (spacing 8/12/16/20/24/32/48/64; body 12–14px); https://styles.refero.design/style/30a8b128-a5bb-4d86-85eb-743b78091596 (15px body at 1.5 line-height, 12px captions at 1.5, 8px base unit); https://styles.refero.design/style/ded6d7c4-2801-45f4-8b8a-089f1b37842d (8px spacing tokens, radius tokens)
- **What:** A single 8px spacing unit with named steps, 12–15px body text at 1.5 line-height, hairline borders and shallow/no shadows. Clearbit also records a focus ring: `0 0 0 1px rgb(15,119,255), 0 1px 2px rgba(...), 0 6px 16px rgba(...)`.
- **Why it fits:** Confirms our existing 12px/1.5 choice; an additive 8px token scale is easy to layer on; the explicit focus-ring token is a concrete keyboard-accessibility improvement; no heavy effects for weak hardware.
- **Status:** **Inspiration only.** Values recorded in `style-tokens-notes.md` are observations from public pages, not a licensed token file.
