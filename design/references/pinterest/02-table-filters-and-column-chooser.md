# Pattern 2 — Progressive disclosure in tables: filter panel, column chooser, expandable rows

**Concrete visual pattern:** a compact filter bar with a small number of labelled filters and a single "Clear filters" reset; a column-chooser control with checkboxes so only relevant columns are shown; and expandable rows for secondary detail instead of adding more columns. Filters are visible as removable chips so users can see *why* a list is short.

**Why it fits ACSF:** at 12px type, wide tables force horizontal scrolling and are intimidating for low-literacy users. Letting a user reveal only the columns and filters they need reduces cognitive load; an always-available "Clear filters" is a recovery path when a user gets "lost" in an empty or surprising result set. Progressive disclosure keeps the default view calm while preserving power-user access.

**Pinterest entry points (metadata only):**
- Pin "19+ Filter UI Examples for SaaS: Design Patterns & Best Practices" — repost from behance.net, author shown as "Interface Vault": https://kr.pinterest.com/pin/529876712430453829
- Pin "Column Chooser for Web UI Design" — repost from dribbble.com, pin description credits a Dribbble "Table sorting" shot: https://www.pinterest.com/pin/table-sorting--104568022586233027
- Board "Expandable Table Rows" — 17 pins, owner Jason Babel: https://www.pinterest.com/jasonbabel01/expandable-table-rows

**Open-web corroboration:**
- UDT table guide (above) recommends an explicit filter bar and pagination around the table skeleton: https://ultimatedesigntools.com/blog/html-tables-styling-accessibility-guide
- GOV.UK Design System components list includes Accordion, Details, Tag and Pagination as standard patterns that can be combined for this: https://design-system.service.gov.uk/components/

**Attribution/licence:** Interface Vault (Behance) and the unnamed Dribbble designer — inspiration only, do not copy. Jason Babel's board — inspiration only. GOV.UK components — check OGL v3.0 on source before reuse.
