// Onglets en bas de la grille - style feuilles Excel
// Rôle : affichage des boutons-onglets pour naviguer entre les volets
// Accessibilité : role=tab, roving tabindex, navigation clavier (flèches, Début/Fin)
// Positionné en bas via flex order, toujours visible

import React, { useRef } from 'react';

import {
  LayoutDashboard,
  BookOpen,
  Heart,
  Users,
  Lock,
  History,
} from 'lucide-react';

export type CleVolet =
  | 'synthese'
  | 'education'
  | 'sante'
  | 'social'
  | 'spiritualite'
  | 'historique';

const ICONES: Record<CleVolet, React.ReactNode> = {
  synthese: <LayoutDashboard size={16} />,
  education: <BookOpen size={16} />,
  sante: <Heart size={16} />,
  social: <Users size={16} />,
  spiritualite: <Lock size={16} />,
  historique: <History size={16} />,
};

export const VOLETS: { cle: CleVolet; libelle: string }[] = [
  { cle: 'synthese', libelle: 'Synthèse' },
  { cle: 'education', libelle: 'Éducation' },
  { cle: 'sante', libelle: 'Santé' },
  { cle: 'social', libelle: 'Social' },
  { cle: 'spiritualite', libelle: 'Spiritualité' },
  { cle: 'historique', libelle: 'Historique' },
];

export interface OngletsVoletsProps {
  voletActif: string;
  onChangerVolet: (volet: CleVolet) => void;
  passages: any[];
}

const TOUCHES_DEPLACEMENT: string[] = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

export const OngletsVolets: React.FC<OngletsVoletsProps> = ({ voletActif, onChangerVolet, passages }) => {
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({});

  const focusVolet = (cle: string) => {
    window.setTimeout(() => {
      if (document.querySelector('[aria-modal="true"]')) return;
      boutons.current[cle]?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!TOUCHES_DEPLACEMENT.includes(e.key)) return;
    e.preventDefault();
    const idx = VOLETS.findIndex((v) => v.cle === voletActif);
    const total = VOLETS.length;
    let suivant: CleVolet;
    if (e.key === 'ArrowRight') {
      suivant = VOLETS[(idx + 1) % total].cle;
    } else if (e.key === 'ArrowLeft') {
      suivant = VOLETS[(idx - 1 + total) % total].cle;
    } else if (e.key === 'Home') {
      suivant = VOLETS[0].cle;
    } else {
      suivant = VOLETS[total - 1].cle;
    }
    onChangerVolet(suivant);
    focusVolet(suivant);
  };

  return (
    <div className="volet-tabs-bottom" role="tablist" aria-label="Volets du dossier">
      {VOLETS.map((v) => {
        const badge = v.cle !== 'synthese' && v.cle !== 'historique'
          ? passages.filter((p: any) => p.voletType === v.cle).length
          : '';
        return (
          <button
            key={v.cle}
            type="button"
            ref={(b) => { boutons.current[v.cle] = b; }}
            id={`volet-onglet-${v.cle}`}
            role="tab"
            aria-selected={voletActif === v.cle}
            aria-controls="volet-panneau"
            aria-label={badge !== '' && badge > 0
              ? `${v.libelle}, ${badge} passage${badge > 1 ? 's' : ''}`
              : v.libelle}
            tabIndex={voletActif === v.cle ? 0 : -1}
            className={`volet-tab-bottom${voletActif === v.cle ? ' actif' : ''}`}
            onClick={() => onChangerVolet(v.cle)}
            onKeyDown={onKeyDown}
          >
            {ICONES[v.cle]}
            <span>{v.libelle}</span>
            {badge !== '' && badge > 0 && <span className="volet-tab-badge" aria-hidden="true">{badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
