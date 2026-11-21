# Cahier des charges — PWA famille (anticipé)

> Version : 0.1.0
> Statut : anticipé — proposition de cahier des charges, en consultation avant développement
> Date : 2026-11-21
> Pilote : ACSF-AFRIQUE SARL — Ouagadougou
> Responsable métier : **Nom fictif** — administratrice de l’agence — 70 23 77 90

> **Nature** : ce document est un **CDC anticipé**, dérivé des fonctionnalités déjà livrées dans
> ACSF Desktop et des règles de validation des rendez-vous (`REGLES-RDV.md`). Il décrit, pour le
> client (famille), ce que la **PWA** doit être capable de faire en fonction de ce que fait déjà le
> desktop côté décision.

---

## 1. Contexte et porteurs

### 1.1 Contexte

ACSF Desktop (compétence dossier / agenda) enregistre les rendez-vous avec un **statut** qui
indique l’origine et la décision attendue :

| Statut | Origine | Décision attendue | Qui décide |
|---|---|---|---|
| `propose` | L’agence propose un rendez-vous | Accepter / refuser | **Le client**, depuis la PWA |
| `demande` | Le client demande un rendez-vous | Valider / refuser | **L’agence**, dans ACSF Desktop |

### 1.2 Porteurs

- **Client** : utilisateur final (famille) — via PWA (lien web, téléphone).
- **Agence** : administratrice (Nom fictif) et agents — via ACSF Desktop (décision).

### 1.3 Positionnement PWA

- Plateforme web accessible via lien, sans installation (browsers modernes).
- **Offline** : la PWA garde les dernières données lues ; elle doit rester fonctionnelle sans
  réseau. Ne jamais rendre la PWA dépendante du réseau (Maint.: point fort à casser).

---

## 2. Objectifs

1. Permettre au client de **valider ou refuser une proposition** de l’agence.
2. Permettre au client de **formuler une demande** de rendez-vous.
3. Permettre à l’agence de **valider ou refuser une demande** (déjà porté par le desktop).
4. Assurer la traçabilité des décisions entre la PWA et desktop.

---

## 3. Périmètre fonctionnel (anticipé)

### 3.1 In scope (proposition)

- Consultation des rendez-vous / décisions en attente liées au client.
- Validation / refus d’une proposition reçue (`propose` → `valide` / `refuse`).
- Formulation d’une demande de rendez-vous (date, créneau de 30 minutes, …).
- **Offline** : lecture / décision sur les éléments déjà lus, sans réseau.

### 3.2 Out of scope (proposition)

- Gestion du dossier personnel du client côté PWA — à cadrer séparément.
- Paiement, messagerie, contenus hors rendez-vous.
- Refonte du desktop.

### 3.3 Saisie des informations personnelles du client (in scope, portée du pilote)

- Le client **peut remplir ses informations personnelles** depuis la PWA (formulaire de saisie /
  mise à jour).
- Champs envisagés : identité, coordonnées, consentements spécifiques (santé, spiritualité,
  situation de mineur).
- Pour les mineurs : consentement parental — décision à valider côté agence.
- La saisie est tracée ; les droits de validation / contrôle restent côté agence (desktop).

---

## 4. Règles de décision (transposition de `REGLES-RDV.md`)

- Aucun champ « sur place » n’est ajouté : la présence du client à l’agence est une **décision de
  l’administrateur** au moment de la validation.
- Si le client est **présent à l’agence**, l’administrateur valide directement depuis le desktop,
  sans champ dédié ni commentaire obligatoire.
- Les statuts `valide` et `refuse` sont **terminaux**.
- Fichiers / remarques : flux à définir (le desktop accepte déjà fichiers et remarques côté
  proposition — à transposer côté client).

---

## 5. Exigences techniques (anticipées)

- **Synchronisation** : articulation PWA ↔ ACSF Desktop — canal à trancher (serveur central /
  liaison locale / pair à pair). Point bloquant à lever avant tout développement.
- **Contraintes produit** : zéro dépense, fonctionnement hors ligne (desktop type), confidentialité
  des données de santé.
- **Expérience** : retours explicites côté client (« Proposition validée. », « Demande envoyée. »)
  et côté agence (déjà en place dans le desktop).

---

## 6. Critères d’acceptation / jalons anticipés

1. Le client peut valider une proposition depuis la PWA ; la décision apparaît dans le desktop
   (file « Décisions en attente »).
2. Le client peut refuser une proposition ; aucune donnée n’est figée côté desktop.
3. Le client peut formuler une demande ; l’agence la valide / la refuse depuis le desktop.
4. Toute décision est tracée (statut terminal, retour explicite).

---

## 7. Risques et limites / questions ouvertes

- Canal de synchronisation PWA ↔ backend/Desktop non trancher.
- Périmètre fonctionnel du client (simple RDV vs consultation dossier) à confirmer.
- Gestion hors ligne de la PWA (à ne jamais rendre dépendante du réseau).

---

## 8. Informations personnelles du client — saisie

### 8.1 Objet

Le client peut remplir ses informations personnelles (identité, coordonnées, consentements
spécifiques). Cette fonctionnalité est portée par le pilote.

### 8.2 Règles

- Consentement éclairé requis avant toute donnée sensible (santé, spiritualité) ou mineure.
- Mineurs : consentement parental — décision de l’agence, jamais seule saisie du client.
- Données minimales nécessaires au service ; durée de conservation à définir.
- Traçabilité côté agence (desktop).

---

## 9. Règles de connexion à la plateforme

### 9.1 Objet

Définir comment le client (PWA) se connecte et échange avec la plateforme (backend / desktop).

### 9.2 Règles proposées (anticipées)

- Authentification propre à la PWA / compte client.
- Échanges décisionnels synchrones ou asynchrones avec le desktop / backend.
- Hors‑ligne : cache local des éléments lus ; stratégie de file d’attente si synchro hors ligne.
- Confidentialité : tokens / sessions sécurisés, pas de données de santé en clair dans le canal non
  sécurisé.

### 9.3 Questions ouvertes

- Canal exact (serveur central / liaison locale / pair‑à‑pair).
- Méthode d’authentification.
- Stratégie hors‑ligne (cache local, file d’envoi).

---

## Annexe — Références

- `REGLES-RDV.md`
- `docs/cahier-des-charges-acsf.md` (CDC principal)
- `MAINTENANCE.md`
