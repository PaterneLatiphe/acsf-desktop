// Dialogue de confirmation accessible : focus contenu, Échap pour fermer, focus rendu à la fermeture.

import React, { useCallback, useEffect, useRef } from 'react';

export interface DialogueConfirmationProps {
  titre: string;
  message: string;
  action: string;
  onAction: () => void;
  onAnnuler?: () => void;
  onFermer: () => void;
  focusRetour?: HTMLElement | null;
}

export const DialogueConfirmation: React.FC<DialogueConfirmationProps> = ({
  titre,
  message,
  action,
  onAction,
  onAnnuler,
  onFermer,
  focusRetour,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const boutonActionRef = useRef<HTMLButtonElement>(null);
  const focusInitialRef = useRef<HTMLElement | null>(null);
  const focusRetourRef = useRef(focusRetour);
  focusRetourRef.current = focusRetour;

  useEffect(() => {
    focusInitialRef.current = document.activeElement as HTMLElement | null;
    boutonActionRef.current?.focus();
    return () => {
      const cible = focusRetourRef.current ?? focusInitialRef.current;
      if (cible?.isConnected) cible.focus?.();
    };
  }, []);

  const annuler = useCallback(() => {
    if (onAnnuler) onAnnuler();
    else onFermer();
  }, [onAnnuler, onFermer]);

  const surTouche = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onFermer();
      return;
    }
    if (e.key !== 'Tab') return;
    const elements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!elements || elements.length === 0) {
      e.preventDefault();
      return;
    }
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === premier) {
      e.preventDefault();
      dernier.focus();
    } else if (!e.shiftKey && document.activeElement === dernier) {
      e.preventDefault();
      premier.focus();
    }
  };

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer(); }}
    >
      <div
        ref={modalRef}
        className="dialog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogue-titre"
        aria-describedby="dialogue-message"
        onKeyDown={surTouche}
      >
        <b id="dialogue-titre">{titre}</b>
        <p id="dialogue-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondaire" onClick={annuler}>Annuler</button>
          <button type="button" className="btn btn-principal" ref={boutonActionRef} onClick={onAction}>{action}</button>
        </div>
      </div>
    </div>
  );
};
