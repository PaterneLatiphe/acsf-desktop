import React, { Component, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  NotebookPen,
  Tag,
  BarChart3,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  UserRoundPlus,
  Database,
} from 'lucide-react';
import logoAcsf from './assets/acsf-logo-signe.png';
import './charte.css';
import Personnes from './Personnes';
import Agenda from './Agenda';
import Rapports from './Rapports';
import { listerPersonnes, listerRdvs } from './db';

type Ecran =
  | 'tableau'
  | 'personnes'
  | 'agenda'
  | 'suivi'
  | 'conseils'
  | 'rapports';

const MENU: { cle: Ecran; libelle: string; icone: React.ReactNode }[] = [
  { cle: 'tableau', libelle: 'Tableau de bord', icone: <LayoutDashboard size={20} /> },
  { cle: 'personnes', libelle: 'Personnes', icone: <Users size={20} /> },
  { cle: 'agenda', libelle: 'Agenda', icone: <CalendarDays size={20} /> },
  { cle: 'suivi', libelle: 'Offres', icone: <Tag size={20} /> },
  { cle: 'conseils', libelle: 'Conseils', icone: <NotebookPen size={20} /> },
  { cle: 'rapports', libelle: 'Rapports', icone: <BarChart3 size={20} /> },
];

function lirePreference(reduitParDefaut: boolean): boolean {
  try {
    return localStorage.getItem('acsf:sidebar-collapsed') === '1';
  } catch {
    return reduitParDefaut;
  }
}

/* ---------- Blocs de chargement (squelettes) ---------- */
const Squelettes: React.FC = () => (
  <>
    <div className="kpis">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="kpi skel skel-kpi" aria-hidden="true" />
      ))}
    </div>
    <div className="grille">
      <div className="bloc"><div className="skel skel-ligne" /><div className="skel skel-ligne" /></div>
      <div className="bloc"><div className="skel skel-ligne" /><div className="skel skel-ligne" /></div>
    </div>
  </>
);

/* ---------- Illustration simple pour l'état vide ---------- */
const IllustrationVide: React.FC = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
    <rect x="10" y="14" width="52" height="46" rx="6" stroke="#c9c6e8" strokeWidth="2.5" />
    <circle cx="30" cy="34" r="6.5" stroke="#150A54" strokeWidth="2.5" />
    <path d="M19 52c2.5-6.5 7.5-9.5 11-9.5S38.5 45.5 41 52" stroke="#150A54" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M47 28l4.5 4.5L61 23" stroke="#7AB444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TableauDeBord: React.FC<{ onCreer: () => void; onNaviguer: (e: Ecran) => void }> = ({ onCreer, onNaviguer }) => {
  const [stats, setStats] = useState({ personnes: 0, parrainages: 0, rdvsSemaine: 0, contributions: 0 });
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const personnes = await listerPersonnes();
        const rdvs = await listerRdvs();
        // Semaine calendaire en cours (lundi 00:00 → lundi suivant).
        const lundi = new Date();
        lundi.setHours(0, 0, 0, 0);
        lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
        const lundiSuivant = new Date(lundi);
        lundiSuivant.setDate(lundiSuivant.getDate() + 7);
        const rdvsSemaine = rdvs.filter((r) => {
          const date = new Date(String(r.dateHeure || ''));
          return !isNaN(date.getTime()) && date >= lundi && date < lundiSuivant;
        }).length;
        if (actif) setStats({ personnes: personnes.length, parrainages: 0, rdvsSemaine, contributions: 0 });
      } catch { /* stats inaccessibles */ }
    })();
    return () => { actif = false; };
  }, []);
  return (
  <>
    <h1 className="page">Tableau de bord</h1>
    <p className="sous-titre">Jeudi 19 novembre · Administratrice de l'agence de Ouaga</p>

    <div className="kpis">
      <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('personnes')} title="Voir les personnes suivies">
        <div className="kpi-tete">
          <span className="chip nuit"><Users size={20} /></span>
          <span className="kpi-label">Personnes suivies</span>
        </div>
        <div className="kpi-chiffre">{stats.personnes}</div>
        <div className="kpi-var">{stats.personnes ? `${stats.personnes} dossiers enregistrés` : "Aucune personne enregistrée pour l'instant"}</div>
      </button>

      <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('personnes')} title="Voir les parrainages">
        <div className="kpi-tete">
          <span className="chip jaune"><UserRoundPlus size={20} /></span>
          <span className="kpi-label">Parrainages en attente</span>
        </div>
        <div className="kpi-chiffre">{stats.parrainages}</div>
        <div className="kpi-var">Aucun pour l'instant</div>
      </button>

      <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('agenda')} title="Voir l'agenda">
        <div className="kpi-tete">
          <span className="chip vert"><CalendarDays size={20} /></span>
          <span className="kpi-label">RDV cette semaine</span>
        </div>
        <div className="kpi-chiffre">{stats.rdvsSemaine}</div>
        <div className="kpi-var">{stats.rdvsSemaine ? `${stats.rdvsSemaine} rendez-vous planifiés` : 'Aucun rendez-vous cette semaine'}</div>
      </button>

      <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('personnes')} title="Voir les contributions famille">
        <div className="kpi-tete">
          <span className="chip brique"><NotebookPen size={20} /></span>
          <span className="kpi-label">Contributions à revoir</span>
        </div>
        <div className="kpi-chiffre">{stats.contributions}</div>
        <div className="kpi-var">Rien à vérifier</div>
      </button>
    </div>

    <div className="grille">
      <div className="bloc">
        <div className="bloc-titre">
          Prochains rendez-vous
          <button type="button" className="lien-bloc" onClick={() => onNaviguer('agenda')}>Voir l'agenda →</button>
        </div>
        <div className="vide" style={{ boxShadow: 'none', background: 'transparent', padding: '28px 16px' }}>
          <IllustrationVide />
          <b>Aucun rendez-vous cette semaine</b>
          Les rendez-vous planifiés apparaîtront ici, personne par personne.
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <button type="button" className="btn btn-principal" onClick={onCreer}>
              <UserRoundPlus size={18} /> Créer une personne
            </button>
          </div>
        </div>
      </div>

      <div className="bloc">
        <div className="bloc-titre">
          Activité récente
          <button type="button" className="lien-bloc" onClick={() => onNaviguer('personnes')}>Voir les personnes →</button>
        </div>
        <div className="ligne">
          <div className="ligne-point"><CalendarDays size={18} /></div>
          <div className="info">
            <b>Aucun événement pour l'instant</b>
            <small>La première personne créée apparaîtra ici avec ses premiers rendez-vous.</small>
          </div>
        </div>
      </div>
    </div>

    <div className="syncbar" role="status">
      <Database size={14} aria-hidden="true" />
      <span>Base locale : vos dossiers sont enregistrés sur ce poste.</span>
    </div>
  </>
  );
};

