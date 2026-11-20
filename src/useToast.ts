// Cycle de vie partagé des messages éphémères : un seul minuteur, nettoyage à la
// désactivation, et pause automatique quand le message reçoit le focus clavier.
// Ajout pur : les textes et les durées existants restent identiques.

import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(delaiParDefaut = 2600) {
  const [toast, setToast] = useState<string | null>(null);
  const minuteur = useRef<number | null>(null);
  const restant = useRef(delaiParDefaut);
  const debut = useRef(0);
  const enPause = useRef(false);
  const actif = useRef(false);

  const nettoyer = useCallback(() => {
    if (minuteur.current !== null) {
      window.clearTimeout(minuteur.current);
      minuteur.current = null;
    }
  }, []);

  const programmer = useCallback((delai: number) => {
    nettoyer();
    debut.current = Date.now();
    minuteur.current = window.setTimeout(() => {
      minuteur.current = null;
      enPause.current = false;
      actif.current = false;
      setToast(null);
    }, Math.max(0, delai));
  }, [nettoyer]);

  const afficherToast = useCallback((message: string, delai = delaiParDefaut) => {
    restant.current = delai;
    enPause.current = false;
    actif.current = true;
    setToast(message);
    programmer(delai);
  }, [delaiParDefaut, programmer]);

  const mettreEnPause = useCallback(() => {
    if (minuteur.current === null) return;
    restant.current = Math.max(0, restant.current - (Date.now() - debut.current));
    nettoyer();
    enPause.current = true;
  }, [nettoyer]);

  const reprendre = useCallback(() => {
    if (!enPause.current || !actif.current) return;
    enPause.current = false;
    programmer(restant.current);
  }, [programmer]);

  const fermerToast = useCallback(() => {
    actif.current = false;
    enPause.current = false;
    nettoyer();
    setToast(null);
  }, [nettoyer]);

  useEffect(() => () => {
    actif.current = false;
    nettoyer();
  }, [nettoyer]);

  return { toast, afficherToast, fermerToast, mettreEnPause, reprendre };
}
