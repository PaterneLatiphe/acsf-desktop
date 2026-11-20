# Offres — catalogue des prestations

L’onglet **Offres** est le catalogue des prestations proposées par l’agence
(ACSF-AFRIQUE SARL). C’est un ajout à l’application existante : aucune grille, aucun
dialogue, aucun onglet, aucun champ, aucun export ni la coquille Electron n’est remplacé.

## Périmètre

- Une **offre** est une prestation du catalogue : accompagnement scolaire, formation,
  animation, appui matériel, etc.
- Ce n’est **pas** une proposition personnalisée liée à une famille : les offres décrivent
  ce que l’agence sait faire, indépendamment de toute personne.
- La **configuration** d’une offre = les champs du catalogue ci-dessous. Aucun volet de
  suivi, aucune règle de validation ni modèle réutilisable n’est introduit à ce stade.

## Acteurs

- **L’agence seulement** crée, modifie, active et désactive les offres, depuis ACSF Desktop.
- Le client ne crée ni ne valide d’offre. Le catalogue est un outil interne de l’agence.

## Champs du catalogue

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| Libellé | Texte | oui | Nom de la prestation |
| Catégorie | Liste | oui | Voir catégories ci-dessous |
| Tarif | Nombre entier positif | oui | Montant en FCFA |
| Durée | Texte | non | ex. « 3 mois » |
| Statut | Liste | oui | Active ou inactive |
| Description | Texte libre | non | Ce que comprend la prestation |

En base, ces champs sont stockés dans la table `offres` (`libelle`, `description`,
`categorie`, `tarif`, `duree`, `active`, `created_at`, `updated_at`). L’ajout de la table
est idempotent : les données existantes ne sont pas touchées.

## Catégories

- Accompagnement
- Formation
- Animation
- Appui matériel
- Autre

## Statuts

- **ACTIVE** : l’offre est proposable.
- **INACTIVE** : l’offre est conservée dans le catalogue mais retirée de l’usage courant.

Les actions **Activer** et **Désactiver** basculent le statut en un clic, sans passer par le
formulaire. Le statut est aussi modifiable depuis le formulaire.

## Comportement de la liste

- La liste affiche le libellé, une description courte, la catégorie, le tarif formaté
  (`FCFA`) et le statut.
- Une **recherche** texte porte sur le libellé, la description, la catégorie et la durée.
- Un **filtre de statut** permet de voir toutes les offres, les actives ou les inactives.
- Quand il y a beaucoup d’offres, la liste en affiche **20** et un bouton
  **Afficher plus** révèle les suivantes par lots de 20. Changer la recherche ou le filtre
  ramène l’affichage au premier lot.
- Le compteur indique le nombre d’offres réellement affichées sur le total du catalogue.
- Les états vides proposent soit de créer la première offre, soit d’effacer les filtres.
- Les erreurs de saisie sont récapitulées en haut du formulaire et signalées sous chaque
  champ ; les messages sont aussi annoncés par une région `aria-live`.

## Vérifications

Avant publication : `npm run verify` puis `npm run build`. Le comportement est également
testé en navigateur sur le port 5191 (création, modification, activation, désactivation,
recherche, filtre, affichage progressif, états vides, absence d’erreurs console et de
débordement horizontal).
