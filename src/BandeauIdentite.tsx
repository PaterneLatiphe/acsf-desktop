// Bandeau d'identité compact - sur une seule ligne
// Affiche les infos principales de la personne sans interface complexe

import React from 'react';

export interface BandeauIdentiteProps {
  personne?: {
    nom: string;
    prenom: string;
    dateNaissance?: string;
    telephone?: string;
    code?: string;
  };
}

export const BandeauIdentite: React.FC<BandeauIdentiteProps> = ({ personne }) => {
  if (!personne) {
    return <div className="vide" style={{ padding: 'var(--sp-3)' }}>Personne non sélectionnée</div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--sp-3)', borderBottom: '1px solid var(--gris-light)', minHeight: 30 }}>
      <span style={{ fontWeight: 'bold', marginRight: 'var(--sp-2)' }}>{personne.nom}</span>
      <span>{personne.prenom}</span>
      {personne.dateNaissance && (
        <span style={{ marginLeft: 'var(--sp-4)', fontSize: '.75rem', color: 'var(--gris)' }}>
          {personne.dateNaissance}
        </span>
      )}
      {personne.telephone && (
        <span style={{ marginLeft: 'var(--sp-4)', fontSize: '.75rem', color: 'var(--gris)' }}>
          {personne.telephone}
        </span>
      )}
      {personne.code && (
        <span style={{ marginLeft: 'var(--sp-4)', fontSize: '.75rem', color: 'var(--gris)' }}>
          Code: {personne.code}
        </span>
      )}
    </div>
  );
};