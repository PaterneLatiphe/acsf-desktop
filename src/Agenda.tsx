import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, UserRoundPlus } from 'lucide-react';
import { changerStatutRdv, creerRdv, listerPersonnes, listerRdvs, type Personne, type Rdv } from './db';
import { formaterDateHeureFr } from './format';
import { Erreur } from './Etats';
import { Toast } from './EtatDonnees';
import { useToast } from './useToast';
import FormulaireCadre, { type SectionFormulaire } from './formulaires/FormulaireCadre';

const TYPES: { cle: string; libelle: string }[] = [
  { cle: 'rdv_agence', libelle: 'RDV agence' },
  { cle: 'sortie_terrain', libelle: 'Sortie terrain' },
  { cle: 'entretien_tele', libelle: 'Entretien téléphone' },
];

const LIBELLES_STATUT: Record<string, string> = {
  demande: 'DEMANDE',
  propose: 'PROPOSÉ',
  valide: 'VALIDÉ',
  refuse: 'REFUSÉ',
};

const RDV_VIDE = { personneId: '', type: 'rdv_agence', dateHeure: '', notes: '' };

const Agenda: React.FC = () => {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [typeFiltre, setTypeFiltre] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [personneId, setPersonneId] = useState('');
  const [type, setType] = useState('rdv_agence');
  const [dateHeure, setDateHeure] = useState('');
  const [notes, setNotes] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const { toast, afficherToast, mettreEnPause, reprendre } = useToast();

  const recharger = async () => {
    setChargement(true);
    try {
      const [listeRdvs, listePersonnes] = await Promise.all([listerRdvs(), listerPersonnes()]);
      setRdvs(listeRdvs);
      setPersonnes(listePersonnes);
      setErreurChargement(null);
    } catch {
      setErreurChargement('L’agenda n’a pas pu être chargé.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    recharger();
  }, []);

  const rdvsFiltres = typeFiltre ? rdvs.filter((r) => r.type === typeFiltre) : rdvs;

  const ouvrirFormulaire = () => {
    setErreurs({});
    setFormulaireOuvert(true);
  };

  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalides: Record<string, string> = {};
    if (!personneId) invalides.personneId = 'Choisissez une personne.';
    if (!dateHeure) invalides.dateHeure = 'Choisissez une date et une heure.';
    setErreurs(invalides);
    if (Object.keys(invalides).length > 0) return;
    await creerRdv({ personneId: Number(personneId), type, statut: 'propose', dateHeure, notes: notes.trim() });
    setFormulaireOuvert(false);
    setPersonneId('');
    setDateHeure('');
    setNotes('');
    setErreurs({});
    await recharger();
    afficherToast('Rendez-vous enregistré.');
  };

  const changer = async (id: number, statut: string) => {
    await changerStatutRdv(id, statut);
    await recharger();
  };

  const nomPersonne = (id: number): string => {
    const p = personnes.find((x) => x.id === id);
    if (!p) return 'Personne à identifier';
    return `${p.prenom} ${p.nom}`;
  };

  const dateAffichee = (r: Rdv): string => formaterDateHeureFr(r.dateHeure);

  const sectionsRdv: SectionFormulaire[] = useMemo(() => [
    {
      titre: 'RENDEZ-VOUS',
      champs: [
        {
          cle: 'personneId', libelle: 'Personne', type: 'select', obligatoire: true,
          options: [
            { valeur: '', libelle: '— Choisir une personne —' },
            ...personnes.map((p) => ({ valeur: String(p.id), libelle: `${p.prenom} ${p.nom}` })),
          ],
        },
        { cle: 'type', libelle: 'Type', type: 'select', obligatoire: true, options: TYPES.map((t) => ({ valeur: t.cle, libelle: t.libelle })) },
        { cle: 'dateHeure', libelle: 'Date et heure', type: 'datetime', obligatoire: true, indications: 'jj/mm/aaaa · hh:mm' },
        { cle: 'notes', libelle: 'Notes', placeholder: 'Sujet, lieu, consignes…' },
      ],
    },
  ], [personnes]);

  const valeursRdv = { personneId, type, dateHeure, notes };

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page">Agenda</h1>
          <p className="sous-titre">Les rendez-vous : RDV agence, sorties terrain, entretiens</p>
        </div>
        <button type="button" className="btn btn-principal" style={{ marginLeft: 'auto' }} onClick={ouvrirFormulaire}>
          <UserRoundPlus size={18} /> Nouveau rendez-vous
        </button>
      </div>

      {erreurChargement && <Erreur message={erreurChargement} onRetry={recharger} />}

      <div className="grille">
        <div className="bloc">
          <div className="bloc-titre">
            Prochain rendez-vous
            <select
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
              aria-label="Filtrer par type de rendez-vous"
              style={{ height: 36, borderRadius: 8, border: '1px solid var(--ligne)', background: 'var(--feuille)', padding: '0 10px' }}
            >
              <option value="">Tous types</option>
              {TYPES.map((t) => (
                <option key={t.cle} value={t.cle}>{t.libelle}</option>
              ))}
            </select>
          </div>
          {chargement ? (
            <div className="vide">
              <div className="skel skel-ligne" />
            </div>
          ) : rdvsFiltres.length === 0 ? (
            <div className="vide">
              <CalendarDays size={40} />
              <b>Aucun rendez-vous</b>
              Aucun rendez-vous planifié pour l'instant. Les rendez-vous de la famille ou de l'agence apparaîtront ici.
            </div>
          ) : (
            rdvsFiltres.map((r) => (
              <div className="ligne" key={r.id}>
                <div className="info" style={{ flex: 1, minWidth: 0 }}>
                  <b>{nomPersonne(r.personneId)}</b>
                  <small>{dateAffichee(r)}</small>
                </div>
                <span className="pill rdv">{TYPES.find((t) => t.cle === r.type)?.libelle ?? r.type}</span>
                <span className={`pill ${r.statut === 'valide' ? 'ok' : r.statut === 'refuse' ? 'ret' : 'pend'}`}>{LIBELLES_STATUT[r.statut] ?? r.statut.toUpperCase()}</span>
                {(r.statut === 'demande' || r.statut === 'propose') && (
                  <span style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                    <button type="button" className="btn btn-secondaire" onClick={() => changer(r.id, 'valide')}>
                      Valider
                    </button>
                    <button type="button" className="btn btn-secondaire" onClick={() => changer(r.id, 'refuse')}>
                      Refuser
                    </button>
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bloc">
          <div className="bloc-titre">
            Nouveau rendez-vous
            <button type="button" className="lien-bloc" onClick={ouvrirFormulaire}>Ouvrir le formulaire →</button>
          </div>
          <div className="vide">
            <CalendarDays size={40} />
            <b>Pas de rendez-vous en préparation</b>
            Les nouvelles demandes (famille) ou propositions (agence) apparaîtront ici, avec leurs actions de validation.
          </div>
        </div>
      </div>

      {formulaireOuvert && (
        <FormulaireCadre
          titre="Nouveau rendez-vous"
          sections={sectionsRdv}
          valeurs={valeursRdv}
          valeursInitiales={RDV_VIDE}
          erreurs={erreurs}
          onChange={(valeurs) => {
            setPersonneId(valeurs.personneId);
            setType(valeurs.type);
            setDateHeure(valeurs.dateHeure);
            setNotes(valeurs.notes);
            if (Object.keys(erreurs).length) setErreurs({});
          }}
          onFermer={() => setFormulaireOuvert(false)}
          onEnregistrer={ajouter}
          libelleEnregistrer="Ajouter"
          avecResumeErreurs
        />
      )}

      {toast && <Toast message={toast} onPause={mettreEnPause} onReprendre={reprendre} />}
    </div>
  );
};

export default Agenda;
