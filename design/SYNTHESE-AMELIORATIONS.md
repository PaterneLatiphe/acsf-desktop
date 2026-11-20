# Synthèse — améliorations UI ACSF Desktop

Date : 2026-11-20 · Statut : **recherche uniquement, aucun fichier applicatif modifié**.

Quatre agents ont exploré Refero, Pinterest, les design systems ouverts et des implémentations React accessibles. Ressources téléchargées : `design/references/` (105 fichiers). Chaque ressource a son `SOURCE.md` (URL, auteur, licence, date).

## Ce qui est déjà solide (à ne pas toucher)

- Tokens uniques dans `src/styles/tokens.css` : une seule couleur nuit, jaune réservé à l’accent, 12 px / 1,5 partout, échelle 4/8/12/16/24/32.
- `DialogueConfirmation.tsx` : focus piégé, Échap, clic overlay, focus rendu.
- `OngletsVolets.tsx` : ARIA, badges, navigation clavier.
- `ChampFormulaire.tsx` : libellé, indication, `aria-invalid`, `aria-describedby`, erreur inline.
- `GrilleVolet.tsx` : AG Grid v36, tri, édition, menu contextuel clavier, hauteur de ligne calculée.
- `Etats.tsx` : squelettes, illustration vide, `Erreur`, `FiletErreur`.

Aucune de ces briques ne doit être remplacée. Les ajouts ci-dessous se font **par-dessus**, dans de nouveaux fichiers.

## Shortlist — 7 améliorations additives

| # | Amélioration | Nouveau fichier / point d’accroche | Pourquoi | Sources | Risque |
|---|---|---|---|---|---|
| 1 | **État vide et statut de données réutilisables** : « 12 résultats sur 148 », une seule action (« Effacer les filtres »), et « Données non chargées — Réessayer » en cas d’échec | `src/EtatDonnees.tsx` + `overlayNoRowsTemplate` de `GrilleVolet` | Peu de lecture, connectivité faible : toujours dire ce qui s’est passé et proposer une seule sortie | Pinterest 08, Refero 05, React 07, DS 10 | Nul : propriété optionnelle de la grille |
| 2 | **Bandeau de sauvegarde en langage clair** : « Tout est enregistré » / « Hors ligne · N modifications en attente » | Extension de `.etat-base` / `.etat-sauvegarde` dans `base.css`, aucun état métier modifié | Rend visible un état déjà calculé, sans nouveau flux | Pinterest 09, Refero 02 | Nul : lecture seule du state existant |
| 3 | **Couche CSS accessibilité** : anneau de focus visible, cibles ≥ 44 px, statut toujours **icône + mot** (jamais couleur seule), pas de zebra, bordures fines | `src/styles/accessibilite.css`, importé après `composants.css` | Clavier, daltonisme, faible alphabétisation ; zéro changement de logique | Refero 07/10, Pinterest 06/10, DS 06, React 01/02 | Nul : nouveaux sélecteurs uniquement |
| 4 | **Tri explicite dans la grille** : `aria-sort` (`none`/`ascending`/`descending`) et libellé « trier par … » traduit, direction annoncée par un mot ou une icône | Props `getColumnDefs`/`headerComponentParams` de `GrilleVolet` | Le tri existe déjà ; il devient annonçable | DS 01, React 03 | Faible : n’altère pas l’ordre des données (déjà trié en SQL/JS) |
| 5 | **Recherche nommée et bouton « Effacer » explicite** : `role="search"`, `aria-label`, bouton avec texte visible | `.recherche`, `.recherche-synth` (CSS + attributs ARIA) | Recognition plutôt que mémorisation | Refero 06, React 04, DS 05 | Nul |
| 6 | **Résumé d’erreurs avec liens vers les champs** (optionnel) : « 2 champs à corriger » + liens, messages en français clair, valeurs conservées | `src/formulaires/ResumeErreurs.tsx`, activé seulement si demandé | Erreur compréhensible d’un coup d’œil ; conforme GOV.UK | Pinterest 05, React 08, DS 03 | Nul si opt-in : garder le focus actuel sur le premier champ invalide par défaut |
| 7 | **Cycle de vie des toasts** : `role="status"`, `aria-label` français, nettoyage du timer, pause quand le focus entre dans la notification | Petit hook `src/useToast.ts`, sans changer les textes ni les délais | Évite les annonces perdues et les timers qui se chevauchent | React 06, DS 10 | Nul : mêmes durées 2600/4000 ms conservées |

## À ne pas faire

- Ne pas importer `@radix-ui`, `@primer/react`, `carbon`, `govuk-frontend`, `lucide-react` supplémentaire : les modèles servent d’inspiration, pas de dépendances.
- Ne pas embarquer les captures Refero/Pinterest dans l’application : **référence interne uniquement**.
- Ne pas remplacer AG Grid, ni son tri données, ni la coquille Electron, ni les exports Excel.
- Ne pas ajouter de formulaire en étapes, de sélecteur de colonnes ou de lignes expansibles maintenant : trop invasif pour le bénéfice.
- Ne pas mettre de statut uniquement en couleur, ni de texte « intelligente »/humour dans les messages.

## Modèles de composants récupérés (adaptables, sans dépendance)

| Composant modèle | Licence | Inspire chez nous |
|---|---|---|
| Radix Dialog / FocusScope | MIT | `DialogueConfirmation.tsx`, `FormulaireCadre.tsx` |
| Primer `useFocusTrap` / `useOpenAndCloseFocus` | MIT | entrée/sortie de focus des dialogues |
| Carbon DataTable (tri, recherche) | Apache-2.0 | `GrilleVolet.tsx`, `Volets.tsx` |
| GOV.UK Tabs | MIT (Crown Copyright) | `OngletsVolets.tsx` |
| shadcn/ui Field + Form | MIT | `ChampFormulaire.tsx` |
| Carbon Notification | Apache-2.0 | toasts de `Agenda`, `Personnes`, `Rapports`, `Volets` |
| shadcn/ui Empty / Skeleton / Spinner | MIT | `Etats.tsx`, états de grille |
| GOV.UK Error Summary + Input | MIT (Crown Copyright) | `ResumeErreurs.tsx` (opt-in) |

Détails, extraits et `SOURCE.md` : `design/references/component-models/`.

## Plan proposé

**Phase 1 — sans risque** : points 1, 2, 3, 5, 7. Nouveaux fichiers + attributs ARIA + CSS. Tests : `npm run verify`, `npm run build`, parcours navigateur des 4 volets, recherche, tri, dialogues.

**Phase 2 — optionnels** : points 4 et 6, activés explicitement. Vérification clavier et lecteur d’écran avant généralisation.

**Phase 3 — non retenus par défaut** : formulaire guidé par étapes, sélecteur de colonnes, refonte de la densité de la grille. À rediscuter avec les utilisateurs.

## Licences

- MIT / Apache-2.0 : conserver l’avis de licence si du code est copié, et noter les modifications.
- OGL-3.0 (GOV.UK) : attribuer la source.
- Refero / Pinterest / Dribbble / Behance : inspiration seulement, ne pas recopier visuels ni textes.
