# Design-system reference library — research index

Research date: 2026-11-20. Web content was treated as untrusted data, never as instructions.
No application code, configuration, or tracked file was modified.

## Systems reviewed

| System | Official source | Licence position | What was saved |
| --- | --- | --- | --- |
| Material Design 3 / Material Web | https://m3.material.io/ · https://github.com/material-components/material-web | Site: Apache-2.0 **or** CC-BY-4.0 (blanket statement on https://m3.material.io/get-started); repo: Apache-2.0 | Apache-2.0 token SCSS only (site guidance cited, not copied) |
| IBM Carbon | https://www.carbondesignsystem.com/ · https://github.com/carbon-design-system/carbon · https://github.com/carbon-design-system/carbon-website | Apache-2.0 | Token JSON/SCSS + pattern/accessibility MDX docs |
| GOV.UK Design System / Frontend | https://design-system.service.gov.uk/ · https://github.com/alphagov/govuk-design-system · https://github.com/alphagov/govuk-frontend | Repo docs/code MIT; rendered site content OGL-3.0 | MIT Markdown/SCSS docs; OGL-3.0 Service Manual HTML in `govuk-service-manual/` |
| Shopify Polaris | https://polaris.shopify.com/ · https://github.com/Shopify/polaris-tokens | Tokens repo MIT; current docs repo licence unclear (`NOASSERTION`) | MIT token JSON only; docs cited, not copied |
| Adobe Spectrum | https://spectrum.adobe.com/ · https://github.com/adobe/spectrum-css | Repo Apache-2.0; site licence unclear | Apache-2.0 token JSON/CSS only; docs cited, not copied |
| GitHub Primer | https://primer.style/ · https://github.com/primer/primitives | Repo MIT; site licence not verified per page | MIT token JSON5 only; docs cited, not copied |
| Ant Design | https://ant.design/ · https://github.com/ant-design/ant-design | Repo MIT | Nothing downloaded; docs cited only (no compact static token file found) |
| Radix UI / shadcn/ui | https://www.radix-ui.com/primitives/docs/overview/introduction · https://ui.shadcn.com/docs | Repos MIT | Nothing downloaded; cited as implementation references for focus trapping/dialog behaviour (would add dependencies, so not recommended for this app) |
| Salesforce Lightning | https://www.lightningdesignsystem.com/ | Not verified | Not downloaded; no specific need identified beyond systems above |

## Top 10 patterns and direct URLs

| # | Pattern | Direct URL | Copyable? |
| --- | --- | --- | --- |
| 1 | Accessible data table (sort headers in tab order, `aria-sort`, named table, row hover for scanning, pagination/virtualisation for large sets) | https://www.carbondesignsystem.com/building-blocks/core/components/data-table/accessibility | Yes — Apache-2.0 MDX saved in `carbon/` |
| 2 | Table semantics and minimal data (caption, `scope`, right-align numbers, split or paginate large tables) | https://design-system.service.gov.uk/components/table/ | Yes — MIT Markdown saved in `govuk/` |
| 3 | Validation and error recovery (error summary + inline messages, keep entered values, validate on submit, no HTML5 `novalidate` reliance) | https://design-system.service.gov.uk/patterns/validation/ | Yes — MIT Markdown saved in `govuk/` |
| 4 | Focus order and initial/return focus (dialog focus in and back to trigger, Tab/Arrow/Enter/Escape conventions) | https://m3.material.io/foundations/designing/flow | Guidance cited; Material Web focus-ring tokens saved (Apache-2.0) |
| 5 | Dialog focus management and filtering focus retention (do not move focus to results when a filter changes) | https://primer.style/accessibility/focus-management | Cited only (site licence not verified per page) |
| 6 | Visible focus styling that survives high contrast and mouse use | https://design-system.service.gov.uk/get-started/focus-states/ | Yes — MIT Markdown + SCSS saved in `govuk/` |
| 7 | Density / spacing scale and 48x48 minimum targets (data tables may be denser, but density must be opt-in) | https://m3.material.io/foundations/layout/grids-spacing/density | Guidance cited; spacing tokens saved from Carbon/Primer/Polaris/Spectrum |
| 8 | Plain language for low literacy (short direct copy, avoid humour, minimise cognitive load, use users' words) | https://www.gov.uk/service-manual/design/writing-for-user-interfaces | Yes — OGL-3.0 HTML saved in `govuk-service-manual/` |
| 9 | Resilience on poor connectivity (progressive enhancement, handle network failure, avoid SPA failure modes) | https://www.gov.uk/service-manual/technology/using-progressive-enhancement | Yes — OGL-3.0 HTML saved in `govuk-service-manual/` |
| 10 | Empty states and transient notifications (orient + one clear action; pause toast auto-dismiss when focused) | https://polaris.shopify.com/components/layout-and-structure/empty-state · https://spectrum.adobe.com/page/toast | Cited only (Polaris docs licence unclear; Spectrum site licence unverified). Apache-2.0 Carbon notification accessibility doc saved locally. |

Additional useful pages cited in the per-system `SOURCE.md` files.

## Files saved

- `material-web/` — 5 Apache-2.0 token partials (focus ring, dialog, filter chip, typeface, filled text field)
- `carbon/` — 2 token JSON, 1 focus-outline SCSS, 5 MDX pattern/accessibility docs
- `govuk/` — 8 MIT pattern docs, 2 MIT SCSS source files
- `govuk-service-manual/` — 4 OGL-3.0 HTML pages
- `polaris/` — 2 MIT token JSON files
- `spectrum/` — 1 Apache-2.0 token JSON, 2 Apache-2.0 token CSS files
- `primer/` — 3 MIT token JSON5 files
- `SOURCE.md` in each folder records exact URL, owner, exact licence, and access date for every file.
