ACSF-AFRIQUE SARL
CAHIER DES CHARGES
PWA famille
Information	Détail
Version	
	
Responsable métier	Admin de l’agence [À compléter : nom]
Responsable technique	[À compléter : nom]
Document lié	Cahier des charges ACSF Desktop (logiciel de l’agence)
Diffusion	Usage interne, document confidentiel


1. Contexte et objectifs
1.1 Contexte
Dans ACSF Desktop, chaque rendez-vous a un statut qui dit d’où il vient et qui doit décider.
Statut	Origine	Décision attendue	Qui décide
Proposé	L’agence propose un rendez-vous	Accepter ou refuser	La famille, depuis la PWA
Demandé	La famille demande un rendez-vous	Valider ou refuser	L’agence, dans ACSF Desktop

1.2 Qui est concerné
•	La famille : utilisateur final, sur téléphone, par un lien web.
•	L’agence : l’admin et les agents, dans ACSF Desktop.
1.3 Objectifs
•	La famille valide ou refuse une proposition de rendez-vous.
•	La famille demande un rendez-vous.
•	L’agence valide ou refuse les demandes (déjà possible dans ACSF Desktop).
•	La famille renseigne ses informations personnelles.
•	Chaque décision est tracée, des deux côtés.

2. Utilisateurs et accès
Rôle	Ce qu’il fait avec la PWA
Famille	Voit ses rendez-vous, répond aux propositions, demande un rendez-vous, remplit ses informations. Ne voit que ce qui la concerne.
Agence	Propose les rendez-vous, valide ou refuse les demandes, contrôle ce que la famille saisit. Tout cela dans ACSF Desktop, pas dans la PWA.

3. Périmètre
3.1 Ce qui est inclus
•	Consultation des rendez-vous et des décisions en attente qui concernent la famille.
•	Acceptation ou refus d’un rendez-vous proposé.
•	Demande de rendez-vous : date et créneau de 30 minutes.
•	Saisie et mise à jour des informations personnelles (voir 4.3).
•	Fonctionnement sans réseau sur ce qui a déjà été chargé.

4. Fonctionnalités
4.1 Répondre à une proposition
La famille voit les rendez-vous proposés par l’agence. Elle peut accepter ou refuser. Elle reçoit un message clair : « Proposition validée. » ou « Proposition refusée. ». La décision apparaît dans ACSF Desktop, dans la liste des décisions en attente.
4.2 Demander un rendez-vous
La famille choisit une date et un créneau de 30 minutes, puis envoie. Elle reçoit « Demande envoyée. ». L’agence valide ou refuse dans ACSF Desktop, et la famille voit la réponse.
4.3 Informations personnelles
La famille peut remplir et mettre à jour : identité, coordonnées, consentements spécifiques (santé, spiritualité, situation de mineur). Ce qu’elle saisit est tracé et contrôlé par l’agence dans ACSF Desktop.
4.4 Prévenir la famille
Quand l’agence propose un rendez-vous ou répond à une demande, comment la famille le sait-elle ? Notification dans la PWA

5. Hors ligne et liaison avec le poste de l’agence
La PWA ne doit jamais dépendre du réseau pour s’ouvrir. Elle garde les dernières données lues. Une décision prise sans réseau est mise en attente, puis envoyée au retour de la connexion.
Le poste de l’agence travaille en local, la PWA est sur le téléphone de la famille. Pour qu’ils échangent, il faut un point commun. Trois pistes : un serveur central, une liaison locale, ou un échange direct entre appareils.
Cas à traiter : la famille accepte hors ligne une proposition que l’agence a retirée entre-temps. [À compléter : règle à fixer]

7. Sécurité et données personnelles
7.1 Connexion
•	Chaque famille a son propre compte, avec une session sécurisée.
•	Aucune donnée de santé ne circule en clair sur un canal non sécurisé.
•	Une famille ne voit jamais les données d’une autre.
[À compléter : méthode d’authentification]
7.2 Consentement
•	Le consentement éclairé est recueilli avant toute donnée sensible (santé, spiritualité, etc) ou concernant un mineur.
•	Pour un mineur, le consentement des parents est décidé par l’agence. La saisie de la famille ne suffit jamais à elle seule.
•	On ne demande que les données nécessaires au service.
•	Toute saisie est tracée côté agence.
7.3 Cadre légal
La loi n° 001-2021/AN et la CIL s’appliquent. Déclaration, durée de conservation, droit d’accès et de suppression doivent être vérifiés par un juriste avant tout usage avec de vraies familles. [À compléter : avis juridique, durée de conservation]

8. Exigences de qualité
•	Téléphones d’entrée de gamme et connexion lente : pages légères, peu de données mobiles consommées.
•	Français simple et courant.
•	Messages d’état et d’erreur clairs après chaque action.
•	Textes lisibles

9. Tests et critères de réception
N°	Vérification	Qui valide
1	La famille valide une proposition : la décision apparaît dans les décisions en attente d’ACSF Desktop	Admin
2	La famille refuse une proposition : statut définitif, aucune autre donnée figée côté agence	Admin
3	La famille formule une demande : l’agence la valide ou la refuse, la famille voit la réponse	Administratrice
4	Chaque décision est tracée avec le statut, la date et l’auteur	Équipe technique
5	La PWA s’ouvre et fonctionne sans réseau sur les données déjà chargées, puis envoie au retour de la connexion	Équipe technique
6	Une famille ne voit que ses propres rendez-vous et informations	Équipe technique
7	La saisie d’informations est tracée et contrôlable dans ACSF Desktop	Administratrice

10. Planning
Étape	Date visée	Remarque
Choix du canal de liaison PWA / poste	[À compléter : date]	Bloquant
Méthode d’authentification et procédure d’accès	[À compléter : date]	Avec le choix du canal
Avis juridique sur le consentement	[À compléter : date]	Avant la saisie des informations
Rendez-vous : réponse et demande	[À compléter : date]	Après le choix du canal
Saisie des informations personnelles	[À compléter : date]	Après l’avis juridique
Tests et mise en service pilote	[À compléter : date]	


Annexe. Références
•	REGLES-RDV.md
•	Cahier des charges ACSF Desktop
•	MAINTENANCE.md
