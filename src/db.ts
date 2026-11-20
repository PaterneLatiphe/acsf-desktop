/**
 * db.ts — Couche de données de l'application ACSF Desktop (accès SQLite via sql.js sur le fichier persistant de ./storage).
 *
 * Schéma :
 *  - personnes, passages, volets, consents, contributions_famille, audit_log, echanges, rendezvous, schema_version.
 *  - passages.id est une chaîne (TEXT PRIMARY KEY, créée avec crypto.randomUUID()).
 *  - Conventions : colonnes snake_case en base, objets camelCase (datePassage, donneesJson, personneId…) à l'API.
 *
 * Continuité des données :
 *  - SCHEMA : CREATE TABLE IF NOT EXISTS ; colonnes manquantes ajoutées idempotentement via ensureColumn.
 *  - Migrations idempotentes à chaque ouverture : backfills (passages.created_at/updated_at),
 *    normalisation legacy de passages.date_passage / passages.prochaine_echeance, indexes légaux,
 *    index unique volets(personne_id, type).
 *  - Dates de passage stockées au format ISO date seule (AAAA-MM-JJ) et normalisées à l'écriture par validerEtNormaliserDate.
 *
 * API (contractuelle, appelée par Volets.tsx) : validation en écriture — personne existante
 * (creerPassage / modifierPassage / supprimerPassage / accorderConsentement), type de volet valide
 * (VOLETS_VALIDES), dates au format ISO et valides (modifierPassage). Signatures inchangées.
 */
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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_personnes_nom ON personnes(nom, prenom);
CREATE TABLE IF NOT EXISTS rendezvous(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  type TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'propose',
  date_heure TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rendezvous_personne ON rendezvous(personne_id);
CREATE INDEX IF NOT EXISTS idx_rendezvous_date_heure ON rendezvous(date_heure);

CREATE TABLE IF NOT EXISTS passages(
  id TEXT PRIMARY KEY,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  volet_type TEXT NOT NULL,
  date_passage TEXT NOT NULL,
  auteur TEXT NOT NULL,
  donnees_json TEXT,
  remarques TEXT,
  prochaine_echeance TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_passages_personne_volet ON passages(personne_id, volet_type, date_passage, created_at);

CREATE TABLE IF NOT EXISTS volets(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  personne_id INTEGER NOT NULL REFERENCES personnes(id),
  type TEXT NOT NULL,
  consentement_spiritualite_at TEXT,
  donnees_json TEXT,
  version INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
CREATE INDEX IF NOT EXISTS idx_consents_personne_type ON consents(personne_id, type, granted_at);

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
CREATE INDEX IF NOT EXISTS idx_contributions_personne_created ON contributions_famille(personne_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contributions_personne_volet_created ON contributions_famille(personne_id, volet_type, created_at);

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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_echanges_personne ON echanges(personne_id);
CREATE INDEX IF NOT EXISTS idx_echanges_personne_created ON echanges(personne_id, created_at);

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

/** Types de volets valides — union du type `Volet` utilisé dans la section « Volets » ci-dessous. */
export const VOLETS_VALIDES: readonly string[] = ['education', 'sante', 'social', 'spiritualite', 'historique'];

/** Convertit une ligne de résultat SQLite en objet camelCase (ex. donnees_json → donneesJson). */
function ligneEnObjet<T>(colonnes: string[], ligne: unknown[]): T {
  const obj: Record<string, unknown> = {};
  colonnes.forEach((col, i) => {
    const camel = col.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
    obj[camel] = ligne[i];
  });
  return obj as unknown as T;
}

/** Normalise une ligne de `passages` en type `Passage` : objet parsé depuis `donnees_json`, dates normalisées, chaînes non nulles. */
export function passageDeLigne(colonnes: string[], ligne: unknown[]): Passage {
  const p = ligneEnObjet<Passage>(colonnes, ligne);
  const donnees: Record<string, string> = {};
  try {
    const parse = p.donneesJson ? JSON.parse(p.donneesJson) : null;
    if (parse && typeof parse === 'object') Object.assign(donnees, parse as Record<string, string>);
  } catch {
    /* données JSON corrompues : on garde un objet vide */
  }
  const datePassage = typeof p.datePassage === 'string' && p.datePassage ? p.datePassage.slice(0, 10) : '';
  const prochaineEcheance = typeof p.prochaineEcheance === 'string' && p.prochaineEcheance.length > 10
    ? p.prochaineEcheance.slice(0, 10)
    : p.prochaineEcheance || null;
  return {
    ...p,
    id: String(p.id ?? ''),
    personneId: Number(p.personneId),
    datePassage,
    auteur: p.auteur || '',
    donnees,
    remarques: p.remarques || '',
    prochaineEcheance,
  };
}

/** Vérifie et normalise un identifiant de personne (entier ≥ 1). */
function validerIdPersonne(id: number, nomFonction: string): number {
  const valeur = Number(id);
  if (!Number.isInteger(valeur) || valeur < 1) {
    throw new Error(`${nomFonction} : identifiant de personne invalide (${String(id)})`);
  }
  return valeur;
}

/** Vérifie et renvoie un identifiant d'utilisateur non vide. */
function validerTexteUtilisateur(utilisateur: string, nomFonction: string): string {
  const texte = String(utilisateur ?? '').trim();
  if (!texte) throw new Error(`${nomFonction} : utilisateur manquant`);
  return texte;
}

/** Vérifie et renvoie une valeur texte non vide. */
export function validerTexteNonVide(valeur: string, champ: string, nomFonction: string): string {
  const texte = String(valeur ?? '').trim();
  if (!texte) throw new Error(`${nomFonction} : ${champ} manquant`);
  return texte;
}

/**
 * Normalise et vérifie une date de passage : accepte AAAA-MM-JJ ou un ISO long
 * (format produit notamment par l'éditeur de cellule AG Grid) et renvoie la date seule AAAA-MM-JJ.
 * Renvoie null si la date est vide et permetVide est vrai, sinon lève une erreur pour une date invalide.
 */
export function validerEtNormaliserDate(valeur: string | null | undefined, champ: string, permetVide: boolean): string | null {
  const texte = valeur === null || valeur === undefined ? '' : String(valeur).trim();
  if (!texte) {
    if (permetVide) return null;
    throw new Error(`Date invalide pour ${champ} : vide`);
  }
  const candidat = texte.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidat) || isNaN(Date.parse(candidat))) {
    throw new Error(`Date invalide pour ${champ} : ${texte}`);
  }
  const d = new Date(candidat + 'T00:00:00Z');
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== candidat) {
    throw new Error(`Date invalide pour ${champ} : ${texte}`);
  }
  return candidat;
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
    // consistance des dates — backfills idempotents pour les lignes legacy
    db.run("UPDATE passages SET prochaine_echeance = substr(prochaine_echeance, 1, 10) WHERE prochaine_echeance IS NOT NULL AND length(prochaine_echeance) > 10");
    db.run('UPDATE passages SET created_at = COALESCE(created_at, date_passage) WHERE created_at IS NULL');
    db.run('UPDATE passages SET updated_at = COALESCE(updated_at, created_at) WHERE updated_at IS NULL');
    // indexes légaux — idempotents, réappliqués à chaque ouverture
    try {
      db.run('CREATE INDEX IF NOT EXISTS idx_echanges_personne_created ON echanges(personne_id, created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_consents_personne_type ON consents(personne_id, type, granted_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_contributions_personne_created ON contributions_famille(personne_id, created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_contributions_personne_volet_created ON contributions_famille(personne_id, volet_type, created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_rendezvous_date_heure ON rendezvous(date_heure)');
      // complétion de l'index de passages pour le tri (personne_id, volet_type, date_passage DESC, created_at DESC)
      const idxPassages = db.exec("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'idx_passages_personne_volet'");
      const defPassages = idxPassages.length && idxPassages[0].values.length ? String(idxPassages[0].values[0][0] ?? '') : '';
      if (!defPassages.includes('created_at')) {
        db.run('DROP INDEX IF EXISTS idx_passages_personne_volet');
        db.run('CREATE INDEX idx_passages_personne_volet ON passages(personne_id, volet_type, date_passage, created_at)');
      }
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_volets_personne_type ON volets(personne_id, type)');
    } catch (e) {
      console.log('DEBUG migration: indexes non appliqués (doublons existants ?) :', e);
    }
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
  const idPersonne = validerIdPersonne(personneId, 'listerVolets');
  const resultat = base.exec('SELECT * FROM volets WHERE personne_id = ? ORDER BY type', [idPersonne]);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const v = ligneEnObjet<Volet>(colonnes, ligne);
    return { ...v, personneId: Number(v.personneId), version: Number(v.version) };
  });
}

