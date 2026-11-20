// Mise en forme commune à TOUS les exports .xlsx de l'application (ExcelJS, licence MIT).
// Une seule fonction d'en-tête (ecrireEnTete) pour la liste, la fiche identité,
// les carnets de suivi et les rapports. Aucune mise en forme dupliquée ailleurs.

import { Workbook, type Cell, type Worksheet } from 'exceljs';
import { LOGO_ACSF_BASE64 } from './assets/acsf-logo-base64';
import { CHARTE_COULEURS } from './charteCouleurs';

export type TypeColonne = 'texte' | 'date' | 'nombre' | 'telephone' | 'statut' | 'programme';

export interface ColonneTableur {
  cle: string;
  libelle: string;
  type?: TypeColonne;
  /** Largeur minimale en caractères (le calcul standard est contenu + 3). */
  largeur?: number;
}

export interface OptionsTableur {
  titre: string;
  nomOnglet: string;
  colonnes: ColonneTableur[];
  lignes: Record<string, unknown>[];
  exportePar: string;
  filtres?: string;
  /** Texte du pied de tableau, ex. « Total : 11 personnes ». */
  libelleTotal?: string;
}

const LIGNE_TITRES = 3;
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Une seule image de logo par classeur, réutilisée par tous les onglets.
const LOGOS_PAR_CLASSEUR = new WeakMap<Workbook, number>();

function imageIdLogo(classeur: Workbook): number {
  const dejaPresent = LOGOS_PAR_CLASSEUR.get(classeur);
  if (dejaPresent !== undefined) return dejaPresent;
  const imageId = classeur.addImage({ base64: LOGO_ACSF_BASE64, extension: 'png' });
  LOGOS_PAR_CLASSEUR.set(classeur, imageId);
  return imageId;
}

const COULEURS = {
  ...CHARTE_COULEURS,
  bordure: 'FFD6D6E0',
  texte: 'FF2B2B40',
  discret: 'FF6E6E8A',
  suiviFond: 'FFE2F0D9',
  suiviTexte: 'FF375623',
  neutreFond: 'FFF0F0F4',
  neutreTexte: 'FF555566',
} as const;

const BORDURE_FINE = {
  top: { style: 'thin' as const, color: { argb: COULEURS.bordure } },
  left: { style: 'thin' as const, color: { argb: COULEURS.bordure } },
  bottom: { style: 'thin' as const, color: { argb: COULEURS.bordure } },
  right: { style: 'thin' as const, color: { argb: COULEURS.bordure } },
};

/* ---------- Utilitaires de présentation (aucune donnée métier modifiée) ---------- */

function deuxChiffres(n: number): string {
  return String(n).padStart(2, '0');
}

/** Date d'export lisible : jj/mm/aaaa à hh:mm. */
export function horodatageFr(date: Date = new Date()): string {
  return `${deuxChiffres(date.getDate())}/${deuxChiffres(date.getMonth() + 1)}/${date.getFullYear()} à ${deuxChiffres(date.getHours())}:${deuxChiffres(date.getMinutes())}`;
}

export function dateIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

/** Accord simple pour les libellés de quantité (« 1 passage », « 0 lignes »). */
export function pluriel(n: number, singulier: string, pluriel: string): string {
  return `${n} ${n === 1 ? singulier : pluriel}`;
}

