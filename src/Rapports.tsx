// Écran Rapports : synthèses filtrables de l'agence, exportées avec la mise en forme commune
// (logo ACSF, en-tête ligne 1-5, tableau stylé, impression A4 paysage).
// Le dashboard pilote l'activité du jour ; ici on produit un document daté et signé.

import React, { useEffect, useMemo, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import {
  listerContributions, listerPersonnes, listerRdvs,
  type Contribution, type Personne, type Rdv,
} from './db';
import { dateIso, exporterTableur, type ColonneTableur } from './exportTableur';
import { formaterDateHeureFr } from './format';
import { UTILISATEUR_COURANT } from './utilisateur';
import { Erreur } from './Etats';
import { EtatVide, StatutDonnees, Toast } from './EtatDonnees';
import { useToast } from './useToast';

const TYPES_RAPPORT = [
  {
    cle: 'personnes',
    libelle: 'Personnes suivies',
    titre: 'RAPPORT DE SUIVI — SYNTHÈSE GÉNÉRALE',
    onglet: 'Personnes',
    fichier: 'rapport-personnes',
    description: 'Une ligne par personne suivie : identité, contact, programme, code de filiation, enregistrement et statut.',
    unite: 'personnes',
  },
  {
    cle: 'rdvs',
    libelle: 'Rendez-vous',
    titre: 'RAPPORT DES RENDEZ-VOUS',
    onglet: 'Rendez-vous',
    fichier: 'rapport-rendez-vous',
    description: 'Une ligne par rendez-vous : personne, date et heure, type, décision et notes.',
    unite: 'rendez-vous',
  },
  {
    cle: 'contributions',
    libelle: 'Contributions famille',
    titre: 'RAPPORT DES CONTRIBUTIONS FAMILLE',
    onglet: 'Contributions',
    fichier: 'rapport-contributions',
    description: 'Une ligne par contribution déclarée par la famille : personne, volet, champ, valeur, statut et décision.',
    unite: 'contributions',
  },
] as const;

type CleRapport = typeof TYPES_RAPPORT[number]['cle'];

const PERIODES = [
  { cle: 'tout', libelle: 'Toutes les périodes' },
  { cle: '7j', libelle: '7 derniers jours' },
  { cle: '30j', libelle: '30 derniers jours' },
  { cle: 'annee', libelle: 'Année en cours' },
  { cle: 'personnalise', libelle: 'Période personnalisée' },
] as const;

type ClePeriode = typeof PERIODES[number]['cle'];

const LIBELLES_STATUT: Record<string, string> = {
  propose: 'Proposé', demande: 'Demandé', valide: 'Validé', refuse: 'Refusé',
  pending: 'À revoir', validee: 'Validée', corrigee: 'Corrigée', rejetee: 'Rejetée',
  suivie: 'Suivie',
};

const TYPES_RDV: Record<string, string> = {
  rdv_agence: 'RDV agence', sortie_terrain: 'Sortie terrain',
  entretien_tele: 'Entretien téléphone', suivi: 'Suivi',
};

const LIGNES_PAR_PAS = 20;

type LigneRapport = {
  cle: string;
  titre: string;
  detail: string;
  date: string;
  statut: string;
  valeurs: Record<string, unknown>;
};

type LigneContribution = Contribution & { personne: string };

/** Filtre de période, appliqué à la date propre à chaque type de rapport. */
function dansPeriode(date: string, periode: ClePeriode, debut: string, fin: string): boolean {
  if (periode === 'tout') return true;
  const valeur = new Date(date);
  if (Number.isNaN(valeur.getTime())) return true;
  const aujourdHui = new Date();
  if (periode === '7j' || periode === '30j') {
    const borne = new Date(aujourdHui);
    borne.setHours(0, 0, 0, 0);
    borne.setDate(borne.getDate() - (periode === '7j' ? 7 : 30));
    return valeur >= borne;
  }
  if (periode === 'annee') return valeur.getFullYear() === aujourdHui.getFullYear();
  if (debut && valeur < new Date(`${debut}T00:00:00`)) return false;
  if (fin && valeur > new Date(`${fin}T23:59:59`)) return false;
  return true;
}

const classePill = (statut: string): string => {
  if (['valide', 'validee', 'suivie'].includes(statut)) return 'ok';
  if (['refuse', 'rejetee'].includes(statut)) return 'ret';
  return 'pend';
};

const Rapports: React.FC = () => {
  const [typeRapport, setTypeRapport] = useState<CleRapport>('personnes');
  const [periode, setPeriode] = useState<ClePeriode>('tout');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statutFiltre, setStatutFiltre] = useState('tous');
  const [limite, setLimite] = useState(LIGNES_PAR_PAS);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [contributions, setContributions] = useState<LigneContribution[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);
  const [exportEnCours, setExportEnCours] = useState(false);
  const { toast, afficherToast, mettreEnPause, reprendre } = useToast();

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);
    (async () => {
      try {
        const [listePersonnes, listeRdvs] = await Promise.all([listerPersonnes(), listerRdvs()]);
        const listes = await Promise.all(listePersonnes.map(async (p) => {
          const contributionsPersonne = await listerContributions(p.id);
          return contributionsPersonne.map((c) => ({ ...c, personne: `${p.prenom} ${p.nom}` }));
        }));
        if (!actif) return;
        setPersonnes(listePersonnes);
        setRdvs(listeRdvs);
        setContributions(listes.flat());
      } catch {
        if (actif) setErreur('Les données des rapports n’ont pas pu être chargées.');
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => { actif = false; };
  }, [tentative]);

  useEffect(() => { setStatutFiltre('tous'); }, [typeRapport]);
  useEffect(() => {
    setLimite(LIGNES_PAR_PAS);
  }, [typeRapport, periode, dateDebut, dateFin, statutFiltre]);

  const nomsPersonnes = useMemo(
    () => new Map(personnes.map((p) => [p.id, `${p.prenom} ${p.nom}`])),
    [personnes],
  );

  const lignesBrutes = useMemo((): LigneRapport[] => {
    if (typeRapport === 'personnes') {
      return personnes.map((p) => ({
        cle: `p-${p.id}`,
        titre: `${p.prenom} ${p.nom}`,
        detail: [p.programme, p.telephone, p.code].filter(Boolean).join(' · ') || 'Aucun détail',
        date: p.createdAt,
        statut: p.statut || '',
        valeurs: {
          nom: p.nom, prenom: p.prenom, sexe: p.sexe, dateNaissance: p.dateNaissance,
          telephone: p.telephone, programme: p.programme, code: p.code,
          createdAt: p.createdAt, statut: p.statut,
        },
      }));
    }
    if (typeRapport === 'rdvs') {
      return rdvs.map((r) => {
        const nom = nomsPersonnes.get(r.personneId) ?? `Personne #${r.personneId}`;
        return {
          cle: `r-${r.id}`,
          titre: nom,
          detail: `${formaterDateHeureFr(r.dateHeure)} · ${TYPES_RDV[r.type] ?? r.type}${r.notes ? ` · ${r.notes}` : ''}`,
          date: r.dateHeure,
          statut: r.statut,
          valeurs: {
            personne: nom,
            dateHeure: r.dateHeure,
            type: TYPES_RDV[r.type] ?? r.type,
            decision: LIBELLES_STATUT[r.statut] ?? r.statut,
            notes: r.notes,
          },
        };
      });
    }
    return contributions.map((c) => ({
      cle: `c-${c.id}`,
      titre: c.personne,
      detail: `${c.champ} · ${c.valeurDeclaree || 'Sans valeur'}${c.decidedBy ? ` · ${c.decidedBy}` : ''}`,
      date: c.createdAt,
      statut: c.statut,
      valeurs: {
        personne: c.personne, volet: c.voletType, champ: c.champ,
        valeurDeclaree: c.valeurDeclaree, statut: LIBELLES_STATUT[c.statut] ?? c.statut,
        createdAt: c.createdAt, decidedBy: c.decidedBy ?? '', decidedAt: c.decidedAt ?? '',
      },
    }));
  }, [typeRapport, personnes, rdvs, contributions, nomsPersonnes]);

  const statutsPossibles = useMemo(
    () => [...new Set(lignesBrutes.map((l) => l.statut).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'fr')),
    [lignesBrutes],
  );

  const lignesFiltrees = useMemo(
    () => lignesBrutes.filter((l) =>
      (statutFiltre === 'tous' || l.statut === statutFiltre)
      && dansPeriode(l.date, periode, dateDebut, dateFin)),
    [lignesBrutes, statutFiltre, periode, dateDebut, dateFin],
  );
  const lignesVisibles = lignesFiltrees.slice(0, limite);
  const restants = lignesFiltrees.length - limite;

  const kpis = useMemo(() => {
    if (typeRapport === 'rdvs') {
      const maintenant = Date.now();
      return [
        { libelle: 'Rendez-vous', valeur: lignesFiltrees.length },
        { libelle: 'À venir', valeur: lignesFiltrees.filter((l) => new Date(l.date).getTime() >= maintenant).length },
        { libelle: 'En attente de décision', valeur: lignesFiltrees.filter((l) => ['propose', 'demande'].includes(l.statut)).length },
      ];
    }
    if (typeRapport === 'contributions') {
      return [
        { libelle: 'Contributions', valeur: lignesFiltrees.length },
        { libelle: 'À revoir', valeur: lignesFiltrees.filter((l) => l.statut === 'pending').length },
        { libelle: 'Validées', valeur: lignesFiltrees.filter((l) => l.statut === 'validee').length },
      ];
    }
    return [
      { libelle: 'Personnes suivies', valeur: lignesFiltrees.length },
      { libelle: 'Femmes', valeur: lignesFiltrees.filter((l) => l.valeurs.sexe === 'Féminin').length },
      { libelle: 'Hommes', valeur: lignesFiltrees.filter((l) => l.valeurs.sexe === 'Masculin').length },
    ];
  }, [typeRapport, lignesFiltrees]);

  const colonnes = useMemo((): ColonneTableur[] => {
    if (typeRapport === 'rdvs') {
      return [
        { cle: 'personne', libelle: 'Personne', type: 'texte' },
        { cle: 'dateHeure', libelle: 'Date et heure', type: 'date' },
        { cle: 'type', libelle: 'Type', type: 'texte' },
        { cle: 'decision', libelle: 'Décision', type: 'statut' },
        { cle: 'notes', libelle: 'Notes', type: 'texte' },
      ];
    }
    if (typeRapport === 'contributions') {
      return [
        { cle: 'personne', libelle: 'Personne', type: 'texte' },
        { cle: 'volet', libelle: 'Volet', type: 'texte' },
        { cle: 'champ', libelle: 'Champ', type: 'texte' },
        { cle: 'valeurDeclaree', libelle: 'Valeur déclarée', type: 'texte' },
        { cle: 'statut', libelle: 'Statut', type: 'statut' },
        { cle: 'createdAt', libelle: 'Demandée le', type: 'date' },
        { cle: 'decidedBy', libelle: 'Décidée par', type: 'texte' },
        { cle: 'decidedAt', libelle: 'Décidée le', type: 'date' },
      ];
    }
    return [
      { cle: 'nom', libelle: 'Nom', type: 'texte' },
      { cle: 'prenom', libelle: 'Prénom', type: 'texte' },
      { cle: 'sexe', libelle: 'Sexe', type: 'texte' },
      { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
      { cle: 'telephone', libelle: 'Téléphone', type: 'telephone' },
      { cle: 'programme', libelle: 'Programme', type: 'programme' },
      { cle: 'code', libelle: 'Code de filiation', type: 'texte' },
      { cle: 'createdAt', libelle: 'Enregistré le', type: 'date' },
      { cle: 'statut', libelle: 'Statut', type: 'statut' },
    ];
  }, [typeRapport]);

  const rapport = TYPES_RAPPORT.find((r) => r.cle === typeRapport) ?? TYPES_RAPPORT[0];
  const periodeChoisie = PERIODES.find((p) => p.cle === periode) ?? PERIODES[0];
  const filtres = [
    `période : ${periodeChoisie.libelle.toLowerCase()}`,
    periode === 'personnalise'
      ? `du ${dateDebut || 'début'} au ${dateFin || 'aujourd’hui'}`
      : '',
    statutFiltre === 'tous' ? '' : `statut : ${LIBELLES_STATUT[statutFiltre] ?? statutFiltre}`,
  ].filter(Boolean).join(' · ');

  const exporter = async () => {
    setExportEnCours(true);
    try {
      await exporterTableur({
        titre: rapport.titre,
        nomOnglet: rapport.onglet,
        colonnes,
        lignes: lignesFiltrees.map((l) => l.valeurs),
        exportePar: UTILISATEUR_COURANT,
        filtres,
        libelleTotal: `Total : ${lignesFiltrees.length} ${rapport.unite}`,
      }, UTILISATEUR_COURANT, `ACSF_${rapport.fichier}_${dateIso()}.xlsx`);
      afficherToast('Rapport Excel généré.');
    } catch {
      afficherToast('Le rapport n’a pas pu être généré.', 4000);
    } finally {
      setExportEnCours(false);
    }
  };

  const effacerFiltres = () => {
    setPeriode('tout');
    setDateDebut('');
    setDateFin('');
    setStatutFiltre('tous');
  };

  return (
    <div className="page-enter">
      <h1 className="page">Rapports</h1>
      <p className="sous-titre">Synthèses de l'agence, prêtes à imprimer ou à envoyer</p>

      {erreur && <Erreur message={erreur} onRetry={() => setTentative((v) => v + 1)} />}

      {!chargement && !erreur && (
        <StatutDonnees affiches={lignesVisibles.length} total={lignesFiltrees.length} />
      )}

      <div className="bloc">
        <div className="bloc-titre">Paramètres du rapport</div>
        <div className="rapports-outils">
          <label className="rapports-champ">
            <span>Rapport</span>
            <select
              value={typeRapport}
              onChange={(e) => setTypeRapport(e.target.value as CleRapport)}
              aria-label="Type de rapport"
            >
              {TYPES_RAPPORT.map((r) => (
                <option key={r.cle} value={r.cle}>{r.libelle}</option>
              ))}
            </select>
          </label>
          <label className="rapports-champ">
            <span>Période</span>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value as ClePeriode)}
              aria-label="Période du rapport"
            >
              {PERIODES.map((p) => (
                <option key={p.cle} value={p.cle}>{p.libelle}</option>
              ))}
            </select>
          </label>
          {periode === 'personnalise' && (
            <>
              <label className="rapports-champ">
                <span>Du</span>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} aria-label="Date de début" />
              </label>
              <label className="rapports-champ">
                <span>Au</span>
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} aria-label="Date de fin" />
              </label>
            </>
          )}
          <label className="rapports-champ">
            <span>Statut</span>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              aria-label="Statut du rapport"
            >
              <option value="tous">Tous statuts</option>
              {statutsPossibles.map((s) => (
                <option key={s} value={s}>{LIBELLES_STATUT[s] ?? s}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="bloc">
        <div className="bloc-titre">
          <BarChart3 size={18} aria-hidden="true" /> {rapport.libelle}
        </div>
        <p style={{ color: 'var(--gris)', margin: 'var(--sp-2) 0 var(--sp-4)' }}>
          {rapport.description} Le fichier porte l’en-tête ACSF, les filtres appliqués
          et une mise en page prête pour l’impression.
        </p>

        {chargement ? (
          <div className="vide">
            <div className="skel skel-ligne" />
          </div>
        ) : (
          <>
            <div className="kpis" style={{ marginBottom: 'var(--sp-4)' }}>
              {kpis.map((k) => (
                <div className="kpi" key={k.libelle}>
                  <div className="kpi-label">{k.libelle}</div>
                  <div className="kpi-chiffre">{k.valeur}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-principal"
              onClick={exporter}
              disabled={erreur !== null || lignesFiltrees.length === 0 || exportEnCours}
            >
              <Download size={18} /> {exportEnCours ? 'Génération…' : 'Exporter le rapport (Excel)'}
            </button>

            {lignesFiltrees.length === 0 ? (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <EtatVide
                  titre="Aucune ligne pour ces critères."
                  message="Modifiez la période ou le statut, ou effacez les filtres."
                  action={{ libelle: 'Effacer les filtres', onClick: effacerFiltres }}
                />
              </div>
            ) : (
              <>
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  {lignesVisibles.map((l) => (
                    <div className="ligne" key={l.cle}>
                      <div className="ligne-point"><BarChart3 size={18} /></div>
                      <div className="info"><b>{l.titre}</b><small>{l.detail}</small></div>
                      {l.statut && (
                        <span className={`pill ${classePill(l.statut)}`}>
                          {LIBELLES_STATUT[l.statut] ?? l.statut}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {restants > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondaire rdv-plus"
                    onClick={() => setLimite(limite + LIGNES_PAR_PAS)}
                  >
                    Afficher plus ({restants} restant{restants === 1 ? '' : 's'})
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast} onPause={mettreEnPause} onReprendre={reprendre} />}
    </div>
  );
};

export default Rapports;
