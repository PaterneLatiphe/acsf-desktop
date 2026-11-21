ACSF-AFRIQUE SARL
CAHIER DES CHARGES
ACSF Desktop, logiciel de suivi des personnes
Information	Détail
Version	0.2 (brouillon pour relecture)
Date	21 novembre 2026
Responsable métier	Administratrice de l’agence de Ouaga [À compléter : nom]
Responsable technique	[À compléter : nom]
Mise en service pilote	15 décembre 2026
Diffusion	Usage interne, document confidentiel


# 1. Contexte et objectifs
## 1.1 Pourquoi ce logiciel
ACSF-AFRIQUE accompagne des personnes et des familles : éducation, santé, situation sociale, vie spirituelle. Aujourd’hui, les informations sont dispersées. ACSF Desktop les réunit dans un dossier unique par personne, avec un carnet de suivi qui garde l’historique de chaque passage.
## 2.2 Objectifs
- Avoir un dossier unique par personne, sans perte d’information.
- Suivre chaque personne dans le temps grâce à des carnets datés (une ligne par passage).
- Protéger les données sensibles : santé, situation sociale, convictions spirituelles, mineurs.
- Continuer à travailler quand il n’y a pas de réseau
- Pouvoir sortir des documents propres, en Excel, prêts à imprimer sur A4.

# 3. Environnement technique
Élément	Choix actuel
Poste agence	Logiciel Windows, application Electron avec React et TypeScript (Vite pour la compilation)
Base de données	SQLite via sql.js, enregistrée dans le fichier acsf-db.bin, avec une copie de secours
Grille de saisie	AG Grid Community (licence libre)
Exports	ExcelJS pour les fichiers .xlsx
Interface	Police Inter, icônes Lucide, couleurs bleu nuit et jaune de l’agence
Version web pour les familles	Application web installable (PWA), consultation depuis un téléphone
	

Les outils de développement, l’hébergement du serveur et le pays où il se trouve ne sont pas décrits ici. [À compléter : hébergeur, pays, coût]
# 4. Périmètre
## 4.1 Ce qui est inclus
- Tableau de bord : compteurs, prochains rendez-vous, contributions à revoir, activité récente.
- Personnes : liste, recherche, création, dossier avec identité et volets de suivi.
- Carnets de suivi : Éducation, Santé, Social, Spiritualité, plus un historique des modifications.
- Agenda : rendez-vous à l’agence, sorties terrain, entretiens.
- Offres et prestations : catalogue géré par l’agence.
- Rapports et exports Excel.
- Version web pour les familles, en consultation.

# 5. Utilisateurs et rôles
Rôle	Qui	Ce qu’il fait
Administratrice	Responsable de l’agence de Ouaga	Décide, valide les rendez-vous et les conseils, voit toutes les personnes de l’agence, gère les habilitations
Agent terrain	Référents sur le terrain	Saisit et modifie les dossiers des personnes qui lui sont assignées, et seulement celles-là
Famille/Personnes	Parents ou proches	Consulte le dossier depuis le PWA, selon ce que l’agence autorise

Les droits précis de chaque rôle sur chaque volet (lire, modifier, supprimer, exporter) doivent être écrits dans un tableau.. [À compléter : tableau des droits à valider avec l’admin]
Circulation des informations
- L’admin et l’agent crée ou met à jour le dossier, puis ajoute des passages dans les volets et prépare les rendez-vous.
- L’admin valide les rendez-vous, les conseils et les offres.
- La famille consulte le dossier depuis son téléphone.

# 6. Fonctionnalités par module
## 6.1 Tableau de bord
Il montre les chiffres du moment : personnes suivies, parrainages en attente, rendez-vous de la semaine, contributions à revoir. Il affiche aussi les prochains rendez-vous et l’activité récente. Quand la base est vide, il propose de créer une première personne.
## 6.2 Personnes et dossier
La liste permet de chercher par nom, prénom, téléphone ou code. La fiche d’une personne contient le nom, le prénom, le sexe, la date de naissance, le téléphone, l’adresse ou le quartier, le programme, le statut et un code de filiation généré automatiquement. Le sexe reste vide tant qu’on ne le renseigne pas. Les dates s’affichent en jour/mois/année.
## 6.3 Carnets de suivi
Chaque volet fonctionne comme un carnet. Une ligne correspond à un passage : on ajoute une ligne à chaque visite ou entretien, on n’écrase pas l’ancienne. Chaque ligne porte la date, l’auteur et ses propres champs, plus une remarque et une prochaine échéance.
- Saisie directe dans la grille, comme dans Excel, avec sauvegarde à la validation de chaque cellule.
- Les plus récents s’affichent en haut.
- Aucun texte coupé : les cellules s’agrandissent.
- Chaque correction ou suppression est enregistrée dans le journal : qui, quand, ancienne et nouvelle valeur.
- Une prochaine échéance crée un rendez-vous lié dans l’agenda. Si l’échéance est effacée ou si le passage est supprimé, le rendez-vous lié est supprimé.
- L’onglet Synthèse résume chaque volet. L’onglet Historique est en lecture seule.

## 6.4 Agenda et rendez-vous
Types : agence, sortie terrain, entretien. Statuts : proposé, demandé, validé, refusé. Un rendez-vous garde son origine (le volet et le passage qui l’ont créé). Les décisions en attente sont visibles à part, avec les rendez-vous à venir et passés. Le détail des règles est dans REGLES-RDV.md.
## 6.5 Offres et prestations
Une offre est une prestation du catalogue, pas une proposition faite sur mesure à une personne. Elle a un libellé, une description, une catégorie (accompagnement, formation, animation, appui matériel, autre), un tarif en FCFA (nombre entier positif) et un statut actif ou inactif. Seule l’agence crée, modifie ou désactive une offre.
## 6.6 Rapports et exports
Les rapports servent à documenter le travail ; ils ne remplacent pas le tableau de bord et ne modifient aucune donnée. Types : personnes suivies, rendez-vous, contributions des familles. Chaque export Excel (.xlsx) porte l’en-tête de l’agence avec le logo, le titre, la date, l’auteur et les filtres utilisés. Les dates sont de vraies dates Excel, les téléphones sont au même format partout, et la mise en page tient sur une page A4 de large, avec les titres répétés sur chaque page.

