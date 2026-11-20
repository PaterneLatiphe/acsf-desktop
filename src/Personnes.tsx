// Écran Personnes : chargement, recherche, création, fiche et export. Logique inchangée.

import React, { useEffect, useMemo, useState } from 'react';
import { UserRoundPlus, Download } from 'lucide-react';
import { creerPersonne, listerPersonnes, type Personne } from './db';
import { dateIso, exporterTableur } from './exportTableur';
import { UTILISATEUR_COURANT } from './utilisateur';
import { Erreur, IllustrationVide } from './Etats';
import Volets from './Volets';
import FormulairePersonne, { VIDE, type Formulaire } from './personnes/FormulairePersonne';
import ListePersonnes from './personnes/ListePersonnes';

const Personnes: React.FC<{ onChanger?: () => void }> = ({ onChanger }) => {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [requete, setRequete] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [formulaire, setFormulaire] = useState<Formulaire>(VIDE);
  const [erreurs, setErreurs] = useState<Formulaire>({});
  const [selection, setSelection] = useState<Personne | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const recharger = async () => {
    setChargement(true);
    try {
      const liste = await listerPersonnes();
      setPersonnes(liste);
      setErreurChargement(null);
    } catch {
      setErreurChargement('La liste des personnes n’a pas pu être chargée.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { recharger(); }, []);

  const resultats = useMemo(() => {
    const q = requete.trim().toLowerCase();
    if (!q) return personnes;
    return personnes.filter((p) =>
      `${p.prenom} ${p.nom} ${p.telephone} ${p.code}`.toLowerCase().includes(q),
    );
  }, [personnes, requete]);

  const ouvrirFormulaire = () => {
    setFormulaire(VIDE);
    setErreurs({});
    setFormulaireOuvert(true);
  };

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalides: Formulaire = {};
    if (!formulaire.nom.trim()) invalides.nom = 'Le nom est obligatoire.';
    if (!formulaire.prenom.trim()) invalides.prenom = 'Le prénom est obligatoire.';
    setErreurs(invalides);
    if (Object.keys(invalides).length > 0) return;
    await creerPersonne({
      prenom: formulaire.prenom.trim(),
      nom: formulaire.nom.trim(),
      sexe: formulaire.sexe,
      dateNaissance: formulaire.dateNaissance,
      telephone: formulaire.telephone.trim(),
      adresse: formulaire.adresse.trim(),
      langue: formulaire.langue,
      programme: formulaire.programme,
    });
    setFormulaireOuvert(false);
    await recharger();
    onChanger?.();
    setToast('Personne enregistrée dans la base locale.');
    window.setTimeout(() => setToast(null), 2600);
  };

  const exporterExcelPersonnes = async (liste: Personne[]) => {
    await exporterTableur({
      titre: 'LISTE DES PERSONNES SUIVIES',
      nomOnglet: 'Personnes',
      colonnes: [
        { cle: 'nom', libelle: 'Nom', type: 'texte' },
        { cle: 'prenom', libelle: 'Prénom', type: 'texte' },
        { cle: 'sexe', libelle: 'Sexe', type: 'texte' },
        { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
        { cle: 'telephone', libelle: 'Téléphone', type: 'telephone' },
        { cle: 'programme', libelle: 'Programme', type: 'programme' },
        { cle: 'statut', libelle: 'Statut', type: 'statut' },
      ],
      lignes: liste,
      exportePar: UTILISATEUR_COURANT,
      filtres: requete.trim() ? `recherche « ${requete.trim()} »` : '',
      libelleTotal: `Total : ${liste.length} personnes`,
    }, UTILISATEUR_COURANT, `ACSF_Liste-personnes_${dateIso()}.xlsx`);
    setToast('Export Excel généré.');
    window.setTimeout(() => setToast(null), 2600);
  };

  if (selection) {
    return (
      <div className="page-enter dossier-page">
        <div className="fiche-page">
          <div className="dossier-corps">
            <Volets
              personneId={selection.id}
              utilisateur={UTILISATEUR_COURANT}
              personne={selection}
              onChanger={recharger}
              onRetour={() => setSelection(null)}
            />
          </div>
        </div>
        {toast && <div role="status" className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page">Personnes</h1>
          <p className="sous-titre">Base de données des personnes suivies par l'agence</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondaire" onClick={() => exporterExcelPersonnes(resultats)} disabled={resultats.length === 0}>
            <Download size={18} /> Exporter
          </button>
          <button type="button" className="btn btn-principal" onClick={ouvrirFormulaire}>
            <UserRoundPlus size={18} /> Nouvelle personne
          </button>
        </div>
      </div>

      <label className="recherche" style={{ maxWidth: 520, margin: 'var(--sp-5) 0', background: 'var(--feuille)' }}>
        <input
          type="text"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Rechercher : nom, prénom, téléphone, code…"
          aria-label="Rechercher une personne"
        />
      </label>

      {erreurChargement && <Erreur message={erreurChargement} onRetry={recharger} />}
      {chargement ? (
        <div className="grille"><div className="bloc"><div className="skel skel-ligne" /><div className="skel skel-ligne" /></div></div>
      ) : resultats.length === 0 ? (
        <div className="vide">
          <IllustrationVide />
          <b>{requete ? 'Aucune personne ne correspond à la recherche.' : 'Aucune personne enregistrée.'}</b>
          {requete
            ? 'Essayez un autre nom, prénom, téléphone ou code.'
            : 'Utilisez « Nouvelle personne » pour créer la première fiche.'}
        </div>
      ) : (
        <ListePersonnes personnes={resultats} surSelection={setSelection} />
      )}

      {formulaireOuvert && (
        <FormulairePersonne
          formulaire={formulaire}
          erreurs={erreurs}
          onChange={(valeurs) => { setFormulaire(valeurs); if (Object.keys(erreurs).length) setErreurs({}); }}
          onFermer={() => setFormulaireOuvert(false)}
          onEnregistrer={enregistrer}
        />
      )}
      {toast && <div role="status" className="toast">{toast}</div>}
    </div>
  );
};

export default Personnes;
