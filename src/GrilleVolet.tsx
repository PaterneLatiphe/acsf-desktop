// Grille AG Grid - composant encapsulant la grille avec configuration de colonnes
// Reçoit les passages bruts et la configuration de colonnes, gère wrapText, tri, édition

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { GrilleVide } from './EtatDonnees';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface ColonneVolet {
  cle: string;
  libelle: string;
  type?: 'text' | 'textarea' | 'date' | 'select';
  editable?: boolean;
  options?: string[];
}

export interface GrilleVoletProps {
  passages: any[];
  colonnes: ColonneVolet[];
  libelle?: string;
  messageVide?: string;
  onCellValueChanged?: (event: any) => void;
  onGridReady?: (params: any) => void;
  onGridDetached?: () => void;
  onCellContextMenu?: (event: any) => void;
  avecSelecteurColonnes?: boolean;
  avecDensite?: boolean;
}

// Formate une date ISO en jj/mm/aaaa
function formaterDate(valeur: any): string {
  if (!valeur) return '—';
  const date = valeur instanceof Date ? valeur : new Date(String(valeur));
  if (isNaN(date.getTime())) return String(valeur);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Aperçu d'une cellule : textarea tronqué sur la première ligne, tooltip complet (composant React)
function CellApercu({ col, params }: { col: any; params: any }) {
  const valeur = params?.value;
  if (valeur === null || valeur === undefined || valeur === '') {
    return <span>—</span>;
  }
  let texte: string;
  if (col?.type === 'date') {
    texte = formaterDate(valeur);
  } else if (col?.valueFormatter) {
    texte = String(col.valueFormatter(params));
  } else {
    texte = String(valeur);
  }
  if (col?.type !== 'textarea') {
    return <>{texte}</>;
  }
  const lignes = texte.split('\n');
  const premier = lignes[0] || '';
  const reste = lignes.length > 1 ? ' ⏎' : '';
  const tronque = premier.length > 50 ? `${premier.slice(0, 50)}…` : premier;
  return (
    <span
      style={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'pre-line',
        color: 'var(--plume)',
      }}
      title={texte.length > 120 ? `${texte.slice(0, 120)}…` : texte}
    >
      {`${tronque}${reste}`}
    </span>
  );
}

