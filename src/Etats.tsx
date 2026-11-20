// Squelettes, état vide illustré et filet de sécurité avec bouton Réessayer.

import React, { Component } from 'react';

export const Squelettes: React.FC = () => (
  <div className="page-enter" aria-busy="true" aria-label="Chargement en cours">
    <div className="kpis">
      {[0, 1, 2, 3].map((i) => <div key={i} className="kpi skel skel-kpi" aria-hidden="true" />)}
    </div>
    <div className="grille">
      <div className="bloc"><div className="skel skel-ligne" /><div className="skel skel-ligne" /></div>
      <div className="bloc"><div className="skel skel-ligne" /><div className="skel skel-ligne" /></div>
    </div>
  </div>
);

export const IllustrationVide: React.FC = () => (
  <svg className="illustration-vide" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
    <rect x="10" y="14" width="52" height="46" rx="6" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="30" cy="34" r="6.5" stroke="currentColor" strokeWidth="2.5" />
    <path d="M19 52c2.5-6.5 7.5-9.5 11-9.5S38.5 45.5 41 52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path className="valide" d="M47 28l4.5 4.5L61 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export class FiletErreur extends Component<{ children: React.ReactNode }, { erreur: boolean }> {
  state = { erreur: false };

  static getDerivedStateFromError() {
    return { erreur: true };
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="vide" role="alert">
          <b>Une erreur est survenue.</b>
          Rechargez l'écran pour reprendre votre travail.
          <button type="button" className="btn btn-principal" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
