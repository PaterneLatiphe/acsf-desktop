// Écran Rapports : synthèses filtrables de l’agence, exportées avec la mise en forme commune
// (logo ACSF, en-tête ligne 1-3, tableau stylé, impression A4 paysage).
// Le dashboard pilote l’activité du jour ; ici on produit un document daté et signé.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import {
  listerPersonnes, listerRdvs, listerToutesContributions,
  type ContributionAvecPersonne, type Personne, type Rdv,
} from './db';
import { dateIso, exporterTableur, type ColonneTableur } from './exportTableur';
import { formaterDateFr, formaterDateHeureFr } from './format';
import { VOLET_COLONNES } from './voletsConfig/voletsConfig';
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
    source: { ecran: 'personnes', libelle: 'Voir les personnes' },
  },
  {
    cle: 'rdvs',
    libelle: 'Rendez-vous',
    titre: 'RAPPORT DES RENDEZ-VOUS',
    onglet: 'Rendez-vous',
    fichier: 'rapport-rendez-vous',
    description: 'Une ligne par rendez-vous : personne, date et heure, type, décision et notes.',
    unite: 'rendez-vous',
    source: { ecran: 'agenda', libelle: 'Voir l’agenda' },
  },
  {
    cle: 'contributions',
    libelle: 'Contributions famille',
    titre: 'RAPPORT DES CONTRIBUTIONS FAMILLE',
    onglet: 'Contributions',
    fichier: 'rapport-contributions',
    description: 'Une ligne par contribution déclarée par la famille : personne, volet, champ, valeur, statut et décision.',
    unite: 'contributions',
    source: { ecran: 'personnes', libelle: 'Voir les personnes' },
  },
] as const;

type CleRapport = typeof TYPES_RAPPORT[number]['cle'];
type EcranSource = typeof TYPES_RAPPORT[number]['source']['ecran'];

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

