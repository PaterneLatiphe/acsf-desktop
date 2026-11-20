// Source unique etunique pour la configuration de tous les volets
// Plus jamais de redéfinition ailleurs dans le code

// Définition de chaque volet avec ses colonnes
export const VOLET_COLONNES = {
  synthese: {
    colonnes: [
      { cle: 'date', libelle: 'Date', type: 'date', editable: false },
      { cle: 'auteur', libelle: 'Saisi par', editable: false, type: 'text' },
      { cle: 'remarques', libelle: 'Remarques', type: 'textarea' },
      { cle: 'prochaineEcheance', libelle: 'Date du prochain RDV', type: 'date' },
    ],
    // Tri par défaut : récents d'abord
    triParDefaut: 'date_passage_desc',
  },
  education: {
    colonnes: [
      { cle: 'date', libelle: 'Date', type: 'date', editable: false },
      { cle: 'auteur', libelle: 'Saisi par', editable: false, type: 'text' },
      { cle: 'niveauScolaire', libelle: 'Niveau scolaire', type: 'text' },
      { cle: 'classeAnnee', libelle: 'Classe / année', type: 'text' },
      { cle: 'etablissement', libelle: 'Établissement', type: 'textarea' },
      { cle: 'difficultesReperees', libelle: 'Difficultés repérées', type: 'textarea' },
      { cle: 'soutienPrevu', libelle: 'Soutien prévu', type: 'text' },
      { cle: 'prochaineEcheance', libelle: 'Date du prochain RDV', type: 'date' },
    ],
    triParDefaut: 'date_passage_desc',
  },
  sante: {
    colonnes: [
      { cle: 'date', libelle: 'Date', type: 'date', editable: false },
      { cle: 'auteur', libelle: 'Saisi par', editable: false, type: 'text' },
      { cle: 'symptomes', libelle: 'Symptômes', type: 'textarea' },
      { cle: 'traitement', libelle: 'Traitement en cours', type: 'textarea' },
      { cle: 'evolution', libelle: 'Évolution', type: 'textarea' },
      { cle: 'suivi', libelle: 'Plan de suivi', type: 'textarea' },
      { cle: 'prochaineEcheance', libelle: 'Date du prochain RDV', type: 'date' },
    ],
    triParDefaut: 'date_passage_desc',
  },
  social: {
    colonnes: [
      { cle: 'date', libelle: 'Date', type: 'date', editable: false },
      { cle: 'auteur', libelle: 'Saisi par', editable: false, type: 'text' },
      { cle: 'typeConseil', libelle: 'Type de conseil', type: 'select', options: ['', 'Conseil familial', 'Orientation scolaire', 'Ressources sociales', 'Autre'] },
      { cle: 'conseilDeclares', libelle: 'Conseil déclaré', type: 'textarea' },
      { cle: 'prochaineEcheance', libelle: 'Date du prochain RDV', type: 'date' },
    ],
    triParDefaut: 'date_passage_desc',
  },
  spiritualite: {
    colonnes: [
      { cle: 'date', libelle: 'Date', type: 'date', editable: false },
      { cle: 'auteur', libelle: 'Saisi par', editable: false, type: 'text' },
      { cle: 'consentement', libelle: 'Consentement', type: 'select', options: ['', 'Donné', 'En cours d\'obtention'] },
      { cle: 'contenuSpirituel', libelle: 'Contenu spirituel', type: 'textarea' },
      { cle: 'prochaineEcheance', libelle: 'Date du prochain RDV', type: 'date' },
    ],
    triParDefaut: 'date_passage_desc',
    lecteurSeul: true, // Marque que ce volet est verrouillé sans consentement
  },
  historique: {
    colonnes: [
      { cle: 'date', libelle: 'Date', type: 'date', editable: false },
      { cle: 'type', libelle: 'Type', type: 'select', options: ['Échange', 'Rendez-vous', 'Conseil'] },
      { cle: 'auteur', libelle: 'Auteur', type: 'text' },
      { cle: 'contenu', libelle: 'Contenu', type: 'textarea' },
    ],
    triParDefaut: 'date_desc',
  },
};

// Export par défaut pour compatibilité
export default VOLET_COLONNES;