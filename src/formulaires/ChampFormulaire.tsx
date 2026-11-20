// Champ générique des fiches d'enregistrement : libellé, contrôle 40 px, erreur sous le champ.

import React from 'react';

export type TypeChamp = 'texte' | 'nombre' | 'date' | 'datetime' | 'telephone' | 'select';

export type OptionChamp = string | { valeur: string; libelle: string };

export type ChampFormulaire = {
  cle: string;
  libelle: string;
  type?: TypeChamp;
  options?: OptionChamp[];
  obligatoire?: boolean;
  largeur?: 1 | 2;
  disabled?: boolean;
  valeurFixe?: string;
  placeholder?: string;
  indications?: string;
};

type Props = {
  champ: ChampFormulaire;
  valeur: string;
  erreur?: string;
  onChange: (valeur: string) => void;
};

const formaterTelephone = (valeur: string): string =>
  valeur.replace(/\D/g, '').slice(0, 8).replace(/(\d{2})(?=\d)/g, '$1 ');

const typeHtml: Record<TypeChamp, string> = {
  texte: 'text',
  nombre: 'number',
  date: 'date',
  datetime: 'datetime-local',
  telephone: 'tel',
  select: 'text',
};

const ChampFormulaire: React.FC<Props> = ({ champ, valeur, erreur, onChange }) => {
  const type = champ.type ?? 'texte';
  const valeurAffichee = champ.valeurFixe ?? (type === 'telephone' ? formaterTelephone(valeur) : valeur);
  const options = (champ.options ?? []).map((option) =>
    typeof option === 'string' ? { valeur: option, libelle: option || '—' } : option,
  );

  const modifier = (suite: string) => {
    onChange(type === 'telephone' ? suite.replace(/\D/g, '').slice(0, 8) : suite);
  };

  return (
    <label className={`champ${champ.largeur === 2 ? ' champ-large' : ''}${erreur ? ' champ-invalide' : ''}`}>
      <span className="champ-libelle">
        {champ.libelle}
        {champ.obligatoire && <em className="champ-etoile">*</em>}
        {champ.indications && <small>{champ.indications}</small>}
      </span>
      <span className={`champ-controle${type === 'telephone' ? ' avec-indicatif' : ''}`}>
        {type === 'telephone' && <span className="champ-indicatif">+226</span>}
        {type === 'select' ? (
          <select
            id={`champ-${champ.cle}`}
            data-champ={champ.cle}
            value={valeurAffichee}
            disabled={champ.disabled}
            aria-invalid={Boolean(erreur)}
            aria-describedby={erreur ? `erreur-${champ.cle}` : undefined}
            onChange={(e) => modifier(e.target.value)}
          >
            {options.map((option) => (
              <option key={option.valeur} value={option.valeur}>{option.libelle}</option>
            ))}
          </select>
        ) : (
          <input
            id={`champ-${champ.cle}`}
            data-champ={champ.cle}
            type={typeHtml[type]}
            value={valeurAffichee}
            disabled={champ.disabled}
            placeholder={champ.placeholder}
            title={type === 'date' ? 'Saisir au format jj/mm/aaaa' : undefined}
            lang={type === 'date' ? 'fr' : undefined}
            inputMode={type === 'telephone' || type === 'nombre' ? 'numeric' : undefined}
            aria-invalid={Boolean(erreur)}
            aria-describedby={erreur ? `erreur-${champ.cle}` : undefined}
            onChange={(e) => modifier(e.target.value)}
          />
        )}
      </span>
      {erreur && <span id={`erreur-${champ.cle}`} className="champ-erreur" role="alert">{erreur}</span>}
    </label>
  );
};

export default ChampFormulaire;
