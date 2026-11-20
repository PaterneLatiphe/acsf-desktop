// Tableau de bord : chiffres clés et blocs utiles, sans inventer de données.

import React, { useEffect, useState } from 'react';
import { CalendarDays, Check, Database, NotebookPen, UserRoundPlus, Users } from 'lucide-react';
import { listerPersonnes, listerRdvs, type Rdv } from './db';
import { formaterDateHeureFr } from './format';
import { IllustrationVide } from './Etats';

type Ecran = 'tableau' | 'personnes' | 'agenda' | 'suivi' | 'conseils' | 'rapports';

const TYPES_RDV: Record<string, string> = {
  rdv_agence: 'RDV agence',
  sortie_terrain: 'Sortie terrain',
  entretien_tele: 'Entretien téléphone',
  suivi: 'Suivi',
};

interface Props {
  onCreer: () => void;
  onNaviguer: (ecran: Ecran) => void;
}

const TableauDeBord: React.FC<Props> = ({ onCreer, onNaviguer }) => {
  const [stats, setStats] = useState({ personnes: 0, parrainages: 0, rdvsSemaine: 0, contributions: 0 });
  const [prochains, setProchains] = useState<Rdv[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ tentative, setTentative] = useState(0);

  useEffect(() => {
    let actif = true;
    setErreur(null);
    (async () => {
      try {
        const [personnes, rdvs] = await Promise.all([listerPersonnes(), listerRdvs()]);
        const lundi = new Date();
        lundi.setHours(0, 0, 0, 0);
        lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
        const lundiSuivant = new Date(lundi);
        lundiSuivant.setDate(lundiSuivant.getDate() + 7);
        const rdvsSemaine = rdvs.filter((r) => {
          const date = new Date(String(r.dateHeure || ''));
          return !isNaN(date.getTime()) && date >= lundi && date < lundiSuivant;
        }).length;
        const maintenant = Date.now();
        const aVenir = rdvs
          .filter((r) => {
            const date = new Date(String(r.dateHeure || '')).getTime();
            return !isNaN(date) && date >= maintenant;
          })
          .slice(0, 3);
        if (actif) {
          setStats({ personnes: personnes.length, parrainages: 0, rdvsSemaine, contributions: 0 });
          setProchains(aVenir);
        }
      } catch {
        if (actif) setErreur('Les chiffres n’ont pas pu être chargés.');
      }
    })();
    return () => { actif = false; };
  }, [tentative]);

  return (
    <div className="page-enter">
      <h1 className="page">Tableau de bord</h1>
      <p className="sous-titre">Vue d'ensemble du suivi — agence de Ouaga</p>

      {erreur && (
        <div className="erreur" role="alert">
          <span>{erreur}</span>
          <button type="button" className="btn btn-secondaire" onClick={() => setTentative((v) => v + 1)}>Réessayer</button>
        </div>
      )}

      <div className="kpis">
        <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('personnes')}>
          <span className="kpi-tete"><span className="chip nuit"><Users size={20} /></span><span className="kpi-label">Personnes suivies</span></span>
          <span className="kpi-chiffre">{stats.personnes}</span>
          <span className="kpi-var">{stats.personnes ? `${stats.personnes} dossiers enregistrés` : 'Aucun dossier pour l’instant'}</span>
        </button>
        <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('personnes')}>
          <span className="kpi-tete"><span className="chip jaune"><UserRoundPlus size={20} /></span><span className="kpi-label">Parrainages en attente</span></span>
          <span className="kpi-chiffre">{stats.parrainages}</span>
          <span className="kpi-var">Aucun parrainage en attente</span>
        </button>
        <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('agenda')}>
          <span className="kpi-tete"><span className="chip vert"><CalendarDays size={20} /></span><span className="kpi-label">Rendez-vous cette semaine</span></span>
          <span className="kpi-chiffre">{stats.rdvsSemaine}</span>
          <span className="kpi-var">{stats.rdvsSemaine ? `${stats.rdvsSemaine} rendez-vous planifiés` : 'Aucun rendez-vous cette semaine'}</span>
        </button>
        <button type="button" className="kpi kpi-btn" onClick={() => onNaviguer('personnes')}>
          <span className="kpi-tete"><span className="chip brique"><NotebookPen size={20} /></span><span className="kpi-label">Contributions à revoir</span></span>
          <span className="kpi-chiffre">{stats.contributions}</span>
          <span className="kpi-var">Rien à vérifier</span>
        </button>
      </div>

      <div className="grille">
        <div className="bloc">
          <div className="bloc-titre">
            Prochains rendez-vous
            <button type="button" className="lien-bloc" onClick={() => onNaviguer('agenda')}>Voir l'agenda</button>
          </div>
          {prochains.length === 0 ? (
            <div className="vide vide-accueil">
              <IllustrationVide />
              <b>Aucun rendez-vous à venir</b>
              Créez une personne pour préparer ses premiers rendez-vous.
              <div><button type="button" className="btn btn-principal" onClick={onCreer}><UserRoundPlus size={18} /> Créer une personne</button></div>
            </div>
          ) : prochains.map((r) => (
            <div className="ligne" key={r.id}>
              <div className="ligne-point"><CalendarDays size={18} /></div>
              <div className="info"><b>{formaterDateHeureFr(r.dateHeure)}</b><small>{TYPES_RDV[r.type] ?? r.type}</small></div>
              <span className={`pill ${r.statut === 'valide' ? 'ok' : r.statut === 'refuse' ? 'ret' : 'pend'}`}>
                {r.statut === 'valide' ? 'Validé' : r.statut === 'refuse' ? 'Refusé' : 'Proposé'}
              </span>
            </div>
          ))}
        </div>

        <div className="bloc">
          <div className="bloc-titre">Contributions à revoir</div>
          <div className="ligne">
            <div className="ligne-point"><Check size={18} /></div>
            <div className="info"><b>Tout est à jour</b><small>Les contributions à valider apparaîtront ici.</small></div>
          </div>
          <div className="bloc-titre" style={{ marginTop: 'var(--sp-5)' }}>Activité récente</div>
          <div className="ligne">
            <div className="ligne-point"><Database size={18} /></div>
            <div className="info"><b>Données sur ce poste</b><small>Les dernières fiches et rendez-vous créés apparaîtront ici.</small></div>
          </div>
        </div>
      </div>

      <div className="syncbar" role="status"><Database size={14} aria-hidden="true" /> Base locale : enregistrement automatique sur ce poste.</div>
    </div>
  );
};

export default TableauDeBord;
