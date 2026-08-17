import React from 'react';
import { ToolMode } from '../types';
import {
  MousePointer,
  Square,
  Hand,
  Ruler,
  Grid,
  MapPin,
  Tag,
  RotateCcw,
  RotateCw,
  FileUp,
  LayoutGrid,
  HelpCircle,
} from 'lucide-react';

interface ToolbarProps {
  toolMode: ToolMode;
  onSelectTool: (mode: ToolMode) => void;
  gridSnap: number;
  onGridSnapChange: (snap: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showLandmarks: boolean;
  onToggleLandmarks: () => void;
  onOpenTurfGridModal: () => void;
  onOpenImportModal: () => void;
  onOpenHelpModal: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolMode,
  onSelectTool,
  gridSnap,
  onGridSnapChange,
  showGrid,
  onToggleGrid,
  showLabels,
  onToggleLabels,
  showLandmarks,
  onToggleLandmarks,
  onOpenTurfGridModal,
  onOpenImportModal,
  onOpenHelpModal,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  return (
    <div
      id="main-toolbar"
      className="bg-[#111113] border-b border-[#232326] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 select-none shrink-0"
    >
      {/* Left: Tool Selection */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center bg-[#18181b] p-0.5 rounded border border-[#27272a] gap-0.5">
          <button
            id="tool-select"
            onClick={() => onSelectTool('select')}
            title="Selecionar / Redimensionar (V)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              toolMode === 'select'
                ? 'bg-[#2ecc71] text-black font-semibold'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>

          <button
            id="tool-draw-box"
            onClick={() => onSelectTool('draw-box')}
            title="Desenhar Zona Retangular (B)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              toolMode === 'draw-box'
                ? 'bg-[#2ecc71] text-black font-semibold'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Desenhar</span>
          </button>

          <button
            id="tool-pan"
            onClick={() => onSelectTool('pan')}
            title="Mover Mapa (H / Botão Direito)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              toolMode === 'pan'
                ? 'bg-[#2ecc71] text-black font-semibold'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Mover</span>
          </button>

          <button
            id="tool-measure"
            onClick={() => onSelectTool('measure')}
            title="Medir Distância (M)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              toolMode === 'measure'
                ? 'bg-[#2ecc71] text-black font-semibold'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Medir</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className={`p-1.5 rounded border transition-colors ${
              canUndo
                ? 'text-[#e4e4e7] hover:bg-[#27272a] bg-[#18181b] border-[#27272a]'
                : 'text-[#52525b] bg-[#111113] border-[#232326] opacity-30 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className={`p-1.5 rounded border transition-colors ${
              canRedo
                ? 'text-[#e4e4e7] hover:bg-[#27272a] bg-[#18181b] border-[#27272a]'
                : 'text-[#52525b] bg-[#111113] border-[#232326] opacity-30 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Snap, Toggles */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Snap to Grid */}
        <div className="flex items-center gap-1 bg-[#18181b] px-2 py-1 rounded border border-[#27272a]">
          <Grid className="w-3 h-3 text-[#71717a]" />
          <select
            id="select-grid-snap"
            value={gridSnap}
            onChange={e => onGridSnapChange(Number(e.target.value))}
            className="bg-transparent text-xs text-[#e4e4e7] focus:outline-none cursor-pointer"
          >
            <option value={0} className="bg-[#18181b] text-[#e4e4e7]">Snap: Off</option>
            <option value={10} className="bg-[#18181b] text-[#e4e4e7]">Snap: 10m</option>
            <option value={25} className="bg-[#18181b] text-[#e4e4e7]">Snap: 25m</option>
            <option value={50} className="bg-[#18181b] text-[#e4e4e7]">Snap: 50m</option>
            <option value={100} className="bg-[#18181b] text-[#e4e4e7]">Snap: 100m</option>
            <option value={250} className="bg-[#18181b] text-[#e4e4e7]">Snap: 250m</option>
          </select>
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-1">
          <button
            id="toggle-grid-lines"
            onClick={onToggleGrid}
            title={showGrid ? 'Ocultar Grade' : 'Exibir Grade'}
            className={`p-1.5 rounded border transition-colors ${
              showGrid
                ? 'bg-[#2ecc71]/15 border-[#2ecc71]/50 text-[#2ecc71]'
                : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            id="toggle-labels"
            onClick={onToggleLabels}
            title={showLabels ? 'Ocultar Nomes' : 'Exibir Nomes'}
            className={`p-1.5 rounded border transition-colors ${
              showLabels
                ? 'bg-[#2ecc71]/15 border-[#2ecc71]/50 text-[#2ecc71]'
                : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
          </button>

          <button
            id="toggle-landmarks"
            onClick={onToggleLandmarks}
            title={showLandmarks ? 'Ocultar Pontos de Referência' : 'Exibir Pontos'}
            className={`p-1.5 rounded border transition-colors ${
              showLandmarks
                ? 'bg-[#2ecc71]/15 border-[#2ecc71]/50 text-[#2ecc71]'
                : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Grid Tool, Import & Help */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-turf-grid-generator"
          onClick={onOpenTurfGridModal}
          title="Gerador de Grade de Territórios"
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#e4e4e7] rounded transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span>Grade</span>
        </button>

        <button
          id="btn-import-code"
          onClick={onOpenImportModal}
          title="Importar Código Pawn ou JSON"
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#e4e4e7] rounded transition-colors"
        >
          <FileUp className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span>Importar</span>
        </button>

        <button
          id="btn-help-modal"
          onClick={onOpenHelpModal}
          title="Atalhos e Ajuda"
          className="p-1.5 text-[#71717a] hover:text-white bg-[#18181b] rounded border border-[#27272a] transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
