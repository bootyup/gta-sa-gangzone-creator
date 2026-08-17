import React, { useState } from 'react';
import { GangZone } from '../types';
import { snapToGrid } from '../utils/coordinates';
import { X, LayoutGrid } from 'lucide-react';

interface TurfGridGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateGrid: (zones: GangZone[]) => void;
}

const DISTRICT_PRESETS = [
  {
    name: 'Los Santos - East LS & Ganton',
    minX: 1800,
    minY: -1900,
    maxX: 2650,
    maxY: -1050,
    defaultRows: 4,
    defaultCols: 4,
  },
  {
    name: 'Los Santos - Sul / Willowfield & Ocean Docks',
    minX: 1700,
    minY: -2500,
    maxX: 2700,
    maxY: -1900,
    defaultRows: 3,
    defaultCols: 4,
  },
  {
    name: 'Los Santos - Norte / Jefferson & Las Colinas',
    minX: 1900,
    minY: -1400,
    maxX: 2700,
    maxY: -700,
    defaultRows: 3,
    defaultCols: 4,
  },
  {
    name: 'San Fierro - Centro & Garcia / Doherty',
    minX: -2600,
    minY: -400,
    maxX: -1600,
    maxY: 600,
    defaultRows: 4,
    defaultCols: 4,
  },
  {
    name: 'Las Venturas - The Strip',
    minX: 1800,
    minY: 800,
    maxX: 2500,
    maxY: 2400,
    defaultRows: 4,
    defaultCols: 3,
  },
];

export const TurfGridGeneratorModal: React.FC<TurfGridGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerateGrid,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICT_PRESETS[0]);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [color, setColor] = useState('#00AA00');
  const [alpha, setAlpha] = useState(170);
  const [namePrefix, setNamePrefix] = useState('Território');

  if (!isOpen) return null;

  const handleGenerate = () => {
    const newZones: GangZone[] = [];
    const stepX = (selectedDistrict.maxX - selectedDistrict.minX) / cols;
    const stepY = (selectedDistrict.maxY - selectedDistrict.minY) / rows;

    let count = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const minX = snapToGrid(selectedDistrict.minX + c * stepX, 10);
        const maxX = snapToGrid(selectedDistrict.minX + (c + 1) * stepX, 10);
        const minY = snapToGrid(selectedDistrict.minY + r * stepY, 10);
        const maxY = snapToGrid(selectedDistrict.minY + (r + 1) * stepY, 10);

        newZones.push({
          id: `turf_${Date.now()}_${r}_${c}`,
          name: `${namePrefix} ${count}`,
          variableName: `gz_Turf_${count}`,
          minX,
          minY,
          maxX,
          maxY,
          color,
          alpha,
          visible: true,
          locked: false,
        });
        count++;
      }
    }

    onGenerateGrid(newZones);
    onClose();
  };

  return (
    <div
      id="turf-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        id="turf-modal-content"
        className="bg-[#141417] border border-[#27272a] rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-[#e4e4e7]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272a] bg-[#111113]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#2ecc71]/15 text-[#2ecc71]">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#e4e4e7]">
                Gerador de Grade de Territórios
              </h2>
            </div>
          </div>
          <button
            id="btn-close-turf"
            onClick={onClose}
            className="p-1 text-[#71717a] hover:text-white rounded hover:bg-[#18181b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Preset Region */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
              Região do Mapa
            </label>
            <select
              value={selectedDistrict.name}
              onChange={e => {
                const found = DISTRICT_PRESETS.find(d => d.name === e.target.value);
                if (found) {
                  setSelectedDistrict(found);
                  setRows(found.defaultRows);
                  setCols(found.defaultCols);
                }
              }}
              className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-xs text-[#e4e4e7] focus:outline-none focus:border-[#2ecc71]"
            >
              {DISTRICT_PRESETS.map(d => (
                <option key={d.name} value={d.name} className="bg-[#141417]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                Linhas (Vertical): {rows}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rows}
                onChange={e => setRows(Number(e.target.value))}
                className="w-full h-2 bg-[#27272a] rounded appearance-none cursor-pointer accent-[#2ecc71]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                Colunas (Horizontal): {cols}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={cols}
                onChange={e => setCols(Number(e.target.value))}
                className="w-full h-2 bg-[#27272a] rounded appearance-none cursor-pointer accent-[#2ecc71]"
              />
            </div>
          </div>

          {/* Color and Alpha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                Cor
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#27272a] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-24 bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs font-mono text-[#e4e4e7] uppercase focus:border-[#2ecc71] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                Opacidade ({Math.round((alpha / 255) * 100)}%)
              </label>
              <input
                type="range"
                min="20"
                max="255"
                value={alpha}
                onChange={e => setAlpha(Number(e.target.value))}
                className="w-full h-2 mt-2 bg-[#27272a] rounded appearance-none cursor-pointer accent-[#2ecc71]"
              />
            </div>
          </div>

          {/* Name Prefix */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1.5">
              Prefixo do Nome
            </label>
            <input
              type="text"
              value={namePrefix}
              onChange={e => setNamePrefix(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-xs text-[#e4e4e7] focus:outline-none focus:border-[#2ecc71]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#27272a] bg-[#111113]">
          <span className="text-xs text-[#71717a]">
            Total: <strong className="text-[#e4e4e7]">{rows * cols} zonas</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white bg-[#18181b] border border-[#27272a] rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-generate-grid"
              onClick={handleGenerate}
              className="px-4 py-1.5 text-xs font-semibold bg-[#2ecc71] hover:bg-[#27ae60] text-black rounded transition-colors"
            >
              Gerar Grade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