# 7. Règles métier
- Un agent ne voit que les personnes qui lui sont assignées. L’administratrice voit toute l’agence.
- Les informations sensibles (santé, spiritualité, education, social) ne s’affichent qu’aux personnes autorisées. Le refus se fait côté serveur, pas seulement à l’écran.
- Les rendez-vous suivent les statuts du point 6.4 ; la validation finale revient à l’administratrice.
- Aucune valeur n’est inventée par défaut : un champ non renseigné reste vide.
- Toute modification de dossier est tracée.

# 8. Fonctionnement hors ligne et synchronisation
Le logiciel doit continuer à fonctionner sans réseau, et envoyer les modifications quand la connexion revient.
- Les données sont d’abord enregistrées sur le poste, dans acsf-db.bin.
- Chaque passage a un identifiant unique (UUID) pour éviter que deux postes créent le même numéro hors ligne.
- Si deux postes modifient la même ligne, la règle actuelle est que la dernière modification l’emporte, et le journal garde les deux versions.
- L’écran indique l’état : base locale, enregistrement en cours, enregistré, erreur.
Reste à écrire : ce qui se passe quand la synchronisation échoue plusieurs jours, comment on résout un conflit à la main, et comment on teste le retour du réseau. [À compléter : scénarios de test hors ligne]

# 9. Sécurité et données personnelles
Le logiciel traite des données de santé, de situation sociale et de croyances
## 9.1 Mesures prévues
- Compte personnel pour chaque utilisateur, mot de passe solide, verrouillage après inactivité.
- Droits par rôle et par volet.
- Chiffrement du fichier de base de données
- Exports tracés et limités selon le rôle, car c’est là que les fuites arrivent le plus souvent.
- Journal d’audit conservé, non modifiable depuis l’application.
- Sauvegardes chiffrées, gardées ailleurs que sur le poste principal.
## 9.2 Cadre légal
La protection des données personnelles au Burkina Faso relève de la CIL et de la loi n° 001-2021/AN. Les obligations exactes (déclaration, consentement, durée de conservation, droit d’accès et de suppression) doivent être vérifiées par un juriste avant la mise en service. [À compléter : avis juridique]
## 9.3 Consentement
Le consentement des personnes, et des parents pour les mineurs, doit être recueilli avant la saisie. [À compléter : modèle de formulaire de consentement, durée de conservation]

# 10. Exigences de qualité
- Accessibilité : messages d’état clairs, erreurs lisibles sous chaque champ, contrastes suffisants, usage au clavier.
- Lisibilité : aucune information coupée à l’écran ni dans les exports.
- Performance : ouverture d’un dossier et affichage d’une grille de plusieurs centaines de lignes sans attente gênante. Seuils à fixer.
- Maintenance : fichiers courts, une seule source pour les colonnes de chaque volet, migrations de base numérotées et rejouables sans risque.

# 11. Tests et critères de réception
Le logiciel est accepté quand les points suivants sont vérifiés et notés dans un compte rendu signé.
N°	Vérification	Qui valide
1	L’application se compile et passe les contrôles automatiques (npm run verify et npm run build)	Équipe technique
2	Création d’une personne, ajout, modification et suppression d’un passage dans les quatre volets	Agent et admin
3	Un agent ne voit pas les personnes d’un autre agent	Admin
4	Travail complet sans réseau, puis synchronisation au retour de la connexion	Équipe technique
5	Chaque export Excel est ouvert dans Excel et contrôlé : en-tête, dates, rien de coupé, une page A4 de large	Admin
6	Reprise depuis une sauvegarde : la base est restaurée sans perte	Équipe technique

# 12. Planning
Étape	Date visée	Remarque
Carnets de suivi complets (4 volets)	[À compléter : date]	Colonnes à valider avec le terrain
Droits par rôle et par agent	[À compléter : date]	Avant toute donnée réelle
Chiffrement et sauvegardes	[À compléter : date]	Avant toute donnée réelle
Tests hors ligne	[À compléter : date]	
Formation des agents	[À compléter : date]	
Mise en service pilote	15 décembre 2026	Date donnée par la direction

# 13. Risques
Risque	Réponse prévue
Fuite de données de santé ou de mineurs	Droits par rôle, chiffrement, exports tracés, aucune donnée envoyée à l’IA externe
Perte de la base sur un poste	Sauvegardes régulières, chiffrées, gardées sur un autre support
Conflits de synchronisation	Identifiants uniques, journal des deux versions, procédure de résolution à écrire
Services externes qui deviennent payants ou indisponibles	Bascule locale, pas de dépendance obligatoire
Équipe qui arrive sans connaître le projet	Ce document, le README, le journal des décisions, passation par l’auteur du projet
Logo ou ressources manquantes à la livraison	Les demander à l’agence dès maintenant

# Annexe. Documents associés
- docs/decisions-acsf.md : journal des décisions.
- docs/avancement-acsf.md : où en est le projet.
- docs/propositions-acsf.md : idées validées, repoussées ou refusées.
- REGLES-RDV.md, OFFRES.md, RAPPORTS.md : règles détaillées par module.
- design/references/ : ressources graphiques.