function nettoyer(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Nom de fichier lisible : ACSF_<titre>_<date ISO>.xlsx */
export function nomFichierExport(titre: string, date: Date = new Date()): string {
  const base = nettoyer(titre).slice(0, 80) || 'Export';
  return `ACSF_${base}_${dateIso(date)}.xlsx`;
}

const PROGRAMMES: Record<string, string> = {
  SS: 'Soutien scolaire',
  AF: 'Appui familial',
  FP: 'Formation parents',
};

/** Libellé complet du programme (jamais l'abréviation technique). */
export function libelleProgramme(valeur: unknown): string {
  const brut = String(valeur ?? '').trim();
  if (!brut || brut === '—' || brut === '-') return '';
  return PROGRAMMES[brut.toUpperCase()] || brut;
}

/** Statuts connus, en clair et sans dépendre de la casse ni des accents sources. */
const STATUTS_EXCEL: Record<string, string> = {
  SUIVI: 'SUIVI', SUIVIE: 'SUIVI', 'SUIVI(E)': 'SUIVI',
  PROPOSE: 'PROPOSÉ', DEMANDE: 'DEMANDE', VALIDE: 'VALIDÉ', VALIDEE: 'VALIDÉE',
  REFUSE: 'REFUSÉ', PENDING: 'À REVOIR', CORRIGEE: 'CORRIGÉE', REJETEE: 'REJETÉE',
};

/** Statut affiché : libellé métier complet, jamais une clé technique. */
export function libelleStatut(valeur: unknown): string {
  const brut = String(valeur ?? '').trim();
  if (!brut || brut === '—' || brut === '-') return '';
  const cle = brut.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return STATUTS_EXCEL[cle] ?? brut.toUpperCase();
}

function versDate(valeur: unknown): Date | null {
  if (!valeur) return null;
  if (valeur instanceof Date) return isNaN(valeur.getTime()) ? null : valeur;
  if (typeof valeur === 'object') return null;
  const texte = String(valeur).trim();
  if (!texte || texte === '—' || texte === '-') return null;

  // Les horaires saisis dans Agenda sont des heures locales « naïves »
  // (AAAA-MM-JJTHH:mm). Les figer en UTC évite un décalage dans Excel
  // lorsque le poste n'est pas au fuseau de l'agence.
  const local = texte.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (local) {
    const millisecondes = Number((local[7] ?? '0').padEnd(3, '0').slice(0, 3));
    const d = new Date(Date.UTC(
      Number(local[1]), Number(local[2]) - 1, Number(local[3]),
      Number(local[4]), Number(local[5]), Number(local[6] ?? 0), millisecondes,
    ));
    return isNaN(d.getTime()) ? null : d;
  }

  let d = new Date(texte);
  if (!isNaN(d.getTime())) return d;
  const m = texte.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** Téléphones burkinabé : +226 XX XX XX XX, zéros et + préservés. */
export function normaliserTelephone(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return '';
  const brut = String(valeur).trim();
  if (!brut || brut === '—' || brut === '-') return '';
  const avecIndicatif = brut.startsWith('+');
  let chiffres = brut.replace(/\D/g, '');
  if (avecIndicatif && chiffres.startsWith('226')) chiffres = chiffres.slice(3);
  else if (chiffres.length === 9 && chiffres.startsWith('0')) chiffres = chiffres.slice(1);
  else if (chiffres.length === 11 && chiffres.startsWith('226')) chiffres = chiffres.slice(3);
  if (chiffres.length === 8) return `+226 ${chiffres.slice(0, 2)} ${chiffres.slice(2, 4)} ${chiffres.slice(4, 6)} ${chiffres.slice(6, 8)}`;
  return (avecIndicatif ? '+' : '') + chiffres;
}

function valeurAffichee(valeur: unknown, type: TypeColonne | undefined): string {
  if (valeur === null || valeur === undefined) return '';
  if (typeof valeur === 'object' && !(valeur instanceof Date)) return ''; // jamais de JSON brut
  const texte = String(valeur).trim();
  if (!texte || texte === '—' || texte === '-') return ''; // cellules vides laissées vides
  if (type === 'date') {
    const d = versDate(valeur);
    return d ? `${deuxChiffres(d.getDate())}/${deuxChiffres(d.getMonth() + 1)}/${d.getFullYear()}` : '';
  }
  if (type === 'telephone') return normaliserTelephone(valeur);
  if (type === 'programme') return libelleProgramme(valeur);
  if (type === 'statut') return libelleStatut(valeur);
  return texte;
}

/* ---------- Largeurs pensées pour l'impression A4 ---------- */

const MARGE_FILTRE = 4; // flèche de filtre, ajoutée à TOUTES les colonnes
const LARGEUR_PAGE_MIN = 100;
const LARGEUR_PAGE_MAX = 130;
// Au-delà, l'ajustement à une page de large descendrait sous 75 % en A4 paysage.
const LARGEUR_IMPRESSION_MAX = 190;

const LARGEURS_PAR_TYPE = { numero: 6, date: 13, auteur: 18, court: 15, moyen: 26, long: 48 } as const;
type CategorieColonne = keyof typeof LARGEURS_PAR_TYPE;

const LIBELLES_COURTS = new Set(['sexe', 'statut', 'oui-non', 'evolution', 'consentement', 'type', 'type-de-conseil', 'volet']);
const LIBELLES_LONGS = new Set([
  'remarques', 'description', 'contenu-spirituel', 'difficultes', 'difficultes-reperees',
  'contenu', 'traitement-en-cours', 'symptomes', 'conseil-declare', 'plan-de-suivi', 'soutien-prevu',
]);

function categorieColonne(colonne: ColonneTableur): CategorieColonne {
  if (colonne.cle === '_numero') return 'numero';
  if (colonne.type === 'date') return 'date';
  const libelle = nettoyer(colonne.libelle).toLowerCase();
  if (/saisi-par|auteur/.test(libelle)) return 'auteur';
  if (LIBELLES_COURTS.has(libelle)) return 'court';
  if (LIBELLES_LONGS.has(libelle)) return 'long';
  return 'moyen';
}

/** Largeur de base par type de colonne, bornée par le contenu réel. */
function largeurColonne(colonne: ColonneTableur, lignes: Record<string, unknown>[]): number {
  let contenu = colonne.libelle.length;
  for (const ligne of lignes) contenu = Math.max(contenu, valeurAffichee(ligne[colonne.cle], colonne.type).length);
  const categorie = categorieColonne(colonne);
  let largeur: number = LARGEURS_PAR_TYPE[categorie];
  if (categorie === 'court') largeur = Math.min(16, Math.max(14, contenu));
  else if (categorie === 'moyen') largeur = Math.min(28, Math.max(22, contenu));
  else if (categorie === 'long') largeur = Math.min(55, Math.max(40, contenu));
  return Math.max(colonne.largeur ?? 0, largeur);
}

/** Répartit l'espace disponible et choisit l'orientation pour tenir sur une page. */
function ajusterLargeurs(colonnes: ColonneTableur[], largeurs: number[], titre: string): { largeurs: number[]; orientation: 'landscape' | 'portrait' } {
  const resultat = [...largeurs];
  const derniere = resultat.length - 1;
  let total = resultat.reduce((somme, l) => somme + l, 0);

  // Peu de colonnes :-on remplit la page, surtout par la dernière colonne de texte.
  if (total < LARGEUR_PAGE_MIN) {
    let manque = LARGEUR_PAGE_MIN - total;
    const partDerniere = manque * 0.4;
    resultat[derniere] += partDerniere;
    manque -= partDerniere;
    const textes = colonnes.map((_, i) => i).filter((i) => !['numero', 'date'].includes(categorieColonne(colonnes[i])));
    const part = manque / Math.max(1, textes.length);
    textes.forEach((i) => { resultat[i] += part; });
    total = LARGEUR_PAGE_MIN;
  }

  // L'en-tête (logo + agence + titre) ne doit jamais déborder du tableau.
  const largeurEnTete = Math.min(LARGEUR_PAGE_MAX, 14 + 32 + titre.length * 1.15);
  if (total < largeurEnTete) {
    resultat[derniere] += largeurEnTete - total;
    total = largeurEnTete;
  }

  // Eviter un facteur de réduction inférieur à 75 % : rogner d'abord les textes longs.
  let reste = Math.max(0, total - LARGEUR_IMPRESSION_MAX);
  const planchers: Partial<Record<CategorieColonne, number>> = { long: 40, moyen: 22, auteur: 18, court: 14 };
  for (const categorie of ['long', 'moyen', 'auteur', 'court'] as CategorieColonne[]) {
    const indices = colonnes.map((_, i) => i).filter((i) => categorieColonne(colonnes[i]) === categorie);
    if (!indices.length) continue;
    const plancher = (planchers[categorie] ?? 0) + MARGE_FILTRE;
    for (const i of indices) {
      if (reste <= 0) break;
      const retrait = Math.min(Math.max(0, resultat[i] - plancher), reste / indices.length);
      resultat[i] -= retrait;
      reste -= retrait;
    }
  }

  return {
    largeurs: resultat.map((l) => (Math.round(l * 10) / 10 === 9 ? 9.1 : Math.round(l * 10) / 10)),
    orientation: resultat.reduce((somme, l) => somme + l, 0) > 95 ? 'landscape' : 'portrait',
  };
}

function lignesNecessaires(texte: string, largeur: number): number {
  return Math.max(1, Math.ceil(texte.length / Math.max(8, largeur - 3)));
}

function lettreColonne(index: number): string {
  let n = index;
  let lettre = '';
  while (n > 0) {
    const reste = (n - 1) % 26;
    lettre = String.fromCharCode(65 + reste) + lettre;
    n = Math.floor((n - 1) / 26);
  }
  return lettre;
}

/* ---------- LA fonction d'en-tête, unique pour tous les exports ---------- */

/**
 * Écrit les deux premières lignes de l'en-tête (logo/agence/titre puis info).
 * La ligne 3 est écrite par ajouterFeuilleTableur avec les titres de colonnes.
 */
function ecrireEnTete(
  classeur: Workbook,
  ws: Worksheet,
  options: OptionsTableur,
  nbColonnes: number,
  largeurs: number[],
): void {
  // Logo réduit (~30 px de haut) dans la colonne A, sans chevauchement avec le texte.
  ws.addImage(imageIdLogo(classeur), {
    tl: { col: 0, row: 0 },
    ext: { width: 26, height: 29 },
  });

  // Hauteur totale de l'en-tête : 26 + 12 + ~24 pt ≈ 83 px.
  ws.getRow(1).height = 26;
  ws.getRow(2).height = 12;

  // Répartition de la ligne 1 : agence à gauche, titre à droite.
  // ~1,15 unité de largeur Excel par caractère à 13 pt : le titre ne doit jamais être coupé.
  const largeurTitre = Math.max(28, options.titre.length * 1.15);
  let positionSplit = nbColonnes - 1;
  let largeurDroite = 0;
  let meilleurSplit = positionSplit;
  let meilleureDroite = 0;
  let titrePlace = false;
  for (let c = nbColonnes; c >= 3; c--) {
    largeurDroite += largeurs[c - 1];
    const largeurAgence = largeurs.slice(1, c - 1).reduce((somme, l) => somme + l, 0);
    if (largeurAgence < 34) continue;
    // On garde le meilleur compromis même si le titre doit être réduit.
    if (largeurDroite > meilleureDroite) {
      meilleureDroite = largeurDroite;
      meilleurSplit = c - 1;
    }
    if (largeurDroite >= largeurTitre) {
      positionSplit = c - 1;
      titrePlace = true;
      break;
    }
  }
  if (!titrePlace) positionSplit = meilleurSplit;
  positionSplit = Math.max(2, Math.min(positionSplit, nbColonnes - 1));

  if (nbColonnes >= 4) {
    ws.mergeCells(1, 2, 1, positionSplit);
    ws.mergeCells(1, positionSplit + 1, 1, nbColonnes);

    const agence = ws.getCell(1, 2);
    agence.value = {
      richText: [
        { text: 'ACSF-AFRIQUE SARL', font: { name: 'Calibri', size: 11, bold: true, color: { argb: COULEURS.nuit } } },
        { text: ' · Agence de Ouaga', font: { name: 'Calibri', size: 9, color: { argb: COULEURS.discret } } },
      ],
    };
    agence.alignment = { vertical: 'middle', horizontal: 'left' };

    // Si l'espace manque malgré tout, on réduit la police (jamais sous 9 pt).
    const largeurDisponible = largeurs.slice(positionSplit).reduce((somme, l) => somme + l, 0);
    const tailleTitre = Math.max(9, Math.min(13, Math.floor(13 * largeurDisponible / largeurTitre)));
    const titre = ws.getCell(1, positionSplit + 1);
    titre.value = options.titre;
    titre.font = { name: 'Calibri', size: tailleTitre, bold: true, color: { argb: COULEURS.nuit } };
    titre.alignment = { vertical: 'middle', horizontal: 'right', wrapText: false };
  }

  // Ligne 2 — une seule ligne grise, taille 8, toutes les métadonnées.
  if (nbColonnes > 1) ws.mergeCells(2, 1, 2, nbColonnes);
  const morceaux = [
    `Exporté le ${horodatageFr()}`,
    `Par ${options.exportePar || 'utilisateur inconnu'}`,
    pluriel(options.lignes.length, 'ligne', 'lignes'),
    'Document confidentiel — usage interne',
  ];
  if (options.filtres) morceaux.push(`Filtres : ${options.filtres}`);
  const info = ws.getCell(2, 1);
  info.value = morceaux.join('  ·  ');
  info.font = { name: 'Calibri', size: 8, color: { argb: COULEURS.discret } };
  info.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
}

/* ---------- Cellules et feuille ---------- */

function ecrireCellule(cellule: Cell, valeur: unknown, type: TypeColonne | undefined, alternance: boolean): void {
  cellule.border = BORDURE_FINE;
  cellule.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  cellule.font = { name: 'Calibri', size: 10, color: { argb: COULEURS.texte } };
  if (alternance) cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.fond } };

  if (type === 'date') {
    const d = versDate(valeur);
    if (d) {
      cellule.value = d;
      cellule.numFmt = 'dd"/"mm"/"yyyy';
    }
    return;
  }
  if (type === 'nombre') {
    const n = Number(valeur);
    if (valeur !== '' && valeur !== null && valeur !== undefined && !isNaN(n)) cellule.value = n;
    return;
  }
  if (type === 'telephone') {
    const tel = normaliserTelephone(valeur);
    if (tel) cellule.value = tel;
    cellule.numFmt = '@'; // texte : conserve + et zéros
    return;
  }
  if (type === 'statut') {
    const statut = libelleStatut(valeur);
    if (!statut) return;
    cellule.value = statut;
    const estSuivi = statut === 'SUIVI';
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estSuivi ? COULEURS.suiviFond : COULEURS.neutreFond } };
    cellule.font = { name: 'Calibri', size: 10, bold: true, color: { argb: estSuivi ? COULEURS.suiviTexte : COULEURS.neutreTexte } };
    return;
  }
  const texte = valeurAffichee(valeur, type);
  if (texte) cellule.value = texte;
}

