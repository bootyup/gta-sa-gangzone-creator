import React from 'react';
import { X, BookOpen, Keyboard, Code, MapPin, ExternalLink } from 'lucide-react';

interface QuickHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickHelpModal: React.FC<QuickHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        id="help-modal-content"
        className="bg-[#141417] border border-[#2a2a2e] rounded shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e0e0e0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e] bg-[#111114]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71]/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e0e0e0]">
                Guia & Funções de GangZone no SA-MP
              </h2>
              <p className="text-xs text-[#71717a]">
                Documentação de coordenadas, funções nativas em Pawn e atalhos do editor
              </p>
            </div>
          </div>
          <button
            id="btn-close-help"
            onClick={onClose}
            className="p-1.5 text-[#71717a] hover:text-white rounded hover:bg-[#1c1c20] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#a1a1aa]">
          {/* Section: Sistema de Coordenadas */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#2ecc71] flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              1. Como funcionam as coordenadas no GTA San Andreas
            </h3>
            <p className="text-[#a1a1aa] leading-relaxed">
              O mapa do GTA San Andreas se estende de <code className="text-[#2ecc71] bg-[#1c1c20] px-1 py-0.5 rounded border border-[#2a2a2e]">-3000.0</code> até <code className="text-[#2ecc71] bg-[#1c1c20] px-1 py-0.5 rounded border border-[#2a2a2e]">+3000.0</code> nos eixos X e Y. O ponto central <code className="text-[#2ecc71] bg-[#1c1c20] px-1 py-0.5 rounded border border-[#2a2a2e]">(0.0, 0.0)</code> fica perto de Blueberry no Red County.
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa] pl-1">
              <li><strong className="text-[#e0e0e0]">minX:</strong> Coordenada X mais a Oeste (esquerda no mapa).</li>
              <li><strong className="text-[#e0e0e0]">minY:</strong> Coordenada Y mais ao Sul (baixo no mapa).</li>
              <li><strong className="text-[#e0e0e0]">maxX:</strong> Coordenada X mais a Leste (direita no mapa).</li>
              <li><strong className="text-[#e0e0e0]">maxY:</strong> Coordenada Y mais ao Norte (cima no mapa).</li>
            </ul>
          </div>

          {/* Section: Funções Nativas SA-MP */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#2ecc71] flex items-center gap-1.5">
              <Code className="w-4 h-4" />
              2. Funções Nativas do SA-MP / open.mp (Pawn)
            </h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#2ecc71] font-bold">GangZoneCreate</span>
                <span className="text-[#71717a]">(Float:minx, Float:miny, Float:maxx, Float:maxy);</span>
                <p className="text-[#a1a1aa] font-sans text-[11px] mt-1">
                  Cria a zona no servidor durante <code>OnGameModeInit</code>. Retorna o ID da zona.
                </p>
              </div>

              <div className="p-2.5 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#2ecc71] font-bold">GangZoneShowForPlayer</span>
                <span className="text-[#71717a]">(playerid, zoneid, color);</span>
                <p className="text-[#a1a1aa] font-sans text-[11px] mt-1">
                  Exibe a zona no mapa/radar do jogador com a cor RGBA especificada (ex: <code>0x00FF00AA</code>).
                </p>
              </div>

              <div className="p-2.5 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#2ecc71] font-bold">GangZoneFlashForPlayer</span>
                <span className="text-[#71717a]">(playerid, zoneid, flashcolor);</span>
                <p className="text-[#a1a1aa] font-sans text-[11px] mt-1">
                  Faz a zona piscar no radar do jogador (usado em guerras de gangue / ataque a território).
                </p>
              </div>

              <div className="p-2.5 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-rose-400 font-bold">GangZoneDestroy</span>
                <span className="text-[#71717a]">(zoneid);</span>
                <p className="text-[#a1a1aa] font-sans text-[11px] mt-1">
                  Remove e limpa a zona da memória durante <code>OnGameModeExit</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Atalhos e Controles */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#2ecc71] flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" />
              3. Atalhos do Editor
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#e0e0e0]">Mover Mapa (Pan)</span>
                <kbd className="px-1.5 py-0.5 bg-[#1c1c20] border border-[#2a2a2e] rounded font-mono text-[#2ecc71]">Botão Direito</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#e0e0e0]">Zoom In / Zoom Out</span>
                <kbd className="px-1.5 py-0.5 bg-[#1c1c20] border border-[#2a2a2e] rounded font-mono text-[#2ecc71]">Scroll do Mouse</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#e0e0e0]">Desfazer Ação</span>
                <kbd className="px-1.5 py-0.5 bg-[#1c1c20] border border-[#2a2a2e] rounded font-mono text-[#2ecc71]">Ctrl + Z</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0c0c0e] rounded border border-[#2a2a2e]">
                <span className="text-[#e0e0e0]">Refazer Ação</span>
                <kbd className="px-1.5 py-0.5 bg-[#1c1c20] border border-[#2a2a2e] rounded font-mono text-[#2ecc71]">Ctrl + Y</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#2a2a2e] bg-[#111114]">
          <button
            onClick={onClose}
            className="bg-[#2ecc71] hover:bg-[#27ae60] text-black font-bold px-4 py-1.5 rounded text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
