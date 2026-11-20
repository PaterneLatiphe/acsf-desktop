// Export Excel .xlsx — un onglet par volet, en-têtes en gras, dates réelles (serial Excel),
// wrapText, filtres, largeurs de colonnes et ton de charte.
// Utilise la configuration unique VOLET_COLONNES (src/voletsConfig/voletsConfig.ts)

import * as XLSX from 'xlsx';
import { VOLET_COLONNES } from './voletsConfig/voletsConfig';
import { CHARTE_COULEURS } from './charteCouleurs';

export interface PersonneExport {
  nom: string;
  prenom?: string;
  dateNaissance?: string;
  telephone?: string;
  code?: string;
  passages?: any[];
  // Événements de l'historique de la personne (échanges + passages), exportés dans le volet Historique
  evenements?: { date: string; type: string; auteur: string; contenu: string }[];
}

// Ordre des volets dans le classeur — synchronisé avec OngletsVolets (feuille Identité en premier)
const ORDRE_VOLETS: string[] = ['synthese', 'education', 'sante', 'social', 'spiritualite', 'historique'];

const LIBELLES_VOLETS: Record<string, string> = {
  synthese: 'Synthèse',
  education: 'Éducation',
  sante: 'Santé',
  social: 'Social',
  spiritualite: 'Spiritualité',
  historique: 'Historique',
};

// Fenêtre de format pour l'affichage réel des dates dans Excel (la valeur reste un serial)
const FORMAT_DATE = 'yyyy-mm-dd';

// Feuille Historique — événements de la personne (échanges + passages)
const COLONNES_HISTORIQUE: { cle: string; libelle: string; type: string }[] = [
  { cle: 'date', libelle: 'Date', type: 'date' },
  { cle: 'type', libelle: 'Type', type: 'text' },
  { cle: 'auteur', libelle: 'Auteur', type: 'text' },
  { cle: 'contenu', libelle: 'Contenu', type: 'text' },
];

// Feuille Synthèse — agrégats des volets saisissables (Éducation, Santé, Social, Spiritualité, Historique)
const COLONNES_SYNTHESE: { cle: string; libelle: string; type: string }[] = [
  { cle: 'volet', libelle: 'Volet', type: 'text' },
  { cle: 'nombrePassages', libelle: 'Nombre de passages', type: 'nombre' },
  { cle: 'dernierPassage', libelle: 'Dernier passage', type: 'date' },
  { cle: 'derniereEcheance', libelle: 'Dernière échéance', type: 'date' },
];

// Convertit une valeur ISO (ou texte) en Date réelle pour Excel
function versDate(valeur: any): Date | string {
  if (!valeur) return '';
  if (valeur instanceof Date) return valeur;
  const texte = String(valeur);
  // ISO ou AAAA-MM-JJ
  const d = new Date(texte);
  if (!isNaN(d.getTime())) return d;
  return texte;
}

// Formatte une valeur selon le type de colonne
function formaterValeur(valeur: any, type?: string): any {
  if (valeur === null || valeur === undefined || valeur === '') return '';
  if (type === 'date') return versDate(valeur);
  return valeur;
}

// Largeur de colonne : en-tête + contenu formaté, plafonnée pour un rendu lisible
function largeurColonne(libelle: string, valeurs: any[], cap = 50): { wch: number } {
  let max = String(libelle || '').length;
  for (const v of valeurs) {
    if (v === null || v === undefined) continue;
    max = Math.max(max, v instanceof Date ? 10 : String(v).length);
  }
  return { wch: Math.min(Math.max(max + 2, 12), cap) };
}

// Applique le ton de charte : en-têtes (bleu nuit + texte blanc, wrap), filtres, largeurs.
// Sur les lignes de données : wrap sur toute la largeur, alternance light/blanc, dates réelles en FORMAT_DATE.
function styliserFeuille(ws: XLSX.WorkSheet, indexColonnesDate: number[] = []): void {
  const ref = ws['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);

  // En-têtes en gras, blanc sur bleu nuit
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: CHARTE_COULEURS.blanc } },
        fill: {
          type: 'pattern',
          patternType: 'solid',
          fgColor: { rgb: CHARTE_COULEURS.nuit },
          bgColor: { rgb: CHARTE_COULEURS.nuit },
        },
        alignment: { wrapText: true, vertical: 'top', horizontal: 'left' },
      };
    }
  }

  for (let R = 1; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      const base = cell.s || {};
      const s: any = {
        ...base,
        alignment: { ...(base.alignment || {}), wrapText: true, vertical: 'top', horizontal: 'left' },
      };
      if (R % 2 === 0) {
        s.fill = {
          type: 'pattern',
          patternType: 'solid',
          fgColor: { rgb: CHARTE_COULEURS.fond },
          bgColor: { rgb: CHARTE_COULEURS.fond },
        };
      }
      // Dates réelles : valeur tournée en serial Excel + format affichable AAAA-MM-JJ
      if (indexColonnesDate.includes(C - range.s.c) && typeof cell.v === 'number' && !isNaN(cell.v)) {
        cell.z = FORMAT_DATE;
      }
      cell.s = s;
    }
  }
}

