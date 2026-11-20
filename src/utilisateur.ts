// Utilisateur connecté (affiché dans l'en-tête et les exports).
// Point unique à brancher sur l'authentification quand elle sera disponible.
export const UTILISATEUR_COURANT = 'Awa Koné';

export type Utilisateur = {
  nom: string;
  role: string;
};

export const UTILISATEUR: Utilisateur = {
  nom: UTILISATEUR_COURANT,
  role: 'Administratrice',
};
