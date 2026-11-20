import initSqlJs, { Database } from 'sql.js';
import { lireBase, ecrireBase, lireWasm, sauvegarderBase } from './storage';

export type Personne = {
  id: number;
  prenom: string;
  nom: string;
  sexe: string;
  dateNaissance: string;
  telephone: string;
  adresse: string;
  langue: string;
  programme: string;
  code: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
};

const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I/L

export function genererCode(): string {
  const chars: string[] = [];
  for (let i = 0; i < 8; i++) {
    chars.push(ALPHA[Math.floor(Math.random() * ALPHA.length)]);
  }
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

let db: Database | null = null;
let enCoursDOuverture: Promise<Database> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS personnes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  sexe TEXT,
  date_naissance TEXT,
  telephone TEXT,
  adresse TEXT,
  langue TEXT DEFAULT 'fr',
  programme TEXT,
  code TEXT UNIQUE,
  statut TEXT DEFAULT 'suivie',
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_personnes_nom ON personnes(nom, prenom);
CREATE TABLE IF NOT EXISTS rendezvous(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  type TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'propose',
  date_heure TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_rendezvous_personne ON rendezvous(personne_id);

CREATE TABLE IF NOT EXISTS passages(
  id TEXT PRIMARY KEY,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  volet_type TEXT NOT NULL,
  date_passage TEXT NOT NULL,
  auteur TEXT NOT NULL,
  donnees_json TEXT,
  remarques TEXT,
  prochaine_echeance TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_passages_personne_volet ON passages(personne_id, volet_type, date_passage);

CREATE TABLE IF NOT EXISTS volets(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  type TEXT NOT NULL,
  consentement_spiritualite_at TEXT,
  donnees_json TEXT,
  version INTEGER DEFAULT 1,
  updated_at TEXT,
  updated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_volets_personne ON volets(personne_id, type);

CREATE TABLE IF NOT EXISTS consents(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  type TEXT NOT NULL,
  granted_at TEXT,
  revoked_at TEXT,
  canal TEXT
);

CREATE TABLE IF NOT EXISTS contributions_famille(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  volet_type TEXT NOT NULL,
  champ TEXT NOT NULL,
  valeur_declaree TEXT,
  consentement_id INTEGER REFERENCES consents(id),
  statut TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT,
  decided_by TEXT,
  decided_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  user_id TEXT,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(table_name, record_id);

CREATE TABLE IF NOT EXISTS echanges(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  auteur_user_id TEXT,
  type TEXT,
  contenu TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_echanges_personne ON echanges(personne_id);

CREATE TABLE IF NOT EXISTS schema_version(
  version INTEGER PRIMARY KEY,
  applied_at TEXT
);
`;

function ensureColumn(table: string, column: string, definition: string): void {
  if (!db) return;
  try {
    const resultat = db.exec(`PRAGMA table_info(${table})`);
    if (!resultat.length) return;
    const colonnes = resultat[0].values.map((ligne) => String(ligne[1]));
    if (colonnes.includes(column)) return;
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch {
    /* migration idempotente : on ignore les erreurs déjà traitées */
  }
}

export async function ouvrirBase(): Promise<Database> {
  if (db) return db;
  if (enCoursDOuverture) return enCoursDOuverture;
  enCoursDOuverture = (async () => {
    const octetsWasm = await lireWasm();
    const SQL = await initSqlJs({
      locateFile: (f: string) => `/${f}`,
      useOldExtensionFunctions: false,
      wasmBinary: octetsWasm ? (octetsWasm.buffer as ArrayBuffer) : undefined,
    });
    const brut = await lireBase();
    // sauvegarde avant migration (Electron uniquement)
    await sauvegarderBase();
    db = brut ? new SQL.Database(brut) : new SQL.Database();
    db.run(SCHEMA);
    const maintenant = new Date().toISOString();
    // migrations idempotentes — ajouter ici les nouvelles colonnes pour les tables existantes
    ensureColumn('personnes', 'agence_id', 'TEXT');
    ensureColumn('personnes', 'admin_id', 'TEXT');
    ensureColumn('rendezvous', 'source_volet', 'TEXT');
    ensureColumn('rendezvous', 'source_passage_id', 'TEXT');
    // migration vers le carnet de suivi (passages) — version 3
    const versionResult = db.exec('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
    const versionActuelle = versionResult.length && versionResult[0].values.length ? Number(versionResult[0].values[0][0]) : 0;
    if (versionActuelle < 4) {
      try {
        const voletsCount = db.exec('SELECT COUNT(*) FROM volets WHERE donnees_json IS NOT NULL AND donnees_json <> \'{}\' AND donnees_json <> \'null\'');
        console.log('DEBUG migration: volets with data =', voletsCount.length ? voletsCount[0].values[0][0] : 0);
        db.run(`
          INSERT INTO passages (id, personne_id, volet_type, date_passage, auteur, donnees_json, remarques, prochaine_echeance, created_at, updated_at)
          SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
                 personne_id, type, COALESCE(substr(updated_at, 1, 10), substr(datetime('now'), 1, 10)), COALESCE(updated_by, 'migration'), donnees_json, NULL, NULL, updated_at, updated_at
          FROM volets
          WHERE donnees_json IS NOT NULL AND donnees_json <> '{}' AND donnees_json <> 'null'
            AND NOT EXISTS (
              SELECT 1 FROM passages p
              WHERE p.personne_id = volets.personne_id
                AND p.volet_type = volets.type
                AND p.created_at = volets.updated_at
            )
        `);
        const passagesCount = db.exec('SELECT COUNT(*) FROM passages');
        console.log('DEBUG migration: passages after =', passagesCount.length ? passagesCount[0].values[0][0] : 0);
      } catch (e) { console.log('DEBUG migration error:', e); /* ignore si déjà migré */ }
      db.run('INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, ?)', [4, maintenant]);
    }
    // fix date_passage to date-only (idempotent)
    db.run("UPDATE passages SET date_passage = substr(date_passage, 1, 10) WHERE length(date_passage) > 10");
    await persister();
    return db;
  })();
  return enCoursDOuverture;
}

export async function persister(): Promise<void> {
  if (!db) return;
  await ecrireBase(db.export());
}

export type Rdv = {
  id: number;
  personneId: number;
  type: string;
  statut: string;
  dateHeure: string;
  notes: string;
};

export async function listerRdvs(): Promise<Rdv[]> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM rendezvous ORDER BY date_heure');
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const obj: Record<string, unknown> = {};
    colonnes.forEach((c, i) => {
      const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
      obj[camel] = ligne[i];
    });
    const r = obj as unknown as Rdv;
    return { ...r, personneId: Number(r.personneId) };
  });
}

export type NouveauRdv = {
  personneId: number;
  type: string;
  statut: string;
  dateHeure: string;
  notes: string;
};

export async function creerRdv(donnees: NouveauRdv): Promise<Rdv> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  base.run(
    `INSERT INTO rendezvous (personne_id, type, statut, date_heure, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [donnees.personneId, donnees.type, donnees.statut, donnees.dateHeure, donnees.notes, maintenant, maintenant],
  );
  await persister();
  const toutes = await listerRdvs();
  return toutes[toutes.length - 1];
}

export async function changerStatutRdv(id: number, statut: string): Promise<void> {
  const base = await ouvrirBase();
  base.run('UPDATE rendezvous SET statut = ?, updated_at = ? WHERE id = ?', [statut, new Date().toISOString(), id]);
  await persister();
}

export async function listerPersonnes(): Promise<Personne[]> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM personnes ORDER BY nom, prenom');
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const obj: Record<string, unknown> = {};
    colonnes.forEach((c, i) => {
      const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
      obj[camel] = ligne[i];
    });
    return obj as unknown as Personne;
  });
}

export async function rechercherPersonnes(requete: string): Promise<Personne[]> {
  const toutes = await listerPersonnes();
  const q = requete.trim().toLowerCase();
  if (!q) return toutes;
  return toutes.filter((p) =>
    `${p.prenom} ${p.nom} ${p.telephone} ${p.code}`.toLowerCase().includes(q),
  );
}

export type NouvellePersonne = {
  prenom: string;
  nom: string;
  sexe: string;
  dateNaissance: string;
  telephone: string;
  adresse: string;
  langue: string;
  programme: string;
};

export async function creerPersonne(donnees: NouvellePersonne): Promise<Personne> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  base.run(
    `INSERT INTO personnes (prenom, nom, sexe, date_naissance, telephone, adresse, langue, programme, code, statut, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'suivie', ?, ?)`,
    [
      donnees.prenom,
      donnees.nom,
      donnees.sexe,
      donnees.dateNaissance,
      donnees.telephone,
      donnees.adresse,
      donnees.langue,
      donnees.programme,
      genererCode(),
      maintenant,
      maintenant,
    ],
  );
  await persister();
  const toutes = await listerPersonnes();
  return toutes[toutes.length - 1];
}

// ---------- Volets (5 volets : éducation, santé, social, spiritualité, historique) ----------
export type Volet = {
  id: number;
  personneId: number;
  type: 'education' | 'sante' | 'social' | 'spiritualite' | 'historique';
  consentementSpiritualiteAt: string | null;
  donneesJson: string;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
};

export async function listerVolets(personneId: number): Promise<Volet[]> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM volets WHERE personne_id = ? ORDER BY type', [personneId]);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const obj: Record<string, unknown> = {};
    colonnes.forEach((c, i) => {
      const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
      obj[camel] = ligne[i];
    });
    const v = obj as unknown as Volet;
    return { ...v, personneId: Number(v.personneId), version: Number(v.version) };
  });
}

