import React, { useEffect, useState } from 'react';
import { CalendarDays, UserRoundPlus } from 'lucide-react';
import { changerStatutRdv, creerRdv, listerPersonnes, listerRdvs, type Personne, type Rdv } from './db';

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
  const [erreur, setErreur] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const recharger = async () => {
    setChargement(true);
    const [listeRdvs, listePersonnes] = await Promise.all([listerRdvs(), listerPersonnes()]);
    setRdvs(listeRdvs);
    setPersonnes(listePersonnes);
    setChargement(false);
  };

  useEffect(() => {
    recharger();
  }, []);

  const rdvsFiltres = typeFiltre ? rdvs.filter((r) => r.type === typeFiltre) : rdvs;

  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personneId) {
      setErreur('Choisissez une personne.');
      return;
    }
    if (!dateHeure) {
      setErreur('Choisissez une date et une heure.');
      return;
    }
    await creerRdv({ personneId: Number(personneId), type, statut: 'propose', dateHeure, notes: notes.trim() });
    setFormulaireOuvert(false);
    setPersonneId('');
    setDateHeure('');
    setNotes('');
    setErreur(null);
    await recharger();
    setToast('Rendez-vous enregistré.');
    window.setTimeout(() => setToast(null), 2600);
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

  const dateAffichee = (r: Rdv): string => {
    if (!r.dateHeure) return '—';
    const valeur = String(r.dateHeure).slice(0, 16);
    return valeur.replace('T', 'à ');
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page">Agenda</h1>
          <p className="sous-titre">Les rendez-vous : RDV agence, sorties terrain, entretiens</p>
        </div>
        <button type="button" className="btn btn-principal" style={{ marginLeft: 'auto' }} onClick={() => setFormulaireOuvert(true)}>
          <UserRoundPlus size={18} /> Nouveau rendez-vous
        </button>
      </div>

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
            <div className="vide" style={{ boxShadow: 'none' }}>
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
                    <button type="button" className="btn btn-secondaire" style={{ minHeight: 44, padding: '10px 16px', fontSize: '.8rem' }} onClick={() => changer(r.id, 'valide')}>
                      Valider
                    </button>
                    <button type="button" className="btn btn-secondaire" style={{ minHeight: 44, padding: '10px 16px', fontSize: '.8rem' }} onClick={() => changer(r.id, 'refuse')}>
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
            <button type="button" className="lien-bloc" onClick={() => setFormulaireOuvert(true)}>Ouvrir le formulaire →</button>
          </div>
          <div className="vide" style={{ boxShadow: 'none' }}>
            <CalendarDays size={40} />
            <b>Pas de rendez-vous en préparation</b>
            Les nouvelles demandes (famille) ou propositions (agence) apparaîtront ici, avec leurs actions de validation.
          </div>
        </div>
      </div>

      {formulaireOuvert && (
        <div className="dossier" role="dialog" aria-modal="true" aria-label="Nouveau rendez-vous">
          <form onSubmit={ajouter}>
            <div className="dossier-tete">
              <div>
                <b>Nouveau rendez-vous</b>
                <small>Le type et la date sont requis.</small>
              </div>
              <button type="button" className="btn btn-secondaire" onClick={() => setFormulaireOuvert(false)}>
                Annuler
              </button>
            </div>
            <div className="grille-form">
              <label className="champ">
                <span>Personne *</span>
                <select value={personneId} onChange={(e) => setPersonneId(e.target.value)}>
                  <option value="">— Choisir une personne —</option>
                  {personnes.map((p) => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </label>
              <label className="champ">
                <span>Type *</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPES.map((t) => (
                    <option key={t.cle} value={t.cle}>{t.libelle}</option>
                  ))}
                </select>
              </label>
              <label className="champ">
                <span>Date et heure *</span>
                <input type="datetime-local" value={dateHeure} onChange={(e) => setDateHeure(e.target.value)} />
              </label>
              <label className="champ">
                <span>Notes</span>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sujet, lieu, consignes…" />
              </label>
            </div>
            {erreur && <p role="alert" style={{ color: 'var(--brique)', marginTop: 'var(--sp-3)' }}>{erreur}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
              <button type="button" className="btn btn-secondaire" onClick={() => setFormulaireOuvert(false)}>Annuler</button>
              <button type="submit" className="btn btn-principal">Ajouter</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div role="status" className="toast">{toast}</div>}
    </>
  );
};

export default Agenda;
