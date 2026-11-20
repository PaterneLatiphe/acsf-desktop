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
    <div className="bandeau-identite">
      <b>{personne.nom}</b>
      <span>{personne.prenom}</span>
      {personne.dateNaissance && <span className="bandeau-detail">{personne.dateNaissance}</span>}
      {personne.telephone && <span className="bandeau-detail">{personne.telephone}</span>}
      {personne.code && <span className="bandeau-detail">Code : {personne.code}</span>}
    </div>
  );
};