export async function chargerVolet(personneId: number, type: string): Promise<Volet | null> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM volets WHERE personne_id = ? AND type = ?', [personneId, type]);
  if (!resultat.length || !resultat[0].values.length) return null;
  const colonnes = resultat[0].columns;
  const ligne = resultat[0].values[0];
  const obj: Record<string, unknown> = {};
  colonnes.forEach((c, i) => {
    const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
    obj[camel] = ligne[i];
  });
  const v = obj as unknown as Volet;
  return { ...v, personneId: Number(v.personneId), version: Number(v.version) };
}

export async function enregistrerVolet(personneId: number, type: string, donnees: Record<string, unknown>, utilisateur: string): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  const existant = await chargerVolet(personneId, type);
  const avant = existant ? existant.donneesJson : null;
  const apres = JSON.stringify(donnees);
  let recordId = 0;
  if (existant) {
    base.run('UPDATE volets SET donnees_json = ?, version = ?, updated_at = ?, updated_by = ? WHERE id = ?',
      [apres, existant.version + 1, maintenant, utilisateur, existant.id]);
    recordId = existant.id;
  } else {
    base.run('INSERT INTO volets (personne_id, type, donnees_json, version, updated_at, updated_by) VALUES (?, ?, ?, 1, ?, ?)',
      [personneId, type, apres, maintenant, utilisateur]);
    const dernier = base.exec('SELECT last_insert_rowid() AS id');
    recordId = dernier.length ? Number(dernier[0].values[0][0]) : 0;
  }
  base.run('INSERT INTO audit_log (table_name, record_id, action, before_json, after_json, user_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['volets', recordId, existant ? 'update' : 'create', avant, apres, utilisateur, maintenant]);
  await persister();
}

