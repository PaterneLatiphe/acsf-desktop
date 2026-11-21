# Cahier des charges — ACSF Desktop

> Version : 0.1.0
> Statut : brouillon — pilote
> Date : 2026-11-21
> Pilote : ACSF-AFRIQUE SARL — Ouagadougou
> Responsable métier : Nom fictif — administratrice — 70 23 77 90

---

## 1. Préambule — cadre du document

Ce cahier décrit ACSF Desktop : logiciel de suivi des personnes suivies par ACSF-AFRIQUE SARL.

C’est la référence du projet : le « quoi » et le « pourquoi ». Si le code dévie de ce document, c’est
lui qui tranche — le cahier est le point d’appui, pas l’inverse. Toute évolution de périmètre ou de
décision validée passe par un journal d’apposition (annexe A).

Historique des révisions :

| Version | Date | Changement | Statut |
|---|---|---|---|
| 0.1.0 | 2026-11-21 | CDC rédigé dans le ton du pilote, référence d’appui pour le travail | Brouillon |

---

## 2. Contexte et porteurs

### 2.1 Mission

ACSF Desktop est le logiciel de suivi des personnes suivies par ACSF-AFRIQUE SARL. Il sert à
**connaître chaque personne suivie** — dossier, volets de suivi, rendez-vous, conseils — et à en faire
une base de données fiable.

### 2.2 Environnement

- **Desktop** : PC Windows de l’agence, Electron + React + TypeScript, base SQLite via `sql.js`.
- **Web / familles** : plateforme web (PWA) — le logiciel est **en ligne**, les familles utilisent un
  lien web depuis leur téléphone.
- **IA** : assistants intégrés via des providers externes (Groq, Gemini), failover local ; bascule
  explicite uniquement.

### 2.3 Posture produit

Le logiciel est **fonctionnel en ligne et hors ligne** : la plateforme est en ligne, le logiciel
continue de marcher sans réseau. C’est son point fort, et c’est le plus fragile à casser.

---

## 3. Vision et objectifs

### 3.1 Objectifs stratégiques

1. Fiabiliser le suivi des personnes (dossier unique, sans perte).
2. Protéger les données sensibles (santé, spiritualité, mineurs).
3. Respecter une règle de **zéro dépense** : pas de service payant, abonnement, carte bancaire, ni
   essai.
4. Garantir le fonctionnement hors ligne.

### 3.2 Objectifs fonctionnels et techniques

- Cadrer le périmètre fonctionnel par modules livrés, avec jalons.
- Accessibilité (états vides, statuts textuels, toasts, tri annoncé, résumés d’erreurs, formulaire
  guidé, outils de grille).

---

## 4. Périmètre fonctionnel

### 4.1 In scope

- Tableau de bord, personnes / dossier, agenda / rendez-vous, offres / prestations, rapports, volets,
  exports.
- Assistance IA (failover, providers externes, bascule explicite).
- Plateforme web famille (PWA) en complément du desktop.

### 4.2 Out of scope (proposition)

- Gestion financière / comptable — hors périmètre actuel, à valider auprès de l’agence.

---

## 5. Utilisateurs, rôles et flux

### 5.1 Acteurs

| Rôle | Acteur | Responsabilités |
|---|---|---|
| Administratrice | Nom fictif (ACSF-AFRIQUE) | Décision métier, validation des rendez-vous, validation des conseils ; point de contact support (70 23 77 90) |
| Agent terrain | Référent terrain (voir §12) | Saisie des personnes, volets, rendez-vous ; périmètre assigné |
| Famille | Utilisateur web (PWA) | Consultation du dossier via lien web |
| Équipe technique | Développeurs / référents ACSF | Maintenance, évolutions, sauvegarde, reprise |

### 5.2 Flux principaux

- Agent → création / mise à jour du dossier personne → volets → rendez-vous / conseils.
- Administratrice → validation des décisions (rendez-vous, conseils, offres).
- Famille → consultation web, hors ligne tolérée (PWA).

---

## 6. Fonctionnalités livrées par module

### 6.1 Tableau de bord

- Compteurs, prochains rendez-vous, contributions à revoir, activité récente.

### 6.2 Personnes / dossier

- Liste, création, recherche, dossier (fiche personne). Export `.xlsx` (liste / carnet / rapports).
- Sauvegarde locale (`acsf-db.bin`, copie de secours).

### 6.3 Agenda / rendez-vous

- RDV : agence, sortie terrain, entretien. Statuts : `propose`, `demande`, `valide`, `refuse`, avec
  origines (`source_volet`, `source_passage_id`) et décisions.
- Fichiers associés, décisions en attente, files à venir / passées, retour explicite.

### 6.4 Offres / prestations

- Catalogue : champs, catégories, statuts, liste, configuration des prestations, gestion des offres.

### 6.5 Rapports

- Différence Tableau de bord / Rapports. Types de rapports, filtres, aperçu, export multi-types.
- Export `.xlsx` validé uniquement s’il est réellement ouvert et contrôlé.

