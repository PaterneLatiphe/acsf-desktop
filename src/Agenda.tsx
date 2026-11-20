import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, UserRoundPlus } from 'lucide-react';
import { changerStatutRdv, creerRdv, listerPersonnes, listerRdvs, type Personne, type Rdv } from './db';
import { formaterDateHeureFr } from './format';
import { Erreur } from './Etats';
import { EtatVide, StatutDonnees, Toast } from './EtatDonnees';
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

// L'origine du RDV détermine qui doit décider. Le statut stocké suffit :
// 'propose' = proposition de l'agence, 'demande' = demande du client.
const ORIGINES: { cle: string; libelle: string; statut: string }[] = [
  { cle: 'proposition', libelle: 'Proposition de l’agence — le client validera', statut: 'propose' },
  { cle: 'demande', libelle: 'Demande du client — l’agence validera', statut: 'demande' },
];

// Créneaux visibles explicitement : le champ natif `datetime-local` ne montre pas
// toujours son segment horaire selon le rendu (Electron, navigateur, locale).
const HEURES = Array.from({ length: 48 }, (_, index) => {
  const heures = String(Math.floor(index / 2)).padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return { valeur: `${heures}:${minutes}`, libelle: `${heures}:${minutes}` };
});

const RDV_VIDE = { personneId: '', type: 'rdv_agence', origine: 'proposition', date: '', heure: '', notes: '' };

// Une longue liste reste lisible : on révèle les rendez-vous par lots de 20.
const RDV_PAR_PAS = 20;

