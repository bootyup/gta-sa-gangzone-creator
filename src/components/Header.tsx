import React from 'react';
import { Layers, Code } from 'lucide-react';

interface HeaderProps {
  totalZones: number;
  selectedZoneName?: string;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ totalZones, selectedZoneName, onOpenExport }) => {
  return (
    <header
      id="top-app-header"
      className="h-11 border-b border-[#232326] bg-[#111113] px-4 flex items-center justify-between z-30 select-none shrink-0"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 bg-[#2ecc71] rounded flex items-center justify-center font-black text-black text-[10px]">
          GZ
        </div>
        <h1 className="text-xs font-semibold tracking-wider text-[#d4d4d8] uppercase">
          GangZone <span className="text-[#2ecc71] font-bold">Editor</span>
        </h1>
      </div>

      {/* Center status info */}
      <div className="hidden sm:flex items-center gap-2.5 text-xs text-[#71717a]">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span className="text-[#e4e4e7] font-medium font-mono">
            {totalZones} {totalZones === 1 ? 'zona' : 'zonas'}
          </span>
        </div>
        {selectedZoneName && (
          <>
            <span className="text-[#3f3f46]">•</span>
            <div className="flex items-center gap-1.5 text-xs truncate max-w-xs">
              <span className="text-[#71717a]">Ativa:</span>
              <span className="text-[#2ecc71] font-medium truncate">{selectedZoneName}</span>
            </div>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          id="btn-header-export"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#2ecc71] text-black rounded hover:bg-[#27ae60] transition-colors"
        >
          <Code className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
};
