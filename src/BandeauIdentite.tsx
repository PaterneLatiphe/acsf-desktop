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

  const details = [
    personne.dateNaissance && { libelle: 'Né(e) le', valeur: personne.dateNaissance },
    personne.telephone && { libelle: 'Tél.', valeur: personne.telephone },
    personne.code && { libelle: 'Code', valeur: personne.code },
  ].filter(Boolean) as { libelle: string; valeur: string }[];
  const identite = [personne.nom, personne.prenom,
    ...details.map((d) => `${d.libelle} : ${d.valeur}`),
  ].join(' · ');

  return (
    <div className="bandeau-identite" title={identite}>
      <b>{personne.nom}</b>
      <span>{personne.prenom}</span>
      {details.map((d) => (
        <span key={d.libelle} className="bandeau-detail">{d.libelle} : {d.valeur}</span>
      ))}
    </div>
  );
};