/* ---------- Filet de sécurité : jamais d'écran blanc silencieux ---------- */
class FiletErreur extends Component<{ children: React.ReactNode }, { erreur: boolean }> {
  state = { erreur: false };
  static getDerivedStateFromError() {
    return { erreur: true };
  }
  render() {
    if (this.state.erreur) {
      return (
        <div className="vide" role="alert">
          <b>Une erreur est survenue.</b>
          Fermez puis rouvrez le logiciel ; si le problème revient, prévenez la personne en charge de la maintenance.
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [ecran, setEcran] = useState<Ecran>('tableau');
  const [chargement, setChargement] = useState(true);
  const [reduit, setReduit] = useState<boolean>(() => lirePreference(false));
  const rechercheRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setChargement(false), 800);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('acsf:sidebar-collapsed', reduit ? '1' : '0');
    } catch {
      /* stockage indisponible : on ignore */
    }
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

  const ecranContenu = () => {
    if (chargement) return <Squelettes />;
    switch (ecran) {
      case 'tableau':
        return (
          <TableauDeBord
            onCreer={() => setEcran('personnes')}
            onNaviguer={setEcran}
          />
        );
      case 'personnes':
        return <Personnes />;
      case 'agenda':
        return <Agenda />;
      case 'rapports':
        return <Rapports />;
      default:
        return (
          <>
            <h1 className="page">{MENU.find((m) => m.cle === ecran)?.libelle}</h1>
            <p className="sous-titre">ACSF-AFRIQUE — ACSF Desktop</p>
            <div className="vide">
              <IllustrationVide />
              <b>Bientôt</b>
              Cet écran n'est pas encore construit. On avance une étape à la fois, dans l'ordre validé.
            </div>
          </>
        );
    }
  };

  return (
    <div className="app">
      <nav className={reduit ? 'side collapsed' : 'side'} aria-label="Menu principal">
        <div className="logo-block">
          <div className="logo-chip">
            <img src={logoAcsf} alt="ACSF-AFRIQUE — sigle de l'agence" />
          </div>
        </div>
        <div className="nav">
          {MENU.map((item) => (
            <button
              key={item.cle}
              type="button"
              className={ecran === item.cle ? 'navbtn active' : 'navbtn'}
              aria-current={ecran === item.cle ? 'page' : undefined}
              onClick={() => setEcran(item.cle)}
            >
              {item.icone}
              <span>{item.libelle}</span>
            </button>
          ))}
        </div>
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
        <div className="pied">ACSF-AFRIQUE SARL<br />v0.1.0</div>
      </nav>

      <div className="main">
        <header className="topbar">
          <div>
            <b>ACSF Desktop</b>
          </div>
          <label className="recherche">
            <Search size={17} color="#8f8cb8" aria-hidden="true" />
            <input ref={rechercheRef} type="text" placeholder="Rechercher une personne, un rendez-vous…" aria-label="Recherche rapide" />
            <kbd>Ctrl K</kbd>
          </label>
          <span className="sync"><span className="dot" />Base locale</span>
          <div className="user">
            <div className="avatar" aria-hidden="true">AK</div>
            <span>Awa Koné<br /><small>Administratrice</small></span>
          </div>
        </header>
        <main className="content">{ecranContenu()}</main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <FiletErreur>
    <App />
  </FiletErreur>,
);
