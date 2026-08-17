import React, { useState } from 'react';
import { GangZone } from '../types';
import { parsePawnCode } from '../utils/codeGenerators';
import { X, FileUp, Code, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportZones: (zones: GangZone[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportZones,
}) => {
  const [importType, setImportType] = useState<'pawn' | 'json'>('pawn');
  const [pawnCode, setPawnCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePawnImport = () => {
    setErrorMessage(null);
    setSuccessCount(null);
    try {
      const parsed = parsePawnCode(pawnCode);
      if (parsed.length === 0) {
        setErrorMessage(
          'Nenhuma função GangZoneCreate(minX, minY, maxX, maxY) válida foi encontrada no código colado.'
        );
        return;
      }
      onImportZones(parsed);
      setSuccessCount(parsed.length);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(`Erro ao processar código Pawn: ${err.message || 'Formato inválido'}`);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessCount(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsedJson = JSON.parse(text);
        const zonesToImport = Array.isArray(parsedJson)
          ? parsedJson
          : Array.isArray(parsedJson.zones)
          ? parsedJson.zones
          : null;

        if (!zonesToImport || zonesToImport.length === 0) {
          setErrorMessage('O arquivo JSON não contém uma lista válida de gang zones.');
          return;
        }

        onImportZones(zonesToImport);
        setSuccessCount(zonesToImport.length);
        setTimeout(() => {
          onClose();
        }, 900);
      } catch (err: any) {
        setErrorMessage(`Erro ao ler arquivo JSON: ${err.message || 'Arquivo corrompido'}`);
      }
    };
    reader.readAsText(file);
  };

  const samplePawnSnippet = `// Exemplo de código SA-MP
new gz_Ganton;
new gz_Idlewood;

public OnGameModeInit()
{
    gz_Ganton = GangZoneCreate(2180.0, -1750.0, 2550.0, -1580.0);
    gz_Idlewood = GangZoneCreate(1800.0, -1850.0, 2180.0, -1600.0);
    return 1;
}

public OnPlayerSpawn(playerid)
{
    GangZoneShowForPlayer(playerid, gz_Ganton, 0x00AA00AA);
    GangZoneShowForPlayer(playerid, gz_Idlewood, 0x990099AA);
    return 1;
}`;

  return (
    <div
      id="import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        id="import-modal-content"
        className="bg-[#141417] border border-[#2a2a2e] rounded shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e0e0e0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e] bg-[#111114]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71]/30">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e0e0e0]">
                Importar Gang Zones
              </h2>
              <p className="text-xs text-[#71717a]">
                Carregue zonas de um arquivo de backup ou cole código Pawn do seu Gamemode
              </p>
            </div>
          </div>
          <button
            id="btn-close-import"
            onClick={onClose}
            className="p-1.5 text-[#71717a] hover:text-white rounded hover:bg-[#1c1c20] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0c0c0e] border-b border-[#2a2a2e] text-xs">
          <button
            onClick={() => {
              setImportType('pawn');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              importType === 'pawn'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            Colar Código Pawn (SA-MP)
          </button>
          <button
            onClick={() => {
              setImportType('json');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded font-medium transition-all ${
              importType === 'json'
                ? 'bg-[#2ecc71]/15 text-[#2ecc71] border border-[#2ecc71] font-bold shadow-sm'
                : 'text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20]'
            }`}
          >
            Carregar Arquivo JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#2ecc71]" />
              <span>{successCount} Gang Zones importadas com sucesso para o mapa!</span>
            </div>
          )}

          {importType === 'pawn' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#e0e0e0]">
                  Cole seu código contendo GangZoneCreate:
                </label>
                <button
                  type="button"
                  onClick={() => setPawnCode(samplePawnSnippet)}
                  className="text-[11px] text-[#2ecc71] hover:underline"
                >
                  Inserir código de exemplo
                </button>
              </div>
              <textarea
                value={pawnCode}
                onChange={e => setPawnCode(e.target.value)}
                placeholder="gz_Grove = GangZoneCreate(2180.0, -1750.0, 2550.0, -1580.0);"
                rows={8}
                className="w-full bg-[#0c0c0e] border border-[#2a2a2e] rounded p-3 text-xs font-mono text-[#2ecc71] focus:outline-none focus:border-[#2ecc71]"
              />
              <p className="text-[11px] text-[#71717a]">
                O analisador detecta automaticamente as variáveis, minX, minY, maxX, maxY e cores em GangZoneShowForPlayer/All.
              </p>
            </div>
          ) : (
            <div className="border border-dashed border-[#2a2a2e] hover:border-[#2ecc71] bg-[#111114] rounded p-8 text-center transition-colors">
              <Upload className="w-8 h-8 text-[#2ecc71] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#e0e0e0] mb-1">
                Selecione ou arraste seu arquivo .json exportado anteriormente
              </p>
              <p className="text-xs text-[#71717a] mb-4">
                Compatível com os projetos salvos no GTA SA GangZone Creator
              </p>
              <label
                htmlFor="json-file-input"
                className="inline-flex items-center gap-2 bg-[#2ecc71] hover:bg-[#27ae60] text-black px-4 py-2 rounded text-xs font-bold cursor-pointer transition-colors"
              >
                <span>Escolher Arquivo JSON</span>
                <input
                  id="json-file-input"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        {importType === 'pawn' && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#2a2a2e] bg-[#111114]">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded text-xs text-[#71717a] hover:text-[#e0e0e0] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-pawn-import"
              onClick={handlePawnImport}
              disabled={!pawnCode.trim()}
              className="bg-[#2ecc71] hover:bg-[#27ae60] disabled:bg-[#2a2a2e] disabled:text-[#71717a] text-black font-bold px-4 py-1.5 rounded text-xs transition-all shadow"
            >
              Importar Zonas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
