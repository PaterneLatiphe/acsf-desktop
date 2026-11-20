// Volets.tsx - Assembleur de l'interface dossier personne
// Interface type tableur Excel (AG Grid Community MIT), branchée sur l'API réelle db.ts
// Zéro dépendance payante

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Lock, Check } from 'lucide-react';

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
  personne?: { nom: string; prenom: string; dateNaissance?: string; telephone?: string; code?: string };
  onChanger?: () => void;
};

type Statut = 'idle' | 'saving' | 'saved' | 'error';

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

const Volets: React.FC<VoletsProps> = ({ personneId, utilisateur, personne, onChanger }) => {
  const [voletActif, setVoletActif] = useState('synthese');
  const [passagesParVolet, setPassagesParVolet] = useState<Record<string, Passage[]>>({});
  const [consentementSpirituel, setConsentementSpirituel] = useState<Consent | null>(null);
  const [echanges, setEchanges] = useState<Echange[]>([]);
  const [statut, setStatut] = useState<Statut>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null);
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

  // Suppression d'une ligne via clic droit
  const supprimerLigne = useCallback(async (id: string) => {
    setMenu(null);
    const confirme = window.confirm('Supprimer ce passage ? Cette suppression est tracée dans l’historique.');
    if (!confirme) return;
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

  const exporter = useCallback(() => {
    exporterExcel(personneId, voletActif, {
      nom: personne?.nom || '',
      prenom: personne?.prenom || '',
      dateNaissance: personne?.dateNaissance,
      telephone: personne?.telephone,
      code: personne?.code,
      passages: tousPassages,
    });
    afficherToast('Export Excel généré');
  }, [personneId, voletActif, personne, tousPassages, afficherToast]);

  const libelleStatut =
    statut === 'saving' ? 'Enregistrement…'
      : statut === 'saved' ? 'Enregistré'
        : statut === 'error' ? 'Erreur d’enregistrement'
          : 'Base locale';

  // ---------- Vues ----------
  const vueSynthese = (
    <div style={{ padding: 'var(--sp-4)', overflow: 'auto', height: '100%' }}>
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
              onClick={() => setVoletActif(cle)}
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

      <div className="bloc">
        <div className="bloc-titre">Carnet de suivi</div>
        <p style={{ color: 'var(--gris)', fontSize: '.85rem', margin: 0 }}>
          {tousPassages.length === 0
            ? 'Aucun passage enregistré. Choisissez un volet puis cliquez sur « Nouveau passage ».'
            : `${tousPassages.length} passage(s) au total dans le carnet. Le passage le plus récent date du ${formaterDate(tousPassages[0]?.datePassage)}.`}
        </p>
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

      {/* Barre d'action au-dessus de la grille */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-3)',
          padding: '6px var(--sp-3)',
          borderBottom: '1px solid var(--ligne)',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '.75rem', color: 'var(--gris)' }}>
          {LIBELLES[voletActif]} — {libelleStatut}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--sp-2)' }}>
          {peutAjouter && (
            <button
              type="button"
              className="btn btn-secondaire"
              style={{ minHeight: 36, padding: '6px 12px', fontSize: '.8rem' }}
              onClick={ajouterPassage}
            >
              <Plus size={16} /> Nouveau passage
            </button>
          )}
          <button
            type="button"
            className="btn btn-principal"
            style={{ minHeight: 36, padding: '6px 12px', fontSize: '.8rem' }}
            onClick={exporter}
          >
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
        setVoletActif={setVoletActif}
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

      {toast && <div role="status" className="toast">{toast}</div>}
    </div>
  );
};

export default Volets;
