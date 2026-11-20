// Fiche officielle de création d'une personne — présentation seule, logique dans Personnes.tsx.

import React from 'react';
import FormulaireCadre, { type SectionFormulaire } from '../formulaires/FormulaireCadre';

export type Formulaire = Record<string, string>;

export const VIDE: Formulaire = {
  nom: '', prenom: '', sexe: '', dateNaissance: '', telephone: '', adresse: '', langue: 'fr', programme: '',
};

const SECTIONS: SectionFormulaire[] = [
  {
    titre: 'IDENTITÉ',
    champs: [
      { cle: 'nom', libelle: 'Nom', obligatoire: true },
      { cle: 'prenom', libelle: 'Prénom', obligatoire: true },
      { cle: 'sexe', libelle: 'Sexe', type: 'select', options: ['', 'Féminin', 'Masculin'] },
      { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date', indications: 'jj/mm/aaaa' },
    ],
  },
  {
    titre: 'COORDONNÉES',
    champs: [
      { cle: 'telephone', libelle: 'Téléphone', type: 'telephone', placeholder: 'XX XX XX XX' },
      { cle: 'adresse', libelle: 'Adresse / quartier', largeur: 2 },
    ],
  },
  {
    titre: 'SUIVI',
    champs: [
      { cle: 'programme', libelle: 'Programme', type: 'select', options: ['', 'Soutien scolaire', 'Appui familial', 'Formation parents'] },
      { cle: 'langue', libelle: 'Langue principale', type: 'select', options: ['fr', 'Mooré', 'Dioula', 'Autre'] },
      { cle: 'statut', libelle: 'Statut', disabled: true, valeurFixe: 'Suivie' },
      { cle: 'code', libelle: 'Code de filiation', disabled: true, placeholder: 'Généré à l’enregistrement' },
    ],
  },
];

interface Props {
  formulaire: Formulaire;
  erreurs: Formulaire;
  onChange: (formulaire: Formulaire) => void;
  onFermer: () => void;
  onEnregistrer: (e: React.FormEvent) => void;
  avecResumeErreurs?: boolean;
  modeGuide?: boolean;
}

const FormulairePersonne: React.FC<Props> = ({ formulaire, erreurs, onChange, onFermer, onEnregistrer, avecResumeErreurs, modeGuide }) => (
  <FormulaireCadre
    titre="Nouvelle personne"
    sections={SECTIONS}
    valeurs={formulaire}
    valeursInitiales={VIDE}
    erreurs={erreurs}
    onChange={onChange}
    onFermer={onFermer}
    onEnregistrer={onEnregistrer}
    avecResumeErreurs={avecResumeErreurs}
    modeGuide={modeGuide}
  />
);

export default FormulairePersonne;
