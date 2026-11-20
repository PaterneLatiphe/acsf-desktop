# ACSF Desktop

Application de suivi des personnes accompagnées par **ACSF-AFRIQUE SARL**.
Electron + React + TypeScript, base SQLite embarquée (sql.js), fonctionnement hors ligne.

## Prérequis

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev        # Vite, http://localhost:5180
npm run verify     # vérification TypeScript
npm run build      # build de production dans dist/
npm run electron   # lance l'application Electron avec dist/
```

L'ordre à respecter avant de lancer Electron : `npm run verify`, puis `npm run build`.

## Données

La base est stockée dans le répertoire `userData` d'Electron (`acsf-db.bin`), avec une
copie de secours `acsf-db.bin.bak`. Aucune donnée n'est envoyée sur un serveur.

## Export Excel

Les exports (liste de personnes, carnet de suivi, rapports) produisent des `.xlsx`.
Dans l'application Electron, une boîte **Enregistrer l'export ACSF** permet de choisir
le dossier et le nom du fichier. En mode `npm run dev` (navigateur), le téléchargement
utilise le comportement standard du navigateur.

## Rendez-vous

Les règles de proposition et de validation des rendez-vous (décision côté client ou côté
agence, APK client, validation directe par l'administrateur) sont décrites dans
[REGLES-RDV.md](REGLES-RDV.md).

## Offres

Le catalogue des prestations de l'agence (champs, catégories, statuts et comportement de la
liste) est décrit dans [OFFRES.md](OFFRES.md).

## Rapports

La différence entre le Tableau de bord et les Rapports, les types de rapports et leurs
filtres sont décrits dans [RAPPORTS.md](RAPPORTS.md).
