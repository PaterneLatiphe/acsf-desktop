// États réutilisables pour les listes et la grille : texte clair, une seule action,
// annonce polie aux lecteurs d'écran. Ajout pur : aucune logique existante n'est modifiée.

import React from 'react';
import { IllustrationVide } from './Etats';

export type ActionEtat = { libelle: string; onClick: () => void };

/** Contenu de l'overlay « aucune ligne » d'AG Grid. */
export const GrilleVide: React.FC<{ message?: string }> = ({ message }) => (
  <div className="etat-grille" role="status">
    <b>Aucune ligne à afficher.</b>
    <span>{message ?? 'Ajoutez une ligne ou modifiez les filtres pour voir des résultats.'}</span>
  </div>
);

/** État vide de page : illustration, une phrase courte et au plus une action. */
export const EtatVide: React.FC<{
  titre: string;
  message?: string;
  action?: ActionEtat;
}> = ({ titre, message, action }) => (
  <div className="vide">
    <IllustrationVide />
    <b>{titre}</b>
    {message}
    {action && (
      <div className="etat-action">
        <button type="button" className="btn btn-principal" onClick={action.onClick}>
          {action.libelle}
        </button>
      </div>
    )}
  </div>
);

/** Message éphémère annoncé poliment. Le focus le rend temporairement stable. */
export const Toast: React.FC<{
  message: string;
  onPause: () => void;
  onReprendre: () => void;
}> = ({ message, onPause, onReprendre }) => (
  <div
    role="status"
    aria-live="polite"
    className="toast"
    tabIndex={0}
    onFocus={onPause}
    onBlur={onReprendre}
  >
    {message}
  </div>
);

/** Statut de données : toujours en texte, jamais seulement par la couleur. */
export const StatutDonnees: React.FC<{
  affiches: number;
  total?: number;
  /** Nombre de lignes retenues par les filtres, quand il diffère du total. */
  selection?: number;
  enErreur?: boolean;
  onReessayer?: () => void;
}> = ({ affiches, total, selection, enErreur = false, onReessayer }) => (
  <div className="statut-donnees" role="status" aria-live="polite">
    {enErreur ? (
      <>
        <span>Données non chargées.</span>
        {onReessayer && (
          <button type="button" className="btn btn-secondaire" onClick={onReessayer}>
            Réessayer
          </button>
        )}
      </>
    ) : (
      <span>
        {total === undefined
          ? `${affiches} résultat${affiches === 1 ? '' : 's'} affiché${affiches === 1 ? '' : 's'}.`
          : `${affiches} affiché${affiches === 1 ? '' : 's'} sur ${total}.`}
        {selection !== undefined && total !== undefined
          ? ` Sélection filtrée : ${selection} sur ${total}.`
          : ''}
      </span>
    )}
  </div>
);