### 6.6 Volets / carnet de suivi

- Carnet de suivi (compétence en cours). Éducation livrée ; Santé / Social / Spiritualité / Historique
  à compléter.

---

## 7. Règles métier

### 7.1 Règles de rendez-vous

Détaillées dans `REGLES-RDV.md` : décision côté client ou côté agence, APK client, validation directe
par l’administratrice.

### 7.2 Confidentialité

Rien de sensible (santé, spiritualité, mineurs) ne doit apparaître sans autorisation ; le refus se
fait côté serveur, pas seulement côté affichage.

### 7.3 Règles métier des autres fonctionnalités (`OFFRES.md`, `RAPPORTS.md`)

- **Offres / catalogue** : une offre est une prestation du catalogue — pas une proposition
  personnalisée. Création, modification et bascules ACTIVE/INACTIVE réservées à l’agence (pas de
  client). Statuts : **ACTIVE** (proposable) / **INACTIVE** (conservé dans le catalogue, retiré de
  l’usage courant). Catalogue affiché : libellé, description, catégorie (Accompagnement, Formation,
  Animation, Appui matériel, Autre), tarif en FCFA et statut. Tarif : nombre entier positif.
- **Rapports** : outil de documentation formel, distinct du tableau de bord. Exportable `.xlsx`
  daté, en-tête ACSF, auteur, filtres, mise en page A4 paysage. Types : Personnes suivies /
  Rendez-vous / Contributions famille — affichés avec libellés métier, jamais clés techniques.
  Read-only : le rapport ne modifie aucune donnée.

---

## 8. Contraintes

### 8.1 Exigences produit

- **Zéro dépense** : pas de service payant, abonnement, carte bancaire, ni essai.
- **Offline-first** : le logiciel doit fonctionner sans réseau (desktop, web/PWA, IA).
- **Confidentialité** : données de santé et mineurs protégées.

### 8.2 Exigences techniques / design

- Electron / React / TypeScript / Vite ; SQLite via `sql.js` (WASM) ; migrations idempotentes.
- Design system : tokens (`--nuit`, `--jaune`, `--fond`, `--feuille`, `--plume`, `--gris`, `--ligne`),
  Inter via `@fontsource`, espacement 4/8/12/16/24/32, radii 8/12/16/999, typo 12px / 1,5, titres.
- Accessibilité : phases livrées (états vides, statuts textuels, toasts, tri annoncé, résumés
  d’erreurs, formulaire guidé, outils de grille).

---

## 9. Jalons et versions

### 9.1 Jalons

- Jalons par compétence (socle, dossier, agenda, offres, rapports, volets…).
- Version de schéma de la base : `schema_version`, migrations idempotentes.
- Pilote agence : 15 décembre 2026.

### 9.2 Versionnage du CDC

- Version `0.x.y` pendant la phase pilote ; passage à `1.0.0` à la validation agence.
- Incrément : +1 mineur = évolution de périmètre ; +1 patch = clarification sans changement de fond.
- Version validée : figée — évolution uniquement par nouvelle version.

---

## 10. Risques et limites

- Données de santé potentiellement envoyées vers des tiers (IA : Groq/Gemini) — vigilance.
- Logo ACSF à fournir avant livraison.
- Fragilité du hors‑ligne (point fort / plus fragile).
- Quotas / failover IA : pool local, cooldown, Retry-After.

---

## 11. Critères d’acceptation / livrables

- Modules fonctionnels livrés et vérifiés (`npm run verify`, `npm run build`).
- Failover IA opérationnel (plugin local, tests, providers live).
- Export `.xlsx` validé par lecture et contrôle.
- Fonctionnement hors ligne validé.
- Zéro dépense engagée.
- Un agent terrain ne voit pas les personnes d’un autre périmètre (voir §12).

---

## 12. Accès et périmètre par agent terrain

Un agent terrain **peut accéder et modifier les données des personnes suivies qui lui sont
assignées**.

- Périmètre d’un agent terrain : personnes assignées (rattachement agent ; migrations
  `agence_id` / `admin_id` sur `personnes`).
- Accès attendu : lecture et modification du dossier, volets, rendez-vous et contributions
  associés à ces personnes.
- Le compte administratif (Nom fictif) conserve un accès global à l’agence.
- Les agents ne voient pas les personnes relevant d’un autre périmètre.
- Toute modification est tracée (export / journal).
- Mise en œuvre du périmètre terrain à valider / compléter (filtrage des listes et des fiches).

Règles d’or concernées : §7.1 (règles 1 et 2).

---

## Annexe A — Documents associés

- `docs/decisions-acsf.md` — journal des décisions (pourquoi).
- `docs/avancement-acsf.md` — avancement (où en est le projet).
- `docs/propositions-acsf.md` — idées validées / à faire plus tard / refusées.
- `design/references/` — ressources design.
- `REGLES-RDV.md`, `OFFRES.md`, `RAPPORTS.md` — règles et spécifications par module.

---

*Ce CDC est un document de travail : versionné, daté, révisé via le journal des décisions.*
