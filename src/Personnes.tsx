import React, { useEffect, useMemo, useState } from 'react';
import { UserRoundPlus, X, Download } from 'lucide-react';
import { creerPersonne, listerPersonnes, type Personne } from './db';
import { dateIso, exporterTableur } from './exportTableur';
import { UTILISATEUR_COURANT } from './utilisateur';
import Volets from './Volets';

type Champ = {
  cle: string;
  libelle: string;
  obligatoire?: boolean;
  type?: 'text' | 'date' | 'select';
  options?: string[];
};

const CHAMPS: Champ[] = [
  { cle: 'prenom', libelle: 'Prénom', obligatoire: true },
  { cle: 'nom', libelle: 'Nom', obligatoire: true },
  { cle: 'sexe', libelle: 'Sexe', type: 'select', options: ['', 'Féminin', 'Masculin'] },
  { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
  { cle: 'telephone', libelle: 'Téléphone' },
  { cle: 'adresse', libelle: 'Adresse / quartier' },
  { cle: 'langue', libelle: 'Langue principale', type: 'select', options: ['fr', 'Mooré', 'Dioula', 'Autre'] },
  { cle: 'programme', libelle: 'Programme', type: 'select', options: ['', 'Soutien scolaire', 'Appui familial', 'Formation parents'] },
];

type Formulaire = Record<string, string>;

const VIDE: Formulaire = {
  prenom: '', nom: '', sexe: '', dateNaissance: '', telephone: '', adresse: '', langue: 'fr', programme: '',
};

const ABREVIATIONS_PROGRAMME: Record<string, string> = {
  'Soutien scolaire': 'SS',
  'Appui familial': 'AF',
  'Formation parents': 'FP',
};

function abreviationProgramme(programme: string): string {
  if (!programme) return '—';
  return ABREVIATIONS_PROGRAMME[programme] ?? programme;
}

const Personnes: React.FC<{ onChanger?: () => void }> = ({ onChanger }) => {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [requete, setRequete] = useState('');
  const [chargement, setChargement] = useState(true);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [formulaire, setFormulaire] = useState<Formulaire>(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [selection, setSelection] = useState<Personne | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const recharger = async () => {
    setChargement(true);
    const liste = await listerPersonnes();
    setPersonnes(liste);
    setChargement(false);
  };

  useEffect(() => {
    recharger();
  }, []);

  const resultats = useMemo(() => {
    const q = requete.trim().toLowerCase();
    if (!q) return personnes;
    return personnes.filter((p) =>
      `${p.prenom} ${p.nom} ${p.telephone} ${p.code}`.toLowerCase().includes(q),
    );
  }, [personnes, requete]);

  const ouvrirFormulaire = () => {
    setFormulaire(VIDE);
    setErreur(null);
    setFormulaireOuvert(true);
  };

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaire.prenom.trim() || !formulaire.nom.trim()) {
      setErreur('Le prénom et le nom sont obligatoires.');
      return;
    }
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
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)', padding: '0 var(--sp-2)', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondaire" style={{ minHeight: 36, padding: '6px 12px', fontSize: '.8rem' }} onClick={() => setSelection(null)}>
            ← Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <b style={{ fontSize: '1.1rem', color: 'var(--nuit)' }}>Dossier — {selection.prenom} {selection.nom}</b>
            <span style={{ fontSize: '.78rem', color: 'var(--gris)' }}>
              {selection.dateNaissance ? `né(e) ${selection.dateNaissance} · ` : ''}{selection.telephone || 'pas de tél.'} · Code : <code>{selection.code}</code> ·
              <span className="pill">{selection.statut === 'suivie' ? 'SUIVI' : selection.statut.toUpperCase()}</span>
            </span>
          </div>
        </div>
        <div className="fiche-page">
          <div className="dossier-corps">
            <Volets personneId={selection.id} utilisateur={UTILISATEUR_COURANT} personne={selection} onChanger={recharger} />
          </div>
        </div>
        {toast && <div role="status" className="toast">{toast}</div>}
      </>
    );
  }

  return (
    <>
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

      <label className="recherche" style={{ maxWidth: 520, margin: '0 0 var(--sp-4) 0', background: 'var(--feuille)', border: '1px solid var(--ligne)' }}>
        <input
          type="text"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Rechercher : nom, prénom, téléphone, code…"
          aria-label="Rechercher une personne"
          style={{ color: 'var(--plume)' }}
        />
      </label>

      {chargement ? (
        <div className="grille"><div className="bloc"><div className="skel skel-ligne" /><div className="skel skel-ligne" /></div></div>
      ) : resultats.length === 0 ? (
        <div className="vide">
          <b>{requete ? 'Aucune personne ne correspond à la recherche.' : 'Aucune personne enregistrée.'}</b>
          {requete
            ? 'Essayez un autre nom, prénom, téléphone ou code.'
            : 'Créez la première fiche personne avec le bouton « Nouvelle personne ».'}
        </div>
      ) : (
        <div className="bloc" style={{ padding: 'var(--sp-2) var(--sp-4)' }}>
          <table className="tableau-personnes">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Sexe</th>
                <th>Date de naissance</th>
                <th>Téléphone</th>
                <th>Prog.</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {resultats.map((p) => (
                <tr key={p.id} onClick={() => setSelection(p)} style={{ cursor: 'pointer' }}>
                  <td>{p.nom}</td>
                  <td>{p.prenom}</td>
                  <td>{p.sexe || '—'}</td>
                  <td>{p.dateNaissance || '—'}</td>
                  <td>{p.telephone || '—'}</td>
                  <td title={p.programme || 'sans programme'}>{abreviationProgramme(p.programme)}</td>
                  <td><span className="pill ok">{p.statut === 'suivie' ? 'SUIVI' : p.statut.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sous-titre" style={{ marginTop: 'var(--sp-3)', marginBottom: 0 }}>
            Abréviations programme : SS = Soutien scolaire · AF = Appui familial · FP = Formation parents
          </p>
        </div>
      )}

      {formulaireOuvert && (
        <div className="dossier" role="dialog" aria-modal="true" aria-label="Nouvelle personne">
          <form onSubmit={enregistrer}>
            <div className="dossier-tete">
              <div>
                <b>Nouvelle personne</b>
                <small>Les champs prénom et nom sont obligatoires.</small>
              </div>
              <button type="button" className="btn btn-secondaire" onClick={() => setFormulaireOuvert(false)} aria-label="Annuler">
                <X size={18} /> Annuler
              </button>
            </div>
            <div className="grille-form">
              {CHAMPS.map((champ) => (
                <label key={champ.cle} className="champ">
                  <span>{champ.libelle}{champ.obligatoire ? ' *' : ''}</span>
                  {champ.type === 'select' ? (
                    <select
                      value={formulaire[champ.cle]}
                      onChange={(e) => setFormulaire({ ...formulaire, [champ.cle]: e.target.value })}
                    >
                      {(champ.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt || '—'}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={champ.type === 'date' ? 'date' : 'text'}
                      value={formulaire[champ.cle]}
                      onChange={(e) => setFormulaire({ ...formulaire, [champ.cle]: e.target.value })}
                    />
                  )}
                </label>
              ))}
            </div>
            {erreur && <p role="alert" style={{ color: 'var(--brique)', marginTop: 'var(--sp-3)' }}>{erreur}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
              <button type="button" className="btn btn-secondaire" onClick={() => setFormulaireOuvert(false)}>Annuler</button>
              <button type="submit" className="btn btn-principal">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div role="status" className="toast">{toast}</div>}
    </>
  );
};

export default Personnes;
