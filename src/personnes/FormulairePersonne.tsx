// Formulaire de création d'une personne — présentation seule, logique dans Personnes.tsx.

import React from 'react';
import { X } from 'lucide-react';

type Champ = {
  cle: string;
  libelle: string;
  obligatoire?: boolean;
  type?: 'text' | 'date' | 'select';
  options?: string[];
};

export type Formulaire = Record<string, string>;

export const CHAMPS: Champ[] = [
  { cle: 'prenom', libelle: 'Prénom', obligatoire: true },
  { cle: 'nom', libelle: 'Nom', obligatoire: true },
  { cle: 'sexe', libelle: 'Sexe', type: 'select', options: ['', 'Féminin', 'Masculin'] },
  { cle: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
  { cle: 'telephone', libelle: 'Téléphone' },
  { cle: 'adresse', libelle: 'Adresse / quartier' },
  { cle: 'langue', libelle: 'Langue principale', type: 'select', options: ['fr', 'Mooré', 'Dioula', 'Autre'] },
  { cle: 'programme', libelle: 'Programme', type: 'select', options: ['', 'Soutien scolaire', 'Appui familial', 'Formation parents'] },
];

export const VIDE: Formulaire = {
  prenom: '', nom: '', sexe: '', dateNaissance: '', telephone: '', adresse: '', langue: 'fr', programme: '',
};

interface Props {
  formulaire: Formulaire;
  erreur: string | null;
  onChange: (formulaire: Formulaire) => void;
  onFermer: () => void;
  onEnregistrer: (e: React.FormEvent) => void;
}

const FormulairePersonne: React.FC<Props> = ({ formulaire, erreur, onChange, onFermer, onEnregistrer }) => (
  <div className="dossier" role="dialog" aria-modal="true" aria-label="Nouvelle personne">
    <form onSubmit={onEnregistrer}>
      <div className="dossier-tete">
        <div>
          <b>Nouvelle personne</b>
          <small>Les champs prénom et nom sont obligatoires.</small>
        </div>
        <button type="button" className="btn btn-secondaire" onClick={onFermer} aria-label="Annuler">
          <X size={18} /> Annuler
        </button>
      </div>
      <div className="grille-form">
        {CHAMPS.map((champ) => (
          <label key={champ.cle} className="champ">
            <span>{champ.libelle}{champ.obligatoire ? ' *' : ''}</span>
            {champ.type === 'select' ? (
              <select value={formulaire[champ.cle]} onChange={(e) => onChange({ ...formulaire, [champ.cle]: e.target.value })}>
                {(champ.options ?? []).map((opt) => <option key={opt} value={opt}>{opt || '—'}</option>)}
              </select>
            ) : (
              <input
                type={champ.type === 'date' ? 'date' : 'text'}
                value={formulaire[champ.cle]}
                onChange={(e) => onChange({ ...formulaire, [champ.cle]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      {erreur && <p role="alert" style={{ color: 'var(--erreur-texte)', marginTop: 'var(--sp-3)' }}>{erreur}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
        <button type="button" className="btn btn-secondaire" onClick={onFermer}>Annuler</button>
        <button type="submit" className="btn btn-principal">Enregistrer</button>
      </div>
    </form>
  </div>
);

export default FormulairePersonne;
