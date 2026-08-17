import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GangZone, ToolMode, MapStyle, Viewport } from './types';
import { DEFAULT_INITIAL_ZONES, GANG_PRESETS } from './data/gtasa_data';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { MapCanvas } from './components/MapCanvas';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { TurfGridGeneratorModal } from './components/TurfGridGeneratorModal';
import { QuickHelpModal } from './components/QuickHelpModal';

const STORAGE_KEY = 'gtasa_gangzones_data_v2';

export default function App() {
  // Load initial zones from localStorage or default Grove/Ballas/Vagos presets
  const [zones, setZones] = useState<GangZone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading saved gang zones:', e);
    }
    return DEFAULT_INITIAL_ZONES;
  });

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('gz_ganton');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [gridSnap, setGridSnap] = useState<number>(25);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [flashPreview, setFlashPreview] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>('radar');
  
  // Default viewport centered on Los Santos (Ganton / Grove Street)
  const [viewport, setViewport] = useState<Viewport>({
    zoom: 0.95,
    centerX: 2200,
    centerY: -1600,
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<{
    past: GangZone[][];
    future: GangZone[][];
  }>({
    past: [],
    future: [],
  });

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTurfGridOpen, setIsTurfGridOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Flash ticker for blinking preview
  const [flashTick, setFlashTick] = useState(false);
  useEffect(() => {
    if (!flashPreview) {
      setFlashTick(false);
      return;
    }
    const interval = setInterval(() => {
      setFlashTick(prev => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, [flashPreview]);

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
    } catch (e) {
      console.error('Error saving zones to localStorage:', e);
    }
  }, [zones]);

  // Push state to undo history
  const pushHistory = useCallback(
    (newZones: GangZone[]) => {
      setHistory(prev => ({
        past: [...prev.past.slice(-25), zones],
        future: [],
      }));
      setZones(newZones);
    },
    [zones]
  );

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    setHistory({
      past: newPast,
      future: [zones, ...history.future],
    });
    setZones(previous);
  }, [history, zones]);

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    setHistory({
      past: [...history.past, zones],
      future: newFuture,
    });
    setZones(next);
  }, [history, zones]);

  // Zone CRUD operations
  const handleCreateZone = (newZoneProps: Partial<GangZone>) => {
    const nextIndex = zones.length + 1;
    const defaultPreset = GANG_PRESETS[0]; // Grove Street

    const defaultMinX = Math.round(viewport.centerX - 150);
    const defaultMaxX = Math.round(viewport.centerX + 150);
    const defaultMinY = Math.round(viewport.centerY - 100);
    const defaultMaxY = Math.round(viewport.centerY + 100);

    const newZone: GangZone = {
      id: `gz_${Date.now()}`,
      name: newZoneProps.name || `Território ${nextIndex}`,
      variableName: newZoneProps.variableName || `gz_Zone${nextIndex}`,
      minX: newZoneProps.minX ?? defaultMinX,
      minY: newZoneProps.minY ?? defaultMinY,
      maxX: newZoneProps.maxX ?? defaultMaxX,
      maxY: newZoneProps.maxY ?? defaultMaxY,
      color: newZoneProps.color || defaultPreset.hexColor,
      alpha: newZoneProps.alpha || defaultPreset.alpha,
      flashColor: newZoneProps.flashColor || defaultPreset.flashColor,
      flashing: false,
      visible: true,
      locked: false,
      gangPreset: defaultPreset.id,
      notes: newZoneProps.notes || '',
    };

    pushHistory([...zones, newZone]);
    setSelectedZoneId(newZone.id);
  };

  const handleUpdateZone = (updatedZone: GangZone) => {
    setZones(prev => prev.map(z => (z.id === updatedZone.id ? updatedZone : z)));
  };

  const handleDeleteZone = (id: string) => {
    pushHistory(zones.filter(z => z.id !== id));
    if (selectedZoneId === id) {
      setSelectedZoneId(null);
    }
  };

  const handleDuplicateZone = (id: string) => {
    const target = zones.find(z => z.id === id);
    if (!target) return;

    const duplicated: GangZone = {
      ...target,
      id: `gz_${Date.now()}`,
      name: `${target.name} (Cópia)`,
      variableName: `${target.variableName}_Copy`,
      minX: target.minX + 60,
      maxX: target.maxX + 60,
      minY: target.minY - 60,
      maxY: target.maxY - 60,
    };

    pushHistory([...zones, duplicated]);
    setSelectedZoneId(duplicated.id);
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza de que deseja limpar todas as zonas de gangue?')) {
      pushHistory([]);
      setSelectedZoneId(null);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Restaurar as zonas clássicas de Los Santos (Ganton, Idlewood, East LS, etc.)?')) {
      pushHistory(DEFAULT_INITIAL_ZONES);
      setSelectedZoneId(DEFAULT_INITIAL_ZONES[0].id);
      setViewport({ zoom: 0.95, centerX: 2200, centerY: -1600 });
    }
  };

  const handleImportZones = (imported: GangZone[]) => {
    pushHistory([...zones, ...imported]);
    if (imported.length > 0) {
      setSelectedZoneId(imported[0].id);
      // Focus on first imported zone
      const first = imported[0];
      setViewport({
        zoom: 0.8,
        centerX: (first.minX + first.maxX) / 2,
        centerY: (first.minY + first.maxY) / 2,
      });
    }
  };

  const handleGenerateGrid = (gridZones: GangZone[]) => {
    pushHistory([...zones, ...gridZones]);
    if (gridZones.length > 0) {
      setSelectedZoneId(gridZones[0].id);
      const first = gridZones[0];
      setViewport({
        zoom: 0.7,
        centerX: (first.minX + first.maxX) / 2,
        centerY: (first.minY + first.maxY) / 2,
      });
    }
  };

  const handleFocusZone = (zone: GangZone) => {
    const cx = (zone.minX + zone.maxX) / 2;
    const cy = (zone.minY + zone.maxY) / 2;
    const w = zone.maxX - zone.minX;
    const h = zone.maxY - zone.minY;
    const maxDim = Math.max(w, h);
    const targetZoom = Math.min(2.5, Math.max(0.4, 1200 / maxDim));

    setViewport({
      zoom: targetZoom,
      centerX: cx,
      centerY: cy,
    });
  };

  const handleSelectCity = (x: number, y: number, zoom: number) => {
    setViewport({
      centerX: x,
      centerY: y,
      zoom: zoom,
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input / textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        setIsExportOpen(true);
        e.preventDefault();
        return;
      }

      if (e.key.toLowerCase() === 'v') {
        setToolMode('select');
      } else if (e.key.toLowerCase() === 'b') {
        setToolMode('draw-box');
      } else if (e.key.toLowerCase() === 'h') {
        setToolMode('pan');
      } else if (e.key.toLowerCase() === 'm') {
        setToolMode('measure');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedZoneId) {
          handleDeleteZone(selectedZoneId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedZoneId, handleUndo, handleRedo, zones]);

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  return (
    <div id="gtasa-app-root" className="flex flex-col h-screen w-screen bg-[#0c0c0e] text-[#e0e0e0] overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        totalZones={zones.length}
        selectedZoneName={selectedZone?.name}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Toolbar */}
      <Toolbar
        toolMode={toolMode}
        onSelectTool={setToolMode}
        gridSnap={gridSnap}
        onGridSnapChange={setGridSnap}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(prev => !prev)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(prev => !prev)}
        showLandmarks={showLandmarks}
        onToggleLandmarks={() => setShowLandmarks(prev => !prev)}
        flashPreview={flashPreview}
        onToggleFlashPreview={() => setFlashPreview(prev => !prev)}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        onSelectCity={handleSelectCity}
        onNewZone={() => handleCreateZone({})}
        onOpenTurfGridModal={() => setIsTurfGridOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenHelpModal={() => setIsHelpOpen(true)}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoneCount={zones.length}
      />

      {/* Center Layout: Interactive Map + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 h-full relative">
          <MapCanvas
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            onUpdateZone={handleUpdateZone}
            onCreateZone={handleCreateZone}
            toolMode={toolMode}
            gridSnap={gridSnap}
            showGrid={showGrid}
            showLabels={showLabels}
            showLandmarks={showLandmarks}
            mapStyle={mapStyle}
            viewport={viewport}
            onViewportChange={setViewport}
            flashTick={flashTick}
          />
        </main>

        {/* Right Inspector & List Sidebar */}
        <Sidebar
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          onUpdateZone={handleUpdateZone}
          onCreateZone={handleCreateZone}
          onDeleteZone={handleDeleteZone}
          onDuplicateZone={handleDuplicateZone}
          onClearAll={handleClearAll}
          onResetDefaults={handleResetDefaults}
          onFocusZone={handleFocusZone}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        zones={zones}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportZones={handleImportZones}
      />

      {/* Turf Grid Generator Modal */}
      <TurfGridGeneratorModal
        isOpen={isTurfGridOpen}
        onClose={() => setIsTurfGridOpen(false)}
        onGenerateGrid={handleGenerateGrid}
      />

      {/* Quick Help Modal */}
      <QuickHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