// ---------- Consentements ----------
export type Consent = {
  id: number;
  personneId: number;
  type: string;
  grantedAt: string | null;
  revokedAt: string | null;
  canal: string | null;
};

export async function chargerConsentement(personneId: number, type: string): Promise<Consent | null> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM consents WHERE personne_id = ? AND type = ? AND revoked_at IS NULL ORDER BY granted_at DESC LIMIT 1', [personneId, type]);
  if (!resultat.length || !resultat[0].values.length) return null;
  const colonnes = resultat[0].columns;
  const ligne = resultat[0].values[0];
  const obj: Record<string, unknown> = {};
  colonnes.forEach((c, i) => {
    const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
    obj[camel] = ligne[i];
  });
  const c = obj as unknown as Consent;
  return { ...c, personneId: Number(c.personneId) };
}

export async function accorderConsentement(personneId: number, type: string, canal: string, utilisateur: string): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  base.run('INSERT INTO consents (personne_id, type, granted_at, canal) VALUES (?, ?, ?, ?)', [personneId, type, maintenant, canal]);
  base.run('INSERT INTO audit_log (table_name, record_id, action, before_json, after_json, user_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['consents', 0, 'create', null, JSON.stringify({ type, canal }), utilisateur, maintenant]);
  await persister();
}

