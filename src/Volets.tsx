// Volets.tsx - Assembleur de l'interface dossier personne
// Interface type tableur Excel (AG Grid Community MIT), branchée sur l'API réelle db.ts
// Zéro dépendance payante

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Lock, Check, RefreshCw, X } from 'lucide-react';

import { VOLET_COLONNES } from './voletsConfig/voletsConfig';
import { OngletsVolets } from './OngletsVolets';
import { BandeauIdentite } from './BandeauIdentite';
import { GrilleVolet } from './GrilleVolet';
import { exporterExcel } from './exportExcel';
import {
  listerPassages,
  creerPassage,
  modifierPassage,
  supprimerPassage,
  chargerConsentement,
  accorderConsentement,
  listerEchanges,
  type Passage,
  type Echange,
  type Consent,
} from './db';

// Volets réellement saisissables dans la grille
const VOLETS_SAISIE = ['education', 'sante', 'social', 'spiritualite'];

const LIBELLES: Record<string, string> = {
  synthese: 'Synthèse',
  education: 'Éducation',
  sante: 'Santé',
  social: 'Social',
  spiritualite: 'Spiritualité',
  historique: 'Historique',
};

const VOLETS_SYNTHESE = ['education', 'sante', 'social', 'spiritualite'];

type VoletsProps = {
  personneId: number;
  utilisateur: string;
  personne?: { nom: string; prenom: string; sexe?: string; dateNaissance?: string; telephone?: string; adresse?: string; code?: string; programme?: string; statut?: string };
  onChanger?: () => void;
};

type Statut = 'idle' | 'saving' | 'saved' | 'error';

type DernierChangement = { id: string; champ: string; valeur: string };
type DialogConfirm = {
  titre: string;
  message: string;
  action: string;
  onAction: () => void;
  onAnnuler?: () => void;
};
type EvolutionRecent = { cle: string; date: string; label: string; detail: string };

function normaliserValeur(valeur: any): string {
  if (valeur === null || valeur === undefined) return '';
  if (valeur instanceof Date) {
    return `${valeur.getFullYear()}-${String(valeur.getMonth() + 1).padStart(2, '0')}-${String(valeur.getDate()).padStart(2, '0')}`;
  }
  return String(valeur);
}

