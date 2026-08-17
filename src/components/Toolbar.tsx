import React from 'react';
import { ToolMode, MapStyle, Viewport } from '../types';
import { CITY_LOCATIONS } from '../data/gtasa_data';
import {
  MousePointer,
  Square,
  Hand,
  Ruler,
  Grid,
  MapPin,
  Tag,
  Zap,
  RotateCcw,
  RotateCw,
  Plus,
  Code,
  FileDown,
  FileUp,
  LayoutGrid,
  Sparkles,
  Map as MapIcon,
  HelpCircle,
  FolderOpen,
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
  flashPreview: boolean;
  onToggleFlashPreview: () => void;
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
  onSelectCity: (x: number, y: number, zoom: number) => void;
  onNewZone: () => void;
  onOpenTurfGridModal: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onOpenHelpModal: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoneCount: number;
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
  flashPreview,
  onToggleFlashPreview,
  mapStyle,
  onMapStyleChange,
  onSelectCity,
  onNewZone,
  onOpenTurfGridModal,
  onOpenExportModal,
  onOpenImportModal,
  onOpenHelpModal,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoneCount,
}) => {
  return (
    <div
      id="main-toolbar"
      className="bg-[#141417] border-b border-[#2a2a2e] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 select-none shrink-0"
    >
      {/* Left: Tool Selection */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center bg-[#0c0c0e] p-0.5 rounded border border-[#2a2a2e] gap-0.5">
          <button
            id="tool-select"
            onClick={() => onSelectTool('select')}
            title="Selecionar / Redimensionar (V)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              toolMode === 'select'
                ? 'bg-[#2ecc71] text-black font-bold'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
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
                ? 'bg-[#2ecc71] text-black font-bold'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Desenhar</span>
          </button>

          <button
            id="tool-pan"
            onClick={() => onSelectTool('pan')}
            title="Mover Mapa (H / Botão Direito)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              toolMode === 'pan'
                ? 'bg-[#2ecc71] text-black font-bold'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Mover</span>
          </button>

          <button
            id="tool-measure"
            onClick={() => onSelectTool('measure')}
            title="Medir Distância (M)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              toolMode === 'measure'
                ? 'bg-[#2ecc71] text-black font-bold'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Medir</span>
          </button>
        </div>

        {/* Turf Grid button */}
        <button
          id="btn-turf-grid-generator"
          onClick={onOpenTurfGridModal}
          title="Gerar Grade de Territórios"
          className="flex items-center gap-1.5 bg-[#1c1c20] hover:bg-[#2a2a2e] border border-[#2a2a2e] text-[#e0e0e0] px-2.5 py-1 rounded text-xs transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span className="hidden md:inline">Grade</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className={`p-1 rounded border ${
              canUndo
                ? 'text-[#e0e0e0] hover:bg-[#2a2a2e] bg-[#1c1c20] border-[#2a2a2e]'
                : 'text-[#52525b] bg-[#141417] border-[#2a2a2e] opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className={`p-1 rounded border ${
              canRedo
                ? 'text-[#e0e0e0] hover:bg-[#2a2a2e] bg-[#1c1c20] border-[#2a2a2e]'
                : 'text-[#52525b] bg-[#141417] border-[#2a2a2e] opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: City Teleport, Map Style & Snap */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* City Location */}
        <div className="flex items-center gap-1 bg-[#1c1c20] px-2 py-0.5 rounded border border-[#2a2a2e]">
          <MapPin className="w-3 h-3 text-[#2ecc71]" />
          <select
            id="select-city-teleport"
            className="bg-transparent text-xs text-[#e0e0e0] focus:outline-none cursor-pointer pr-1"
            onChange={e => {
              const loc = CITY_LOCATIONS.find(c => c.name === e.target.value);
              if (loc) onSelectCity(loc.x, loc.y, loc.zoom);
            }}
            defaultValue="Los Santos - Centro / Ganton"
          >
            {CITY_LOCATIONS.map(c => (
              <option key={c.name} value={c.name} className="bg-[#141417] text-[#e0e0e0]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Map Style */}
        <div className="flex items-center gap-1 bg-[#1c1c20] px-2 py-0.5 rounded border border-[#2a2a2e]">
          <MapIcon className="w-3 h-3 text-[#71717a]" />
          <select
            id="select-map-style"
            value={mapStyle}
            onChange={e => onMapStyleChange(e.target.value as MapStyle)}
            className="bg-transparent text-xs text-[#e0e0e0] focus:outline-none cursor-pointer"
          >
            <option value="radar" className="bg-[#141417] text-[#e0e0e0]">Radar Original GTA SA</option>
            <option value="satellite" className="bg-[#141417] text-[#e0e0e0]">Satélite HD</option>
            <option value="blueprint" className="bg-[#141417] text-[#e0e0e0]">Blueprint</option>
            <option value="vector" className="bg-[#141417] text-[#e0e0e0]">Vetorial</option>
          </select>
        </div>

        {/* Snap to Grid */}
        <div className="flex items-center gap-1 bg-[#1c1c20] px-2 py-0.5 rounded border border-[#2a2a2e]">
          <Grid className="w-3 h-3 text-[#71717a]" />
          <select
            id="select-grid-snap"
            value={gridSnap}
            onChange={e => onGridSnapChange(Number(e.target.value))}
            className="bg-transparent text-xs text-[#e0e0e0] focus:outline-none cursor-pointer"
          >
            <option value={0} className="bg-[#141417] text-[#e0e0e0]">Snap: Off</option>
            <option value={10} className="bg-[#141417] text-[#e0e0e0]">Snap: 10m</option>
            <option value={25} className="bg-[#141417] text-[#e0e0e0]">Snap: 25m</option>
            <option value={50} className="bg-[#141417] text-[#e0e0e0]">Snap: 50m</option>
            <option value={100} className="bg-[#141417] text-[#e0e0e0]">Snap: 100m</option>
            <option value={250} className="bg-[#141417] text-[#e0e0e0]">Snap: 250m</option>
          </select>
        </div>

        {/* View Toggles */}
        <div className="flex items-center gap-0.5">
          <button
            id="toggle-grid-lines"
            onClick={onToggleGrid}
            title={showGrid ? 'Ocultar Grade' : 'Exibir Grade'}
            className={`p-1 rounded border transition-colors ${
              showGrid
                ? 'bg-[#2ecc71]/15 border-[#2ecc71] text-[#2ecc71]'
                : 'bg-[#1c1c20] border-[#2a2a2e] text-[#71717a] hover:text-[#e0e0e0]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            id="toggle-labels"
            onClick={onToggleLabels}
            title={showLabels ? 'Ocultar Nomes' : 'Exibir Nomes'}
            className={`p-1 rounded border transition-colors ${
              showLabels
                ? 'bg-[#2ecc71]/15 border-[#2ecc71] text-[#2ecc71]'
                : 'bg-[#1c1c20] border-[#2a2a2e] text-[#71717a] hover:text-[#e0e0e0]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
          </button>

          <button
            id="toggle-landmarks"
            onClick={onToggleLandmarks}
            title={showLandmarks ? 'Ocultar Pontos' : 'Exibir Pontos'}
            className={`p-1 rounded border transition-colors ${
              showLandmarks
                ? 'bg-[#2ecc71]/15 border-[#2ecc71] text-[#2ecc71]'
                : 'bg-[#1c1c20] border-[#2a2a2e] text-[#71717a] hover:text-[#e0e0e0]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          <button
            id="toggle-flash-preview"
            onClick={onToggleFlashPreview}
            title={flashPreview ? 'Pausar Flash' : 'Ver Flash'}
            className={`p-1 rounded border transition-colors ${
              flashPreview
                ? 'bg-[#2ecc71]/20 border-[#2ecc71] text-[#2ecc71]'
                : 'bg-[#1c1c20] border-[#2a2a2e] text-[#71717a] hover:text-[#e0e0e0]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Import & Help */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-import-code"
          onClick={onOpenImportModal}
          title="Importar Código Pawn ou JSON"
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1c1c20] rounded hover:bg-[#2a2a2e] border border-[#2a2a2e] text-[#e0e0e0] transition-colors"
        >
          <FileUp className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span>Importar</span>
        </button>

        <button
          id="btn-help-modal"
          onClick={onOpenHelpModal}
          title="Atalhos e Ajuda"
          className="p-1 text-[#71717a] hover:text-[#e0e0e0] bg-[#1c1c20] rounded border border-[#2a2a2e] transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