// ---------- Contributions famille (sidecar) ----------
export type Contribution = {
  id: number;
  personneId: number;
  voletType: string;
  champ: string;
  valeurDeclaree: string;
  consentementId: number | null;
  statut: 'pending' | 'validee' | 'corrigee' | 'rejetee';
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
};

export async function listerContributions(personneId: number, voletType?: string): Promise<Contribution[]> {
  const base = await ouvrirBase();
  const sql = voletType
    ? 'SELECT * FROM contributions_famille WHERE personne_id = ? AND volet_type = ? ORDER BY created_at'
    : 'SELECT * FROM contributions_famille WHERE personne_id = ? ORDER BY created_at';
  const params = voletType ? [personneId, voletType] : [personneId];
  const resultat = base.exec(sql, params);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const obj: Record<string, unknown> = {};
    colonnes.forEach((c, i) => {
      const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
      obj[camel] = ligne[i];
    });
    const c = obj as unknown as Contribution;
    return { ...c, personneId: Number(c.personneId), consentementId: c.consentementId ? Number(c.consentementId) : null };
  });
}

export async function enregistrerContribution(personneId: number, voletType: string, champ: string, valeurDeclaree: string, consentementId: number | null): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  base.run('INSERT INTO contributions_famille (personne_id, volet_type, champ, valeur_declaree, consentement_id, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [personneId, voletType, champ, valeurDeclaree, consentementId, 'pending', maintenant]);
  await persister();
}

export async function deciderContribution(id: number, statut: 'validee' | 'corrigee' | 'rejetee', decidedBy: string): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  base.run('UPDATE contributions_famille SET statut = ?, decided_by = ?, decided_at = ? WHERE id = ?', [statut, decidedBy, maintenant, id]);
  await persister();
}

// ---------- Échanges (historique immuable) ----------
export type Echange = {
  id: number;
  personneId: number;
  auteurUserId: string | null;
  type: string | null;
  contenu: string | null;
  createdAt: string;
};

export async function listerEchanges(personneId: number): Promise<Echange[]> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM echanges WHERE personne_id = ? ORDER BY created_at DESC', [personneId]);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const obj: Record<string, unknown> = {};
    colonnes.forEach((c, i) => {
      const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
      obj[camel] = ligne[i];
    });
    const e = obj as unknown as Echange;
    return { ...e, personneId: Number(e.personneId) };
  });
}

export async function ajouterEchange(personneId: number, auteurUserId: string, type: string, contenu: string): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  base.run('INSERT INTO echanges (personne_id, auteur_user_id, type, contenu, created_at) VALUES (?, ?, ?, ?, ?)',
    [personneId, auteurUserId, type, contenu, maintenant]);
  await persister();
}

// ---------- Carnet de suivi : passages (une ligne = un passage) ----------
export type Passage = {
  id: string;
  personneId: number;
  voletType: string;
  datePassage: string;
  auteur: string;
  donnees: Record<string, string>;
  donneesJson?: string;
  remarques: string;
  prochaineEcheance: string | null;
  createdAt: string;
  updatedAt: string;
};

