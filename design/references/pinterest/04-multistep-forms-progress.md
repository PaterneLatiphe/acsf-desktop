# Pattern 4 — Step-by-step forms with named progress and safe navigation

**Concrete visual pattern:** a horizontal step indicator with *plain-language names* ("Identité", "Famille", "Aide", "Vérification"), current step visually dominant, completed steps distinct, pending steps visible but quiet. Below it: one question group per screen, "Continuer" / "Retour" buttons in the same place every step, auto-saved data with "Brouillon enregistré", and a final review screen before submission. On each step change, move keyboard focus to the new step heading or first field.

**Why it fits ACSF:** long intake/AG forms overwhelm low-literacy users and lose data when connectivity drops. Named steps give orientation without reading; stable button positions support memory and keyboard use; local auto-save plus a review screen prevents costly re-entry and errors on low-connectivity machines.

**Sources:**
- U.S. Web Design System, "Step indicator": https://designsystem.digital.gov/components/step-indicator — distinct treatment for current/completed/pending; use counters to reinforce progression; skip the indicator for fewer than three sections or for conditional branching.
- Figr, "Multi Step Form UX: Best Practices and Examples": https://figr.design/blog/multi-step-form-ux — "Step 2 of 4" with plain-language names, safe way back, data surviving navigation, focus to new step heading, Enter submits step, Back reachable, no focus trap in the indicator.
- Figr/Medium discussion, "Designing Multi-Step Forms Without Losing Users Halfway Through": https://medium.com/@ashish.devoq/designing-multi-step-forms-without-losing-users-halfway-through-8cfa5fd4bf55 — descriptive step names over "Step 1/2/3", save progress, review stage.
- Designlab, "How to Design Multi-Step Forms": https://designlab.com/blog/design-multi-step-forms-enhance-user-experience — progress tracker, consistent Previous/Next placement, autosave, real-time validation.

**Attribution/licence:** USWDS — U.S. government work, normally public domain; verify on site. Figr / Medium author / Designlab — inspiration only, do not copy.