export const GrilleVolet: React.FC<GrilleVoletProps> = ({
  passages,
  colonnes,
  libelle = 'volet',
  messageVide,
  onCellValueChanged,
  onGridReady,
  onGridDetached,
  onCellContextMenu,
  avecSelecteurColonnes = false,
  avecDensite = false,
}) => {
  const apiRef = useRef<any>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const detacheRef = useRef(onGridDetached);
  detacheRef.current = onGridDetached;
  const [chooserOuvert, setChooserOuvert] = useState(false);
  const [colonnesVisibles, setColonnesVisibles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(colonnes.map((colonne) => [colonne.cle, true])),
  );
  const [densite, setDensite] = useState<'compact' | 'confort'>('compact');

  // Le tri existe déjà dans la grille ; on le rend annonçable sans toucher aux données.
  const actualiserAriaTri = useCallback(() => {
    const colonnesApi = apiRef.current?.getColumns?.() ?? [];
    colonnesApi.forEach((colonne: any) => {
      const cle = colonne.getColId?.();
      if (!cle) return;
      const tri = colonne.getSort?.();
      const valeur = tri === 'asc' ? 'ascending' : tri === 'desc' ? 'descending' : 'none';
      const libelle = colonne.getColDef?.()?.headerName ?? String(cle);
      const direction = valeur === 'none'
        ? 'Non triée.'
        : valeur === 'ascending' ? 'Triée par ordre croissant.' : 'Triée par ordre décroissant.';
      const action = valeur === 'none'
        ? 'Activer pour trier par ordre croissant.'
        : valeur === 'ascending' ? 'Activer pour trier par ordre décroissant.' : 'Activer pour retirer le tri.';
      const cellules = conteneurRef.current?.querySelectorAll<HTMLElement>(
        `.ag-header-cell[col-id="${CSS.escape(String(cle))}"]`,
      ) ?? [];
      cellules.forEach((cellule) => {
        cellule.setAttribute('aria-sort', valeur);
        cellule.setAttribute('aria-label', `${libelle}. ${direction} ${action}`);
      });
    });
  }, []);

  const planifierAriaTri = useCallback(() => {
    window.requestAnimationFrame(actualiserAriaTri);
  }, [actualiserAriaTri]);

  useEffect(() => {
    setColonnesVisibles((precedent) => {
      const suivant = { ...precedent };
      colonnes.forEach((colonne) => {
        if (suivant[colonne.cle] === undefined) suivant[colonne.cle] = true;
      });
      return suivant;
    });
  }, [colonnes]);

  useEffect(() => {
    planifierAriaTri();
  }, [colonnes, planifierAriaTri]);

  useEffect(() => {
    if (avecDensite) apiRef.current?.resetRowHeights?.();
  }, [densite, avecDensite]);

  const basculerColonne = useCallback((cle: string, visible: boolean) => {
    const autresVisibles = Object.entries(colonnesVisibles)
      .filter(([colonne, estVisible]) => estVisible && colonne !== cle).length;
    if (!visible && autresVisibles === 0) return;
    setColonnesVisibles((precedent) => ({ ...precedent, [cle]: visible }));
    apiRef.current?.setColumnsVisible?.([cle], visible);
    planifierAriaTri();
  }, [colonnesVisibles, planifierAriaTri]);

  // ColumnDefs générés depuis la configuration unique — largeurs flexibles (réparties).
  // L'ordre des lignes vient des données déjà triées (date_passage puis created_at).
  const columnDefs = useMemo<any[]>(() => colonnes.map((col: any) => ({
    field: col.cle,
    headerName: col.libelle,
    editable: col.editable !== false,
    sortable: true,
    resizable: true,
    wrapText: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    cellStyle: { alignItems: 'flex-start', paddingTop: '4px', paddingBottom: '4px' },
    flex: col.type === 'textarea' ? 2.4 : col.type === 'select' ? 1.1 : col.type === 'date' ? 0.55 : 1,
    minWidth: col.type === 'textarea' ? 220 : col.type === 'select' ? 170 : col.type === 'date' ? 110 : 100,
    cellEditor:
      col.type === 'select' ? 'agSelectCellEditor'
        : col.type === 'date' ? 'agDateStringCellEditor'
          : col.type === 'textarea' ? 'agLargeTextCellEditor'
            : undefined,
    cellEditorParams: col.type === 'select'
      ? { values: col.options || [] }
      : col.type === 'textarea'
        ? { maxLength: 2000, rows: 6, cols: 50 }
        : undefined,
    cellEditorPopup: col.type === 'textarea',
    cellRenderer: (params: any) => <CellApercu col={col} params={params} />,
    valueFormatter: (params: any) => {
      if (params.value === null || params.value === undefined || params.value === '') return '—';
      if (col.type === 'date') return formaterDate(params.value);
      return params.value;
    },
  })), [colonnes]);

  // Lignes normalisées pour AG Grid (une ligne = un passage)
  const passagesForGrid = useMemo(() => passages.map((p: any) => {
    // Ligne déjà préparée par l'appelant
    if (p && p._id !== undefined) return p;
    const row: Record<string, any> = {
      _id: p.id,
      date: p.datePassage,
      auteur: p.auteur,
      remarques: p.remarques,
      prochaineEcheance: p.prochaineEcheance,
      createdAt: p.createdAt ?? '',
    };
    for (const [k, v] of Object.entries(p.donnees || {})) {
      row[k] = v;
    }
    return row;
  }), [passages]);

  const handleCellValueChanged = useCallback((event: any) => {
    const row = event.data;
    const field = event.colDef?.field as string;
    if (!row || !field || field === '_id') return;
    onCellValueChanged?.(event);
  }, [onCellValueChanged]);

  const handleGridReady = useCallback((params: any) => {
    apiRef.current = params.api;
    params.api?.setGridAriaProperty?.('label', `Grille du volet ${libelle}`);
    planifierAriaTri();
    onGridReady?.(params);
  }, [libelle, onGridReady, planifierAriaTri]);

  useEffect(() => {
    apiRef.current?.setGridAriaProperty?.('label', `Grille du volet ${libelle}`);
  }, [libelle]);

  // Le menu « Supprimer » est aussi accessible au clavier (Maj+F10 ou touche Menu).
  const handleCellKeyDown = useCallback((event: any) => {
    if (!onCellContextMenu) return;
    const touche = event.event as KeyboardEvent | undefined;
    if (!touche) return;
    const estMenu = touche.key === 'ContextMenu' || (touche.shiftKey && touche.key === 'F10');
    if (!estMenu || event.api?.getEditingCells?.().length) return;
    touche.preventDefault?.();
    const rect = (touche.target as HTMLElement | null)?.getBoundingClientRect?.();
    onCellContextMenu({
      data: event.data,
      event: {
        clientX: rect?.left ?? 0,
        clientY: rect?.bottom ?? 0,
        target: touche.target,
        preventDefault: () => touche.preventDefault?.(),
      },
    });
  }, [onCellContextMenu]);

  useEffect(() => () => {
    apiRef.current = null;
    detacheRef.current?.();
  }, []);

  // Hauteur de ligne calculée pour que le texte ne soit jamais coupé
  const getRowHeight = useCallback((params: any) => {
    const row = params.data || {};
    let maxLignes = 1;
    for (const col of colonnes as any[]) {
      if (col.type !== 'textarea') continue;
      const texte = row[col.cle];
      if (texte === null || texte === undefined || texte === '') continue;
      const largeur = 240;
      const caracteresParLigne = Math.max(12, Math.floor(largeur / 7.2));
      const lignes = String(texte).split('\n').reduce(
        (total: number, ligne: string) => total + Math.max(1, Math.ceil(ligne.length / caracteresParLigne)),
        0
      );
      if (lignes > maxLignes) maxLignes = lignes;
    }
    const confort = densite === 'confort';
    const hauteurLigne = confort ? 24 : 19;
    const marge = confort ? 16 : 0;
    return Math.min(260 + marge, Math.max(38 + marge, maxLignes * hauteurLigne + 12 + marge));
  }, [colonnes, densite]);

  return (
    <div
      ref={conteneurRef}
      className={`ag-theme-quartz grille-volet${avecSelecteurColonnes || avecDensite ? ' avec-outils' : ''}${densite === 'confort' ? ' grille-confort' : ''}`}
    >
      {(avecSelecteurColonnes || avecDensite) && (
        <div className="grille-outils">
          {avecSelecteurColonnes && (
            <div className="selecteur-colonnes">
              <button
                type="button"
                className="btn btn-secondaire"
                aria-expanded={chooserOuvert}
                onClick={() => setChooserOuvert((ouvert) => !ouvert)}
              >
                Colonnes
              </button>
              {chooserOuvert && (
                <div className="selecteur-colonnes-liste" role="group" aria-label="Colonnes affichées">
                  {colonnes.map((colonne) => (
                    <label key={colonne.cle}>
                      <input
                        type="checkbox"
                        checked={colonnesVisibles[colonne.cle] !== false}
                        onChange={(e) => basculerColonne(colonne.cle, e.target.checked)}
                      />
                      {colonne.libelle}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {avecDensite && (
            <button
              type="button"
              className="btn btn-secondaire"
              aria-pressed={densite === 'confort'}
              onClick={() => setDensite((valeur) => (valeur === 'compact' ? 'confort' : 'compact'))}
            >
              {densite === 'compact' ? 'Lignes confortables' : 'Lignes compactes'}
            </button>
          )}
        </div>
      )}
      <AgGridReact
        rowData={passagesForGrid}
        columnDefs={columnDefs}
        getRowId={(params) => String(params.data._id)}
        getRowHeight={getRowHeight}
        rowHeight={38}
        defaultColDef={{
          resizable: true,
          sortable: true,
          editable: true,
          minWidth: 90,
          wrapText: true,
          autoHeaderHeight: true,
        }}
        onCellValueChanged={handleCellValueChanged}
        onGridReady={handleGridReady}
        onSortChanged={planifierAriaTri}
        onCellKeyDown={handleCellKeyDown}
        onCellContextMenu={onCellContextMenu}
        undoRedoCellEditing={true}
        undoRedoCellEditingLimit={20}
        stopEditingWhenCellsLoseFocus={true}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        noRowsOverlayComponent={GrilleVide}
        noRowsOverlayComponentParams={{ message: messageVide }}
        animateRows={false}
        domLayout="normal"
        theme="legacy"
      />
    </div>
  );
};
