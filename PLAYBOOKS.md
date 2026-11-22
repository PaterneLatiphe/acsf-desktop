## qa - Playbook de l'agent QA / automatisation

### Dernière mission : Plan QA — Prof-IA (PWA famille, ACSF-AFRIQUE SARL)
**Date :** Sun Nov 22 2026

#### Ce qui a fonctionné
- Spec métier exploitée : ACSF Desktop\docs\cahier-des-charges-pwa.md (+ REGLES-RDV.md pour les statuts propose/demande/valide/refuse)
- Playbook persistant lu : ACSF Desktop\PLAYBOOKS.md (standards WCAG target AA/AAA, exigences ACSF)
- Nouveau projet créé : Prof-IA\docs\plan-qa.md (répertoire nouveau)

#### Points de vigilance retenus
- Caveats : diff visuels préférés en tests IRL réelles (navigateur + DevTools), ratio calculé automatiquement par scripts (messages auto réve de fragmentation)

#### Règles retenues
- Vérifications repeatables : scripts versionsés + axe-core suite + Lighthouse scripts ; archivés par release
- Tests black-box primaires : navigateur + DevTools, Jumeau logiciel vérifiant via DOM
- Intégrité tracé : vérifier statut/date/auteur dans ACSF Desktop en plus du statut PWA
#### 2026-11-22 — Mission Prof-IA (plan QA — PWA famille, ACSF-AFRIQUE SARL)
- **Sécurité (agent sécurité — P0/P1 validés) :** CSP stricte + HTTPS prod (audit curl/DevTools/OWASP ZAP + injection XSS + blocage Trusted Types) ; données santé/mineur en clair IndexedDB (dump Playwright → absence de chaînes sensibles) ; cookies Secure+HttpOnly+SameSite=Lax, CSRF, lockouts, scoping familyId ; `navigator.storage.persist()` vérifié après install ; intégrité tracé (tamper IndexedDB → détecté/refusé) ; CDC §7.3 : durée de conservation + avis juridique (loi 001-2021/AN/CIL) avant toute saisie.
- **IA (agent IA — statut V1) : IA hors périmètre V1** (aucun appel client : greps vides dans src/, src/api, src/lib ; §§5, 9.2, 12, 16 absence vérifiée). Si V2 : proxy Host/Origin check, rate limit device_id, input sanitizer élève (prompt injection), redaction PII avant appel, exclusion mineurs (Loi 001-2021/AN/CIL).
- **Sources :** CDC Prof-IA (ACSF-Desktop/docs/cahier-des-charges-pwa.md §§1-9), Prof-IA/docs/plan-qa.md, OWASP WSTG v4.2, MSTG, web.dev/learn/pwa/offline-data.
- **Note :** Prof-IA/src/db vide → ICache (Dexie V1) à définir avec repositories Appointments/FamilyInfo/Settings/DeviceIds ; tests/e2e vide → Playwright e2e à créer.

#### Sources consultées
- CAHier des charges PWA (Spec métier - débutant)
- REGLES-RDV.md (statuts, files décisions)
- ACSF Desktop\PLAYBOOKS.md (standards)
- ROUTING.md (protocole d'équipe senior)

## ux-accessibilite - Playbook d'amélioration continue

### Dernière mission : Audit accessibility complet ACSF Desktop
**Date :** Sun Nov 22 2026

#### Ce qui a fonctionné
- Analyse de tous les 18 fichiers sources requis
- Calculs de contraste WCAG précis via formule de luminosité relative
- Vérification complète des focus clavier, ARIA, reduced motion
- Tous les invariants ACSF vérifiés et documentés

#### Points de vigilance retenus
- Ratio succès 6.96:1 juste sous AAA 7:1 pour texte normal (AA ok)
- Ratio alerte 6.82:1 AA seulement pour texte normal
- Ratio erreur 7.00:1 exactement à la frontière AA/AAA
- Gris #55536A sur blanc est le seul à atteindre AAA pour texte normal

#### Règles retenues
- Tous les contrastes satisfont AA minimum, majorité AAA
- Pas de couleur seule sans texte explicite
- Langue fr par défaut sur inputs date
- Téléphone burkinabé format +226 XX XX XX XX dans normaliserTelephone
- focus-visible 2px solid var(--nuit) + outline-offset 2px conservé
- Reduced motion dans les 2 fichiers CSS base.css + accessibilite.css

#### Sources consultées
- WCAG 2.1 ratios calculs manuels via formule luminosité relative
- Tokens CSS tokens.css pour toutes les paires de couleurs
- base.css lignes 11-12 focus-visible
- accessibilite.css média prefers-reduced-motion
- exportTableur.ts normaliserTelephone pour format +226