function formaterDate(valeur?: string | null): string {
  if (!valeur) return '—';
  const d = new Date(valeur.length <= 10 ? `${valeur}T12:00:00` : valeur);
  if (isNaN(d.getTime())) return valeur;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function valeurDe(passage: Passage, champ: string): string {
  if (!passage) return '';
  if (champ === 'prochaineEcheance') return passage.prochaineEcheance ?? '';
  if (champ === 'remarques') return passage.remarques ?? '';
  return passage.donnees?.[champ] ?? '';
}

function labelDe(voletCle: string, champ: string): string {
  const colonnes = (VOLET_COLONNES as any)[voletCle]?.colonnes || [];
  const colonne = colonnes.find((c: any) => c.cle === champ);
  return colonne?.libelle || champ;
}

function resumePassage(p: Passage): string {
  const valeurs = Object.entries(p.donnees || {})
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .slice(0, 2)
    .map(([k, v]) => `${labelDe(p.voletType, k)} : ${v}`);
  if (p.prochaineEcheance) valeurs.push(`Échéance ${formaterDate(p.prochaineEcheance)}`);
  return valeurs.length ? valeurs.join(' · ') : '(sans note)';
}

const Volets: React.FC<VoletsProps> = ({ personneId, utilisateur, personne, onChanger }) => {
  const [voletActif, setVoletActif] = useState('synthese');
  const [passagesParVolet, setPassagesParVolet] = useState<Record<string, Passage[]>>({});
  const [consentementSpirituel, setConsentementSpirituel] = useState<Consent | null>(null);
  const [echanges, setEchanges] = useState<Echange[]>([]);
  const [statut, setStatut] = useState<Statut>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [dialog, setDialog] = useState<DialogConfirm | null>(null);
  const [filtreSynthese, setFiltreSynthese] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [dernierChangement, setDernierChangement] = useState<DernierChangement | null>(null);
  const [nouvellesModifications, setNouvellesModifications] = useState(0);
  const gridApiRef = useRef<any>(null);

  const afficherToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const signaler = useCallback((nouveau: Statut) => {
    setStatut(nouveau);
    if (nouveau === 'saved') window.setTimeout(() => setStatut('idle'), 1800);
  }, []);

  // Chargement de tous les volets + consentement + échanges
  const charger = useCallback(async () => {
    const [education, sante, social, spiritualite, consent, listeEchanges] = await Promise.all([
      listerPassages(personneId, 'education'),
      listerPassages(personneId, 'sante'),
      listerPassages(personneId, 'social'),
      listerPassages(personneId, 'spiritualite'),
      chargerConsentement(personneId, 'spiritualite'),
      listerEchanges(personneId),
    ]);
    setPassagesParVolet({ education, sante, social, spiritualite });
    setConsentementSpirituel(consent);
    setEchanges(listeEchanges);
  }, [personneId]);

  useEffect(() => {
    charger().catch(() => setStatut('error'));
  }, [charger]);

  // Ré-enregistrement de la dernière modification (confirmation avant changement de volet)
  const enregistrerDerniereModification = useCallback(async () => {
    if (!dernierChangement) return;
    signaler('saving');
    try {
      await modifierPassage(dernierChangement.id, dernierChangement.champ, dernierChangement.valeur, utilisateur);
      setNouvellesModifications(0);
      signaler('saved');
    } catch {
      signaler('error');
      afficherToast('Échec de l’enregistrement');
    }
  }, [dernierChangement, utilisateur, signaler, afficherToast]);

  const chargerSaufStatut = useCallback(async () => {
    signaler('saving');
    try {
      await charger();
      signaler('saved');
      afficherToast('Données rafraîchies');
    } catch {
      signaler('error');
      afficherToast('Échec du chargement');
    }
  }, [charger, signaler, afficherToast]);

  // Changer de volet — confirmation avant d’enregistrer la dernière modification
  const confirmerChangement = useCallback((suivant: string) => {
    if (nouvellesModifications > 0) {
      setDialog({
        titre: 'Modifications en attente',
        message: `Des modifications ont été saisies. Voulez-vous enregistrer la dernière modification avant de passer au volet ${LIBELLES[suivant] ?? suivant} ?`,
        action: 'Enregistrer',
        onAction: async () => {
          setDialog(null);
          await enregistrerDerniereModification();
          setVoletActif(suivant);
        },
        onAnnuler: () => setVoletActif(suivant),
      });
      return;
    }
    setVoletActif(suivant);
  }, [nouvellesModifications, enregistrerDerniereModification]);

  const actualiser = useCallback(async () => {
    if (nouvellesModifications > 0) {
      setDialog({
        titre: 'Modifications en attente',
        message: 'Des modifications ont été saisies. Voulez-vous enregistrer la dernière modification avant de rafraîchir ?',
        action: 'Enregistrer',
        onAction: async () => {
          setDialog(null);
          await enregistrerDerniereModification();
          await chargerSaufStatut();
        },
        onAnnuler: () => void chargerSaufStatut(),
      });
      return;
    }
    await chargerSaufStatut();
  }, [nouvellesModifications, enregistrerDerniereModification, chargerSaufStatut]);

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    if (!menu) return undefined;
    const fermer = () => setMenu(null);
    window.addEventListener('mousedown', fermer);
    window.addEventListener('keydown', fermer);
    return () => {
      window.removeEventListener('mousedown', fermer);
      window.removeEventListener('keydown', fermer);
    };
  }, [menu]);

  const tousPassages = useMemo(
    () => VOLETS_SAISIE.flatMap((cle) => passagesParVolet[cle] || []),
    [passagesParVolet]
  );

  const evolutionsRecentes = useMemo((): EvolutionRecent[] => {
    const liste: EvolutionRecent[] = [];
    for (const cle of VOLETS_SYNTHESE) {
      const passages = (passagesParVolet[cle] || []).slice().sort((a, b) => b.datePassage.localeCompare(a.datePassage));
      const top = passages[0];
      if (top) {
        const valeurs = Object.entries(top.donnees || {})
          .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
          .slice(0, 2)
          .map(([k, v]) => `${labelDe(cle, k)} : ${v}`);
        if (top.prochaineEcheance) valeurs.push(`Échéance ${formaterDate(top.prochaineEcheance)}`);
        liste.push({ cle, date: top.datePassage, label: `Nouveau passage ${LIBELLES[cle]}`, detail: valeurs.join(' · ') || '(sans note)' });
      }
      for (let i = 1; i < Math.min(passages.length, 3); i++) {
        if (!top) continue;
        const champs = [...new Set([...Object.keys(top.donnees || {}), ...Object.keys(passages[i].donnees || {}), 'remarques', 'prochaineEcheance'])];
        for (const champ of champs) {
          const nouveau = valeurDe(top, champ);
          const ancien = valeurDe(passages[i], champ);
          if (String(nouveau ?? '') === String(ancien ?? '')) continue;
          liste.push({
            cle,
            date: top.datePassage,
            label: `${labelDe(cle, champ)} — ${LIBELLES[cle]}`,
            detail: `${ancien ? `« ${ancien} »` : '(vide)'} → ${nouveau ? `« ${nouveau} »` : '(vide)'}`,
          });
        }
      }
    }
    return liste.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [passagesParVolet]);

  const passagesRecents = useMemo(() => {
    const filtre = recherche.trim().toLowerCase();
    return tousPassages
      .filter((p) => filtreSynthese === 'tous' || p.voletType === filtreSynthese)
      .filter((p) => {
        if (!filtre) return true;
        return `${LIBELLES[p.voletType] ?? p.voletType} ${p.auteur} ${resumePassage(p)}`.toLowerCase().includes(filtre);
      })
      .sort((a, b) => b.datePassage.localeCompare(a.datePassage))
      .slice(0, 10);
  }, [tousPassages, filtreSynthese, recherche]);

  const passagesDuVolet = passagesParVolet[voletActif] || [];
  const colonnesVolet = (VOLET_COLONNES as any)[voletActif]?.colonnes || [];

  const voletVerrouille = voletActif === 'spiritualite' && !consentementSpirituel;
  const voletGrille = VOLETS_SAISIE.includes(voletActif) && !voletVerrouille;
  const peutAjouter = voletGrille;

  const appliquerMajLocale = useCallback((id: string, champ: string, valeur: string) => {
    setPassagesParVolet((precedent) => {
      const liste = precedent[voletActif] || [];
      const miseAJour = liste.map((p) => {
        if (p.id !== id) return p;
        if (champ === 'date') return { ...p, datePassage: valeur };
        if (champ === 'prochaineEcheance') return { ...p, prochaineEcheance: valeur || null };
        if (champ === 'remarques') return { ...p, remarques: valeur };
        return { ...p, donnees: { ...p.donnees, [champ]: valeur } };
      });
      return { ...precedent, [voletActif]: miseAJour };
    });
  }, [voletActif]);

  // Édition d'une cellule : écriture en base puis mise à jour locale (la ligne ne bouge pas)
  const onCellValueChanged = useCallback(async (event: any) => {
    const row = event.data;
    const field = event.colDef?.field as string;
    if (!row?._id || !field) return;
    const valeur = normaliserValeur(event.newValue);

    signaler('saving');
    try {
      if (field === 'date') {
        await modifierPassage(row._id, 'date_passage', valeur, utilisateur);
      } else if (field === 'prochaineEcheance') {
        await modifierPassage(row._id, 'prochaine_echeance', valeur, utilisateur);
      } else if (field === 'remarques') {
        await modifierPassage(row._id, 'remarques', valeur, utilisateur);
      } else {
        await modifierPassage(row._id, field, valeur, utilisateur);
      }
      appliquerMajLocale(row._id, field, valeur);
      setDernierChangement({ id: row._id, champ: field, valeur });
      setNouvellesModifications((n) => n + 1);
      signaler('saved');
    } catch {
      signaler('error');
      afficherToast('Échec de l’enregistrement');
    }
  }, [utilisateur, appliquerMajLocale, signaler, afficherToast]);

  // Nouveau passage : création réelle en base, ajout en tête de liste
  const ajouterPassage = useCallback(async () => {
    if (!peutAjouter) return;
    signaler('saving');
    try {
      const passage = await creerPassage(personneId, voletActif, utilisateur);
      setPassagesParVolet((precedent) => ({
        ...precedent,
        [voletActif]: [passage, ...(precedent[voletActif] || [])],
      }));
      signaler('saved');
      afficherToast('Nouveau passage créé — saisissez vos observations');
      onChanger?.();
      const premiereColonne = colonnesVolet.find((c: any) => c.editable !== false)?.cle;
      if (premiereColonne) {
        window.setTimeout(() => {
          try {
            gridApiRef.current?.startEditingCell({ rowIndex: 0, colKey: premiereColonne });
          } catch {
            /* la grille n'est peut-être pas encore prête */
          }
        }, 250);
      }
    } catch {
      signaler('error');
      afficherToast('Impossible de créer le passage');
    }
  }, [peutAjouter, personneId, voletActif, utilisateur, afficherToast, signaler, onChanger, colonnesVolet]);

  // Suppression d'une ligne via clic droit (confirmation in-app)
  const supprimerLigne = useCallback((id: string) => {
    setMenu(null);
    setDialog({
      titre: 'Supprimer ce passage ?',
      message: 'Cette suppression est tracée dans l’historique.',
      action: 'Supprimer',
      onAction: async () => {
        setDialog(null);
        signaler('saving');
        try {
          await supprimerPassage(id, utilisateur);
          setPassagesParVolet((precedent) => ({
            ...precedent,
            [voletActif]: (precedent[voletActif] || []).filter((p) => p.id !== id),
          }));
          signaler('saved');
          afficherToast('Passage supprimé');
          onChanger?.();
        } catch {
          signaler('error');
          afficherToast('Suppression impossible');
        }
      },
    });
  }, [utilisateur, voletActif, signaler, afficherToast, onChanger]);

  const onCellContextMenu = useCallback((event: any) => {
    if (!event.data?._id) return;
    event.event?.preventDefault?.();
    setMenu({ x: event.event?.clientX ?? 0, y: event.event?.clientY ?? 0, id: event.data._id });
  }, []);

  // Consentement explicite pour le volet Spiritualité
  const donnerConsentement = useCallback(async () => {
    signaler('saving');
    try {
      await accorderConsentement(personneId, 'spiritualite', 'oral', utilisateur);
      const consent = await chargerConsentement(personneId, 'spiritualite');
      setConsentementSpirituel(consent);
      signaler('saved');
      afficherToast('Consentement enregistré — le volet Spiritualité est déverrouillé');
    } catch {
      signaler('error');
      afficherToast('Impossible d’enregistrer le consentement');
    }
  }, [personneId, utilisateur, signaler, afficherToast]);

  const evenements = useMemo(() => {
    const depuisEchanges = echanges.map((e) => ({
      cle: `e-${e.id}`,
      date: e.createdAt,
      type: e.type || 'Échange',
      auteur: e.auteurUserId || '',
      contenu: e.contenu || '',
    }));
    const depuisPassages = tousPassages.map((p) => {
      const valeurs = Object.values(p.donnees || {}).filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
      return {
        cle: `p-${p.id}`,
        date: p.datePassage,
        type: `Passage ${LIBELLES[p.voletType] || p.voletType}`,
        auteur: p.auteur,
        contenu: valeurs.length ? String(valeurs[0]) : (p.remarques || ''),
      };
    });
    return [...depuisEchanges, ...depuisPassages]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 200);
  }, [echanges, tousPassages]);

  const exporter = useCallback(() => {
    exporterExcel(personneId, voletActif, {
      nom: personne?.nom || '',
      prenom: personne?.prenom || '',
      sexe: personne?.sexe,
      dateNaissance: personne?.dateNaissance,
      telephone: personne?.telephone,
      adresse: personne?.adresse,
      code: personne?.code,
      programme: personne?.programme,
      statut: personne?.statut,
      passages: tousPassages,
      evenements,
    });
    afficherToast('Export Excel généré');
  }, [personneId, voletActif, personne, tousPassages, evenements, afficherToast]);

  const libelleStatut =
    statut === 'saving' ? 'Enregistrement…'
      : statut === 'saved' ? 'Enregistré'
        : statut === 'error' ? 'Erreur d’enregistrement'
          : 'Base locale';

  // ---------- Vues ----------
  const filtreLabel = filtreSynthese === 'tous' ? '' : ` — ${LIBELLES[filtreSynthese] ?? filtreSynthese}`;
  const evolutionsVolets = evolutionsRecentes.filter((e) => filtreSynthese === 'tous' || e.cle === filtreSynthese);

  const vueSynthese = (
    <div style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', overflow: 'auto', height: '100%' }}>
      <div className="bloc">
        <div className="bloc-titre">Panorama du suivi</div>
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {VOLETS_SYNTHESE.map((cle) => {
            const liste = passagesParVolet[cle] || [];
            const dernier = liste[0];
            const verrouille = cle === 'spiritualite' && !consentementSpirituel;
            return (
              <button
                key={cle}
                type="button"
                className="kpi kpi-btn"
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => confirmerChangement(cle)}
              >
                <span className="kpi-label">{LIBELLES[cle]}</span>
                <span className="kpi-chiffre">{verrouille ? '—' : liste.length}</span>
                <span className="kpi-var">
                  {verrouille ? 'Consentement requis' : dernier ? `Dernier : ${formaterDate(dernier.datePassage)}` : 'Aucun passage'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="synthese-filtres">
        <label className="filtre-volet">
          <span>Filtre par volet :</span>
          <select
            value={filtreSynthese}
            onChange={(e) => setFiltreSynthese(e.target.value)}
            aria-label="Filtrer les passages par volet"
          >
            <option value="tous">Tous les volets</option>
            {VOLETS_SAISIE.map((cle) => (
              <option key={cle} value={cle}>{LIBELLES[cle]}</option>
            ))}
          </select>
        </label>
        <label className="recherche-synth" role="search">
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher dans le carnet…"
            aria-label="Rechercher dans le carnet de suivi"
          />
          <button type="button" className="btn btn-secondaire" onClick={() => setRecherche('')} disabled={recherche.trim() === ''}>
            <X size={14} /> Vider la recherche
          </button>
        </label>
      </div>

      <div className="bloc">
        <div className="bloc-titre">Évolutions récentes</div>
        {evolutionsVolets.length === 0 ? (
          <p style={{ color: 'var(--gris)', fontSize: '.85rem', margin: 0 }}>Aucune évolution à signaler pour le moment.</p>
        ) : (
          <ul className="evolutions">
            {evolutionsVolets.map((e) => (
              <li key={`${e.cle}|${e.date}|${e.label}`}>
                <div className="evo-tete">
                  <b>{e.label}</b>
                  <span>{formaterDate(e.date)} · {LIBELLES[e.cle] ?? e.cle}</span>
                </div>
                <div className="evo-detail">{e.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bloc">
        <div className="bloc-titre">Passages récents{filtreLabel}</div>
        {passagesRecents.length === 0 ? (
          <p style={{ color: 'var(--gris)', fontSize: '.85rem', margin: 0 }}>Aucun passage correspondant.</p>
        ) : (
          <ul className="passages-recents">
            {passagesRecents.map((p) => (
              <li key={p.id}>
                <div>
                  <b>{LIBELLES[p.voletType] ?? p.voletType}</b>
                  <span> — {formaterDate(p.datePassage)}</span>
                  {p.auteur && <span> · {p.auteur}</span>}
                </div>
                <div className="passage-resume">{resumePassage(p)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const vueSpiritualiteVerrouillee = (
    <div className="vide" style={{ margin: 'var(--sp-4)' }}>
      <Lock size={32} />
      <b>Volet verrouillé</b>
      <p style={{ maxWidth: 520, margin: '0 auto var(--sp-3)' }}>
        Le volet Spiritualité ne peut être rempli qu’avec le consentement explicite de la personne
        (ou de son responsable légal). Aucune donnée spirituelle n’est accessible sans cet accord.
      </p>
      <button type="button" className="btn btn-principal" onClick={donnerConsentement}>
        <Check size={18} /> La personne a donné son consentement
      </button>
    </div>
  );

  const vueHistorique = (
    <div style={{ padding: 'var(--sp-4)', overflow: 'auto', height: '100%' }}>
      <div className="bloc">
        <div className="bloc-titre">Historique des échanges et passages</div>
        {evenements.length === 0 ? (
          <p style={{ color: 'var(--gris)', fontSize: '.85rem', margin: 0 }}>
            Aucun événement enregistré pour cette personne.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evenements.map((e) => (
              <li key={e.cle} style={{ borderBottom: '1px solid var(--ligne)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--gris)' }}>
                  <b style={{ color: 'var(--nuit)' }}>{formaterDate(e.date)}</b>
                  <span>{e.type}</span>
                  {e.auteur && <span>· {e.auteur}</span>}
                </div>
                {e.contenu && <div style={{ fontSize: '.85rem', color: 'var(--texte)' }}>{e.contenu}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <BandeauIdentite personne={personne} />

      {/* Barre d'action */}
      <div className="barre-actions">
        <span>{LIBELLES[voletActif]} — {libelleStatut}</span>
        <div className="actions">
          {peutAjouter && (
            <button type="button" className="btn btn-secondaire" onClick={ajouterPassage}>
              <Plus size={16} /> Nouveau passage
            </button>
          )}
          <button type="button" className="btn btn-secondaire" onClick={actualiser} title="Rafraîchir les données du dossier">
            <RefreshCw size={16} /> Actualiser
          </button>
          <button type="button" className="btn btn-principal" onClick={exporter}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Zone centrale */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {voletActif === 'synthese' && vueSynthese}
        {voletActif === 'historique' && vueHistorique}
        {voletVerrouille && vueSpiritualiteVerrouillee}
        {voletGrille && (
          <GrilleVolet
            passages={passagesDuVolet}
            colonnes={colonnesVolet}
            onCellValueChanged={onCellValueChanged}
            onGridReady={(params: any) => { gridApiRef.current = params.api; }}
            onCellContextMenu={onCellContextMenu}
          />
        )}
      </div>

      <OngletsVolets
        voletActif={voletActif}
        onChangerVolet={confirmerChangement}
        passages={tousPassages}
      />

      {menu && (
        <div
          style={{
            position: 'fixed',
            top: menu.y,
            left: menu.x,
            zIndex: 50,
            background: 'var(--feuille)',
            border: '1px solid var(--ligne)',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(16, 24, 40, .18)',
            padding: 4,
          }}
        >
          <button
            type="button"
            className="btn btn-secondaire"
            style={{ minHeight: 32, padding: '4px 10px', fontSize: '.8rem' }}
            onClick={() => supprimerLigne(menu.id)}
          >
            Supprimer cette ligne
          </button>
        </div>
      )}

      {dialog && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-label={dialog.titre}>
          <div className="dialog-modal">
            <b>{dialog.titre}</b>
            <p>{dialog.message}</p>
            <div className="dialog-actions">
              {dialog.onAnnuler && (
                <button type="button" className="btn btn-secondaire" onClick={dialog.onAnnuler}>Annuler</button>
              )}
              <button type="button" className="btn btn-principal" onClick={dialog.onAction}>{dialog.action}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div role="status" className="toast">{toast}</div>}
    </div>
  );
};

export default Volets;
