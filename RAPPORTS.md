# Rapports — synthèses de l’agence

L’onglet **Rapports** produit des documents, pas du pilotage en temps réel.

## Pourquoi un écran séparé du Tableau de bord

- Le **Tableau de bord** répond à « que faut-il traiter aujourd’hui ? » : compteurs en
  direct, prochains rendez-vous, contributions à revoir, activité récente. Il ne produit
  aucun fichier.
- **Rapports** répond à « quel document officiel puis-je imprimer ou envoyer ? » : un
  fichier `.xlsx` daté, portant l’en-tête ACSF, le nom de l’exportateur, les filtres
  appliqués et une mise en page A4 paysage.
- L’export de **Personnes** reste une liste de travail filtrée ; le rapport est une
  synthèse formelle, avec des colonnes propres à chaque type.

## Types de rapports

| Rapport | Lignes | Colonnes principales |
| --- | --- | --- |
| Personnes suivies | Une par personne | Identité, contact, programme, code de filiation, enregistrement, statut |
| Rendez-vous | Un par rendez-vous | Personne, date et heure, type, décision, notes |
| Contributions famille | Une par contribution | Personne, volet, champ, valeur déclarée, statut, décision |

Le rapport « Personnes suivies » remplace l’ancien export unique, sans en changer le titre
ni la mise en forme.

## Filtres

- **Période** : toutes les périodes, 7 derniers jours, 30 derniers jours, année en cours,
  ou période personnalisée (dates « Du » / « Au »).
  La date filtrée est celle du rapport : enregistrement pour une personne, date et heure
  pour un rendez-vous, date de demande pour une contribution.
- **Statut** : tous, ou une valeur présente dans les données. Les libellés sont traduits
  (proposé, demandé, validé, refusé, à revoir, corrigé, rejeté, suivi).
- Les indicateurs, l’aperçu et l’export suivent toujours les mêmes filtres.

## Aperçu et export

- Trois indicateurs s’adaptent au rapport choisi (par exemple Femmes/Hommes pour les
  personnes, À venir/En attente de décision pour les rendez-vous).
- Un aperçu affiche les lignes retenues, par lots de 20 avec **Afficher plus**.
- **Exporter le rapport (Excel)** utilise la mise en forme commune de `exportTableur.ts` :
  logo ACSF, en-tête, filtres, ligne de total, auteur. Le nom du fichier est
  `ACSF_<rapport>_<date>.xlsx`.
- Aucune ligne pour ces critères : un état vide propose **Effacer les filtres**.

## Données et acteurs

- Lecture seule : l’écran ne modifie aucune donnée.
- Aucune dépendance ajoutée ; aucun export existant n’est remplacé.
- Comme pour le reste de l’application, le fichier est enregistré par le navigateur en
  mode `npm run dev`, et via la boîte **Enregistrer l’export ACSF** sous Electron.
