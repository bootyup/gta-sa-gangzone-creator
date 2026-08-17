import React, { useState } from 'react';
import { GangZone } from '../types';
import { GANG_PRESETS } from '../data/gtasa_data';
import { snapToGrid } from '../utils/coordinates';
import { X, LayoutGrid, Sparkles, MapPin, Check } from 'lucide-react';

interface TurfGridGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateGrid: (zones: GangZone[]) => void;
}

const DISTRICT_PRESETS = [
  {
    name: 'Los Santos - East LS & Ganton (Guerras)',
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
    name: 'Las Venturas - The Strip & Cassinos',
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
  const [selectedGang, setSelectedGang] = useState(GANG_PRESETS[0]);
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
          color: selectedGang.hexColor,
          alpha: selectedGang.alpha,
          flashColor: selectedGang.flashColor,
          flashing: false,
          visible: true,
          locked: false,
          gangPreset: selectedGang.id,
          notes: `Território em grade ${r + 1}x${c + 1}`,
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
        className="bg-[#141417] border border-[#2a2a2e] rounded shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e0e0e0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e] bg-[#111114]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71]/30">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e0e0e0]">
                Gerador de Grade de Territórios (Turfs)
              </h2>
              <p className="text-xs text-[#71717a]">
                Crie dezenas de zonas de disputa automaticamente sobre uma região
              </p>
            </div>
          </div>
          <button
            id="btn-close-turf"
            onClick={onClose}
            className="p-1.5 text-[#71717a] hover:text-white rounded hover:bg-[#1c1c20] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Preset District */}
          <div>
            <label className="block text-xs font-semibold text-[#e0e0e0] mb-1.5">
              Região / Bairro do GTA SA:
            </label>
            <div className="space-y-1.5">
              {DISTRICT_PRESETS.map(d => (
                <button
                  key={d.name}
                  onClick={() => {
                    setSelectedDistrict(d);
                    setRows(d.defaultRows);
                    setCols(d.defaultCols);
                  }}
                  className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between ${
                    selectedDistrict.name === d.name
                      ? 'bg-[#2ecc71]/15 border-[#2ecc71] text-[#e0e0e0] font-semibold'
                      : 'bg-[#1c1c20] border-[#2a2a2e] hover:border-[#3f3f46] text-[#a1a1aa]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2ecc71]" />
                    <span>{d.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#71717a]">
                    {d.maxX - d.minX}m × {d.maxY - d.minY}m
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Division (Rows & Columns) */}
          <div className="grid grid-cols-2 gap-3 bg-[#1c1c20] p-3 rounded border border-[#2a2a2e]">
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] mb-1">
                Linhas Verticais: <span className="text-[#2ecc71] font-bold">{rows}</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={rows}
                onChange={e => setRows(Number(e.target.value))}
                className="w-full h-1.5 bg-[#2a2a2e] rounded appearance-none cursor-pointer accent-[#2ecc71]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#71717a] mb-1">
                Colunas Horizontais: <span className="text-[#2ecc71] font-bold">{cols}</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={cols}
                onChange={e => setCols(Number(e.target.value))}
                className="w-full h-1.5 bg-[#2a2a2e] rounded appearance-none cursor-pointer accent-[#2ecc71]"
              />
            </div>
          </div>

          {/* Total Zones Calculation */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#111114] border border-[#2a2a2e] rounded text-[#e0e0e0]">
            <span className="text-[#71717a]">Total de Zonas a serem criadas:</span>
            <span className="font-bold text-sm text-[#2ecc71]">{rows * cols} Zonas</span>
          </div>

          {/* Initial Gang Faction */}
          <div>
            <label className="block text-xs font-semibold text-[#e0e0e0] mb-1.5">
              Facção Inicial do Território:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {GANG_PRESETS.slice(0, 6).map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGang(g)}
                  className={`flex items-center gap-2 p-2 rounded border transition-all text-left ${
                    selectedGang.id === g.id
                      ? 'border-[#2ecc71] bg-[#2ecc71]/10 font-semibold'
                      : 'border-[#2a2a2e] hover:border-[#3f3f46] bg-[#1c1c20]'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/40"
                    style={{ backgroundColor: g.hexColor }}
                  />
                  <span className="truncate text-[#e0e0e0] text-[11px]">{g.shortName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#2a2a2e] bg-[#111114]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs text-[#71717a] hover:text-[#e0e0e0] transition-colors"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-generate-grid"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-black font-bold px-4 py-1.5 rounded text-xs transition-all shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerar {rows * cols} Zonas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
