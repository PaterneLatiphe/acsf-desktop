# Maintenance de ACSF Desktop — notes pour la personne qui réparera ça plus tard

> Écrit par quelqu'un qui sait que ce logiciel sera réouvert un jour par une personne fatiguée, en urgence, sans le contexte. Lis ça avant de toucher quoi que ce soit.
> Dernière écriture : 19 novembre 2026 — état du projet : **compétence 5 (volets) en cours — migration + carte Éducation livrée, Santé/Social/Spiritualité/Historique à compléter.**

## Ce que c'est, en une phrase

ACSF Desktop est **le logiciel de l'agence ACSF-AFRIQUE** : il sert à connaître chaque personne suivie (dossier + volets + RDV + conseil), et à en faire une base de données fiable. Il fonctionne sur un PC Windows de l'agence. La plateforme est **en ligne** (les familles utilisent un lien web de leur téléphone), **mais le logiciel continue à marcher même sans réseau** — c'est son point fort, et c'est le plus fragile à casser.

## Les trois règles d'or

1. **On perd des dossiers, jamais des vies.** Si quelque chose n'est pas sûr, on ne le fait pas : on sauvegarde d'abord.
2. **On ne teste pas sur les dossiers réels des familles.** On travaille sur une copie ; on valide, on se dit « ok », après seulement on applique.
3. **On n'invente pas le métier.** Un doute sur « est-ce que l'agence veut ça ? » → on demande à l'association (Awa Koné, administratrice de l'agence de Ouaga — 70 23 77 90). C'est son logiciel, pas le tien.

## Où sont les choses

- `apps/acsf-desktop/` — le projet (ce dossier, tu y es). Le reste du dépôt :
  - `docs/cahier-des-charges-acsf.md` — **la référence** (le « quoi » et le « pourquoi »). Versions datées, ne l'édite pas sans réfléchir aux autres sections.
  - `docs/decisions-acsf.md` — **le journal des décisions** (pourquoi on a choisi ça). Si tu changes un choix validé, ajoute une ligne au journal.
  - `docs/avancement-acsf.md` — où en est le projet, en une page.
  - `docs/propositions-acsf.md` — les idées validées / à faire plus tard / refusées.
  - `apps/desktop/` — c'est **SIRANIN** (autre logiciel). Ne le touche pas.
- Base de données locale : fichier `acsf-db.bin` (SQLite via sql.js) créé dans le dossier utilisateur Windows (`%APPDATA%\ACSF Desktop\`), pont Electron `acsfDisque` (lire / ecrire / lireWasm) ; en navigation web, repli sur le localStorage du navigateur. Sauvegarde : copie du fichier.
- Sauvegardes : copier `acsf.db` quelque part de sûr **chaque jour ou chaque semaine** — c'est tout le travail.

## Lancer le logiciel en mode développeur

```powershell
cd apps/acsf-desktop
npm.cmd install     # une fois
npm run dev         # serveur de dev (http://127.0.0.1:5180) — pas la fenêtre
npm run build       # produit dist/ (utilisé par la fenêtre)
npm run electron    # ouvre la vraie fenêtre Windows (nécessite dist/ à jour)
npm run verify      # contrôle TypeScript (doit rester vert)
```

Si `npm install` échoue à cause d'`electron` (gros téléchargement, réseau capricieux) : relance — ce n'est pas une erreur de code. Si `better-sqlite3` réapparaît un jour dans les dépendances : retire-le, ça demande un compilateur C++ que la machine n'a pas. Utilise **sql.js** (pure WebAssembly).

## Comprendre sans tout lire

- `src/charte.css` — les couleurs ACSF (`--nuit #150A54`, `--jaune #FFF268`, `--vert #7AB444`, `--brique #B0390E`, `--fond #F6F7FB`). Si tu changes une couleur ici, tu changes tout le logiciel — et tu dois en parler à l'agence, c'est leur identité (logo officiel).
- `src/App.tsx` — l'écran « Tableau de bord » et la **navigation latérale** (Personnes, Agenda, Offres, Rapports). Les cinq écrans du menu sont construits : Tableau de bord, Personnes (création + liste + dossier), Agenda, Offres et Rapports. L'ancien onglet « Conseils » a été retiré : les conseils donnés à une famille sont déjà saisis dans le dossier de la personne (volet Social : « Type de conseil » et « Conseil déclaré » ; volet Synthèse : « Remarques » ; volet Historique : type « Conseil »).
- `electron/main.cjs` — ouvre la fenêtre. Rien de plus, volontairement.

## Comment on travaille ici (pour ne pas se retrouver coincé trois mois)

- **Un écran à la fois, une compétence à la fois.** On a commencé par le socle (compétence 1). On ne commence la compétence 2 que quand la 1 est finie et validée par l'agence.
- **Chaque écran doit marcher sans réseau.** Si un changement casse ça, c'est un bug, pas un choix.
- **Zéro dépense.** Pas de service payant, pas d'abonnement, pas de carte bancaire — même d'essai. Gratuit ou on n'en parle pas.
- **Sécurité des familles** : rien de sensible (santé, spiritualité, mineurs) ne doit apparaître sans autorisation. Refuser côté serveur, pas seulement masquer à l'écran.

## Problèmes connus / pièges

- Le **serveur central** vit sur Cloudflare (`*.pages.dev`) — plan gratuit, **blocage gracieux** si on dépasse les quotas (ça s'arrête, ça ne facture pas). Consignes de synchro : jamais de polling, toujours à l'ouverture ou sur action.
- Les familles utilisent un lien web ; elles peuvent être sans réseau : la PWA garde les dernières données lues. **Ne jamais rendre la PWA dépendante du réseau.**
- `better-sqlite3` ne compile pas ici → sql.js uniquement.
- Le logo ACSF dans les maquettes vient d'un extrait de `Logo et Pied de page ACSF-AFRIQUE 2.docx` ; pour le produit final, l'agence doit fournir le fichier officiel propre (SVG/PNG) — ne pas utiliser une photo d'écran.
- Si un jour l'agence veut un nom de domaine (ex. `acsf-afrique.com`) : c'est elle qui achète et possède. On adapte la configuration, on ne décide pas pour elle.

## Si quelque chose casse en prod (le jour du pilote)

1. Ne touche PAS au fichier de base (`acsf-db.bin`). Copie-le ailleurs d'abord.
2. Redémarre le PC / le logiciel. 80 % des cas.
3. Note l'heure, l'écran, le message d'erreur, la personne qui l'a vécu. Envoie à l'administration (70 23 77 90).
4. Seul cas destructeur admis : restaurer la dernière copie de `acsf-db.bin` connue bonne — avec accord de la responsable d'agence, jamais seul.

## Qui décide quoi

- **Métier** (quelles données, qui voit quoi, quels volets) : l'ACSF — jamais nous.
- **Technique** (comment, avec quoi) : celui/celle qui assure la maintenance — voir `docs/decisions-acsf.md`. Les choix guidés (agence pilote, 15 décembre 2026, zéro dépense) sont dans ce journal. Un changement majeur = une ligne dans ce journal, datée.

## Contacts

- Maintenance/développement : voir qui assure actuellement (J6 du 18/12/2026 — le référent sera désigné là).
- Agence pilote : ACSF-AFRIQUE SARL, Ouagadougou — acsfafrique@gmail.com — 70 23 77 90 / 25 45 43 43.

---

*Ce fichier n'est pas une bible — il est simplement plus long qu'un café, moins long qu'une nuit de debug. Si tu l'améliores, dis-le dans le journal.*
