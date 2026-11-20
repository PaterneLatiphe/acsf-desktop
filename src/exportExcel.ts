// Export du carnet de suivi complet : un onglet par volet, mise en forme ACSF commune.
// Généré avec ExcelJS via exportTableur.ts (en-tête agence + logo, tableau, impression).

import type { Workbook } from 'exceljs';
import { VOLET_COLONNES } from './voletsConfig/voletsConfig';
import {
  ajouterFeuilleTableur,
  creerClasseur,
  nomFichierExport,
  telechargerClasseur,
  type ColonneTableur,
} from './exportTableur';
import { UTILISATEUR_COURANT } from './utilisateur';

export interface PersonneExport {
  nom: string;
  prenom?: string;
  dateNaissance?: string;
  telephone?: string;
  code?: string;
  passages?: any[];
  // Événements de l'historique de la personne (échanges + passages)
  evenements?: { date: string; type: string; auteur: string; contenu: string }[];
}

const ORDRE_VOLETS: string[] = ['synthese', 'education', 'sante', 'social', 'spiritualite', 'historique'];

const LIBELLES_VOLETS: Record<string, string> = {
  synthese: 'Synthèse',
  education: 'Éducation',
  sante: 'Santé',
  social: 'Social',
  spiritualite: 'Spiritualité',
  historique: 'Historique',
};

const COLONNES_SYNTHESE: ColonneTableur[] = [
  { cle: 'volet', libelle: 'Volet', type: 'texte' },
  { cle: 'nombrePassages', libelle: 'Nombre de passages', type: 'nombre' },
  { cle: 'dernierPassage', libelle: 'Dernier passage', type: 'date' },
  { cle: 'derniereEcheance', libelle: 'Dernière échéance', type: 'date' },
];

function colonnesDepuisConfig(voletKey: string): ColonneTableur[] {
  const config = (VOLET_COLONNES as any)[voletKey];
  const colonnes = config?.colonnes || [];
  return colonnes.map((c: any) => ({
    cle: c.cle,
    libelle: c.libelle,
    type: c.type === 'date' ? 'date' : 'texte',
  }));
}

function identitePersonne(personne?: PersonneExport): string {
  const nom = String(personne?.nom || '').trim();
  const prenom = String(personne?.prenom || '').trim();
  return `${prenom} ${nom}`.trim() || 'personne';
}

/** Construit le classeur complet : Identité, Synthèse, un onglet par volet, Historique. */
export async function construireWorkbook(personneId: number, voletActif: string, personne?: PersonneExport): Promise<Workbook> {
  void personneId;
  void voletActif;
  const nom = identitePersonne(personne);
  const classeur = creerClasseur(`Carnet de suivi — ${nom}`, UTILISATEUR_COURANT);
  const passages = personne?.passages || [];

  // Feuille Identité
  ajouterFeuilleTableur(classeur, {
    titre: `FICHE IDENTITÉ — ${nom}`,
    nomOnglet: 'Identité',
    colonnes: [
      { cle: 'nom', libelle: 'Nom', type: 'texte' },
      { cle: 'prenom', libelle: 'Prénom', type: 'texte' },
      { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
      { cle: 'telephone', libelle: 'Téléphone', type: 'telephone' },
      { cle: 'code', libelle: 'Code de filiation', type: 'texte' },
    ],
    lignes: [{
      nom: personne?.nom || '',
      prenom: personne?.prenom || '',
      dateNaissance: personne?.dateNaissance || '',
      telephone: personne?.telephone || '',
      code: personne?.code || '',
    }],
    exportePar: UTILISATEUR_COURANT,
    libelleTotal: 'Total : 1 personne',
  });

  // Feuille Synthèse — un résumé par volet
  const lignesSynthese = ORDRE_VOLETS.filter((cle) => cle !== 'synthese' && cle !== 'historique').map((voletKey) => {
    const liste = passages.filter((p) => p.voletType === voletKey);
    let dernierPassage = '';
    let derniereEcheance = '';
    for (const p of liste) {
      const d = new Date(String(p.datePassage || ''));
      if (!isNaN(d.getTime()) && (!dernierPassage || d > new Date(String(dernierPassage)))) dernierPassage = String(p.datePassage);
      if (p.prochaineEcheance) {
        const e = new Date(String(p.prochaineEcheance));
        if (!isNaN(e.getTime()) && (!derniereEcheance || e > new Date(String(derniereEcheance)))) derniereEcheance = String(p.prochaineEcheance);
      }
    }
    return {
      volet: LIBELLES_VOLETS[voletKey] || voletKey,
      nombrePassages: liste.length,
      dernierPassage,
      derniereEcheance,
    };
  });
  const total = lignesSynthese.reduce((somme, l) => somme + l.nombrePassages, 0);
  ajouterFeuilleTableur(classeur, {
    titre: `SYNTHÈSE DU SUIVI — ${nom}`,
    nomOnglet: 'Synthèse',
    colonnes: COLONNES_SYNTHESE,
    lignes: lignesSynthese,
    exportePar: UTILISATEUR_COURANT,
    libelleTotal: `Total : ${total} passages`,
  });

  // Un onglet par volet saisissable
  for (const voletKey of ORDRE_VOLETS) {
    if (voletKey === 'synthese' || voletKey === 'historique') continue;
    const colonnes = colonnesDepuisConfig(voletKey);
    if (!colonnes.length) continue;
    const lignes = passages
      .filter((p) => p.voletType === voletKey)
      .map((p) => ({
        ...(p.donnees || {}),
        date: p.datePassage,
        auteur: p.auteur,
        remarques: p.remarques || '',
        prochaineEcheance: p.prochaineEcheance || '',
      }));
    ajouterFeuilleTableur(classeur, {
      titre: `CARNET DE SUIVI — ${LIBELLES_VOLETS[voletKey] || voletKey} — ${nom}`,
      nomOnglet: LIBELLES_VOLETS[voletKey] || voletKey,
      colonnes,
      lignes,
      exportePar: UTILISATEUR_COURANT,
      libelleTotal: `Total : ${lignes.length} passages`,
    });
  }

  // Feuille Historique
  const evenements = (personne?.evenements || []).map((e) => ({
    date: e.date,
    type: e.type,
    auteur: e.auteur,
    contenu: e.contenu,
  }));
  ajouterFeuilleTableur(classeur, {
    titre: `HISTORIQUE — ${nom}`,
    nomOnglet: 'Historique',
    colonnes: colonnesDepuisConfig('historique'),
    lignes: evenements,
    exportePar: UTILISATEUR_COURANT,
    libelleTotal: `Total : ${evenements.length} événements`,
  });

  return classeur;
}

/** Exporte le dossier complet vers un fichier .xlsx. */
export async function exporterExcel(personneId: number, voletActif: string, personne?: PersonneExport): Promise<void> {
  const classeur = await construireWorkbook(personneId, voletActif, personne);
  const titre = `Carnet de suivi ${identitePersonne(personne)}`;
  await telechargerClasseur(classeur, nomFichierExport(titre, new Date()));
}
