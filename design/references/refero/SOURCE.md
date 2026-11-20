# SOURCE — Refero research bundle (master index)

Date accessed: **2026-11-20**

## Primary public sources used

| Source | URL | Used for |
| --- | --- | --- |
| Refero home (public, JS-rendered) | https://refero.design | UI Elements / UX Patterns vocabulary (Table, Dialog & Modal Window, Cards & Tiles, Skeleton, Navigation Bar, Sidebar & Drawer, Toolbar, Badge, Empty State, Search Field, Filter & Sorting, Searching) |
| Refero AI/agent index | https://refero.design/llms.txt | Official public page map, MCP notes, docs links |
| Dashboard UI best practices (public article) | https://refero.design/p/dashboard-ui-best-practices | Dashboard principles, KPI count, progressive disclosure, 12-column grid, states, accessibility, screenshot CDN URLs |
| How it works (public article) | https://refero.design/how-it-works | Tag combination / search behaviour |
| Filter & Sorting + Dialog tags | https://refero.design/search?design_patterns%5Bid%5D%5B%5D=111&page_elements%5Bid%5D%5B%5D=81 | Concrete pattern search URLs |
| Dialog & Modal Window tag | https://refero.design/search?page_elements%5Bid%5D%5B%5D=81&order=trending | Concrete pattern search URL |
| Refero Styles (public) | https://styles.refero.design | Token / DESIGN.md library overview |
| DESIGN.md examples (public) | https://styles.refero.design/ai-agents/design-md-examples | Warm palette example + style image URL |
| Dashboard style examples (public) | https://styles.refero.design/examples/dashboard-ui-design | Caveat: preview shows source website, not a product dashboard |
| Clearbit style (public) | https://styles.refero.design/style/6221ba67-26e7-4657-91b7-efd77cbb1f12 | Data table, pill tag, focus-ring token, 8px spacing |
| Visitors style (public) | https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5 | Analytics data grid, 8px spacing scale, radii |
| Pravah style (public) | https://styles.refero.design/style/30a8b128-a5bb-4d86-85eb-743b78091596 | Warm parchment palette, 12px/1.5 type, contrast pairs |
| until style (public) | https://styles.refero.design/style/ded6d7c4-2801-45f4-8b8a-089f1b37842d | Minor-third type scale, 8px spacing tokens |
| Terms of Use | https://doc.refero.design/legal/terms-of-use | Licensing / permitted use (§10) |
| Refero robots policy | https://refero.design/robots.txt | Confirms `/api/` is disallowed; not accessed |

## Downloaded files

Every downloaded file has its own `SOURCE.md` beside it:

- `screenshots/stripe-dashboard/stripe-dashboard-preview.jpg` (+ SOURCE.md)
- `screenshots/asana-dashboard/asana-dashboard-preview.jpg` (+ SOURCE.md)
- `screenshots/stellate-dashboard/stellate-dashboard-preview.jpg` (+ SOURCE.md)
- `screenshots/shopify-dashboard/shopify-dashboard-thumb.jpg` (+ SOURCE.md)
- `screenshots/coinbase-dashboard/coinbase-dashboard-preview.jpg` (+ SOURCE.md)
- `styles/pravah-warm-parchment/pravah-preview.jpg` (+ SOURCE.md)

`pattern-notes.md` and `style-tokens-notes.md` are my own research notes distilled from the public pages above; they are not copies of Refero documents.

## Licensing / usage cautions

- **All downloaded images are "inspiration only" / internal design reference.** Refero Terms of Use §10 allows design research, inspiration, internal reference and ordinary product design work under your plan. It does **not** allow resale, redistribution, standalone publication as a dataset/library, or removal of attribution/source context.
- **Third-party rights:** Screenshots and brands shown (Stripe, Asana, Stellate, Shopify, Coinbase, Pravah) remain the property of their respective owners. Inclusion in Refero does not imply endorsement. Do not ship these images in the app or reuse logos/fonts/code.
- **DESIGN.md:** Refero Styles says its guides are generated analyses of public websites, **not official brand guides**. Copying/downloading a guide does not grant permission to reuse third-party images, logos, fonts or code. There is **no public `/design.md` endpoint**; the site's own docs describe the export as generated from page content, and undocumented API access is discouraged/blocked. Only values visible on public rendered pages were recorded here.
- **No scraping workaround was used.** No API, MCP or login-gated content was accessed.

## Access limitations encountered (transparent note)

- `https://refero.design` root, `/elements`, `/patterns` and `refero.design/styles/<id>` returned **no server-rendered text** to the web fetcher (client-side rendered). Their public content was still obtained via the site's `llms.txt`, public article pages, search-result excerpts and the rendered HTML payload of `styles.refero.design` pages.
- The in-app browser was **not connected** to this session (`[browser.disconnected]`), so interactive browsing/screenshots of Refero itself were not possible. No login-gated or paid screen-detail/MCP content was used or guessed.
- Refero MCP (`https://api.refero.design/mcp`) is **paid/login-gated** and was not used.
- Full per-screen detail pages and bulk screen search require an account/paid plan; no attempt was made to bypass this.
