// Onglets en bas de la grille - style feuilles Excel
// Rôle : affichage des boutons-onglets pour naviguer entre les volets
// Positionné en bas via flex order, toujours visible

import React from 'react';
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
  setVoletActif: (volet: string) => void;
  passages: any[];
}

export const OngletsVolets: React.FC<OngletsVoletsProps> = ({ voletActif, setVoletActif, passages }) => {
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
            role="tab"
            aria-selected={voletActif === v.cle}
            className={`volet-tab-bottom${voletActif === v.cle ? ' actif' : ''}`}
            onClick={() => setVoletActif(v.cle)}
          >
            {ICONES[v.cle]}
            <span>{v.libelle}</span>
            {badge !== '' && badge > 0 && <span className="volet-tab-badge">{badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
