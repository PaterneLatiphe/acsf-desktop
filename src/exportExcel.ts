// Export Excel .xlsx - un onglet par volet, en-têtes en gras, dates réelles, rien de coupé
// Utilise la configuration unique VOLET_COLONNES

import * as XLSX from 'xlsx';
import { VOLET_COLONNES } from './voletsConfig/voletsConfig';

export interface PersonneExport {
  nom: string;
  prenom: string;
  dateNaissance?: string;
  telephone?: string;
  code?: string;
  passages?: any[];
}

const LIBELLES_VOLETS: Record<string, string> = {
  synthese: 'Synthèse',
  education: 'Éducation',
  sante: 'Santé',
  social: 'Social',
  spiritualite: 'Spiritualité',
  historique: 'Historique',
};

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
  if (valeur === null || valeur === undefined) return '';
  if (type === 'date') return versDate(valeur);
  return valeur;
}

// Construit une feuille pour un volet donné
function construireFeuille(voletKey: string, passages: any[]): XLSX.WorkSheet | null {
  const config = (VOLET_COLONNES as any)[voletKey];
  if (!config || !config.colonnes) return null;

  const colonnes: any[] = config.colonnes;

  const lignes = passages
    .filter((p) => p.voletType === voletKey)
    .map((p) => {
      const donnees = p.donnees || {};
      return {
        date: p.datePassage,
        auteur: p.auteur,
        remarques: p.remarques || '',
        prochaineEcheance: p.prochaineEcheance || '',
        ...donnees,
      };
    });

  // Construire la matrice AOA : en-têtes + lignes
  const entetes = colonnes.map((c) => c.libelle);
  const aoa: any[][] = [entetes];

  for (const ligne of lignes) {
    aoa.push(
      colonnes.map((c) => formaterValeur(ligne[c.cle], c.type))
    );
  }

  // Si aucune ligne, garder au moins les en-têtes pour montrer la structure
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Largeurs de colonnes basées sur en-tête + contenu
  const largeurs = colonnes.map((c) => {
    let max = (c.libelle || '').length;
    for (const ligne of lignes) {
      const v = ligne[c.cle];
      const longueur = v === null || v === undefined ? 0 : String(v).length;
      if (longueur > max) max = longueur;
    }
    // Cap pour éviter des colonnes trop larges (wrap géré ensuite)
    const wch = Math.min(Math.max(max + 2, 12), 50);
    return { wch };
  });
  ws['!cols'] = largeurs;

  // En-têtes en gras + wrap global
  const ref = ws['!ref'];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = ws[cellAddr];
      if (cell) {
        cell.s = {
          font: { bold: true },
          alignment: { wrapText: true, vertical: 'top' },
        };
      }
    }
    // Alignement wrap + vertical top sur toutes les cellules
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (cell) {
          cell.s = {
            alignment: { wrapText: true, vertical: 'top' },
            ...(cell.s || {}),
          };
        }
      }
    }
  }

  return ws;
}

// Exporte le dossier complet vers un fichier .xlsx
export function exporterExcel(
  personneId: number,
  voletActif: string,
  personne?: PersonneExport
): void {
  const workbook = XLSX.utils.book_new();
  const passages = personne?.passages || [];

  // Feuille identité
  const identiteAoa: any[][] = [
    ['Nom', 'Prénom', 'Date de naissance', 'Téléphone', 'Code de filiation'],
    [
      personne?.nom || '',
      personne?.prenom || '',
      personne?.dateNaissance || '',
      personne?.telephone || '',
      personne?.code || '',
    ],
  ];
  const wsIdentite = XLSX.utils.aoa_to_sheet(identiteAoa);
  wsIdentite['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
  for (let C = 0; C < 5; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (wsIdentite[addr]) wsIdentite[addr].s = { font: { bold: true } };
  }
  XLSX.utils.book_append_sheet(workbook, wsIdentite, 'Identité');

  // Un onglet par volet (dans l'ordre logique)
  const ordre = ['synthèse', 'education', 'sante', 'social', 'spiritualite', 'historique'];
  const cleParLibelle: Record<string, string> = {
    synthese: 'synthese',
    education: 'education',
    sante: 'sante',
    social: 'social',
    spiritualite: 'spiritualite',
    historique: 'historique',
  };

  for (const key of Object.keys(cleParLibelle)) {
    const ws = construireFeuille(key, passages);
    if (ws) {
      const nomOnglet = LIBELLES_VOLETS[key] || key;
      XLSX.utils.book_append_sheet(workbook, ws, nomOnglet.slice(0, 31));
    }
  }
  void voletActif;
  void ordre;

  // Écriture + téléchargement
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
