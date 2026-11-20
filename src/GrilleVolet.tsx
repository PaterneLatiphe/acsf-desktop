// Grille AG Grid - composant encapsulant la grille avec configuration de colonnes
// Reçoit les passages bruts et la configuration de colonnes, gère wrapText, tri, édition

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

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
  onCellValueChanged?: (event: any) => void;
  onGridReady?: (params: any) => void;
  onGridDetached?: () => void;
  onCellContextMenu?: (event: any) => void;
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
  onCellValueChanged,
  onGridReady,
  onGridDetached,
  onCellContextMenu,
}) => {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const detacheRef = useRef(onGridDetached);
  detacheRef.current = onGridDetached;

  // ColumnDefs générés depuis la configuration unique — largeurs flexibles (réparties).
  // L'ordre des lignes vient des données déjà triées (date_passage puis created_at).
  const columnDefs = useMemo<any[]>(() => colonnes.map((col: any) => ({
    field: col.cle,
    headerName: col.libelle,
    editable: col.editable !== false,
    sortable: true,
    resizable: true,
    wrapText: true,
    headerWordWrap: true,
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
    params.api?.sizeColumnsToFit?.();
    onGridReady?.(params);
  }, [onGridReady]);

  const handleGridSizeChanged = useCallback((params: any) => {
    params.api?.sizeColumnsToFit?.();
  }, []);

  // Le redimensionnement de la fenêtre et le changement d'onglet redessinent la grille
  useEffect(() => {
    const element = conteneurRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observateur = new ResizeObserver(() => {
      apiRef.current?.onGridHeightChanged?.();
      apiRef.current?.sizeColumnsToFit?.();
    });
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

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
    return Math.min(260, Math.max(38, maxLignes * 19 + 12));
  }, [colonnes]);

  return (
    <div ref={conteneurRef} className="ag-theme-quartz grille-volet">
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
        onGridSizeChanged={handleGridSizeChanged}
        onCellContextMenu={onCellContextMenu}
        undoRedoCellEditing={true}
        undoRedoCellEditingLimit={20}
        stopEditingWhenCellsLoseFocus={true}
        rowSelection="single"
        animateRows={false}
        domLayout="normal"
        theme="legacy"
      />
    </div>
  );
};
