# Style token observations from public Refero Styles pages

Date accessed: 2026-11-20. **Inspiration only / internal reference.**

These are values **observed on public rendered pages**. Refero Styles states its guides are automated analyses of public websites, **not official brand guides**. Copying/downloading does not license third-party fonts, images, logos or code. There is no public `/design.md` endpoint; nothing was scraped from private/API/login-gated sources.

## Warm-neutral palette — Pravah
Source: https://styles.refero.design/style/30a8b128-a5bb-4d86-85eb-743b78091596

| Value | Name | Role |
| --- | --- | --- |
| `#f3f1ed` | Parchment | Primary canvas (warm off-white — close to our cream direction) |
| `#ffffff` | Pure White | Card / badge surface |
| `#181011` | Ink Black | Primary text, borders, nav strokes |
| `#222222` | Charcoal | Secondary headings |
| `#302023` | Aubergine Black | Full-bleed dark inversion only |
| `#aaaaaa` | Ash | Muted text (⚠️ fails on white: 2.32:1) |
| `#666666` | Dim | Captions (5.74:1 on white = AA) |
| `#d8d4d4` | Bone | Hairline borders (⚠️ 1.47:1 on white — borders only) |

Type observations: body 15px / line-height 1.5; caption/badge 12px / 1.5 / 0.10em uppercase; heading 28–48px with -0.02em tracking above 28px.
Shape: 4px radius on cards/badges/inputs, 100px pill for primary CTA. Spacing base unit 8px; section gap 64px; card padding 24px; element gap 8px.
Accessibility note: measured contrast pairs include 16.61:1 (ink on parchment, AAA) and explicit **fail** pairs — useful justification for not using light grey text on cream.

## Analytics data grid — Visitors
Source: https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5

- White fill, 1px `#e8e8e8` gridlines, 24px container radius, **no row striping**.
- 12–14px, weight 400–500; header row bold; body in graphite.
- 40px circular avatar used sparingly in nav/dashboard header.
- Spacing scale: 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 px.
- Radii: tags 9999px, cards 16px, images 8px, inputs 8px, tables 24px, buttons 9999px.

## Product data table — Clearbit
Source: https://styles.refero.design/style/6221ba67-26e7-4657-91b7-efd77cbb1f12

- 1px `#e1e9f0` border, **no shadow**; two-column data table: 14px `#36394a` labels left, 14px `#091135` values right, 12px row gap, blue `#0f77ff` checkmark icons in leading column.
- Pill section tag: `#f5f3ff` background, 9999px radius, 8px 16px padding, 14px weight 500, `#091135` text.
- Focus/active ring: `0 0 0 1px rgb(15, 119, 255), 0 1px 2px 0 rgba(12, 43, 100, .32), 0 6px 16px 0 rgba(12, 43, 100, .32)`.
- Guidance: reserve one chromatic accent; avoid resting drop shadows; 64px between major zones, 20–24px headline→subhead, 8px metadata lines.

## Type scale structure — until
Source: https://styles.refero.design/style/ded6d7c4-2801-45f4-8b8a-089f1b37842d

- Minor Third (1.2) from 16px base; 12px spacing tokens (`--spacing-8`, `--spacing-16`, `--spacing-24`, …); named radii (`--radius-nav`, `--radius-cards`).
- Demonstrates the useful pattern of **naming tokens by role**, not just by value.

## Suggested additive mapping for ACSF Desktop (proposal only)
- Keep global `12px / 1.5`; add `--space-1: 8px`, `--space-2: 12px`, `--space-3: 16px`, `--space-4: 24px`.
- Add `--border-hairline: 1px solid` using a warm neutral; prefer borders over shadows at rest.
- Add a single visible focus token adapted to our accent (e.g. `0 0 0 2px` yellow/ink) — do not copy Clearbit's blue.
- Add a badge token: 12px, 0.08–0.10em, uppercase only for short codes, padding 2px 8px, radius 4px, **with a text label**.
