import React, { useState } from 'react';
import { GangZone, ExportFormat } from '../types';
import { exportCode } from '../utils/codeGenerators';
import {
  X,
  Copy,
  Check,
  Download,
  Code,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  zones: GangZone[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ zones, isOpen, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('pawn-simple');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedCode = exportCode(format, zones);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let extension = 'pwn';
    let mimeType = 'text/plain';

    if (format === 'mta-lua') {
      extension = 'lua';
    } else if (format === 'json') {
      extension = 'json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      extension = 'csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([generatedCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gtasa_gangzones_${format}_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        id="export-modal-content"
        className="bg-[#141417] border border-[#2a2a2e] rounded shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e0e0e0]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e] bg-[#111114]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71]/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e0e0e0]">
                Exportador de Gang Zones (SA-MP & MTA)
              </h2>
              <p className="text-xs text-[#71717a]">
                {zones.length} zonas prontas para inserção no seu Gamemode ou Script
              </p>
            </div>
          </div>
          <button
            id="btn-close-export"
            onClick={onClose}
            className="p-1.5 text-[#71717a] hover:text-white rounded hover:bg-[#1c1c20] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0c0c0e] border-b border-[#2a2a2e] overflow-x-auto text-xs">
          <button
            onClick={() => setFormat('pawn-simple')}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              format === 'pawn-simple'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            Pawn Simples (SA-MP)
          </button>
          <button
            onClick={() => setFormat('pawn-array')}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              format === 'pawn-array'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            Pawn Modular (Array/Enum)
          </button>
          <button
            onClick={() => setFormat('pawn-system')}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              format === 'pawn-system'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            Pawn + Sistema de Territórios
          </button>
          <button
            onClick={() => setFormat('mta-lua')}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              format === 'mta-lua'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            MTA:SA (Lua)
          </button>
          <button
            onClick={() => setFormat('json')}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              format === 'json'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            JSON (Backup)
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              format === 'csv'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            CSV (Planilha)
          </button>
        </div>

        {/* Code Preview Box */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#0c0c0e] font-mono text-xs text-[#e0e0e0]">
          <pre className="p-4 rounded bg-[#111114] border border-[#2a2a2e] text-[#2ecc71] overflow-x-auto whitespace-pre select-text">
            {generatedCode}
          </pre>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#2a2a2e] bg-[#111114]">
          <span className="text-xs text-[#71717a] font-mono">
            {zones.length} zonas configuradas no formato {format.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-download-file"
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-[#2a2a2e] hover:bg-[#323238] text-[#e0e0e0] px-3.5 py-1.5 rounded text-xs font-semibold border border-[#3f3f46] transition-colors"
            >
              <Download className="w-4 h-4 text-[#2ecc71]" />
              <span>Baixar Arquivo</span>
            </button>
            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-black px-4 py-1.5 rounded text-xs font-bold shadow transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
