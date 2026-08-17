import React, { useState } from 'react';
import { GangZone, GangPreset } from '../types';
import { GANG_PRESETS } from '../data/gtasa_data';
import { toSampHex, formatFloat } from '../utils/coordinates';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronRight,
  Sliders,
  Palette,
  Crosshair,
  Layers,
  Sparkles,
  Zap,
  Info,
  Check,
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
  const [filterGang, setFilterGang] = useState<string>('all');

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  // Filtered zone list
  const filteredZones = zones.filter(z => {
    const matchesSearch =
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.variableName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGang = filterGang === 'all' || z.gangPreset === filterGang;
    return matchesSearch && matchesGang;
  });

  const applyGangPreset = (preset: GangPreset) => {
    if (!selectedZone) return;
    onUpdateZone({
      ...selectedZone,
      gangPreset: preset.id,
      color: preset.hexColor,
      alpha: preset.alpha,
      flashColor: preset.flashColor,
    });
  };

  return (
    <aside
      id="sidebar-container"
      className="w-72 md:w-80 border-l border-[#2a2a2e] bg-[#141417] flex flex-col h-full z-10 select-none overflow-hidden text-[#e0e0e0]"
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#2a2a2e] bg-[#141417]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2ecc71]" />
            <h2 className="text-[11px] uppercase tracking-wider text-[#a1a1aa] font-bold">
              Zonas ({zones.length})
            </h2>
          </div>
          <button
            id="btn-sidebar-add-zone"
            onClick={() => onCreateZone({})}
            className="flex items-center gap-1 bg-[#2ecc71] hover:bg-[#27ae60] text-black px-2 py-0.5 rounded text-xs font-bold transition-colors"
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
            className="w-full bg-[#1c1c20] border border-[#2a2a2e] rounded pl-7 pr-2.5 py-1 text-xs text-[#e0e0e0] placeholder-[#71717a] focus:outline-none focus:border-[#2ecc71]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2a2a2e]">
        {/* Selected Zone Inspector */}
        {selectedZone ? (
          <div id="zone-inspector" className="p-3 bg-[#111114] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                Propriedades
              </span>
              <div className="flex items-center gap-1">
                <button
                  id="btn-focus-zone"
                  onClick={() => onFocusZone(selectedZone)}
                  title="Focar no mapa"
                  className="p-1 text-[#a1a1aa] hover:text-[#2ecc71] hover:bg-[#1c1c20] rounded transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-duplicate-selected"
                  onClick={() => onDuplicateZone(selectedZone.id)}
                  title="Duplicar"
                  className="p-1 text-[#a1a1aa] hover:text-white hover:bg-[#1c1c20] rounded transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-delete-selected"
                  onClick={() => onDeleteZone(selectedZone.id)}
                  title="Excluir"
                  className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-[#1c1c20] rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Name & Variable */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#71717a] mb-1">
                  Nome da Zona
                </label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={e => onUpdateZone({ ...selectedZone, name: e.target.value })}
                  className="w-full bg-[#1c1c20] border border-[#2a2a2e] rounded px-2.5 py-1 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#2ecc71]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#71717a] mb-1">
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
                  className="w-full bg-[#1c1c20] border border-[#2a2a2e] rounded px-2.5 py-1 text-xs font-mono text-[#2ecc71] focus:outline-none focus:border-[#2ecc71]"
                />
              </div>
            </div>

            {/* Quick Gang Preset Selector */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#71717a] mb-1.5">
                Facção / Gangue GTA SA
              </label>
              <div className="grid grid-cols-4 gap-1">
                {GANG_PRESETS.slice(0, 8).map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyGangPreset(preset)}
                    title={preset.name}
                    className={`flex flex-col items-center p-1.5 rounded border transition-all text-center ${
                      selectedZone.gangPreset === preset.id
                        ? 'border-[#2ecc71] bg-[#2ecc71]/10 font-bold'
                        : 'border-[#2a2a2e] hover:border-[#3f3f46] bg-[#1c1c20]'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full mb-0.5 border border-black/50 shadow-sm"
                      style={{ backgroundColor: preset.hexColor }}
                    />
                    <span className="text-[9px] text-[#a1a1aa] truncate w-full">
                      {preset.shortName}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates Matrix */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-[#71717a]">
                  Coordenadas SA-MP (Min / Max)
                </label>
                <span className="text-[10px] text-[#71717a] font-mono">
                  {Math.round(selectedZone.maxX - selectedZone.minX)}m ×{' '}
                  {Math.round(selectedZone.maxY - selectedZone.minY)}m
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#1c1c20] p-2.5 rounded border border-[#2a2a2e] text-xs">
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
                    className="w-full bg-[#111114] border border-[#2a2a2e] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
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
                    className="w-full bg-[#111114] border border-[#2a2a2e] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
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
                    className="w-full bg-[#111114] border border-[#2a2a2e] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
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
                    className="w-full bg-[#111114] border border-[#2a2a2e] rounded px-1.5 py-0.5 font-mono text-[#2ecc71] text-xs focus:border-[#2ecc71] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Color, Opacity & HEX SA-MP Preview */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-[#71717a]">
                  Cor & Transparência
                </label>
                <span className="text-[10px] font-mono text-[#2ecc71] font-bold">
                  {toSampHex(selectedZone.color, selectedZone.alpha)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={selectedZone.color}
                  onChange={e => onUpdateZone({ ...selectedZone, color: e.target.value })}
                  className="w-8 h-8 rounded border border-[#2a2a2e] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedZone.color}
                  onChange={e => onUpdateZone({ ...selectedZone, color: e.target.value })}
                  className="w-20 bg-[#1c1c20] border border-[#2a2a2e] rounded px-2 py-1 text-xs font-mono text-[#e0e0e0] uppercase focus:border-[#2ecc71] focus:outline-none"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-[#71717a] mb-0.5">
                    <span>Opacidade (Alpha)</span>
                    <span className="text-[#a1a1aa]">{Math.round((selectedZone.alpha / 255) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="255"
                    value={selectedZone.alpha}
                    onChange={e =>
                      onUpdateZone({ ...selectedZone, alpha: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-[#2a2a2e] rounded appearance-none cursor-pointer accent-[#2ecc71]"
                  />
                </div>
              </div>
            </div>

            {/* Flash / Blinking Settings */}
            <div className="bg-[#1c1c20] p-2.5 rounded border border-[#2a2a2e]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#2ecc71]" />
                  <span className="text-xs font-medium text-[#e0e0e0]">
                    Piscar em Guerra (Flash)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedZone.flashing}
                  onChange={e =>
                    onUpdateZone({ ...selectedZone, flashing: e.target.checked })
                  }
                  className="rounded border-[#2a2a2e] text-[#2ecc71] focus:ring-0 cursor-pointer accent-[#2ecc71]"
                />
              </div>

              {selectedZone.flashing && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#2a2a2e]">
                  <span className="text-[10px] text-[#71717a]">Cor do Flash:</span>
                  <input
                    type="color"
                    value={selectedZone.flashColor || '#FF0000'}
                    onChange={e =>
                      onUpdateZone({ ...selectedZone, flashColor: e.target.value })
                    }
                    className="w-6 h-6 rounded border border-[#2a2a2e] bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#2ecc71]">
                    {toSampHex(selectedZone.flashColor || '#FF0000', 255)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#71717a] mb-1">
                Anotações / Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: Ponto de encontro, HQ, entrega de armas..."
                value={selectedZone.notes || ''}
                onChange={e => onUpdateZone({ ...selectedZone, notes: e.target.value })}
                className="w-full bg-[#1c1c20] border border-[#2a2a2e] rounded px-2.5 py-1 text-xs text-[#e0e0e0] placeholder-[#71717a] focus:outline-none focus:border-[#2ecc71]"
              />
            </div>
          </div>
        ) : (
          <div className="p-5 text-center text-[#71717a] text-xs bg-[#111114]">
            <Info className="w-6 h-6 text-[#52525b] mx-auto mb-2" />
            <p className="text-[#a1a1aa] font-medium mb-1">Nenhuma zona selecionada</p>
            <p className="text-[#71717a] text-[11px]">
              Clique em uma zona na lista ou no mapa para inspecionar e editar suas propriedades.
            </p>
          </div>
        )}

        {/* Zone List Items */}
        <div className="p-3 space-y-2">
          <div className="px-1 flex items-center justify-between text-[10px] font-bold text-[#71717a] uppercase tracking-widest">
            <span>Lista de Zonas ({filteredZones.length})</span>
            {zones.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider"
              >
                Limpar Tudo
              </button>
            )}
          </div>

          {filteredZones.length === 0 ? (
            <div className="py-6 text-center text-[#71717a] text-xs">
              Nenhuma zona encontrada.
            </div>
          ) : (
            filteredZones.map(zone => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <div
                  key={zone.id}
                  id={`zone-item-${zone.id}`}
                  onClick={() => onSelectZone(zone.id)}
                  className={`p-3 rounded border flex items-center justify-between group cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1c1c20] border-[#2ecc71] shadow-sm'
                      : 'bg-[#1c1c20] border-[#2a2a2e] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Color Swatch */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0 border border-black/40"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#e0e0e0] truncate">
                          {zone.name}
                        </p>
                        {zone.flashing && (
                          <Zap className="w-2.5 h-2.5 text-[#2ecc71] shrink-0" />
                        )}
                      </div>
                      <p className="text-[9px] text-[#71717a] font-mono truncate">
                        {zone.variableName} • {Math.round(zone.minX)}, {Math.round(zone.minY)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 ml-2"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Visible Toggle */}
                    <button
                      onClick={() => onUpdateZone({ ...zone, visible: !zone.visible })}
                      title={zone.visible ? 'Ocultar zona' : 'Exibir zona'}
                      className={`p-1 rounded ${
                        zone.visible ? 'text-[#71717a] hover:text-[#e0e0e0]' : 'text-[#52525b]'
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
                        zone.locked ? 'text-[#2ecc71]' : 'text-[#71717a] hover:text-[#e0e0e0]'
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
      <div className="p-3 border-t border-[#2a2a2e] bg-[#141417] flex items-center justify-between text-xs text-[#71717a]">
        <button
          onClick={onResetDefaults}
          className="text-[11px] text-[#71717a] hover:text-[#2ecc71] transition-colors"
        >
          Restaurar Zonas Clássicas
        </button>
        <span className="text-[10px] text-[#71717a] font-mono">SA-MP / open.mp</span>
      </div>
    </aside>
  );
};