export async function chargerVolet(personneId: number, type: string): Promise<Volet | null> {
  const base = await ouvrirBase();
  const idPersonne = validerIdPersonne(personneId, 'chargerVolet');
  const texteType = String(type ?? '').trim();
  if (!texteType) throw new Error('chargerVolet : type de volet invalide (vide)');
  const resultat = base.exec('SELECT * FROM volets WHERE personne_id = ? AND type = ?', [idPersonne, texteType]);
  if (!resultat.length || !resultat[0].values.length) return null;
  const v = ligneEnObjet<Volet>(resultat[0].columns, resultat[0].values[0]);
  return { ...v, personneId: Number(v.personneId), version: Number(v.version) };
}

export async function enregistrerVolet(personneId: number, type: string, donnees: Record<string, unknown>, utilisateur: string): Promise<void> {
  const base = await ouvrirBase();
  const idPersonne = validerIdPersonne(personneId, 'enregistrerVolet');
  const texteType = String(type ?? '').trim();
  if (!VOLETS_VALIDES.includes(texteType)) throw new Error(`enregistrerVolet : type de volet invalide (${type})`);
  if (!donnees || typeof donnees !== 'object') throw new Error('enregistrerVolet : données obligatoires');
  const texteUtilisateur = validerTexteUtilisateur(utilisateur, 'enregistrerVolet');
  const maintenant = new Date().toISOString();
  const existant = await chargerVolet(personneId, texteType);
  const avant = existant ? existant.donneesJson : null;
  const apres = JSON.stringify(donnees);
  let recordId = 0;
  if (existant) {
    base.run('UPDATE volets SET donnees_json = ?, version = ?, updated_at = ?, updated_by = ? WHERE id = ?',
      [apres, existant.version + 1, maintenant, texteUtilisateur, existant.id]);
    recordId = existant.id;
  } else {
    base.run('INSERT INTO volets (personne_id, type, donnees_json, version, updated_at, updated_by) VALUES (?, ?, ?, 1, ?, ?)',
      [idPersonne, texteType, apres, maintenant, texteUtilisateur]);
    const dernier = base.exec('SELECT last_insert_rowid() AS id');
    recordId = dernier.length ? Number(dernier[0].values[0][0]) : 0;
  }
  base.run('INSERT INTO audit_log (table_name, record_id, action, before_json, after_json, user_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['volets', recordId, existant ? 'update' : 'create', avant, apres, texteUtilisateur, maintenant]);
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
  const idPersonne = validerIdPersonne(personneId, 'chargerConsentement');
  const texteType = String(type ?? '').trim();
  if (!texteType) throw new Error('chargerConsentement : type de consentement invalide (vide)');
  const resultat = base.exec('SELECT * FROM consents WHERE personne_id = ? AND type = ? AND revoked_at IS NULL ORDER BY granted_at DESC LIMIT 1', [idPersonne, texteType]);
  if (!resultat.length || !resultat[0].values.length) return null;
  const c = ligneEnObjet<Consent>(resultat[0].columns, resultat[0].values[0]);
  return { ...c, personneId: Number(c.personneId) };
}

export async function accorderConsentement(personneId: number, type: string, canal: string, utilisateur: string): Promise<void> {
  const base = await ouvrirBase();
  const idPersonne = validerIdPersonne(personneId, 'accorderConsentement');
  const texteType = String(type ?? '').trim();
  if (!texteType) throw new Error('accorderConsentement : type de consentement invalide (vide)');
  const texteUtilisateur = validerTexteUtilisateur(utilisateur, 'accorderConsentement');
  const maintenant = new Date().toISOString();
  const existe = base.exec('SELECT 1 AS ok FROM personnes WHERE id = ?', [idPersonne]);
  if (!existe.length || !existe[0].values.length) throw new Error(`accorderConsentement : personne introuvable (id=${idPersonne})`);
  base.run('INSERT INTO consents (personne_id, type, granted_at, canal) VALUES (?, ?, ?, ?)',
    [idPersonne, texteType, maintenant, canal ? String(canal).trim() || null : null]);
  base.run('INSERT INTO audit_log (table_name, record_id, action, before_json, after_json, user_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['consents', 0, 'create', null, JSON.stringify({ type: texteType, canal }), texteUtilisateur, maintenant]);
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
  const idPersonne = validerIdPersonne(personneId, 'listerContributions');
  const texteType = voletType === undefined ? '' : String(voletType).trim();
  if (voletType !== undefined && !texteType) throw new Error('listerContributions : type de volet invalide (vide)');
  const sql = texteType
    ? 'SELECT * FROM contributions_famille WHERE personne_id = ? AND volet_type = ? ORDER BY created_at'
    : 'SELECT * FROM contributions_famille WHERE personne_id = ? ORDER BY created_at';
  const params = texteType ? [idPersonne, texteType] : [idPersonne];
  const resultat = base.exec(sql, params);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const c = ligneEnObjet<Contribution>(colonnes, ligne);
    return { ...c, personneId: Number(c.personneId), consentementId: c.consentementId ? Number(c.consentementId) : null };
  });
}

