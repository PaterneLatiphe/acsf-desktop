# Refero reference research — ACSF Desktop

Research only. **No application code was changed.** Date accessed: 2026-11-20.

See `SOURCE.md` for URLs, licensing and access limitations; `pattern-notes.md` and `style-tokens-notes.md` for detail.

## Top patterns relevant to ACSF Desktop

1. Dashboard overview with 3–4 KPIs + progressive disclosure — https://refero.design/p/dashboard-ui-best-practices
2. Data tables with inline filters — https://refero.design/ (tag "Table" + "Filter & Sorting")
3. Filter & Sorting as a first-class pattern — https://refero.design/search?design_patterns%5Bid%5D%5B%5D=111&page_elements%5Bid%5D%5B%5D=81
4. Dialog & Modal Window — https://refero.design/search?page_elements%5Bid%5D%5B%5D=81&order=trending
5. Empty State — https://refero.design/ (UI Elements tag list)
6. Search field / Searching — https://refero.design/ (UX Patterns tag list)
7. Status badges — https://styles.refero.design/style/30a8b128-a5bb-4d86-85eb-743b78091596 (uppercase tracked label component)
8. Navigation bar / sidebar & drawer / toolbar — https://refero.design/ (UI Elements tag list)
9. Skeleton / loading states — https://refero.design/ (UI Elements tag list)
10. Typography & spacing scale (8px base, 12–14px body, hairline borders) — https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5

## Three additive recommendations (no breaking changes)

1. **Add an optional "compact table" style layer** on top of existing AG Grid: 12px/1.5 body, 1px hairline borders instead of shadows/zebra striping, 8px spacing tokens, and visible icon+text filter chips. Keep current grid config intact; toggle via a new wrapper class/CSS variable only.
2. **Introduce explicit loading / empty / error / offline states** for tables and dashboard cards using skeleton shapes (shape-preserving, `aria-busy`) and one short French sentence plus a single action button ("Réessayer"). This targets low connectivity and low literacy without touching data logic.
3. **Add a documented focus-ring and status-badge token set** (e.g. `0 0 0 1px` accent ring; uppercase 12px / 0.10em badges with text labels, not colour alone) in a new CSS file imported additively, improving keyboard accessibility while preserving the warm cream/yellow palette.

⚠️ All saved images are **inspiration only**, internal reference. Do not ship them in the app, and do not copy third-party fonts, logos or code. See `SOURCE.md` §Licensing.
