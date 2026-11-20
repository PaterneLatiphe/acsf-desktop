// Ton de charte pour l'export Excel — dérivé de src/charte.css
// Couleurs au format ARGB (ex. 'FF150A54' = #150A54).
// Le bleu nuit reste pour les en-têtes, le fond neutre pour les lignes impaires,
// le blanc pour le texte sur bleu.

export const CHARTE_COULEURS = {
  nuit: 'FF150A54',   // --nuit — identité ACSF
  fond: 'FFF6F7FB',   // --fond — fond neutre des feuilles
  blanc: 'FFFFFFFF',  // --feuille / blanc — texte sur nuit
} as const;
