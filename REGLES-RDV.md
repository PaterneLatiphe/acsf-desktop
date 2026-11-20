# Règles de validation des rendez-vous

Les rendez-vous sont enregistrés dans ACSF Desktop avec un **statut** qui indique qui
doit décider. Aucun champ « sur place » n'est ajouté : la présence du client à l'agence
est une décision prise par l'administrateur au moment de valider.

## Origine et décision

| Statut stocké | Origine du rendez-vous | Décision attendue | Qui décide |
| --- | --- | --- | --- |
| `propose` | L'agence propose un rendez-vous | Accepter ou refuser la proposition | **Le client**, depuis son APK |
| `demande` | Le client demande un rendez-vous | Valider ou refuser la demande | **L'agence**, dans ACSF Desktop |
| `valide` | Décision positive enregistrée | Aucune | — |
| `refuse` | Décision négative enregistrée | Aucune | — |

## Cas particuliers

- Le client dispose d'un **APK séparé** : c'est là qu'il valide ou refuse une proposition
  de l'agence, et qu'il formule une demande de rendez-vous. ACSF Desktop documente les
  décisions qui lui sont remontées.
- Si le client est **présent à l'agence**, l'administrateur peut valider directement une
  proposition depuis ACSF Desktop, sans champ dédié ni commentaire obligatoire.
- L'agence peut toujours **annuler sa propre proposition** (`propose` → `refuse`) ou
  **refuser une demande client** (`demande` → `refuse`) : aucun rendez-vous en attente
  n'est figé.
- Les statuts `valide` et `refuse` sont terminaux : plus aucun bouton de décision
  n'est affiché.

## Dans l'Agenda

- La liste est séparée en **À venir** et **Passés** ; un rendez-vous passé est marqué
  « · Passé ». Aucun tri SQL ni modification du modèle n'est nécessaire.
- Chaque ligne en attente indique explicitement **En attente du client** ou
  **En attente de l'agence**.
- Le bloc **Décisions en attente** présente deux files distinctes, chacune avec son
  compteur : propositions en attente du client et demandes en attente de l'agence.
- Le formulaire « Nouveau rendez-vous » contient un champ **Origine** :
  - « Proposition de l'agence — le client validera » enregistre le statut `propose` ;
  - « Demande du client — l'agence validera » enregistre le statut `demande`.
- Les actions affichent un retour explicite : « Rendez-vous validé. »,
  « Proposition annulée. » ou « Demande refusée. ».

## Modèle de données

Aucune migration n'est nécessaire : le champ `statut` de la table `rendezvous` suffit à
distinguer l'origine et la décision. Aucune colonne `sur_place` n'est ajoutée.