const Agenda: React.FC = () => {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [typeFiltre, setTypeFiltre] = useState('');
  const [limiteVenir, setLimiteVenir] = useState(RDV_PAR_PAS);
  const [limitePasses, setLimitePasses] = useState(RDV_PAR_PAS);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [personneId, setPersonneId] = useState('');
  const [type, setType] = useState('rdv_agence');
  const [origine, setOrigine] = useState('proposition');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
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

  // Changer de filtre ramène l'affichage au premier lot : le compteur reste cohérent.
  useEffect(() => {
    setLimiteVenir(RDV_PAR_PAS);
    setLimitePasses(RDV_PAR_PAS);
  }, [typeFiltre]);

  const rdvsFiltres = typeFiltre ? rdvs.filter((r) => r.type === typeFiltre) : rdvs;

  // La date reste une donnée d'affichage : on sépare seulement ce qui est déjà passé.
  const maintenant = Date.now();
  const passe = (r: Rdv): boolean => {
    const temps = new Date(r.dateHeure).getTime();
    return !Number.isNaN(temps) && temps < maintenant;
  };
  const aVenir = rdvsFiltres.filter((r) => !passe(r));
  const passes = rdvsFiltres.filter(passe);
  const venirVisibles = aVenir.slice(0, limiteVenir);
  const passesVisibles = passes.slice(0, limitePasses);
  const rdvsAffiches = venirVisibles.length + passesVisibles.length;
  const attenteClient = rdvs.filter((r) => r.statut === 'propose');
  const attenteAgence = rdvs.filter((r) => r.statut === 'demande');

  const ouvrirFormulaire = () => {
    setErreurs({});
    setFormulaireOuvert(true);
  };

  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalides: Record<string, string> = {};
    if (!personneId) invalides.personneId = 'Choisissez une personne.';
    if (!date) invalides.date = 'Choisissez une date.';
    if (!heure) invalides.heure = 'Choisissez une heure.';
    setErreurs(invalides);
    if (Object.keys(invalides).length > 0) return;
    const origineChoisie = ORIGINES.find((o) => o.cle === origine) ?? ORIGINES[0];
    try {
      await creerRdv({ personneId: Number(personneId), type, statut: origineChoisie.statut, dateHeure: `${date}T${heure}`, notes: notes.trim() });
    } catch {
      afficherToast('Le rendez-vous n’a pas pu être enregistré. Réessayez.');
      return;
    }
    setFormulaireOuvert(false);
    setPersonneId('');
    setOrigine('proposition');
    setDate('');
    setHeure('');
    setNotes('');
    setErreurs({});
    await recharger();
    afficherToast('Rendez-vous enregistré.');
  };

  const changer = async (id: number, statut: string) => {
    const rdv = rdvs.find((r) => r.id === id);
    const message = statut === 'valide'
      ? 'Rendez-vous validé.'
      : rdv?.statut === 'propose' ? 'Proposition annulée.' : 'Demande refusée.';
    try {
      await changerStatutRdv(id, statut);
      await recharger();
      afficherToast(message);
    } catch {
      afficherToast('La mise à jour du rendez-vous a échoué. Réessayez.');
    }
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
        {
          cle: 'origine', libelle: 'Origine', type: 'select', obligatoire: true,
          options: ORIGINES.map((o) => ({ valeur: o.cle, libelle: o.libelle })),
        },
        { cle: 'date', libelle: 'Date', type: 'date', obligatoire: true, indications: 'jj/mm/aaaa' },
        {
          cle: 'heure', libelle: 'Heure', type: 'select', obligatoire: true,
          options: [{ valeur: '', libelle: '— Choisir une heure —' }, ...HEURES],
        },
        { cle: 'notes', libelle: 'Notes', placeholder: 'Sujet, lieu, consignes…' },
      ],
    },
  ], [personnes]);

  const valeursRdv = { personneId, type, origine, date, heure, notes };

  const ligneRdv = (r: Rdv) => (
    <div className="ligne" key={r.id}>
      <div className="info" style={{ flex: 1, minWidth: 0 }}>
        <b>{nomPersonne(r.personneId)}</b>
        <small>{dateAffichee(r)}{passe(r) ? ' · Passé' : ''}</small>
        {(r.statut === 'propose' || r.statut === 'demande') && (
          <small className="rdv-attente">
            {r.statut === 'propose' ? 'En attente du client' : 'En attente de l’agence'}
          </small>
        )}
      </div>
      <span className="pill rdv">{TYPES.find((t) => t.cle === r.type)?.libelle ?? r.type}</span>
      <span className={`pill ${r.statut === 'valide' ? 'ok' : r.statut === 'refuse' ? 'ret' : 'pend'}`}>{LIBELLES_STATUT[r.statut] ?? r.statut.toUpperCase()}</span>
      {(r.statut === 'demande' || r.statut === 'propose') && (
        <span style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button type="button" className="btn btn-secondaire" onClick={() => changer(r.id, 'valide')}>
            Valider
          </button>
          <button type="button" className="btn btn-secondaire" onClick={() => changer(r.id, 'refuse')}>
            {r.statut === 'propose' ? 'Annuler' : 'Refuser'}
          </button>
        </span>
      )}
    </div>
  );

  const filesAttente = [
    { titre: 'En attente du client', note: 'Propositions faites par l’agence.', liste: attenteClient },
    { titre: 'En attente de l’agence', note: 'Demandes faites par le client.', liste: attenteAgence },
  ].filter((file) => file.liste.length > 0);

  const groupeRdv = (
    titre: string,
    liste: Rdv[],
    visibles: Rdv[],
    limite: number,
    setLimite: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    if (liste.length === 0) return null;
    const restants = liste.length - limite;
    return (
      <section className="rdv-groupe">
        <h2 className="section-titre">{titre}</h2>
        {visibles.map(ligneRdv)}
        {restants > 0 && (
          <button
            type="button"
            className="btn btn-secondaire rdv-plus"
            onClick={() => setLimite(limite + RDV_PAR_PAS)}
          >
            Afficher plus ({restants} restant{restants === 1 ? '' : 's'})
          </button>
        )}
      </section>
    );
  };

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

      {!chargement && !erreurChargement && (
        <StatutDonnees affiches={rdvsAffiches} total={rdvs.length} />
      )}

      <div className="grille">
        <div className="bloc">
          <div className="bloc-titre">
            Rendez-vous
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
            <EtatVide
              titre={typeFiltre ? 'Aucun rendez-vous de ce type.' : 'Aucun rendez-vous.'}
              message={typeFiltre
                ? 'Essayez un autre type de rendez-vous.'
                : 'Les rendez-vous de la famille ou de l’agence apparaîtront ici.'}
              action={typeFiltre
                ? { libelle: 'Effacer le filtre', onClick: () => setTypeFiltre('') }
                : { libelle: 'Nouveau rendez-vous', onClick: ouvrirFormulaire }}
            />
          ) : (
            <>
              {groupeRdv('À venir', aVenir, venirVisibles, limiteVenir, setLimiteVenir)}
              {groupeRdv('Passés', passes, passesVisibles, limitePasses, setLimitePasses)}
            </>
          )}
        </div>

        <div className="bloc">
          <div className="bloc-titre">
            Décisions en attente
            <button type="button" className="lien-bloc" onClick={ouvrirFormulaire}>Ouvrir le formulaire →</button>
          </div>
          {filesAttente.length === 0 ? (
            <div className="vide">
              <CalendarDays size={40} />
              <b>Aucune décision en attente.</b>
              Les demandes et propositions apparaîtront ici.
            </div>
          ) : (
            <div className="rdv-files">
              {filesAttente.map((file) => (
                <section className="rdv-file" key={file.titre}>
                  <h3 className="rdv-file-titre">{file.titre} · {file.liste.length}</h3>
                  <p className="rdv-file-note">{file.note}</p>
                  {file.liste.slice(0, 3).map((r) => (
                    <div className="rdv-attente-ligne" key={r.id}>
                      {nomPersonne(r.personneId)} · {dateAffichee(r)}
                    </div>
                  ))}
                  {file.liste.length > 3 && (
                    <div className="rdv-attente-ligne">Et {file.liste.length - 3} autre{file.liste.length - 3 === 1 ? '' : 's'}…</div>
                  )}
                </section>
              ))}
              <p className="rdv-file-note">Utilisez « Valider », « Annuler » ou « Refuser » dans la liste.</p>
            </div>
          )}
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
            setOrigine(valeurs.origine);
            setDate(valeurs.date);
            setHeure(valeurs.heure);
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
