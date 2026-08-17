import React from 'react';
import { Layers, Map, Code } from 'lucide-react';

interface HeaderProps {
  totalZones: number;
  selectedZoneName?: string;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ totalZones, selectedZoneName, onOpenExport }) => {
  return (
    <header
      id="top-app-header"
      className="h-12 border-b border-[#2a2a2e] bg-[#141417] px-4 flex items-center justify-between z-30 select-none shrink-0"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2ecc71] rounded-sm flex items-center justify-center font-bold text-black text-xs">
            SA
          </div>
          <h1 className="text-sm font-bold tracking-tight text-[#e0e0e0]">
            GANGZONE <span className="text-[#2ecc71]">EDITOR</span>
          </h1>
        </div>

        <span className="hidden sm:inline-block text-[#71717a] text-xs">
          | SA-MP & open.mp
        </span>
      </div>

      {/* Center status info */}
      <div className="hidden md:flex items-center gap-3 text-xs font-mono text-[#71717a]">
        <div className="flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span>San Andreas</span>
        </div>
        <span className="text-[#3f3f46]">•</span>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span className="text-[#e0e0e0] font-medium">{totalZones} {totalZones === 1 ? 'zona' : 'zonas'}</span>
        </div>
        {selectedZoneName && (
          <>
            <span className="text-[#3f3f46]">•</span>
            <div className="flex items-center gap-1.5 text-[#e0e0e0] truncate max-w-xs">
              <span className="text-[#71717a]">Selecionada:</span>
              <span className="text-[#2ecc71] font-semibold">{selectedZoneName}</span>
            </div>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-[#2ecc71] text-black rounded hover:bg-[#27ae60] transition-colors"
        >
          <Code className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>EXPORTAR ({totalZones})</span>
        </button>
      </div>
    </header>
  );
};


