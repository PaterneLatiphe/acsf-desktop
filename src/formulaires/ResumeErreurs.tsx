// Résumé d'erreurs en langage clair, avec un lien vers chaque champ.
// Activé explicitement par les fiches qui le souhaitent ; le focus reste sur le
// premier champ invalide, comme dans l'application avant cet ajout.

import React from 'react';

export type ErreurResume = {
  cle: string;
  libelle: string;
  message: string;
};

export const ResumeErreurs: React.FC<{ erreurs: ErreurResume[] }> = ({ erreurs }) => {
  if (erreurs.length === 0) return null;

  return (
    <div className="resume-erreurs" role="alert">
      <b>
        {erreurs.length === 1
          ? '1 champ à corriger.'
          : `${erreurs.length} champs à corriger.`}
      </b>
      <ul>
        {erreurs.map((erreur) => (
          <li key={erreur.cle}>
            <a href={`#champ-${erreur.cle}`}>
              {erreur.libelle} : {erreur.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResumeErreurs;
