# Rapports — synthèses de l’agence

L’onglet **Rapports** produit des documents, pas du pilotage en temps réel.

## Pourquoi un écran séparé du Tableau de bord

- Le **Tableau de bord** répond à « que faut-il traiter aujourd’hui ? » : compteurs en
  direct, prochains rendez-vous, contributions à revoir, activité récente. Il ne produit
  aucun fichier.
- **Rapports** répond à « quel document officiel puis-je imprimer ou envoyer ? » : un
  fichier `.xlsx` daté, portant l’en-tête ACSF, le nom de l’exportateur, les filtres
  appliqués et une mise en page A4 paysage.
- L’export de **Personnes** reste une liste de travail filtrée, titrée
  « LISTE DES PERSONNES SUIVIES ». Le rapport « Personnes suivies » est une synthèse
  formelle distincte, titrée « RAPPORT DE SUIVI — SYNTHÈSE GÉNÉRALE ». Les deux utilisent
  la même mise en forme commune.

Chaque rapport garde un lien **Voir les personnes** ou **Voir l’agenda** vers sa source :
l’écran ne modifie aucune donnée.

## Types de rapports

| Rapport | Lignes | Colonnes principales |
| --- | --- | --- |
| Personnes suivies | Une par personne | Identité, contact, programme, code de filiation, enregistrement, statut |
| Rendez-vous | Un par rendez-vous | Personne, date et heure, type, décision, notes |
| Contributions famille | Une par contribution | Personne, volet, champ, valeur déclarée, statut, décision |

Les volets et les champs des contributions sont affichés avec leurs libellés métier
(« Éducation », « Niveau scolaire »…), jamais avec leurs clés techniques.

## Filtres

- **Période** : toutes les périodes, 7 derniers jours, 30 derniers jours, année en cours,
  ou période personnalisée (dates « Du » / « Au »).
  - « 7 derniers jours » = aujourd’hui + les 6 jours précédents ; « 30 derniers jours »
    = aujourd’hui + les 29 jours précédents. Les dates futures sont exclues.
  - La borne de fin personnalisée est incluse ; une date de fin antérieure au début est
    refusée avec un message inline, et l’export est désactivé.
  - Les lignes sans date exploitable sont exclues dès qu’une période est choisie.
  - La date filtrée est celle du rapport : enregistrement pour une personne, date et heure
    pour un rendez-vous, date de demande pour une contribution.
- **Statut** : tous, ou une valeur réellement présente dans les données. Libellés exacts :
  Proposé, Demandé, Validé, Refusé, À revoir, Validée, Corrigée, Rejetée, Suivie.
  Un statut devenu introuvable après un changement de filtre revient automatiquement à
  « Tous statuts ».
- **Effacer les filtres** est toujours disponible dans la barre de filtres et remet le focus
  sur le premier champ.
- Les indicateurs, l’aperçu et l’export suivent toujours le même jeu de lignes filtrées.

## Aperçu et indicateurs

- Le compteur distingue trois niveaux : lignes affichées, sélection filtrée, total du jeu.
  Exemple : `20 affichés sur 45. Sélection filtrée : 26 sur 45.`
- Trois indicateurs s’adaptent au rapport choisi : Femmes/Hommes pour les personnes,
  À venir/En attente de décision pour les rendez-vous, À revoir/Validées pour les
  contributions.
- Un aperçu affiche les lignes retenues, par lots de 20 avec **Afficher plus**, puis
  **Réduire l’aperçu**. La date du rapport apparaît dans chaque ligne.
- État vide : « Aucune donnée à synthétiser » si la base est vide ; « Aucune ligne pour ces
  critères » si seuls les filtres excluent tout ; « Dates de période invalides » si les
  bornes sont incorrectes.

## Export

**Exporter le rapport (Excel)** est accessible en permanence dans l’en-tête, avec un
raccourci secondaire sous les indicateurs. Il utilise la mise en forme commune de
`exportTableur.ts` : logo ACSF, en-tête, filtres, ligne de total, auteur, A4 paysage.
Les heures saisies localement dans l’Agenda sont figées en UTC lors de l’export, pour
éviter tout décalage selon le fuseau du poste. Les statuts sont normalisés en libellés
métier (`PROPOSÉ`, `VALIDÉE`, `À REVOIR`…).

Noms de fichiers réels :

- `ACSF_rapport-personnes_<date>.xlsx`
- `ACSF_rapport-rendez-vous_<date>.xlsx`
- `ACSF_rapport-contributions_<date>.xlsx`

L’export contient toute la sélection filtrée, même quand l’aperçu est limité à 20 lignes.

## Données et acteurs

- Lecture seule : l’écran ne modifie aucune donnée.
- Les contributions sont chargées en une seule requête avec le nom de la personne.
- Aucune dépendance ajoutée ; aucun export existant n’est remplacé.
- Comme pour le reste de l’application, le fichier est enregistré par le navigateur en
  mode `npm run dev`, et via la boîte **Enregistrer l’export ACSF** sous Electron.

## Vérifications

1. `npm.cmd run verify` puis `npm.cmd run build`.
2. Ouvrir `http://127.0.0.1:5191` — le port 5173 appartient à un autre projet.
3. Tester les trois rapports, les cinq périodes, le filtre de statut, les bornes
   personnalisées, l’aperçu par lots de 20, l’export `.xlsx` et les états vides.
4. Ne laisser aucune donnée de test dans la base locale.
