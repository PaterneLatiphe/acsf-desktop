// Tableau de la liste des personnes : en-têtes discrets, lignes aérées, dates jj/mm/aaaa.

import React from 'react';
import type { Personne } from '../db';
import { formaterDateFr } from '../format';

interface Props {
  personnes: Personne[];
  surSelection: (personne: Personne) => void;
}

const ListePersonnes: React.FC<Props> = ({ personnes, surSelection }) => (
  <div className="bloc" style={{ padding: 'var(--sp-2) var(--sp-4)' }}>
    <table className="tableau-personnes">
      <thead>
        <tr>
          <th>Nom</th><th>Prénom</th><th>Sexe</th>
          <th>Date de naissance</th><th>Téléphone</th><th>Programme</th><th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {personnes.map((p) => (
          <tr key={p.id} onClick={() => surSelection(p)}>
            <td>{p.nom}</td>
            <td>{p.prenom}</td>
            <td>{p.sexe || '—'}</td>
            <td>{formaterDateFr(p.dateNaissance)}</td>
            <td>{p.telephone || '—'}</td>
            <td>{p.programme || '—'}</td>
            <td><span className={`pill ${p.statut === 'suivie' ? 'ok' : 'pend'}`}>{p.statut === 'suivie' ? 'Suivi' : p.statut}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ListePersonnes;