export async function enregistrerContribution(personneId: number, voletType: string, champ: string, valeurDeclaree: string, consentementId: number | null): Promise<void> {
  const base = await ouvrirBase();
  const idPersonne = validerIdPersonne(personneId, 'enregistrerContribution');
  const texteType = String(voletType ?? '').trim();
  if (!texteType) throw new Error('enregistrerContribution : type de volet invalide (vide)');
  const texteChamp = String(champ ?? '').trim();
  if (!texteChamp) throw new Error('enregistrerContribution : champ obligatoire');
  const maintenant = new Date().toISOString();
  base.run('INSERT INTO contributions_famille (personne_id, volet_type, champ, valeur_declaree, consentement_id, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [idPersonne, texteType, texteChamp, valeurDeclaree === null || valeurDeclaree === undefined ? null : String(valeurDeclaree), consentementId ? Number(consentementId) : null, 'pending', maintenant]);
  await persister();
}

export async function deciderContribution(id: number, statut: 'validee' | 'corrigee' | 'rejetee', decidedBy: string): Promise<void> {
  const base = await ouvrirBase();
  if (statut !== 'validee' && statut !== 'corrigee' && statut !== 'rejetee') {
    throw new Error(`deciderContribution : statut invalide (${String(statut)})`);
  }
  const texteDecidedBy = validerTexteUtilisateur(decidedBy, 'deciderContribution');
  if (!Number.isInteger(id) || id < 1) throw new Error(`deciderContribution : identifiant de contribution invalide (${id})`);
  const maintenant = new Date().toISOString();
  base.run('UPDATE contributions_famille SET statut = ?, decided_by = ?, decided_at = ? WHERE id = ?', [statut, texteDecidedBy, maintenant, id]);
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
  const idPersonne = validerIdPersonne(personneId, 'listerEchanges');
  const resultat = base.exec('SELECT * FROM echanges WHERE personne_id = ? ORDER BY created_at DESC', [idPersonne]);
  if (!resultat.length) return [];
  const colonnes = resultat[0].columns;
  return resultat[0].values.map((ligne) => {
    const e = ligneEnObjet<Echange>(colonnes, ligne);
    return { ...e, personneId: Number(e.personneId) };
  });
}

export async function ajouterEchange(personneId: number, auteurUserId: string, type: string, contenu: string): Promise<void> {
  const base = await ouvrirBase();
  const idPersonne = validerIdPersonne(personneId, 'ajouterEchange');
  const texteType = String(type ?? '').trim();
  if (!texteType) throw new Error('ajouterEchange : type d’échange invalide (vide)');
  const maintenant = new Date().toISOString();
  base.run('INSERT INTO echanges (personne_id, auteur_user_id, type, contenu, created_at) VALUES (?, ?, ?, ?, ?)',
    [idPersonne, auteurUserId, texteType, contenu, maintenant]);
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

