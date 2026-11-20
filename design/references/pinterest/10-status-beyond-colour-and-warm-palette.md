# Pattern 10 — Status shown as icon + text; safe use of a warm cream/yellow palette

**Concrete visual pattern:** any status (valid / incomplete / to review / synced) is encoded with a shape or icon plus a short word, and only then reinforced with colour. Yellow is used as an accent for the current step, active tab, or primary action — never as the sole carrier of meaning, and never as small text on cream unless contrast is measured. Text stays near-black on cream; status chips use outlines or filled backgrounds with dark text.

**Why it fits ACSF:** the app's warm cream + yellow palette is friendly for a social-work context, but yellow-on-cream is a classic low-contrast trap. Low-literacy and low-vision users, plus keyboard users needing visible focus, benefit from redundant encoding. This pattern is additive: it constrains new accents without requiring a palette rewrite.

**Sources:**
- UI Skills, empty-state collection: https://www.ui-skills.com/collections/empty-state-design — "Never use color alone for status — add text or an icon", "Improve contrast for muted text", "Add visible keyboard focus rings".
- Princeton OIT, "Design for accessibility": https://oit.princeton.edu/services/digital-accessibility/design-accessibility — 4.5:1 normal text, 3:1 large text and meaningful graphics/focus indicators; avoid extreme black/white; don't rely on distant spatial mappings.
- WCAG 2.2, 1.4.11 Non-text Contrast and 1.4.3 Contrast (Minimum): https://www.w3.org/TR/WCAG22 — normative thresholds.
- GOV.UK Design System, "Colour": https://design-system.service.gov.uk/styles/colour/ — an example of a restrained palette with accessible yellow/focus yellow usage; verify exact values and licence at source.

**Attribution/licence:** UI Skills — inspiration only. Princeton — inspiration only / verify site terms. W3C — W3C document licence, verify. GOV.UK — Crown copyright, normally OGL v3.0, verify. No values or code copied.
