// Layout global : menu latéral, en-tête clair, changement d'écran. Aucune logique métier.

import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Users, CalendarDays, NotebookPen, Tag, BarChart3,
  Search, PanelLeftClose, PanelLeftOpen, Check, WifiOff,
} from 'lucide-react';
import logoAcsf from './assets/acsf-logo-signe.png';
import Personnes from './Personnes';
import Agenda from './Agenda';
import Offres from './Offres';
import Rapports from './Rapports';
import TableauDeBord from './TableauDeBord';
import { Squelettes, IllustrationVide } from './Etats';
import { UTILISATEUR } from './utilisateur';

type Ecran = 'tableau' | 'personnes' | 'agenda' | 'suivi' | 'conseils' | 'rapports';

const MENU: { cle: Ecran; libelle: string; icone: React.ReactNode }[] = [
  { cle: 'tableau', libelle: 'Tableau de bord', icone: <LayoutDashboard size={20} /> },
  { cle: 'personnes', libelle: 'Personnes', icone: <Users size={20} /> },
  { cle: 'agenda', libelle: 'Agenda', icone: <CalendarDays size={20} /> },
  { cle: 'suivi', libelle: 'Offres', icone: <Tag size={20} /> },
  { cle: 'conseils', libelle: 'Conseils', icone: <NotebookPen size={20} /> },
  { cle: 'rapports', libelle: 'Rapports', icone: <BarChart3 size={20} /> },
];

function lirePreference(): boolean {
  try {
    return localStorage.getItem('acsf:sidebar-collapsed') === '1';
  } catch {
    return false;
  }
}

const initiales = UTILISATEUR.nom.split(' ').map((mot) => mot[0]).join('').slice(0, 2).toUpperCase();

function App() {
  const [ecran, setEcran] = useState<Ecran>('tableau');
  const [chargement, setChargement] = useState(true);
  const [reduit, setReduit] = useState<boolean>(lirePreference);
  const [rechercheRapide, setRechercheRapide] = useState('');
  const [enLigne, setEnLigne] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const rechercheRef = useRef<HTMLInputElement>(null);

  // Lecture seule de l'état réseau du navigateur : aucun état métier n'est modifié.
  useEffect(() => {
    const mettreAJour = () => setEnLigne(navigator.onLine);
    window.addEventListener('online', mettreAJour);
    window.addEventListener('offline', mettreAJour);
    return () => {
      window.removeEventListener('online', mettreAJour);
      window.removeEventListener('offline', mettreAJour);
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setChargement(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('acsf:sidebar-collapsed', reduit ? '1' : '0');
    } catch { /* stockage indisponible */ }
  }, [reduit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        rechercheRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const contenu = () => {
    if (chargement) return <Squelettes />;
    switch (ecran) {
      case 'tableau':
        return <TableauDeBord onCreer={() => setEcran('personnes')} onNaviguer={setEcran} />;
      case 'personnes': return <Personnes />;
      case 'agenda': return <Agenda />;
      case 'suivi': return <Offres />;
      case 'rapports': return <Rapports />;
      default:
        return (
          <div className="page-enter">
            <h1 className="page">{MENU.find((m) => m.cle === ecran)?.libelle}</h1>
            <p className="sous-titre">ACSF-AFRIQUE — ACSF Desktop</p>
            <div className="vide">
              <IllustrationVide />
              <b>Bientôt</b>
              Cet écran n'est pas encore construit. On avance une étape à la fois, dans l'ordre validé.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <nav className={reduit ? 'side collapsed' : 'side'} aria-label="Menu principal">
        <div className="logo-block">
          <img src={logoAcsf} alt="Sigle ACSF-AFRIQUE" />
          <div className="logo-texte"><b>ACSF Desktop</b><small>ACSF-AFRIQUE SARL</small></div>
        </div>
        <div className="nav">
          {MENU.map((item) => (
            <button
              key={item.cle}
              type="button"
              className={ecran === item.cle ? 'navbtn active' : 'navbtn'}
              aria-current={ecran === item.cle ? 'page' : undefined}
              aria-label={item.libelle}
              onClick={() => setEcran(item.cle)}
              title={item.libelle}
            >
              {item.icone}<span>{item.libelle}</span>
            </button>
          ))}
        </div>
        <div className="side-foot">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setReduit((v) => !v)}
            aria-label={reduit ? 'Étendre le menu' : 'Réduire le menu'}
            aria-expanded={!reduit}
          >
            {reduit ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{reduit ? 'Étendre le menu' : 'Réduire le menu'}</span>
          </button>
        </div>
      </nav>

      <div className="main">
        <header className="topbar">
          <div className="recherche" role="search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={rechercheRef}
              id="recherche-rapide"
              type="text"
              value={rechercheRapide}
              onChange={(e) => setRechercheRapide(e.target.value)}
              placeholder="Rechercher une personne, un rendez-vous…"
              aria-label="Recherche rapide"
            />
            <button
              type="button"
              className="recherche-effacer"
              onClick={() => setRechercheRapide('')}
              disabled={rechercheRapide.trim() === ''}
              aria-label="Effacer la recherche rapide"
            >
              Effacer
            </button>
            <kbd>Ctrl K</kbd>
          </div>
          <div className="topbar-droite">
            <span className="etat-base"><span className="dot" aria-hidden="true" />Base locale</span>
            <span className="etat-sauvegarde" role="status" aria-live="polite">
              {enLigne ? <Check size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
              {' '}{enLigne ? 'Tout est enregistré' : 'Hors ligne — données conservées sur cet appareil'}
            </span>
            <div className="user">
              <div className="avatar" aria-hidden="true">{initiales}</div>
              <span>{UTILISATEUR.nom}<small>{UTILISATEUR.role}</small></span>
            </div>
          </div>
        </header>
        <main className="content" key={ecran}>{contenu()}</main>
      </div>
    </div>
  );
}

export default App;
