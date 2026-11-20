// Cadre partagé de toutes les fiches d'enregistrement : en-tête fixe, corps scrollable, pied fixe.

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ChampFormulaire, { type ChampFormulaire as Champ } from './ChampFormulaire';
import ResumeErreurs, { type ErreurResume } from './ResumeErreurs';

export type { ChampFormulaire, OptionChamp } from './ChampFormulaire';

export type SectionFormulaire = {
  titre: string;
  champs: Champ[];
};

export type ValeursFormulaire = Record<string, string>;

type Props = {
  titre: string;
  sections: SectionFormulaire[];
  valeurs: ValeursFormulaire;
  valeursInitiales?: ValeursFormulaire;
  erreurs?: ValeursFormulaire;
  erreurGenerale?: string | null;
  onChange: (valeurs: ValeursFormulaire) => void;
  onFermer: () => void;
  onEnregistrer: (e: React.FormEvent) => void;
  libelleEnregistrer?: string;
  avecResumeErreurs?: boolean;
  modeGuide?: boolean;
};

const FormulaireCadre: React.FC<Props> = ({
  titre,
  sections,
  valeurs,
  valeursInitiales,
  erreurs = {},
  erreurGenerale,
  onChange,
  onFermer,
  onEnregistrer,
  libelleEnregistrer = 'Enregistrer',
  avecResumeErreurs = false,
  modeGuide = false,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const depart = useRef<ValeursFormulaire>(valeursInitiales ?? valeurs);
  const [etape, setEtape] = useState(0);
  const guide = modeGuide && sections.length > 1;
  const sectionsAffichees = guide ? [sections[Math.min(etape, sections.length - 1)]] : sections;

  const listeErreurs: ErreurResume[] = Object.entries(erreurs)
    .map(([cle, message]) => {
      const champ = sections.flatMap((section) => section.champs).find((c) => c.cle === cle);
      return champ && message ? { cle, libelle: champ.libelle, message } : null;
    })
    .filter((erreur): erreur is ErreurResume => erreur !== null);

  const allerEtape = (index: number) => {
    if (!guide || index < 0 || index >= sections.length) return;
    setEtape(index);
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('.formulaire-section [data-champ]:not([disabled])')?.focus();
    });
  };

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[data-champ]:not([disabled])')?.focus();
  }, []);

  useEffect(() => {
    const premierInvalide = sections.flatMap((section) => section.champs).find((champ) => erreurs[champ.cle]);
    if (!premierInvalide) return;
    const index = sections.findIndex((section) => section.champs.some((champ) => champ.cle === premierInvalide.cle));
    if (guide && index >= 0 && index !== etape) {
      setEtape(index);
      return;
    }
    formRef.current?.querySelector<HTMLElement>(`[data-champ="${premierInvalide.cle}"]`)?.focus();
  }, [erreurs, sections, guide, etape]);

  const modifie = Object.keys({ ...depart.current, ...valeurs })
    .some((cle) => (valeurs[cle] ?? '') !== (depart.current[cle] ?? ''));

  const fermer = () => {
    if (modifie && !window.confirm('Des saisies ne sont pas enregistrées. Fermer quand même ?')) return;
    onFermer();
  };

  const surTouche = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      fermer();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      formRef.current?.requestSubmit();
      return;
    }
    if (e.key !== 'Enter' || e.shiftKey || !(e.target instanceof HTMLElement)) return;
    if (!['INPUT', 'SELECT'].includes(e.target.tagName)) return;
    e.preventDefault();
    const champs = Array.from(formRef.current?.querySelectorAll<HTMLElement>('[data-champ]:not([disabled])') ?? []);
    const suivant = champs[champs.indexOf(e.target) + 1] ?? formRef.current?.querySelector<HTMLElement>('[type="submit"]');
    suivant?.focus();
  };

  return (
    <div className="formulaire-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) fermer(); }}>
      <form
        ref={formRef}
        className="formulaire-cadre"
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onSubmit={onEnregistrer}
        onKeyDown={surTouche}
        noValidate
      >
        <header className="formulaire-tete">
          <div>
            <small>ACSF-AFRIQUE SARL · Agence de Ouaga</small>
            <b>{titre}</b>
          </div>
          <span className="formulaire-obligatoire">* Champs obligatoires</span>
          <button type="button" className="formulaire-fermer" onClick={fermer} aria-label="Fermer la fenêtre">
            <X size={18} />
          </button>
        </header>

        <div className="formulaire-corps">
          {guide && (
            <div className="formulaire-etapes" role="group" aria-label="Étapes du formulaire">
              {sections.map((section, index) => (
                <button
                  key={section.titre}
                  type="button"
                  className={`formulaire-etape${index === etape ? ' active' : ''}`}
                  aria-current={index === etape ? 'step' : undefined}
                  onClick={() => allerEtape(index)}
                >
                  <span aria-hidden="true">{index + 1}</span> {section.titre}
                </button>
              ))}
            </div>
          )}
          {avecResumeErreurs && <ResumeErreurs erreurs={listeErreurs} />}
          {sectionsAffichees.map((section) => (
            <section className="formulaire-section" key={section.titre}>
              <h2 className="section-titre">{section.titre}</h2>
              <div className="grille-champs">
                {section.champs.map((champ) => (
                  <ChampFormulaire
                    key={champ.cle}
                    champ={champ}
                    valeur={valeurs[champ.cle] ?? ''}
                    erreur={erreurs[champ.cle]}
                    onChange={(valeur) => onChange({ ...valeurs, [champ.cle]: valeur })}
                  />
                ))}
              </div>
            </section>
          ))}
          {erreurGenerale && <p className="formulaire-erreur" role="alert">{erreurGenerale}</p>}
        </div>

        <footer className="formulaire-pied">
          <div className="formulaire-actions">
            {guide && (
              <>
                <button type="button" className="btn btn-secondaire" onClick={() => allerEtape(etape - 1)} disabled={etape === 0}>
                  Étape précédente
                </button>
                <button type="button" className="btn btn-secondaire" onClick={() => allerEtape(etape + 1)} disabled={etape >= sections.length - 1}>
                  Étape suivante
                </button>
              </>
            )}
            <button type="button" className="btn btn-secondaire" onClick={fermer}>Annuler</button>
            <button type="submit" className="btn btn-principal">{libelleEnregistrer}</button>
          </div>
        </footer>
      </form>
    </div>
  );
};

export default FormulaireCadre;