const LIBELLES_VOLET: Record<string, string> = {
  synthese: 'Synthèse', education: 'Éducation', sante: 'Santé',
  social: 'Social', spiritualite: 'Spiritualité', historique: 'Historique',
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

/** Date exploitable, en heure locale. Une date seule est normalisée en local (et non en UTC). */
function enDate(valeur: string): Date | null {
  const texte = String(valeur ?? '').trim();
  if (!texte) return null;
  const normalise = /^\d{4}-\d{2}-\d{2}$/.test(texte) ? `${texte}T00:00:00` : texte;
  const date = new Date(normalise);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Filtre de période appliqué à la date propre à chaque type de rapport. */
function dansPeriode(date: string, periode: ClePeriode, debut: string, fin: string): boolean {
  if (periode === 'tout') return true;
  const valeur = enDate(date);
  if (!valeur) return false;
  const aujourdHui = new Date();
  if (periode === '7j' || periode === '30j') {
    const borne = new Date(aujourdHui);
    borne.setHours(0, 0, 0, 0);
    // Aujourd’hui + les 6 (ou 29) jours précédents : 7 (ou 30) dates calendaires.
    borne.setDate(borne.getDate() - (periode === '7j' ? 6 : 29));
    // Borne haute : les rendez-vous à venir ne sont pas des « derniers jours ».
    const apresAujourdhui = new Date(aujourdHui);
    apresAujourdhui.setHours(0, 0, 0, 0);
    apresAujourdhui.setDate(apresAujourdhui.getDate() + 1);
    return valeur >= borne && valeur < apresAujourdhui;
  }
  if (periode === 'annee') return valeur.getFullYear() === aujourdHui.getFullYear();

  const deb = debut ? enDate(`${debut}T00:00:00`) : null;
  const apresFin = fin ? enDate(`${fin}T00:00:00`) : null;
  if (debut && !deb) return false;
  if (fin && !apresFin) return false;
  if (apresFin) apresFin.setDate(apresFin.getDate() + 1); // borne exclusive, fin incluse
  if (deb && valeur < deb) return false;
  if (apresFin && valeur >= apresFin) return false;
  return true;
}

const classePill = (statut: string): string => {
  if (['valide', 'validee', 'suivie'].includes(statut)) return 'ok';
  if (['refuse', 'rejetee'].includes(statut)) return 'ret';
  return 'pend';
};

const libelleChamp = (voletType: string, champ: string): string => {
  const colonnes = VOLET_COLONNES[voletType as keyof typeof VOLET_COLONNES]?.colonnes;
  return colonnes?.find((c) => c.cle === champ)?.libelle ?? champ;
};

type RapportsProps = {
  onNaviguer: (ecran: EcranSource) => void;
};

const Rapports: React.FC<RapportsProps> = ({ onNaviguer }) => {
  const [typeRapport, setTypeRapport] = useState<CleRapport>('personnes');
  const [periode, setPeriode] = useState<ClePeriode>('tout');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statutFiltre, setStatutFiltre] = useState('tous');
  const [limite, setLimite] = useState(LIGNES_PAR_PAS);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [contributions, setContributions] = useState<ContributionAvecPersonne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);
  const [exportEnCours, setExportEnCours] = useState(false);
  const premierFiltreRef = useRef<HTMLSelectElement>(null);
  const { toast, afficherToast, mettreEnPause, reprendre } = useToast();

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);
    (async () => {
      try {
        const [listePersonnes, listeRdvs, listeContributions] = await Promise.all([
          listerPersonnes(), listerRdvs(), listerToutesContributions(),
        ]);
        if (!actif) return;
        setPersonnes(listePersonnes);
        setRdvs(listeRdvs);
        setContributions(listeContributions);
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
        detail: `${formaterDateFr(p.createdAt)} · ${[p.programme, p.telephone, p.code].filter(Boolean).join(' · ') || 'Aucun détail'}`,
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
      detail: `${formaterDateFr(c.createdAt)} · ${LIBELLES_VOLET[c.voletType] ?? c.voletType} · ${libelleChamp(c.voletType, c.champ)} · ${c.valeurDeclaree || 'Sans valeur'}${c.decidedBy ? ` · ${c.decidedBy}` : ''}`,
      date: c.createdAt,
      statut: c.statut,
      valeurs: {
        personne: c.personne,
        volet: LIBELLES_VOLET[c.voletType] ?? c.voletType,
        champ: libelleChamp(c.voletType, c.champ),
        valeurDeclaree: c.valeurDeclaree,
        statut: LIBELLES_STATUT[c.statut] ?? c.statut,
        createdAt: c.createdAt, decidedBy: c.decidedBy ?? '', decidedAt: c.decidedAt ?? '',
      },
    }));
  }, [typeRapport, personnes, rdvs, contributions, nomsPersonnes]);

  const statutsPossibles = useMemo(
    () => [...new Set(lignesBrutes.map((l) => l.statut).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'fr')),
    [lignesBrutes],
  );

  // Un statut devenu introuvable après un changement de filtre ne doit pas
  // laisser l’utilisateur face à un résultat vide inexplicable.
  const statutEffectif = statutsPossibles.includes(statutFiltre) ? statutFiltre : 'tous';
  const debutDate = dateDebut ? enDate(`${dateDebut}T00:00:00`) : null;
  const finDate = dateFin ? enDate(`${dateFin}T00:00:00`) : null;
  const periodeInvalide = periode === 'personnalise' && (
    (Boolean(dateDebut) && debutDate === null)
    || (Boolean(dateFin) && finDate === null)
    || (debutDate !== null && finDate !== null && debutDate > finDate)
  );

  const lignesFiltrees = useMemo(
    () => lignesBrutes.filter((l) =>
      (statutEffectif === 'tous' || l.statut === statutEffectif)
      && !periodeInvalide
      && dansPeriode(l.date, periode, dateDebut, dateFin)),
    [lignesBrutes, statutEffectif, periode, dateDebut, dateFin, periodeInvalide],
  );
  const lignesVisibles = lignesFiltrees.slice(0, limite);
  const restants = lignesFiltrees.length - limite;
  const filtresActifs = periode !== 'tout' || dateDebut !== '' || dateFin !== '' || statutEffectif !== 'tous';

  const kpis = useMemo(() => {
    if (typeRapport === 'rdvs') {
      const maintenant = Date.now();
      return [
        { libelle: 'Rendez-vous', valeur: lignesFiltrees.length, detail: 'Sur la sélection' },
        { libelle: 'À venir', valeur: lignesFiltrees.filter((l) => new Date(l.date).getTime() >= maintenant).length, detail: 'Date et heure à venir' },
        { libelle: 'En attente de décision', valeur: lignesFiltrees.filter((l) => ['propose', 'demande'].includes(l.statut)).length, detail: 'Client et agence' },
      ];
    }
    if (typeRapport === 'contributions') {
      return [
        { libelle: 'Contributions', valeur: lignesFiltrees.length, detail: 'Sur la sélection' },
        { libelle: 'À revoir', valeur: lignesFiltrees.filter((l) => l.statut === 'pending').length, detail: 'Décision en attente' },
        { libelle: 'Validées', valeur: lignesFiltrees.filter((l) => l.statut === 'validee').length, detail: 'Acceptées par l’agence' },
      ];
    }
    return [
      { libelle: 'Personnes suivies', valeur: lignesFiltrees.length, detail: 'Sur la sélection' },
      { libelle: 'Femmes', valeur: lignesFiltrees.filter((l) => l.valeurs.sexe === 'Féminin').length, detail: 'Sexe renseigné Féminin' },
      { libelle: 'Hommes', valeur: lignesFiltrees.filter((l) => l.valeurs.sexe === 'Masculin').length, detail: 'Sexe renseigné Masculin' },
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
    statutEffectif === 'tous' ? '' : `statut : ${LIBELLES_STATUT[statutEffectif] ?? statutEffectif}`,
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

  const effacerEtFocus = () => {
    effacerFiltres();
    premierFiltreRef.current?.focus();
  };

  const basculerApercu = () => {
    setLimite(restants > 0 ? limite + LIGNES_PAR_PAS : LIGNES_PAR_PAS);
  };

  const boutonExport = (principal: boolean) => (
    <button
      type="button"
      className={principal ? 'btn btn-principal' : 'btn btn-secondaire'}
      onClick={exporter}
      disabled={erreur !== null || periodeInvalide || lignesFiltrees.length === 0 || exportEnCours}
      aria-busy={exportEnCours}
    >
      <Download size={18} aria-hidden="true" />
      {exportEnCours ? <><span className="spin" aria-hidden="true" /> Génération…</> : 'Exporter le rapport (Excel)'}
    </button>
  );

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page">Rapports</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {boutonExport(true)}
        </div>
      </div>

      {erreur ? (
        <Erreur
          message={erreur}
          onRetry={() => {
            setTentative((v) => v + 1);
            premierFiltreRef.current?.focus();
          }}
        />
      ) : (
        <>
          {!chargement && (
            <StatutDonnees
              affiches={lignesVisibles.length}
              total={lignesBrutes.length}
              selection={lignesFiltrees.length}
            />
          )}

          <div className="bloc">
            <div className="bloc-titre">Filtres du rapport</div>
            <div className="rapports-outils">
              <label className="rapports-champ">
                <span>Rapport</span>
                <select
                  ref={premierFiltreRef}
                  value={typeRapport}
                  onChange={(e) => setTypeRapport(e.target.value as CleRapport)}
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
                    <input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      max={dateFin || undefined}
                      aria-invalid={periodeInvalide || undefined}
                    />
                  </label>
                  <label className="rapports-champ">
                    <span>Au</span>
                    <input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      min={dateDebut || undefined}
                      aria-invalid={periodeInvalide || undefined}
                    />
                  </label>
                </>
              )}
              <label className="rapports-champ">
                <span>Statut</span>
                <select
                  value={statutEffectif}
                  onChange={(e) => setStatutFiltre(e.target.value)}
                >
                  <option value="tous">Tous statuts</option>
                  {statutsPossibles.map((s) => (
                    <option key={s} value={s}>{LIBELLES_STATUT[s] ?? s}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-secondaire"
                onClick={effacerEtFocus}
                disabled={!filtresActifs}
              >
                Effacer les filtres
              </button>
            </div>
            {periodeInvalide && (
              <p className="rapports-alerte" role="alert">
                Vérifiez les dates : la date de fin doit être postérieure à la date de début.
              </p>
            )}
          </div>

          <div className="bloc">
            <div className="bloc-titre">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <BarChart3 size={18} aria-hidden="true" /> {rapport.libelle}
              </span>
              <button
                type="button"
                className="lien-bloc"
                onClick={() => onNaviguer(rapport.source.ecran)}
              >
                {rapport.source.libelle}
              </button>
            </div>
            <p className="rapports-description">
              {rapport.description} Le fichier porte l’en-tête ACSF, les filtres appliqués
              et une mise en page prête pour l’impression.
            </p>

            {chargement ? (
              <div className="vide" role="status" aria-busy="true">
                <span className="rapports-sr-only">Chargement des rapports…</span>
                <div className="skel skel-ligne" />
              </div>
            ) : (
              <>
                <div className="kpis rapports-kpis" style={{ marginBottom: 'var(--sp-4)' }}>
                  {kpis.map((k) => (
                    <div className="kpi" key={k.libelle}>
                      <div className="kpi-label">{k.libelle}</div>
                      <div className="kpi-chiffre">{k.valeur}</div>
                      <div className="kpi-var">{k.detail}</div>
                    </div>
                  ))}
                </div>

                <div className="rapports-action">{boutonExport(false)}</div>

                {periodeInvalide ? (
                  <div className="rapports-etat">
                    <EtatVide
                      titre="Dates de période invalides."
                      message="Corrigez les dates ou effacez les filtres pour retrouver la synthèse."
                      action={{ libelle: 'Effacer les filtres', onClick: effacerEtFocus }}
                    />
                  </div>
                ) : lignesBrutes.length === 0 ? (
                  <div className="rapports-etat">
                    <EtatVide
                      titre="Aucune donnée à synthétiser."
                      message="La base est vide pour ce rapport. Commencez par renseigner les données sources."
                      action={{ libelle: rapport.source.libelle, onClick: () => onNaviguer(rapport.source.ecran) }}
                    />
                  </div>
                ) : lignesFiltrees.length === 0 ? (
                  <div className="rapports-etat">
                    <EtatVide
                      titre="Aucune ligne pour ces critères."
                      message="Modifiez la période ou le statut, ou effacez les filtres."
                      action={{ libelle: 'Effacer les filtres', onClick: effacerEtFocus }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="rapports-liste">
                      {lignesVisibles.map((l) => (
                        <div className="ligne" key={l.cle}>
                          <div className="ligne-point"><BarChart3 size={18} aria-hidden="true" /></div>
                          <div className="info"><b>{l.titre}</b><small>{l.detail}</small></div>
                          {l.statut && (
                            <span className={`pill ${classePill(l.statut)}`}>
                              {LIBELLES_STATUT[l.statut] ?? l.statut}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {lignesFiltrees.length > LIGNES_PAR_PAS && (
                      <button
                        type="button"
                        className="btn btn-secondaire rdv-plus"
                        onClick={basculerApercu}
                      >
                        {restants > 0
                          ? `Afficher plus (${restants} restant${restants === 1 ? '' : 's'})`
                          : 'Réduire l’aperçu'}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {toast && <Toast message={toast} onPause={mettreEnPause} onReprendre={reprendre} />}
    </div>
  );
};

export default Rapports;
