import React, { useState } from 'react';
import { GangZone } from '../types';
import { toSampHex } from '../utils/coordinates';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Crosshair,
  Layers,
  Info,
} from 'lucide-react';

interface SidebarProps {
  zones: GangZone[];
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onUpdateZone: (zone: GangZone) => void;
  onCreateZone: (zone: Partial<GangZone>) => void;
  onDeleteZone: (id: string) => void;
  onDuplicateZone: (id: string) => void;
  onClearAll: () => void;
  onResetDefaults: () => void;
  onFocusZone: (zone: GangZone) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  onUpdateZone,
  onCreateZone,
  onDeleteZone,
  onDuplicateZone,
  onClearAll,
  onResetDefaults,
  onFocusZone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  // Filtered zone list
  const filteredZones = zones.filter(z => {
    return (
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.variableName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <aside
      id="sidebar-container"
      className="w-72 md:w-80 border-l border-[#232326] bg-[#111113] flex flex-col h-full z-10 select-none overflow-hidden text-[#e4e4e7]"
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#232326] bg-[#111113]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2ecc71]" />
            <h2 className="text-xs uppercase tracking-wider text-[#a1a1aa] font-semibold">
              Zonas ({zones.length})
            </h2>
          </div>
          <button
            id="btn-sidebar-add-zone"
            onClick={() => onCreateZone({})}
            className="flex items-center gap-1 bg-[#2ecc71] hover:bg-[#27ae60] text-black px-2 py-0.5 rounded text-xs font-semibold transition-colors"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Nova Zona</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar zona ou variável..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] border border-[#27272a] rounded pl-7 pr-2.5 py-1 text-xs text-[#e4e4e7] placeholder-[#71717a] focus:outline-none focus:border-[#2ecc71]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#232326]">
        {/* Selected Zone Inspector */}
        {selectedZone ? (
          <div id="zone-inspector" className="p-3 bg-[#141417] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                Propriedades
              </span>
              <div className="flex items-center gap-1">
                <button
                  id="btn-focus-zone"
                  onClick={() => onFocusZone(selectedZone)}
                  title="Focar no mapa"
                  className="p-1 text-[#a1a1aa] hover:text-[#2ecc71] hover:bg-[#1f1f23] rounded transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-duplicate-selected"
                  onClick={() => onDuplicateZone(selectedZone.id)}
                  title="Duplicar"
                  className="p-1 text-[#a1a1aa] hover:text-white hover:bg-[#1f1f23] rounded transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-delete-selected"
                  onClick={() => onDeleteZone(selectedZone.id)}
                  title="Excluir"
                  className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-[#1f1f23] rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Name & Variable */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#71717a] mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={e => onUpdateZone({ ...selectedZone, name: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-[#e4e4e7] focus:outline-none focus:border-[#2ecc71]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-semibold text-[#71717a] mb-1">
                  Variável Pawn
                </label>
                <input
                  type="text"
                  value={selectedZone.variableName}
                  onChange={e =>
                    onUpdateZone({
                      ...selectedZone,
                      variableName: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                    })
                  }
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs font-mono text-[#2ecc71] focus:outline-none focus:border-[#2ecc71]"
                />
              </div>
            </div>

            {/* Coordinates Matrix */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-semibold text-[#71717a]">
                  Coordenadas (Min / Max)
                </label>
                <span className="text-[10px] text-[#71717a] font-mono">
                  {Math.round(selectedZone.maxX - selectedZone.minX)}m ×{' '}
                  {Math.round(selectedZone.maxY - selectedZone.minY)}m
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#18181b] p-2 rounded border border-[#27272a] text-xs">
                {/* Min X */}
                <div>
                  <span className="text-[#71717a] text-[10px] block">Min X (Oeste)</span>
                  <input
                    type="number"
                    step="1"
                    value={selectedZone.minX}
                    onChange={e =>
                      onUpdateZone({
                        ...selectedZone,
                        minX: Math.min(selectedZone.maxX - 5, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-[#111113] border border-[#27272a] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
                  />
                </div>
                {/* Max X */}
                <div>
                  <span className="text-[#71717a] text-[10px] block">Max X (Leste)</span>
                  <input
                    type="number"
                    step="1"
                    value={selectedZone.maxX}
                    onChange={e =>
                      onUpdateZone({
                        ...selectedZone,
                        maxX: Math.max(selectedZone.minX + 5, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-[#111113] border border-[#27272a] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
                  />
                </div>
                {/* Min Y */}
                <div>
                  <span className="text-[#71717a] text-[10px] block">Min Y (Sul)</span>
                  <input
                    type="number"
                    step="1"
                    value={selectedZone.minY}
                    onChange={e =>
                      onUpdateZone({
                        ...selectedZone,
                        minY: Math.min(selectedZone.maxY - 5, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-[#111113] border border-[#27272a] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
                  />
                </div>
                {/* Max Y */}
                <div>
                  <span className="text-[#71717a] text-[10px] block">Max Y (Norte)</span>
                  <input
                    type="number"
                    step="1"
                    value={selectedZone.maxY}
                    onChange={e =>
                      onUpdateZone({
                        ...selectedZone,
                        maxY: Math.max(selectedZone.minY + 5, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-[#111113] border border-[#27272a] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Color & Transparency */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-semibold text-[#71717a]">
                  Cor & Transparência
                </label>
                <span className="text-[10px] font-mono text-[#2ecc71] font-bold">
                  {toSampHex(selectedZone.color, selectedZone.alpha)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedZone.color}
                  onChange={e => onUpdateZone({ ...selectedZone, color: e.target.value })}
                  className="w-7 h-7 rounded border border-[#27272a] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedZone.color}
                  onChange={e => onUpdateZone({ ...selectedZone, color: e.target.value })}
                  className="w-20 bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs font-mono text-[#e4e4e7] uppercase focus:border-[#2ecc71] focus:outline-none"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-[#71717a] mb-0.5">
                    <span>Opacidade</span>
                    <span className="text-[#a1a1aa] font-mono">{Math.round((selectedZone.alpha / 255) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="255"
                    value={selectedZone.alpha}
                    onChange={e =>
                      onUpdateZone({ ...selectedZone, alpha: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-[#27272a] rounded appearance-none cursor-pointer accent-[#2ecc71]"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 text-center text-[#71717a] text-xs bg-[#141417]">
            <Info className="w-5 h-5 text-[#52525b] mx-auto mb-1.5" />
            <p className="text-[#a1a1aa] font-medium">Nenhuma zona selecionada</p>
            <p className="text-[#71717a] text-[11px] mt-0.5">
              Clique em uma zona na lista ou no mapa para inspecionar.
            </p>
          </div>
        )}

        {/* Zone List Items */}
        <div className="p-3 space-y-1.5">
          <div className="px-1 flex items-center justify-between text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">
            <span>Lista de Zonas ({filteredZones.length})</span>
            {zones.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors tracking-normal lowercase first-letter:uppercase"
              >
                Limpar tudo
              </button>
            )}
          </div>

          {filteredZones.length === 0 ? (
            <div className="py-6 text-center text-[#71717a] text-xs">
              Nenhuma zona cadastrada.
            </div>
          ) : (
            filteredZones.map(zone => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <div
                  key={zone.id}
                  id={`zone-item-${zone.id}`}
                  onClick={() => onSelectZone(zone.id)}
                  className={`p-2 rounded border flex items-center justify-between group cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#18181b] border-[#2ecc71] shadow-sm'
                      : 'bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 border border-black/50"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#e4e4e7] truncate">
                        {zone.name}
                      </p>
                      <p className="text-[10px] text-[#71717a] font-mono truncate">
                        {zone.variableName} • {Math.round(zone.minX)}, {Math.round(zone.minY)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 ml-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Visible Toggle */}
                    <button
                      onClick={() => onUpdateZone({ ...zone, visible: !zone.visible })}
                      title={zone.visible ? 'Ocultar zona' : 'Exibir zona'}
                      className={`p-1 rounded ${
                        zone.visible ? 'text-[#71717a] hover:text-white' : 'text-[#52525b]'
                      }`}
                    >
                      {zone.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </button>

                    {/* Lock Toggle */}
                    <button
                      onClick={() => onUpdateZone({ ...zone, locked: !zone.locked })}
                      title={zone.locked ? 'Desbloquear edição' : 'Bloquear edição'}
                      className={`p-1 rounded ${
                        zone.locked ? 'text-[#2ecc71]' : 'text-[#71717a] hover:text-white'
                      }`}
                    >
                      {zone.locked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteZone(zone.id)}
                      title="Excluir"
                      className="p-1 text-[#71717a] hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-2.5 border-t border-[#232326] bg-[#111113] flex items-center justify-between text-xs text-[#71717a]">
        <button
          onClick={onResetDefaults}
          className="text-[11px] text-[#71717a] hover:text-[#2ecc71] transition-colors"
        >
          Restaurar Padrões
        </button>
        <span className="text-[10px] text-[#52525b] font-mono">SA-MP / open.mp</span>
      </div>
    </aside>
  );
};