/** Ajoute une feuille complète : en-tête unique + tableau + pied + impression. */
export function ajouterFeuilleTableur(classeur: Workbook, options: OptionsTableur): Worksheet {
  const colonnes: ColonneTableur[] = [{ cle: '_numero', libelle: 'N°', type: 'nombre', largeur: 6 }, ...options.colonnes];
  const nbColonnes = colonnes.length;
  const { largeurs, orientation } = ajusterLargeurs(
    colonnes,
    colonnes.map((c) => largeurColonne(c, options.lignes) + MARGE_FILTRE),
    options.titre,
  );

  const ws = classeur.addWorksheet(options.nomOnglet.slice(0, 31) || 'Export', {
    properties: { defaultRowHeight: 15 },
    views: [{ showGridLines: false }],
  });

  ecrireEnTete(classeur, ws, options, nbColonnes, largeurs);

  // Ligne 3 — titres de colonnes, hauteur adaptée au retour à la ligne.
  const ligneTitres = ws.getRow(LIGNE_TITRES);
  const lignesTitre = Math.max(...colonnes.map((c, i) => lignesNecessaires(c.libelle, largeurs[i])));
  ligneTitres.height = Math.min(24, Math.max(20, lignesTitre * 12));
  colonnes.forEach((colonne, index) => {
    const cellule = ligneTitres.getCell(index + 1);
    cellule.value = colonne.libelle;
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.nuit } };
    cellule.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COULEURS.blanc } };
    cellule.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cellule.border = BORDURE_FINE;
    ws.getColumn(index + 1).width = largeurs[index];
  });

  // Données à partir de la ligne 4 — hauteur adaptée, aucun texte coupé.
  options.lignes.forEach((ligne, index) => {
    const row = ws.getRow(LIGNE_TITRES + 1 + index);
    row.getCell(1).value = index + 1;
    row.getCell(1).numFmt = '0';
    row.getCell(1).font = { name: 'Calibri', size: 10, color: { argb: COULEURS.texte } };
    let nbLignes = 1;
    colonnes.slice(1).forEach((colonne, c) => {
      const texte = valeurAffichee(ligne[colonne.cle], colonne.type);
      if (texte) nbLignes = Math.max(nbLignes, lignesNecessaires(texte, largeurs[c + 1]));
      ecrireCellule(row.getCell(c + 2), ligne[colonne.cle], colonne.type, index % 2 === 1);
    });
    row.height = Math.min(120, Math.max(15, nbLignes * 14));
    row.getCell(1).border = BORDURE_FINE;
    row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };
    if (index % 2 === 1) row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.fond } };
  });

  // Onglet sans données : on garde l'en-tête et le tableau, avec un message lisible.
  const sansDonnees = options.lignes.length === 0;
  if (sansDonnees) {
    const vide = ws.getRow(LIGNE_TITRES + 1);
    ws.mergeCells(LIGNE_TITRES + 1, 1, LIGNE_TITRES + 1, nbColonnes);
    const cellule = vide.getCell(1);
    cellule.value = 'Aucun passage enregistré';
    cellule.font = { name: 'Calibri', size: 10, italic: true, color: { argb: COULEURS.discret } };
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.fond } };
    cellule.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let c = 1; c <= nbColonnes; c++) vide.getCell(c).border = BORDURE_FINE;
    vide.height = 20;
  }

  const derniereLigne = LIGNE_TITRES + options.lignes.length + (sansDonnees ? 1 : 0);

  // Pied de tableau
  if (options.libelleTotal) {
    const pied = derniereLigne + 1;
    ws.mergeCells(pied, 1, pied, nbColonnes);
    const cellule = ws.getCell(pied, 1);
    cellule.value = options.libelleTotal;
    cellule.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COULEURS.nuit } };
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.fond } };
    cellule.alignment = { vertical: 'middle', horizontal: 'right' };
    for (let c = 1; c <= nbColonnes; c++) ws.getCell(pied, c).border = BORDURE_FINE;
  }

  // Filtres sur la ligne des titres uniquement (pas sur le pied)
  ws.autoFilter = {
    from: { row: LIGNE_TITRES, column: 1 },
    to: { row: sansDonnees ? LIGNE_TITRES : derniereLigne, column: nbColonnes },
  };

  // Impression identique pour tous les onglets : A4, une page de large, titres répétés.
  const derniereColonne = lettreColonne(nbColonnes);
  const finImpression = options.libelleTotal ? derniereLigne + 1 : derniereLigne;
  ws.pageSetup = {
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
    horizontalCentered: true,
    margins: { left: 0.47, right: 0.47, top: 0.59, bottom: 0.59, header: 0.2, footer: 0.3 },
    printArea: `A1:${derniereColonne}${finImpression}`,
    printTitlesRow: '1:3',
  };
  ws.headerFooter.oddFooter = '&LACSF-Afrique SARL — Confidentiel&RPage &P sur &N';
  ws.headerFooter.evenFooter = ws.headerFooter.oddFooter;
  ws.headerFooter.firstFooter = ws.headerFooter.oddFooter;

  return ws;
}

export function creerClasseur(titre: string, auteur: string): Workbook {
  const classeur = new Workbook();
  classeur.creator = auteur;
  classeur.lastModifiedBy = auteur;
  classeur.title = titre;
  classeur.subject = 'Export confidentiel ACSF-AFRIQUE SARL';
  classeur.company = 'ACSF-AFRIQUE SARL';
  classeur.created = new Date();
  classeur.modified = new Date();
  return classeur;
}

/** Écrit le classeur et déclenche le téléchargement du .xlsx. */
export async function telechargerClasseur(classeur: Workbook, nomFichier: string): Promise<void> {
  const buffer = await classeur.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME_XLSX });
  const url = URL.createObjectURL(blob);
  const ancre = document.createElement('a');
  ancre.href = url;
  ancre.download = nomFichier;
  document.body.appendChild(ancre);
  ancre.click();
  ancre.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Construit un classeur à une seule feuille et le télécharge. */
export async function exporterTableur(options: OptionsTableur, exportePar: string, nomFichier?: string): Promise<void> {
  const classeur = creerClasseur(options.titre, exportePar);
  ajouterFeuilleTableur(classeur, { ...options, exportePar });
  await telechargerClasseur(classeur, nomFichier ?? nomFichierExport(options.titre));
}
