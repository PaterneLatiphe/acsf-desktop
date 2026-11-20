// Mise en forme commune à TOUS les exports .xlsx de l'application (ExcelJS, licence MIT).
// Un seul endroit pour : en-tête agence + logo, tableau, types de données, impression.
// Remplace SheetJS pour la génération : ses styles sont trop limités.

import { Workbook, type Cell, type Worksheet } from 'exceljs';
import { LOGO_ACSF_BASE64 } from './assets/acsf-logo-base64';
import { CHARTE_COULEURS } from './charteCouleurs';

export type TypeColonne = 'texte' | 'date' | 'nombre' | 'telephone' | 'statut';

export interface ColonneTableur {
  cle: string;
  libelle: string;
  type?: TypeColonne;
  /** Largeur minimale en caractères (calculée automatiquement sinon). */
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

const LIGNE_TITRES = 6;
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

/* ---------- Utilitaires de format ---------- */

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

function nettoyer(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Nom de fichier lisible : ACSF_<titre>_<date ISO>.xlsx */
export function nomFichierExport(titre: string, date: Date = new Date()): string {
  const base = nettoyer(titre).slice(0, 80) || 'Export';
  return `ACSF_${base}_${dateIso(date)}.xlsx`;
}

function versDate(valeur: unknown): Date | null {
  if (!valeur) return null;
  if (valeur instanceof Date) return isNaN(valeur.getTime()) ? null : valeur;
  const texte = String(valeur).trim();
  if (!texte || texte === '—' || texte === '-') return null;
  // ISO (AAAA-MM-JJ, éventuellement avec heure)
  let d = new Date(texte);
  if (!isNaN(d.getTime())) return d;
  // Français jj/mm/aaaa
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
  const texte = String(valeur).trim();
  if (!texte || texte === '—' || texte === '-') return '';
  if (type === 'date') {
    const d = versDate(valeur);
    if (!d) return '';
    return `${deuxChiffres(d.getDate())}/${deuxChiffres(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  if (type === 'telephone') return normaliserTelephone(valeur);
  return texte;
}

function largeurColonne(colonne: ColonneTableur, lignes: Record<string, unknown>[]): number {
  let max = colonne.libelle.length;
  for (const ligne of lignes) max = Math.max(max, valeurAffichee(ligne[colonne.cle], colonne.type).length);
  const plancher = colonne.type === 'date' ? 14 : colonne.type === 'telephone' ? 18 : 12;
  return Math.min(Math.max(max + 3, colonne.largeur ?? plancher), 58);
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

function colorierPlage(ws: Worksheet, ligne: number, de: number, a: number, fond: string, texte: string, gras = false, taille = 11): void {
  for (let c = de; c <= a; c++) {
    const cellule = ws.getCell(ligne, c);
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fond } };
    cellule.font = { name: 'Calibri', size: taille, bold: gras, color: { argb: texte } };
  }
}

/* ---------- Construction d'une feuille ---------- */

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

function ecrireEnTete(classeur: Workbook, ws: Worksheet, options: OptionsTableur, nbColonnes: number): void {
  const maintenant = new Date();
  const imageId = imageIdLogo(classeur);
  ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 58, height: 65 } });

  ws.getRow(1).height = 68;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 34;
  ws.getRow(4).height = 20;
  ws.getRow(5).height = 10;

  // Ligne 1 — nom de l'agence à côté du logo
  if (nbColonnes > 2) ws.mergeCells(1, 2, 1, nbColonnes);
  colorierPlage(ws, 1, 2, nbColonnes, COULEURS.blanc, COULEURS.nuit, true, 13);
  const agence = ws.getCell(1, 2);
  agence.value = 'ACSF-AFRIQUE SARL';
  agence.alignment = { vertical: 'middle', horizontal: 'left' };

  // Ligne 2 — mention de confidentialité
  if (nbColonnes > 2) ws.mergeCells(2, 2, 2, nbColonnes);
  colorierPlage(ws, 2, 2, nbColonnes, COULEURS.blanc, COULEURS.discret, false, 9);
  const confidentiel = ws.getCell(2, 2);
  confidentiel.value = 'Document confidentiel — usage interne';
  confidentiel.alignment = { vertical: 'middle', horizontal: 'left' };

  // Ligne 3 — titre centré, edition de la largeur totale
  ws.mergeCells(3, 1, 3, nbColonnes);
  colorierPlage(ws, 3, 1, nbColonnes, COULEURS.blanc, COULEURS.nuit, true, 16);
  const titre = ws.getCell(3, 1);
  titre.value = options.titre;
  titre.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Ligne 4 — date, auteur, nombre de lignes, filtres
  ws.mergeCells(4, 1, 4, nbColonnes);
  colorierPlage(ws, 4, 1, nbColonnes, COULEURS.blanc, COULEURS.discret, false, 9);
  const morceaux = [
    `Exporté le ${horodatageFr(maintenant)}`,
    `Par ${options.exportePar || 'utilisateur inconnu'}`,
    `${options.lignes.length} ligne${options.lignes.length > 1 ? 's' : ''}`,
  ];
  if (options.filtres) morceaux.push(`Filtres : ${options.filtres}`);
  const info = ws.getCell(4, 1);
  info.value = morceaux.join('  ·  ');
  info.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // Ligne 5 voulue vide (séparation avec le tableau)
}

function ecrireCellule(cellule: Cell, valeur: unknown, type: TypeColonne | undefined, alternance: boolean): void {
  cellule.border = BORDURE_FINE;
  cellule.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  cellule.font = { name: 'Calibri', size: 10, color: { argb: COULEURS.texte } };
  if (alternance) cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.fond } };

  if (type === 'date') {
    const d = versDate(valeur);
    if (d) {
      cellule.value = d;
      cellule.numFmt = 'dd/mm/yyyy';
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
    const statut = valeurAffichee(valeur, 'texte').toUpperCase();
    if (!statut) return;
    cellule.value = statut;
    const estSuivi = statut === 'SUIVI' || statut === 'VALIDEE' || statut === 'SUIVIE';
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estSuivi ? COULEURS.suiviFond : COULEURS.neutreFond } };
    cellule.font = { name: 'Calibri', size: 10, bold: true, color: { argb: estSuivi ? COULEURS.suiviTexte : COULEURS.neutreTexte } };
    return;
  }
  const texte = valeurAffichee(valeur, 'texte');
  if (texte) cellule.value = texte;
}

/** Ajoute une feuille complète : en-tête agence + tableau + pied + impression. */
export function ajouterFeuilleTableur(classeur: Workbook, options: OptionsTableur): Worksheet {
  const colonnes: ColonneTableur[] = [{ cle: '_numero', libelle: 'N°', type: 'nombre', largeur: 7 }, ...options.colonnes];
  const nbColonnes = colonnes.length;
  const ws = classeur.addWorksheet(options.nomOnglet.slice(0, 31) || 'Export', {
    properties: { defaultRowHeight: 16 },
    views: [{ state: 'frozen', ySplit: LIGNE_TITRES, topLeftCell: 'A7', activeCell: 'A7' }],
  });

  ecrireEnTete(classeur, ws, options, nbColonnes);

  // Ligne 6 — titres de colonnes
  const ligneTitres = ws.getRow(LIGNE_TITRES);
  ligneTitres.height = 32;
  colonnes.forEach((colonne, index) => {
    const cellule = ligneTitres.getCell(index + 1);
    cellule.value = colonne.libelle;
    cellule.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.nuit } };
    cellule.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COULEURS.blanc } };
    cellule.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cellule.border = BORDURE_FINE;
    ws.getColumn(index + 1).width = largeurColonne(colonne, options.lignes);
  });

  // Données
  options.lignes.forEach((ligne, index) => {
    const row = ws.getRow(LIGNE_TITRES + 1 + index);
    row.getCell(1).value = index + 1;
    row.getCell(1).numFmt = '0';
    row.getCell(1).font = { name: 'Calibri', size: 10, color: { argb: COULEURS.texte } };
    colonnes.slice(1).forEach((colonne, c) => {
      ecrireCellule(row.getCell(c + 2), ligne[colonne.cle], colonne.type, index % 2 === 1);
    });
    row.getCell(1).border = BORDURE_FINE;
    row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };
    if (index % 2 === 1) row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.fond } };
  });

  const derniereLigne = LIGNE_TITRES + options.lignes.length;

  // Pied de tableau
  if (options.libelleTotal) {
    const pied = LIGNE_TITRES + options.lignes.length + 1;
    ws.mergeCells(pied, 1, pied, nbColonnes);
    colorierPlage(ws, pied, 1, nbColonnes, COULEURS.fond, COULEURS.nuit, true, 10);
    const cellule = ws.getCell(pied, 1);
    cellule.value = options.libelleTotal;
    cellule.alignment = { vertical: 'middle', horizontal: 'right' };
    for (let c = 1; c <= nbColonnes; c++) ws.getCell(pied, c).border = BORDURE_FINE;
  }

  // Filtres sur la ligne de titres uniquement (pas sur le pied)
  if (options.lignes.length > 0) {
    ws.autoFilter = { from: { row: LIGNE_TITRES, column: 1 }, to: { row: derniereLigne, column: nbColonnes } };
  }

  // Impression : paysage, une page de large, titres répétés, pied de page, zone utile
  const derniereColonne = lettreColonne(nbColonnes);
  const finImpression = options.libelleTotal ? derniereLigne + 1 : derniereLigne;
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
    horizontalCentered: true,
    margins: { left: 0.35, right: 0.35, top: 0.6, bottom: 0.6, header: 0.25, footer: 0.3 },
    printArea: `A1:${derniereColonne}${finImpression}`,
    printTitlesRow: `${LIGNE_TITRES}:${LIGNE_TITRES}`,
  };
  ws.headerFooter.oddFooter = `&L ACSF-Afrique SARL — Confidentiel&R Page &P sur &N`;
  ws.headerFooter.evenFooter = ws.headerFooter.oddFooter;
  ws.headerFooter.firstFooter = ws.headerFooter.oddFooter;

  return ws;
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
