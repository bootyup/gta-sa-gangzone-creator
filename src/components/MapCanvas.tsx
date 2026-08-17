import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GangZone, ToolMode, Viewport, DragHandle, Landmark } from '../types';
import {
  gtaToScreen,
  screenToGta,
  snapToGrid,
  toRgbaString,
  toSampHex,
  formatFloat,
  MAP_MIN_COORD,
  MAP_MAX_COORD,
  MAP_SIZE_UNITS,
} from '../utils/coordinates';
import { LANDMARKS } from '../data/gtasa_data';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';

import radarMapPngUrl from '../assets/maps/gtasa_radar.png';
import radarMapJpgUrl from '../assets/maps/gtasa_radar.jpg';

interface MapCanvasProps {
  zones: GangZone[];
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onUpdateZone: (zone: GangZone) => void;
  onCreateZone: (zone: Partial<GangZone>) => void;
  toolMode: ToolMode;
  gridSnap: number;
  showGrid: boolean;
  showLabels: boolean;
  showLandmarks: boolean;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

// Persistent texture cache for the radar
const GLOBAL_MAP_CACHE = new Map<string, HTMLImageElement>();

function getRadarCandidates(): string[] {
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return [
    radarMapPngUrl,
    radarMapJpgUrl,
    `${cleanBase}maps/gtasa_radar.png`,
    `${cleanBase}maps/gtasa_radar.jpg`,
    `${cleanBase}gtasa_radar.png`,
    `${cleanBase}gtasa_radar.jpg`,
    '/maps/gtasa_radar.png',
    '/maps/gtasa_radar.jpg',
    '/gtasa_radar.png',
    '/gtasa_radar.jpg',
    'maps/gtasa_radar.png',
    'maps/gtasa_radar.jpg',
    'gtasa_radar.png',
    'gtasa_radar.jpg',
  ].filter(Boolean);
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  onUpdateZone,
  onCreateZone,
  toolMode,
  gridSnap,
  showGrid,
  showLabels,
  showLandmarks,
  viewport,
  onViewportChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse & interaction state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<DragHandle | null>(null);
  const [drawStartGta, setDrawStartGta] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrentGta, setDrawCurrentGta] = useState<{ x: number; y: number } | null>(null);
  const [measureStartGta, setMeasureStartGta] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrentGta, setMeasureCurrentGta] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; vpX: number; vpY: number } | null>(null);
  
  // Image cache & render trigger
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);

  // Load radar map texture
  useEffect(() => {
    let isCancelled = false;
    const candidates = getRadarCandidates();
    let candidateIndex = 0;

    const tryNext = () => {
      if (isCancelled || candidateIndex >= candidates.length) return;

      const src = candidates[candidateIndex];
      const cached = GLOBAL_MAP_CACHE.get(src);

      if (cached && cached.complete && cached.naturalWidth > 0) {
        if (!isCancelled) {
          mapImageRef.current = cached;
          setTextureVersion(v => v + 1);
        }
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0) {
          GLOBAL_MAP_CACHE.set(src, img);
          if (!isCancelled) {
            mapImageRef.current = img;
            setTextureVersion(v => v + 1);
          }
        } else {
          candidateIndex++;
          tryNext();
        }
      };

      img.onerror = () => {
        candidateIndex++;
        tryNext();
      };

      img.src = src;

      if (img.complete && img.naturalWidth > 0) {
        GLOBAL_MAP_CACHE.set(src, img);
        if (!isCancelled) {
          mapImageRef.current = img;
          setTextureVersion(v => v + 1);
        }
      }
    };

    tryNext();

    return () => {
      isCancelled = true;
    };
  }, []);

  // ResizeObserver for canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Zoom controls
  const handleZoom = useCallback(
    (delta: number, clientX?: number, clientY?: number) => {
      onViewportChange({
        ...viewport,
        zoom: Math.min(12, Math.max(0.12, viewport.zoom * (delta > 0 ? 1.2 : 0.833))),
      });
    },
    [viewport, onViewportChange]
  );

  const handleResetView = () => {
    onViewportChange({
      zoom: 0.95,
      centerX: 2200,
      centerY: -1600,
    });
  };

  const handleFitAllZones = () => {
    if (zones.length === 0) {
      handleResetView();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    zones.forEach(z => {
      minX = Math.min(minX, z.minX);
      minY = Math.min(minY, z.minY);
      maxX = Math.max(maxX, z.maxX);
      maxY = Math.max(maxY, z.maxY);
    });

    const cX = (minX + maxX) / 2;
    const cY = (minY + maxY) / 2;
    const spanX = Math.max(300, maxX - minX);
    const spanY = Math.max(300, maxY - minY);

    const fitZoom = Math.min(
      canvasDimensions.width / (spanX * 1.5),
      canvasDimensions.height / (spanY * 1.5),
      3.0
    );

    onViewportChange({
      centerX: Math.round(cX),
      centerY: Math.round(cY),
      zoom: Math.max(0.2, fitZoom),
    });
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 1. Background Ocean
    ctx.fillStyle = '#111b24';
    ctx.fillRect(0, 0, width, height);

    // Map bounds in screen coords
    const mapTopLeft = gtaToScreen(MAP_MIN_COORD, MAP_MAX_COORD, width, height, viewport);
    const mapBottomRight = gtaToScreen(MAP_MAX_COORD, MAP_MIN_COORD, width, height, viewport);
    const mapDrawW = mapBottomRight.sx - mapTopLeft.sx;
    const mapDrawH = mapBottomRight.sy - mapTopLeft.sy;

    // 2. Draw Map Texture
    let activeImg = mapImageRef.current;
    if (!activeImg || !activeImg.complete || activeImg.naturalWidth === 0) {
      const candidates = getRadarCandidates();

      for (const src of candidates) {
        const cached = GLOBAL_MAP_CACHE.get(src);
        if (cached && cached.complete && cached.naturalWidth > 0) {
          activeImg = cached;
          mapImageRef.current = cached;
          break;
        }
      }
    }

    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.drawImage(activeImg, mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);
    } else {
      ctx.fillStyle = '#141417';
      ctx.fillRect(mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);

      ctx.fillStyle = '#71717a';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Carregando Radar GTA SA...', width / 2, height / 2);
      ctx.textAlign = 'start';
    }

    // 3. Map Outer Border & World Limits (-3000 to +3000)
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);

    // 4. Grid System
    if (showGrid) {
      let gridInterval = 500;
      if (viewport.zoom > 3) gridInterval = 50;
      else if (viewport.zoom > 1.5) gridInterval = 100;
      else if (viewport.zoom > 0.6) gridInterval = 250;
      else gridInterval = 500;

      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '9px ui-monospace, monospace';

      // Vertical grid lines (X)
      const startX = Math.floor(MAP_MIN_COORD / gridInterval) * gridInterval;
      for (let gx = startX; gx <= MAP_MAX_COORD; gx += gridInterval) {
        const p1 = gtaToScreen(gx, MAP_MAX_COORD, width, height, viewport);
        const p2 = gtaToScreen(gx, MAP_MIN_COORD, width, height, viewport);

        if (p1.sx >= 0 && p1.sx <= width) {
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();

          if (viewport.zoom > 0.4) {
            ctx.fillText(`${gx}`, p1.sx + 2, 14);
          }
        }
      }

      // Horizontal grid lines (Y)
      const startY = Math.floor(MAP_MIN_COORD / gridInterval) * gridInterval;
      for (let gy = startY; gy <= MAP_MAX_COORD; gy += gridInterval) {
        const p1 = gtaToScreen(MAP_MIN_COORD, gy, width, height, viewport);
        const p2 = gtaToScreen(MAP_MAX_COORD, gy, width, height, viewport);

        if (p1.sy >= 0 && p1.sy <= height) {
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();

          if (viewport.zoom > 0.4) {
            ctx.fillText(`${gy}`, 4, p1.sy - 2);
          }
        }
      }

      // Center Axes (0,0)
      const origin = gtaToScreen(0, 0, width, height, viewport);
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(origin.sx, 0);
      ctx.lineTo(origin.sx, height);
      ctx.moveTo(0, origin.sy);
      ctx.lineTo(width, origin.sy);
      ctx.stroke();
    }

    // 5. Landmarks
    if (showLandmarks && viewport.zoom > 0.45) {
      LANDMARKS.forEach(lm => {
        const pos = gtaToScreen(lm.x, lm.y, width, height, viewport);
        if (pos.sx < -50 || pos.sx > width + 50 || pos.sy < -50 || pos.sy > height + 50) return;

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(pos.sx, pos.sy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (viewport.zoom > 0.8) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 3;
          ctx.fillText(lm.name, pos.sx + 6, pos.sy + 3);
          ctx.shadowBlur = 0;
        }
      });
    }

    // 6. Draw Gang Zones (Solid defined color and alpha)
    zones.forEach(zone => {
      if (!zone.visible) return;

      const isSelected = zone.id === selectedZoneId;
      const nw = gtaToScreen(zone.minX, zone.maxY, width, height, viewport);
      const se = gtaToScreen(zone.maxX, zone.minY, width, height, viewport);
      const zw = se.sx - nw.sx;
      const zh = se.sy - nw.sy;

      const fillColor = toRgbaString(zone.color, zone.alpha);

      ctx.save();
      // Fill rectangle
      ctx.fillStyle = fillColor;
      ctx.fillRect(nw.sx, nw.sy, zw, zh);

      // Border outline
      ctx.strokeStyle = isSelected ? '#ffffff' : zone.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.2;
      ctx.strokeRect(nw.sx, nw.sy, zw, zh);

      // Highlight stripes if selected
      if (isSelected) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(nw.sx + 2, nw.sy + 2, zw - 4, zh - 4);
        ctx.setLineDash([]);
      }

      // Zone Label & Dimensions
      if (showLabels && (zw > 35 || zh > 25)) {
        ctx.fillStyle = '#ffffff';
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(zone.name, nw.sx + 6, nw.sy + 14);

        if (zw > 80 && zh > 45 && viewport.zoom > 0.6) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '9px ui-monospace, monospace';
          ctx.fillText(
            `${Math.round(zone.maxX - zone.minX)}m × ${Math.round(zone.maxY - zone.minY)}m`,
            nw.sx + 6,
            nw.sy + 28
          );
        }
        ctx.shadowBlur = 0;
      }

      // 7. Interactive Handles if Selected and in Select Mode
      if (isSelected && toolMode === 'select') {
        const handleSize = 7;
        const half = handleSize / 2;

        const handles = [
          { type: 'nw', sx: nw.sx, sy: nw.sy },
          { type: 'ne', sx: se.sx, sy: nw.sy },
          { type: 'se', sx: se.sx, sy: se.sy },
          { type: 'sw', sx: nw.sx, sy: se.sy },
          { type: 'n', sx: nw.sx + zw / 2, sy: nw.sy },
          { type: 's', sx: nw.sx + zw / 2, sy: se.sy },
          { type: 'w', sx: nw.sx, sy: nw.sy + zh / 2 },
          { type: 'e', sx: se.sx, sy: nw.sy + zh / 2 },
        ];

        handles.forEach(h => {
          ctx.fillStyle = '#2ecc71';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.fillRect(h.sx - half, h.sy - half, handleSize, handleSize);
          ctx.strokeRect(h.sx - half, h.sy - half, handleSize, handleSize);
        });
      }

      ctx.restore();
    });

    // 8. Draw active creation rectangle (B Tool)
    if (toolMode === 'draw-box' && drawStartGta && drawCurrentGta) {
      const minX = Math.min(drawStartGta.x, drawCurrentGta.x);
      const maxX = Math.max(drawStartGta.x, drawCurrentGta.x);
      const minY = Math.min(drawStartGta.y, drawCurrentGta.y);
      const maxY = Math.max(drawStartGta.y, drawCurrentGta.y);

      const nw = gtaToScreen(minX, maxY, width, height, viewport);
      const se = gtaToScreen(maxX, minY, width, height, viewport);
      const zw = se.sx - nw.sx;
      const zh = se.sy - nw.sy;

      ctx.save();
      ctx.fillStyle = 'rgba(46, 204, 113, 0.25)';
      ctx.fillRect(nw.sx, nw.sy, zw, zh);

      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(nw.sx, nw.sy, zw, zh);
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(
        `W: ${Math.round(maxX - minX)}m | H: ${Math.round(maxY - minY)}m`,
        nw.sx + 8,
        nw.sy + 18
      );
      ctx.restore();
    }

    // 9. Measure Tool Line (M Tool)
    if (toolMode === 'measure' && measureStartGta && measureCurrentGta) {
      const p1 = gtaToScreen(measureStartGta.x, measureStartGta.y, width, height, viewport);
      const p2 = gtaToScreen(measureCurrentGta.x, measureCurrentGta.y, width, height, viewport);

      const dx = measureCurrentGta.x - measureStartGta.x;
      const dy = measureCurrentGta.y - measureStartGta.y;
      const dist = Math.hypot(dx, dy);

      ctx.save();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();

      // Endpoints
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(p1.sx, p1.sy, 4, 0, Math.PI * 2);
      ctx.arc(p2.sx, p2.sy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Tooltip
      const midX = (p1.sx + p2.sx) / 2;
      const midY = (p1.sy + p2.sy) / 2;
      ctx.fillStyle = '#000000';
      ctx.fillRect(midX - 40, midY - 14, 80, 20);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - 40, midY - 14, 80, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(dist)}m`, midX, midY);
      ctx.textAlign = 'start';
      ctx.restore();
    }
  }, [
    canvasDimensions,
    viewport,
    zones,
    selectedZoneId,
    toolMode,
    showGrid,
    showLabels,
    showLandmarks,
    textureVersion,
    drawStartGta,
    drawCurrentGta,
    measureStartGta,
    measureCurrentGta,
  ]);

  // Pointer event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const gta = screenToGta(sx, sy, canvasDimensions.width, canvasDimensions.height, viewport);
    const snappedGta = {
      x: snapToGrid(gta.x, gridSnap),
      y: snapToGrid(gta.y, gridSnap),
    };

    // Right click or Space or Pan tool -> Pan Map
    if (e.button === 2 || e.button === 1 || toolMode === 'pan' || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, vpX: viewport.centerX, vpY: viewport.centerY });
      return;
    }

    if (e.button !== 0) return;

    if (toolMode === 'measure') {
      setMeasureStartGta(snappedGta);
      setMeasureCurrentGta(snappedGta);
      return;
    }

    if (toolMode === 'draw-box') {
      setDrawStartGta(snappedGta);
      setDrawCurrentGta(snappedGta);
      return;
    }

    if (toolMode === 'select') {
      // 1. Check if clicking a handle on selected zone
      const selected = zones.find(z => z.id === selectedZoneId);
      if (selected && !selected.locked) {
        const nw = gtaToScreen(selected.minX, selected.maxY, canvasDimensions.width, canvasDimensions.height, viewport);
        const se = gtaToScreen(selected.maxX, selected.minY, canvasDimensions.width, canvasDimensions.height, viewport);
        const zw = se.sx - nw.sx;
        const zh = se.sy - nw.sy;
        const tolerance = 9;

        const handles: { type: DragHandle['type']; hx: number; hy: number }[] = [
          { type: 'nw', hx: nw.sx, hy: nw.sy },
          { type: 'ne', hx: se.sx, hy: nw.sy },
          { type: 'se', hx: se.sx, hy: se.sy },
          { type: 'sw', hx: nw.sx, hy: se.sy },
          { type: 'n', hx: nw.sx + zw / 2, hy: nw.sy },
          { type: 's', hx: nw.sx + zw / 2, hy: se.sy },
          { type: 'w', hx: nw.sx, hy: nw.sy + zh / 2 },
          { type: 'e', hx: se.sx, hy: nw.sy + zh / 2 },
        ];

        for (const h of handles) {
          if (Math.abs(sx - h.hx) <= tolerance && Math.abs(sy - h.hy) <= tolerance) {
            setDragHandle({
              type: h.type,
              zoneId: selected.id,
              startX: snappedGta.x,
              startY: snappedGta.y,
              initialMinX: selected.minX,
              initialMinY: selected.minY,
              initialMaxX: selected.maxX,
              initialMaxY: selected.maxY,
            });
            setIsDragging(true);
            return;
          }
        }
      }

      // 2. Check if clicked inside any zone (reverse order for top-most)
      let clickedZone: GangZone | null = null;
      for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i];
        if (z.visible && gta.x >= z.minX && gta.x <= z.maxX && gta.y >= z.minY && gta.y <= z.maxY) {
          clickedZone = z;
          break;
        }
      }

      if (clickedZone) {
        onSelectZone(clickedZone.id);
        if (!clickedZone.locked) {
          setDragHandle({
            type: 'move',
            zoneId: clickedZone.id,
            startX: snappedGta.x,
            startY: snappedGta.y,
            initialMinX: clickedZone.minX,
            initialMinY: clickedZone.minY,
            initialMaxX: clickedZone.maxX,
            initialMaxY: clickedZone.maxY,
          });
          setIsDragging(true);
        }
      } else {
        onSelectZone(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const gta = screenToGta(sx, sy, canvasDimensions.width, canvasDimensions.height, viewport);
    const snappedGta = {
      x: snapToGrid(gta.x, gridSnap),
      y: snapToGrid(gta.y, gridSnap),
    };

    setCursorPos({ x: snappedGta.x, y: snappedGta.y });

    // Handle Panning
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      const baseDim = Math.min(canvasDimensions.width, canvasDimensions.height);
      const scale = (baseDim / MAP_SIZE_UNITS) * viewport.zoom;
      if (scale > 0) {
        onViewportChange({
          ...viewport,
          centerX: panStart.vpX - dx / scale,
          centerY: panStart.vpY + dy / scale,
        });
      }
      return;
    }

    // Handle Measure
    if (toolMode === 'measure' && measureStartGta) {
      setMeasureCurrentGta(snappedGta);
      return;
    }

    // Handle Draw Box
    if (toolMode === 'draw-box' && drawStartGta) {
      setDrawCurrentGta(snappedGta);
      return;
    }

    // Handle Zone Drag / Resize
    if (isDragging && dragHandle) {
      const activeZone = zones.find(z => z.id === dragHandle.zoneId);
      if (!activeZone) return;

      const deltaX = snappedGta.x - dragHandle.startX;
      const deltaY = snappedGta.y - dragHandle.startY;

      let newMinX = dragHandle.initialMinX;
      let newMinY = dragHandle.initialMinY;
      let newMaxX = dragHandle.initialMaxX;
      let newMaxY = dragHandle.initialMaxY;

      switch (dragHandle.type) {
        case 'move':
          newMinX = dragHandle.initialMinX + deltaX;
          newMaxX = dragHandle.initialMaxX + deltaX;
          newMinY = dragHandle.initialMinY + deltaY;
          newMaxY = dragHandle.initialMaxY + deltaY;
          break;
        case 'nw':
          newMinX = Math.min(dragHandle.initialMaxX - 5, dragHandle.initialMinX + deltaX);
          newMaxY = Math.max(dragHandle.initialMinY + 5, dragHandle.initialMaxY + deltaY);
          break;
        case 'ne':
          newMaxX = Math.max(dragHandle.initialMinX + 5, dragHandle.initialMaxX + deltaX);
          newMaxY = Math.max(dragHandle.initialMinY + 5, dragHandle.initialMaxY + deltaY);
          break;
        case 'se':
          newMaxX = Math.max(dragHandle.initialMinX + 5, dragHandle.initialMaxX + deltaX);
          newMinY = Math.min(dragHandle.initialMaxY - 5, dragHandle.initialMinY + deltaY);
          break;
        case 'sw':
          newMinX = Math.min(dragHandle.initialMaxX - 5, dragHandle.initialMinX + deltaX);
          newMinY = Math.min(dragHandle.initialMaxY - 5, dragHandle.initialMinY + deltaY);
          break;
        case 'n':
          newMaxY = Math.max(dragHandle.initialMinY + 5, dragHandle.initialMaxY + deltaY);
          break;
        case 's':
          newMinY = Math.min(dragHandle.initialMaxY - 5, dragHandle.initialMinY + deltaY);
          break;
        case 'w':
          newMinX = Math.min(dragHandle.initialMaxX - 5, dragHandle.initialMinX + deltaX);
          break;
        case 'e':
          newMaxX = Math.max(dragHandle.initialMinX + 5, dragHandle.initialMaxX + deltaX);
          break;
      }

      onUpdateZone({
        ...activeZone,
        minX: Math.round(newMinX),
        minY: Math.round(newMinY),
        maxX: Math.round(newMaxX),
        maxY: Math.round(newMaxY),
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }

    if (toolMode === 'draw-box' && drawStartGta && drawCurrentGta) {
      const minX = Math.min(drawStartGta.x, drawCurrentGta.x);
      const maxX = Math.max(drawStartGta.x, drawCurrentGta.x);
      const minY = Math.min(drawStartGta.y, drawCurrentGta.y);
      const maxY = Math.max(drawStartGta.y, drawCurrentGta.y);

      // Only create if minimum 10m dimension
      if (maxX - minX >= 10 && maxY - minY >= 10) {
        onCreateZone({
          minX: Math.round(minX),
          minY: Math.round(minY),
          maxX: Math.round(maxX),
          maxY: Math.round(maxY),
        });
      }

      setDrawStartGta(null);
      setDrawCurrentGta(null);
    }

    if (toolMode === 'measure') {
      setMeasureStartGta(null);
      setMeasureCurrentGta(null);
    }

    if (isDragging) {
      setIsDragging(false);
      setDragHandle(null);
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(15, Math.max(0.1, viewport.zoom * zoomFactor));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const gtaBefore = screenToGta(sx, sy, canvasDimensions.width, canvasDimensions.height, viewport);
      const gtaAfter = screenToGta(sx, sy, canvasDimensions.width, canvasDimensions.height, {
        ...viewport,
        zoom: newZoom,
      });

      onViewportChange({
        zoom: newZoom,
        centerX: viewport.centerX + (gtaBefore.x - gtaAfter.x),
        centerY: viewport.centerY + (gtaBefore.y - gtaAfter.y),
      });
    } else {
      onViewportChange({ ...viewport, zoom: newZoom });
    }
  };

  return (
    <div
      ref={containerRef}
      id="map-canvas-container"
      className="relative w-full h-full bg-[#111b24] overflow-hidden select-none"
      onContextMenu={e => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        id="gtasa-main-canvas"
        style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
        className={`w-full h-full block ${
          toolMode === 'draw-box'
            ? 'cursor-crosshair'
            : toolMode === 'measure'
            ? 'cursor-crosshair'
            : toolMode === 'pan' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating HUD: Live Coordinates & Zoom */}
      <div
        id="map-hud-coordinates"
        className="absolute bottom-3 left-3 bg-[#111113]/90 backdrop-blur-sm border border-[#27272a] rounded px-3 py-1.5 text-xs text-[#e4e4e7] flex items-center gap-3 font-mono shadow-lg pointer-events-none"
      >
        <div className="flex items-center gap-1">
          <Crosshair className="w-3.5 h-3.5 text-[#2ecc71]" />
          <span>
            X: <strong className="text-[#2ecc71]">{cursorPos ? formatFloat(cursorPos.x) : '0.00'}</strong>
          </span>
          <span className="text-[#52525b]">|</span>
          <span>
            Y: <strong className="text-[#2ecc71]">{cursorPos ? formatFloat(cursorPos.y) : '0.00'}</strong>
          </span>
        </div>

        <div className="text-[11px] text-[#71717a] border-l border-[#27272a] pl-2.5">
          Zoom: <strong className="text-[#e4e4e7]">{Math.round(viewport.zoom * 100)}%</strong>
        </div>
      </div>

      {/* Floating View Controls (Zoom in / out / fit) */}
      <div
        id="map-hud-controls"
        className="absolute bottom-3 right-3 flex flex-col gap-1 bg-[#111113]/90 backdrop-blur-sm p-1 rounded border border-[#27272a] shadow-lg z-10"
      >
        <button
          id="btn-zoom-in"
          onClick={() => handleZoom(1)}
          title="Aproximar (+)"
          className="p-1.5 text-[#e4e4e7] hover:bg-[#27272a] hover:text-[#2ecc71] rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => handleZoom(-1)}
          title="Afastar (-)"
          className="p-1.5 text-[#e4e4e7] hover:bg-[#27272a] hover:text-[#2ecc71] rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-fit-all"
          onClick={handleFitAllZones}
          title="Ajustar todas as zonas"
          className="p-1.5 text-[#e4e4e7] hover:bg-[#27272a] hover:text-[#2ecc71] rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