export const VOLETS_COLONNES: Record<string, { cle: string; libelle: string; type: 'text' | 'select' | 'date' | 'textarea'; options?: string[]; editable?: boolean }[]> = {
  education: [
    { cle: 'date', libelle: 'Date', type: 'date' },
    { cle: 'niveauScolaire', libelle: 'Niveau scolaire', type: 'select', options: ['', 'Aucun', 'Primaire', 'Collège', 'Lycée', 'Université'] },
    { cle: 'classe', libelle: 'Classe / année', type: 'text' },
    { cle: 'etablissement', libelle: 'Établissement', type: 'text' },
    { cle: 'difficultes', libelle: 'Difficultés repérées', type: 'textarea' },
    { cle: 'soutien', libelle: 'Soutien prévu', type: 'textarea' },
    { cle: 'evolution', libelle: 'Évolution', type: 'select', options: ['', 'Amélioration', 'Stable', 'Dégradation'] },
    { cle: 'prochaineEcheance', libelle: 'Prochaine échéance', type: 'date' },
    { cle: 'remarques', libelle: 'Remarques', type: 'textarea' },
    { cle: 'auteur', libelle: 'Saisi par', type: 'text', editable: false },
  ],
  sante: [
    { cle: 'date', libelle: 'Date', type: 'date' },
    { cle: 'type', libelle: 'Type', type: 'select', options: ['', 'Allergie', 'Traitement', 'Handicap', 'Maladie chronique', 'Consultation', 'Autre'] },
    { cle: 'description', libelle: 'Description', type: 'textarea' },
    { cle: 'traitement', libelle: 'Traitement en cours', type: 'textarea' },
    { cle: 'suiviMedical', libelle: 'Suivi médical', type: 'text' },
    { cle: 'partageFamille', libelle: 'Partage avec la famille', type: 'select', options: ['', 'Oui', 'Non'] },
    { cle: 'prochaineEcheance', libelle: 'Prochaine échéance', type: 'date' },
    { cle: 'remarques', libelle: 'Remarques', type: 'textarea' },
    { cle: 'auteur', libelle: 'Saisi par', type: 'text', editable: false },
  ],
  social: [
    { cle: 'date', libelle: 'Date', type: 'date' },
    { cle: 'situationFamiliale', libelle: 'Situation familiale', type: 'textarea' },
    { cle: 'logement', libelle: 'Logement', type: 'text' },
    { cle: 'ressources', libelle: 'Ressources', type: 'textarea' },
    { cle: 'soutienDisponible', libelle: 'Soutien disponible', type: 'textarea' },
    { cle: 'obstacles', libelle: 'Obstacles repérés', type: 'textarea' },
    { cle: 'evolution', libelle: 'Évolution', type: 'select', options: ['', 'Amélioration', 'Stable', 'Dégradation'] },
    { cle: 'prochaineEcheance', libelle: 'Prochaine échéance', type: 'date' },
    { cle: 'remarques', libelle: 'Remarques', type: 'textarea' },
    { cle: 'auteur', libelle: 'Saisi par', type: 'text', editable: false },
  ],
  spiritualite: [
    { cle: 'date', libelle: 'Date', type: 'date' },
    { cle: 'appartenance', libelle: 'Appartenance / croyances', type: 'textarea' },
    { cle: 'pratiques', libelle: 'Pratiques', type: 'textarea' },
    { cle: 'ressources', libelle: 'Ressources spirituelles', type: 'textarea' },
    { cle: 'consentement', libelle: 'Consentement à en parler', type: 'select', options: ['', 'Oui', 'Non'] },
    { cle: 'remarques', libelle: 'Remarques', type: 'textarea' },
    { cle: 'auteur', libelle: 'Saisi par', type: 'text', editable: false },
  ],
};

export async function listerPassages(personneId: number, voletType: string): Promise<Passage[]> {
  const base = await ouvrirBase();
  const resultat = base.exec('SELECT * FROM passages WHERE personne_id = ? AND volet_type = ? ORDER BY date_passage DESC, created_at DESC', [personneId, voletType]);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const obj: Record<string, unknown> = {};
    colonnes.forEach((c, i) => {
      const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
      obj[camel] = ligne[i];
    });
    const p = obj as unknown as Passage;
    let donnees: Record<string, string> = {};
    try { if (p.donneesJson) donnees = JSON.parse(p.donneesJson) as Record<string, string>; } catch { /* ignore */ }
    return { ...p, personneId: Number(p.personneId), donnees, prochaineEcheance: p.prochaineEcheance ?? null };
  });
}

export async function creerPassage(personneId: number, voletType: string, auteur: string): Promise<Passage> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  const id = crypto.randomUUID();
  const aujourdhui = maintenant.slice(0, 10);
  base.run('INSERT INTO passages (id, personne_id, volet_type, date_passage, auteur, donnees_json, remarques, prochaine_echeance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, personneId, voletType, aujourdhui, auteur, '{}', '', null, maintenant, maintenant]);
  await persister();
  const toutes = await listerPassages(personneId, voletType);
  return toutes.find((p) => p.id === id) ?? toutes[0];
}

