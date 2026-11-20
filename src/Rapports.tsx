// Écran Rapports : synthèse de l'agence, exportée avec la mise en forme commune
// (logo ACSF, en-tête ligne 1-5, tableau stylé, impression A4 paysage).

import React, { useEffect, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { listerPersonnes, type Personne } from './db';
import { dateIso, exporterTableur } from './exportTableur';
import { UTILISATEUR_COURANT } from './utilisateur';

const Rapports: React.FC = () => {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const liste = await listerPersonnes();
        if (actif) setPersonnes(liste);
      } catch {
        if (actif) setToast('Impossible de charger les données du rapport.');
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => { actif = false; };
  }, []);

  const exporter = async () => {
    setExportEnCours(true);
    try {
      await exporterTableur({
        titre: 'RAPPORT DE SUIVI — SYNTHÈSE GÉNÉRALE',
        nomOnglet: 'Rapport',
        colonnes: [
          { cle: 'nom', libelle: 'Nom', type: 'texte' },
          { cle: 'prenom', libelle: 'Prénom', type: 'texte' },
          { cle: 'sexe', libelle: 'Sexe', type: 'texte' },
          { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
          { cle: 'telephone', libelle: 'Téléphone', type: 'telephone' },
          { cle: 'programme', libelle: 'Programme', type: 'programme' },
          { cle: 'code', libelle: 'Code de filiation', type: 'texte' },
          { cle: 'createdAt', libelle: 'Enregistré le', type: 'date' },
          { cle: 'statut', libelle: 'Statut', type: 'statut' },
        ],
        lignes: personnes,
        exportePar: UTILISATEUR_COURANT,
        libelleTotal: `Total : ${personnes.length} personnes`,
      }, UTILISATEUR_COURANT, `ACSF_Rapport-suivi_${dateIso()}.xlsx`);
      setToast('Rapport Excel généré.');
      window.setTimeout(() => setToast(null), 2600);
    } catch {
      setToast('Le rapport n’a pas pu être généré.');
      window.setTimeout(() => setToast(null), 4000);
    } finally {
      setExportEnCours(false);
    }
  };

  const femmes = personnes.filter((p) => p.sexe === 'Féminin').length;
  const hommes = personnes.filter((p) => p.sexe === 'Masculin').length;

  return (
    <>
      <h1 className="page">Rapports</h1>
      <p className="sous-titre">Synthèses de l'agence, prêtes à imprimer ou à envoyer</p>

      <div className="bloc">
        <div className="bloc-titre">
          <BarChart3 size={18} aria-hidden="true" /> Rapport de suivi des personnes
        </div>
        <p style={{ color: 'var(--gris)', margin: 'var(--sp-2) 0 var(--sp-4)' }}>
          Une ligne par personne suivie : identité, contact, programme, date d'enregistrement et statut.
          Le fichier porte l'en-tête ACSF, les filtres et une mise en page prête pour l'impression.
        </p>

        <div className="kpis" style={{ marginBottom: 'var(--sp-4)' }}>
          <div className="kpi"><div className="kpi-label">Personnes suivies</div><div className="kpi-chiffre">{personnes.length}</div></div>
          <div className="kpi"><div className="kpi-label">Femmes</div><div className="kpi-chiffre">{femmes}</div></div>
          <div className="kpi"><div className="kpi-label">Hommes</div><div className="kpi-chiffre">{hommes}</div></div>
        </div>

        <button
          type="button"
          className="btn btn-principal"
          onClick={exporter}
          disabled={chargement || personnes.length === 0 || exportEnCours}
        >
          <Download size={18} /> {exportEnCours ? 'Génération…' : 'Exporter le rapport (Excel)'}
        </button>
        {personnes.length === 0 && !chargement && (
          <p style={{ marginTop: 'var(--sp-3)' }}>Aucune personne enregistrée : le rapport sera disponible après la première fiche.</p>
        )}
      </div>

      {toast && <div role="status" className="toast">{toast}</div>}
    </>
  );
};

export default Rapports;
