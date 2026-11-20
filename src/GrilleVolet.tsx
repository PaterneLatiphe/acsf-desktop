// Grille AG Grid - composant encapsulant la grille avec configuration de colonnes
// Reçoit les passages bruts et la configuration de colonnes, gère wrapText, tri, édition

import React, { useCallback, useMemo } from 'react';
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
  onCellContextMenu?: (event: any) => void;
}

// Formate une date ISO en jj/mm/aaaa
function formaterDate(valeur: any): string {
  if (!valeur) return '—';
  const date = valeur instanceof Date ? valeur : new Date(String(valeur));
  if (isNaN(date.getTime())) return String(valeur);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export const GrilleVolet: React.FC<GrilleVoletProps> = ({
  passages,
  colonnes,
  onCellValueChanged,
  onGridReady,
  onCellContextMenu,
}) => {
  // ColumnDefs générés depuis la configuration unique
  const columnDefs = useMemo(() => colonnes.map((col: any) => ({
    field: col.cle,
    headerName: col.libelle,
    editable: col.editable !== false,
    sortable: true,
    resizable: true,
    wrapText: true,
    headerWordWrap: true,
    autoHeaderHeight: true,
    cellStyle: { alignItems: 'flex-start', paddingTop: '4px', paddingBottom: '4px' },
    width: col.type === 'textarea' ? 220 : col.type === 'date' ? 130 : col.type === 'select' ? 180 : 140,
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
    onGridReady?.(params);
  }, [onGridReady]);

  // Hauteur de ligne calculée pour que le texte ne soit jamais coupé
  const getRowHeight = useCallback((params: any) => {
    const row = params.data || {};
    let maxLignes = 1;
    for (const col of colonnes as any[]) {
      if (col.type !== 'textarea') continue;
      const texte = row[col.cle];
      if (texte === null || texte === undefined || texte === '') continue;
      const largeur = 220;
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
    <div className="ag-theme-quartz" style={{ width: '100%', height: '100%', minHeight: 240 }}>
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