export async function modifierPassage(id: string, champ: string, valeur: string, utilisateur: string): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  // lire l'ancienne valeur pour l'audit
  const res = base.exec('SELECT personne_id, donnees_json, remarques, prochaine_echeance, date_passage, auteur FROM passages WHERE id = ?', [id]);
  let ancien: Record<string, unknown> = {};
  let passage: { personneId: number; donneesJson: string; remarques: string; prochaineEcheance: string | null; datePassage: string; auteur: string } | null = null;
  if (res.length && res[0].values.length) {
    const cols = res[0].columns;
    const vals = res[0].values[0];
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { const camel = c.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase()); obj[camel] = vals[i]; });
    passage = obj as unknown as { personneId: number; donneesJson: string; remarques: string; prochaineEcheance: string | null; datePassage: string; auteur: string };
    try { if (passage.donneesJson) ancien = JSON.parse(passage.donneesJson) as Record<string, unknown>; } catch { /* ignore */ }
    if (champ === 'remarques') ancien.remarques = passage.remarques;
    if (champ === 'date_passage') ancien.date = passage.datePassage;
    if (champ === 'prochaine_echeance') ancien.prochaineEcheance = passage.prochaineEcheance;
  }
  const nouveau = { ...ancien };
  if (champ === 'remarques') {
    base.run('UPDATE passages SET remarques = ?, updated_at = ? WHERE id = ?', [valeur, maintenant, id]);
    nouveau.remarques = valeur;
  } else if (champ === 'date_passage') {
    base.run('UPDATE passages SET date_passage = ?, updated_at = ? WHERE id = ?', [valeur, maintenant, id]);
    nouveau.date = valeur;
  } else if (champ === 'prochaine_echeance') {
    base.run('UPDATE passages SET prochaine_echeance = ?, updated_at = ? WHERE id = ?', [valeur || null, maintenant, id]);
    nouveau.prochaineEcheance = valeur || null;
    // synchroniser l'Agenda
    synchroniserEcheance(id, passage?.personneId ?? 0, valeur);
  } else {
    ancien[champ] = ancien[champ] ?? null;
    nouveau[champ] = valeur;
    const donneesJson = JSON.stringify(nouveau);
    base.run('UPDATE passages SET donnees_json = ?, updated_at = ? WHERE id = ?', [donneesJson, maintenant, id]);
  }
  // audit
  base.run('INSERT INTO audit_log (table_name, record_id, action, before_json, after_json, user_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['passages', 0, 'update', JSON.stringify(ancien), JSON.stringify(nouveau), utilisateur, maintenant]);
  await persister();
}

export async function supprimerPassage(id: string, utilisateur: string): Promise<void> {
  const base = await ouvrirBase();
  const maintenant = new Date().toISOString();
  // lire le passage pour l'audit et l'échéance
  const res = base.exec('SELECT personne_id, prochaine_echeance FROM passages WHERE id = ?', [id]);
  let personneId = 0;
  let echeance: string | null = null;
  if (res.length && res[0].values.length) {
    personneId = Number(res[0].values[0][0]);
    echeance = res[0].values[0][1] as string | null;
  }
  // supprimer le RDV lié si présent
  if (echeance) {
    base.run('DELETE FROM rendezvous WHERE source_passage_id = ?', [id]);
  }
  // audit avant suppression
  const avant = res.length && res[0].values.length ? JSON.stringify({ id, personneId, echeance }) : null;
  base.run('INSERT INTO audit_log (table_name, record_id, action, before_json, after_json, user_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['passages', 0, 'delete', avant, null, utilisateur, maintenant]);
  base.run('DELETE FROM passages WHERE id = ?', [id]);
  await persister();
}

function synchroniserEcheance(passageId: string, personneId: number, echeance: string | null): void {
  if (!db) return;
  if (!echeance) {
    // supprimer le RDV lié
    db.run('DELETE FROM rendezvous WHERE source_passage_id = ?', [passageId]);
    return;
  }
  // vérifier si un RDV lié existe
  const res = db.exec('SELECT id FROM rendezvous WHERE source_passage_id = ?', [passageId]);
  const maintenant = new Date().toISOString();
  if (res.length && res[0].values.length) {
    const rdvId = res[0].values[0][0];
    db.run('UPDATE rendezvous SET date_heure = ?, updated_at = ? WHERE id = ?', [echeance, maintenant, rdvId]);
  } else {
    // créer un nouveau RDV
    db.run('INSERT INTO rendezvous (personne_id, type, statut, date_heure, notes, source_volet, source_passage_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [personneId, 'suivi', 'propose', echeance, 'Échéance issue du carnet de suivi', null, passageId, maintenant, maintenant]);
  }
}

