# Pattern 1 — Context-preserving data tables

**Concrete visual pattern:** sticky column headers + a frozen/sticky first "identity" column (e.g. beneficiary name or case ID), subtle zebra striping, right-aligned numeric columns, and a hover/focus highlight. Wide tables scroll horizontally inside a labelled region rather than reflowing into unlabelled cards. Keep alternating-row contrast very low; keep the row's selected/focused state clearly distinct.

**Why it fits ACSF:** data-heavy AG Grid views are used by low-literacy staff on small screens and unreliable connections. Freezing the first column means staff never lose track of *whose* row they are editing; sticky headers mean they never forget *which* column a value belongs to. Subtle striping aids eye tracking at 12px without adding visual noise. Explicit scroll region + semantic table markup keeps keyboard and screen-reader navigation intact.

**Pinterest entry points (metadata only, image not accessible):**
- Board "Grid / Table / Rows UI" — 87 pins, owner lin m: https://www.pinterest.com/linimg/grid-table-rows-ui
- Board "Table UI design" — 40 pins, owner Mike Rapp: https://www.pinterest.com/mikerapp/table-ui-design
- Pin "Table sample design" — repost of Colorlib "Responsive Table V2 – Free HTML/CSS Table Template 2026": https://www.pinterest.com/pin/336081190961031863

**Open-web sources with the actual guidance:**
- "Designing Clear Data Tables" interactive course, section 11 "Sticky Headers, Frozen Columns, and Context Preservation": https://personwise.ai/t/c4a1839c/public — describes the anchor (identity) column, sticky headers, zebra striping, alignment zones, filter bar, pagination.
- "HTML Tables: Styling & Accessibility Best Practices", UDT: https://ultimatedesigntools.com/blog/html-tables-styling-accessibility-guide — horizontal-scroll wrapper is the most reliable accessible responsive pattern; subtle zebra contrast; right-align numbers; sticky `thead th`.
- Purdue University Libraries, "Building Tables" research guide (WebAIM/W3C links): https://guides.lib.purdue.edu/c.php?g=1471250&p=10997895 — simple tables, real `th`/`caption`, avoid merged/nested cells.

**Attribution/licence:** Pinterest boards — inspiration only, do not copy. Personwise and UDT — inspiration only. Purdue guide links to public WebAIM/W3C guidance; verify on those sites before reuse.
