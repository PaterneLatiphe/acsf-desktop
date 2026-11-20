// Module de gestion des passages avec audit et échéances
// Ce module exporte des fonctions utilisables par l'application avec la connexion base de données

// Types exportés pour usage dans le composable
export type Passage = {
  id: string;
  personne_id: number;
  voletType: string;
  datePassage: string;
  auteur: string;
  donnees: Record<string, any>;
  remarques: string | null;
  prochaineEcheance: string | null;
};

export type AuditEntry = {
  id: string;
  passageId: string;
  champ: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  utilisateur: string;
  dateModification: string;
};

export type PassagesAudit = AuditEntry[];

// Functions that receive the db connection as parameter
// This allows flexible integration avec l'application

// Initialiser les tables nécessaires
export function initialiserBase(db: any): void {
  // Création de la table passages
  db.prepare(`
    CREATE TABLE IF NOT EXISTS passages (
      id TEXT PRIMARY KEY,
      personne_id INTEGER,
      voletType TEXT,
      datePassage TEXT,
      auteur TEXT,
      donnees TEXT,
      remarques TEXT,
      prochaine_echeance TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  // Création de la table audit_log
  db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      passageId TEXT,
      champ TEXT,
      ancienneValeur TEXT,
      nouvelleValeur TEXT,
      utilisateur TEXT,
      dateModification TEXT
    )
  `).run();
}

// Récupérer tous les passages d'une personne
export function listerPassages(db: any, personneId: number, voletType?: string): Passage[] {
  if (voletType) {
    return db
      .prepare(`SELECT * FROM passages WHERE personne_id = ? AND voletType = ?`)
      .all(personneId, voletType) as Passage[];
  }
  return db
    .prepare(`SELECT * FROM passages WHERE personne_id = ?`)
    .all(personneId) as Passage[];
}

// Ajouter un nouveau passage
export function creerPassage(db: any, personneId: number, voletType: string, utilisateur: string): string {
  const id = crypto.randomUUID();
  const maintenant = new Date().toISOString();

  db.prepare(
    `INSERT INTO passages (id, personne_id, voletType, datePassage, auteur, donnees, remarques, prochaine_echeance, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, personneId, voletType, maintenant, utilisateur, '{}', null, null, maintenant, maintenant);

  return id;
}

// Modifier un passage existant
export function modifierPassage(db: any, passageId: string, champ: string, nouvelleValeur: string, utilisateur: string): void {
  const maintenant = new Date().toISOString();

  db.prepare(
    `UPDATE passages SET donnees = JSON_SET(donnees, '$.${champ}', ?, updated_at = ?) WHERE id = ?`
  ).run(nouvelleValeur, maintenant, passageId);

  // Enregistrer dans l'audit
  const auditId = crypto.randomUUID();
  db.prepare(
    `INSERT INTO audit_log (id, passageId, champ, ancienneValeur, nouvelleValeur, utilisateur, dateModification) 
     VALUES (?, ?, ?, '', ?, ?, ?)`
  ).run(auditId, passageId, champ, utilisateur, maintenant);
}

// Supprimer un passage
export function supprimerPassage(db: any, passageId: string): void {
  db.prepare(`DELETE FROM passages WHERE id = ?`).run(passageId);
}

// Obtenir un passage par ID
export function obtenirPassage(db: any, passageId: string): Passage | null {
  const result = db
    .prepare(`SELECT * FROM passages WHERE id = ?`)
    .get(passageId) as Passage | null;
  return result;
}

// Historique d'audit d'un passage
export function getPassageAudit(db: any, passageId: string): AuditEntry[] {
  return db
    .prepare(`SELECT * FROM audit_log WHERE passageId = ? ORDER BY dateModification DESC`)
    .all(passageId) as AuditEntry[];
}

// Obtenir les échéances à venir pour une personne
export function obtenirEcheancesProchaines(db: any, personneId: number): Array<{ date: string; type: string; contenu: string }> {
  const result = db
    .prepare(`SELECT datePassage, proximate_echeance, voletType FROM passages WHERE personne_id = ? AND proximate_echeance IS NOT NULL AND proximate_echeance != ''`)
    .all(personneId) as Array<{ datePassage: string; proximate_echeance: string; voletType: string }>;

  return result.map(r => ({
    date: r.datePassage.split('T')[0],
    type: r.voletType,
    contenu: `Prochaine échéance pour le volet ${r.voletType}`
  }));
}

