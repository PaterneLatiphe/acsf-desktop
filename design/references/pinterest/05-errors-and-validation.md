# Pattern 5 — Error summary plus field-level, plain-language recovery

**Concrete visual pattern:** on validation failure, show a prominent summary at the top of the form titled "Il y a un problème", listing each error as a link that jumps focus to the offending field; repeat the exact same short message beside the field; describe the fix ("Saisissez la date de naissance", not "Champ invalide"). Never rely on red colour alone — keep an icon or "Erreur :" text and a visible field border change.

**Why it fits ACSF:** low-literacy users are easily derailed by unexpected errors; a linked summary removes searching, and plain wording in French removes guesswork. Moving focus is essential for keyboard and screen-reader users. Consistent wording between summary and field prevents confusion.

**Sources:**
- GOV.UK Design System, "Error summary": https://design-system.service.gov.uk/components/error-summary — always show it for validation errors; heading "There is a problem"; links to each bad field; move keyboard focus to the summary; same wording next to inputs; place below breadcrumbs/back link and above the h1.
- GOV.UK Design System, "Error message": https://design-system.service.gov.uk/components/error-message — be clear and concise; include the field's own words; avoid jargon ("forbidden", "invalid"), "sorry", "please", and humour.
- Home Office User-Centred Design Manual, "Error messages": https://design.homeoffice.gov.uk/accessibility/interactivity/error-messages — do not use colour alone; provide review/correct/confirm for lower-digital-literacy users; give format hints up front.
- Department for Education accessibility manual, common issues: https://accessibility.education.gov.uk/audits-issues-statements/issues/common-issues — matched summary/field messages; descriptive rather than generic text.

**Attribution/licence:** GOV.UK and UK government department content — Crown copyright, normally OGL v3.0; verify on each site before reuse. Paraphrased only.
