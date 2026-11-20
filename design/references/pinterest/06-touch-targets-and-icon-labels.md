# Pattern 6 — Large touch targets, icon + label pairs, visible focus

**Concrete visual pattern:** every interactive control has at least a 44×44 CSS px hit area (48dp where touch is common), even when the visible icon is only 24px; at least 8px between targets; icons always paired with a short visible text label; `:focus-visible` ring of at least 3:1 contrast on every control; active navigation item marked by text/underline/shape, not colour alone.

**Why it fits ACSF:** staff may use touch-screen laptops or cheap peripherals; small controls cause mis-taps on dense tables and dialogs. Icon+label pairs support recognition for low-literacy users and give screen readers a name. Focus rings and consistent nav placement are essential for keyboard navigation.

**Sources:**
- Material Design 3, "Accessibility designing / structure": https://m3.material.io/foundations/designing/structure — 48×48dp touch targets (~9mm), 44×44dp pointer targets, 8dp spacing, icon 24dp inside a 48dp target.
- Princeton OIT, "Design for accessibility": https://oit.princeton.edu/services/digital-accessibility/design-accessibility — forgiving click/hover areas, consistent nav order and active-section indication, 4.5:1 text contrast / 3:1 large text and graphics, avoid pure black on pure white, avoid label-columns-far-from-fields layouts.
- UI Skills, "Empty state design patterns" collection: https://www.ui-skills.com/collections/empty-state-design — 44px touch targets, visible `:focus-visible` rings, never status by colour alone.
- WCAG 2.2, sc 2.5.8 Target Size (Minimum) and 1.1.1 Non-text Content: https://www.w3.org/TR/WCAG22 — normative backing.

**Attribution/licence:** Material Design guidance — prose typically CC BY 4.0, code Apache 2.0; verify on site. Princeton OIT — inspiration only / check site terms. UI Skills — inspiration only. W3C WCAG — W3C licence, verify before reuse; paraphrased only.