// Construit une feuille stylisée à partir d'une config de colonnes et de lignes (objets clé → valeur)
function construireFeuilleGenerique(colonnes: any[], lignes: any[]): XLSX.WorkSheet {
  const aoa: any[][] = [colonnes.map((c) => c.libelle)];
  lignes.forEach((ligne) => aoa.push(colonnes.map((c) => formaterValeur(ligne[c.cle], c.type))));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = colonnes.map((c, i) => largeurColonne(c.libelle, aoa.slice(1).map((l) => l[i])));
  const ref = ws['!ref'];
  if (ref) ws['!autofilter'] = { ref };
  styliserFeuille(ws, colonnes.map((c, i) => (c.type === 'date' ? i : -1)).filter((i) => i >= 0));
  return ws;
}

// Feuille Éducation / Santé / Social / Spiritualité — colonnes = VOLET_COLONNES[cle].colonnes
function construireFeuillePassages(voletKey: string, passages: any[]): XLSX.WorkSheet | null {
  const config = (VOLET_COLONNES as any)[voletKey];
  if (!config || !config.colonnes) return null;
  const colonnes: any[] = config.colonnes;

  const lignes = passages
    .filter((p) => p.voletType === voletKey)
    .map((p) => {
      const donnees = p.donnees || {};
      return {
        // Les données du passage (symptomes, traitement, evolution, suivi, …) complètent la ligne
        ...donnees,
        // Champs canoniques du passage — toujours à jour même si donnees contient des clés similaires
        date: p.datePassage,
        auteur: p.auteur,
        remarques: p.remarques || '',
        prochaineEcheance: p.prochaineEcheance || '',
      };
    });

  return construireFeuilleGenerique(colonnes, lignes);
}

// Feuille Synthèse — un résumé par volet : Nb de passages, dernier passage, dernière échéance
function construireFeuilleSynthese(passages: any[]): XLSX.WorkSheet {
  const lignes = ORDRE_VOLETS.filter((cle) => cle !== 'synthese').map((voletKey) => {
    const liste = passages.filter((p) => p.voletType === voletKey);
    let dernierPassage: Date | null = null;
    let derniereEcheance: Date | null = null;
    for (const p of liste) {
      const d = new Date(String(p.datePassage || ''));
      if (!isNaN(d.getTime()) && (dernierPassage === null || d > dernierPassage)) dernierPassage = d;
      if (p.prochaineEcheance) {
        const e = new Date(String(p.prochaineEcheance));
        if (!isNaN(e.getTime()) && (derniereEcheance === null || e > derniereEcheance)) derniereEcheance = e;
      }
    }
    return {
      volet: LIBELLES_VOLETS[voletKey] || voletKey,
      nombrePassages: liste.length,
      dernierPassage: dernierPassage || '',
      derniereEcheance: derniereEcheance || '',
    };
  });
  const total = lignes.reduce((somme, l) => somme + l.nombrePassages, 0);
  return construireFeuilleGenerique(COLONNES_SYNTHESE, [
    ...lignes,
    { volet: 'Total', nombrePassages: total, dernierPassage: '', derniereEcheance: '' },
  ]);
}

// Feuille Historique — événements de la personne (échanges + passages)
// Colonnes : VOLET_COLONNES.historique — COLONNES_HISTORIQUE en secours
function construireFeuilleHistorique(evenements: PersonneExport['evenements']): XLSX.WorkSheet {
  const colonnes: any[] = (VOLET_COLONNES as any).historique?.colonnes || COLONNES_HISTORIQUE;
  const liste = (evenements || []).map((e) => ({
    date: e.date,
    type: e.type,
    auteur: e.auteur,
    contenu: e.contenu,
  }));
  return construireFeuilleGenerique(colonnes, liste);
}

// Feuille Identité — en-tête + ligne de la personne
function construireFeuilleIdentite(personne?: PersonneExport): XLSX.WorkSheet {
  return construireFeuilleGenerique(
    [
      { cle: 'nom', libelle: 'Nom', type: 'text' },
      { cle: 'prenom', libelle: 'Prénom', type: 'text' },
      { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
      { cle: 'telephone', libelle: 'Téléphone', type: 'text' },
      { cle: 'code', libelle: 'Code de filiation', type: 'text' },
    ],
    [{
      nom: personne?.nom || '',
      prenom: personne?.prenom || '',
      dateNaissance: versDate(personne?.dateNaissance) || '',
      telephone: personne?.telephone || '',
      code: personne?.code || '',
    }],
  );
}

// Construit le classeur complet : Identité, Synthèse, un onglet par volet, Historique
export function construireWorkbook(personneId: number, voletActif: string, personne?: PersonneExport): XLSX.WorkBook {
  void personneId;
  void voletActif;
  const workbook = XLSX.utils.book_new();
  const passages = personne?.passages || [];

  XLSX.utils.book_append_sheet(workbook, construireFeuilleIdentite(personne), 'Identité');
  XLSX.utils.book_append_sheet(workbook, construireFeuilleSynthese(passages), 'Synthèse');

  // Un onglet par volet — Éducation, Santé, Social, Spiritualité
  for (const voletKey of ORDRE_VOLETS) {
    if (voletKey === 'synthese' || voletKey === 'historique') continue;
    const ws = construireFeuillePassages(voletKey, passages);
    if (ws) XLSX.utils.book_append_sheet(workbook, ws, LIBELLES_VOLETS[voletKey]);
  }

  XLSX.utils.book_append_sheet(workbook, construireFeuilleHistorique(personne?.evenements), 'Historique');

  return workbook;
}

// Exporte le dossier complet vers un fichier .xlsx (API inchangée)
export function exporterExcel(personneId: number, voletActif: string, personne?: PersonneExport): void {
  const workbook = construireWorkbook(personneId, voletActif, personne);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acsf-dossier-${personneId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
