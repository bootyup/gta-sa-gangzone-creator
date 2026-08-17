import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GangZone, ToolMode, MapStyle, Viewport, DragHandle, Landmark } from '../types';
import {
  gtaToScreen,
  screenToGta,
  snapToGrid,
  toRgbaString,
  toSampHex,
  formatFloat,
  MAP_MIN_COORD,
  MAP_MAX_COORD,
} from '../utils/coordinates';
import { LANDMARKS } from '../data/gtasa_data';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';

import radarMapUrl from '../assets/maps/gtasa_radar.jpg';
import satelliteMapUrl from '../assets/maps/gtasa_satellite.jpg';
import vectorMapUrl from '../assets/maps/gtasa_radar_vector.svg';

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
  mapStyle: MapStyle;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  flashTick: boolean;
}

// Module-level persistent texture cache so images remain decoded in memory
const GLOBAL_MAP_CACHE = new Map<string, HTMLImageElement>();

// Map style to direct imported asset URL with public fallback
const MAP_SOURCES: Record<MapStyle, string> = {
  radar: radarMapUrl || '/maps/gtasa_radar.jpg',
  satellite: satelliteMapUrl || '/maps/gtasa_satellite.jpg',
  blueprint: radarMapUrl || '/maps/gtasa_radar.jpg',
  vector: vectorMapUrl || '/maps/gtasa_radar_vector.svg',
};

// Immediately preload radar map in background
if (typeof window !== 'undefined') {
  const preloadSources = [radarMapUrl, '/maps/gtasa_radar.jpg', satelliteMapUrl].filter(Boolean) as string[];
  preloadSources.forEach(src => {
    if (!GLOBAL_MAP_CACHE.has(src)) {
      const img = new Image();
      img.src = src;
      GLOBAL_MAP_CACHE.set(src, img);
    }
  });
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
  mapStyle,
  viewport,
  onViewportChange,
  flashTick,
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

  // Load map texture reliably with persistent cache
  useEffect(() => {
    let isCancelled = false;

    const candidates = [
      MAP_SOURCES[mapStyle],
      radarMapUrl,
      '/maps/gtasa_radar.jpg',
      '/maps/gtasa_satellite.jpg',
    ].filter(Boolean) as string[];

    let currentIdx = 0;

    const tryLoadImage = () => {
      if (currentIdx >= candidates.length || isCancelled) return;

      const candidateSrc = candidates[currentIdx];
      let img = GLOBAL_MAP_CACHE.get(candidateSrc);

      if (!img) {
        img = new Image();
        GLOBAL_MAP_CACHE.set(candidateSrc, img);
      }

      if (img.complete && img.naturalWidth > 0) {
        if (!isCancelled) {
          mapImageRef.current = img;
          setTextureVersion(v => v + 1);
        }
        return;
      }

      img.onload = () => {
        if (!isCancelled) {
          mapImageRef.current = img;
          setTextureVersion(v => v + 1);
        }
      };

      img.onerror = () => {
        currentIdx++;
        tryLoadImage();
      };

      if (!img.src) {
        img.src = candidateSrc;
      }
    };

    tryLoadImage();

    return () => {
      isCancelled = true;
    };
  }, [mapStyle]);

  // Handle Canvas Resize
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: Math.max(300, Math.floor(rect.width)),
          height: Math.max(300, Math.floor(rect.height)),
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Check if cursor hits resize handles of selected zone
  const getHandleAtPoint = (
    screenX: number,
    screenY: number,
    zone: GangZone,
    width: number,
    height: number
  ): DragHandle['type'] | null => {
    const nw = gtaToScreen(zone.minX, zone.maxY, width, height, viewport);
    const ne = gtaToScreen(zone.maxX, zone.maxY, width, height, viewport);
    const se = gtaToScreen(zone.maxX, zone.minY, width, height, viewport);
    const sw = gtaToScreen(zone.minX, zone.minY, width, height, viewport);
    const n = { sx: (nw.sx + ne.sx) / 2, sy: nw.sy };
    const s = { sx: (sw.sx + se.sx) / 2, sy: sw.sy };
    const w = { sx: nw.sx, sy: (nw.sy + sw.sy) / 2 };
    const e = { sx: ne.sx, sy: (ne.sy + se.sy) / 2 };

    const handleRadius = 8;
    const dist = (p1: { sx: number; sy: number }, x: number, y: number) =>
      Math.hypot(p1.sx - x, p1.sy - y);

    if (dist(nw, screenX, screenY) <= handleRadius) return 'nw';
    if (dist(ne, screenX, screenY) <= handleRadius) return 'ne';
    if (dist(se, screenX, screenY) <= handleRadius) return 'se';
    if (dist(sw, screenX, screenY) <= handleRadius) return 'sw';
    if (dist(n, screenX, screenY) <= handleRadius) return 'n';
    if (dist(s, screenX, screenY) <= handleRadius) return 's';
    if (dist(w, screenX, screenY) <= handleRadius) return 'w';
    if (dist(e, screenX, screenY) <= handleRadius) return 'e';

    // Inside zone box -> move handle
    const minScreenX = Math.min(nw.sx, se.sx);
    const maxScreenX = Math.max(nw.sx, se.sx);
    const minScreenY = Math.min(nw.sy, se.sy);
    const maxScreenY = Math.max(nw.sy, se.sy);

    if (
      screenX >= minScreenX &&
      screenX <= maxScreenX &&
      screenY >= minScreenY &&
      screenY <= maxScreenY
    ) {
      return 'move';
    }

    return null;
  };

  // Find topmost zone at GTA coords
  const getZoneAtGtaCoords = (gx: number, gy: number): GangZone | null => {
    // Traverse in reverse (topmost first)
    for (let i = zones.length - 1; i >= 0; i--) {
      const z = zones[i];
      if (!z.visible) continue;
      if (gx >= z.minX && gx <= z.maxX && gy >= z.minY && gy <= z.maxY) {
        return z;
      }
    }
    return null;
  };

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 1. Clear background (Ocean color)
    ctx.fillStyle = mapStyle === 'blueprint' ? '#0c0c0e' : '#111b24';
    ctx.fillRect(0, 0, width, height);

    // Map bounds in screen coords
    const mapTopLeft = gtaToScreen(MAP_MIN_COORD, MAP_MAX_COORD, width, height, viewport);
    const mapBottomRight = gtaToScreen(MAP_MAX_COORD, MAP_MIN_COORD, width, height, viewport);
    const mapDrawW = mapBottomRight.sx - mapTopLeft.sx;
    const mapDrawH = mapBottomRight.sy - mapTopLeft.sy;

    // 2. Draw Map Texture
    let activeImg = mapImageRef.current;
    if (!activeImg || !activeImg.complete || activeImg.naturalWidth === 0) {
      const candidates = [
        MAP_SOURCES[mapStyle],
        radarMapUrl,
        '/maps/gtasa_radar.jpg',
        '/maps/gtasa_satellite.jpg',
      ].filter(Boolean) as string[];

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
      ctx.save();
      if (mapStyle === 'blueprint') {
        ctx.filter = 'invert(85%) hue-rotate(180deg) brightness(0.9) contrast(1.2)';
      }
      ctx.drawImage(activeImg, mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);
      ctx.restore();
    } else {
      // Clean dark neutral placeholder while texture initializes
      ctx.fillStyle = '#141417';
      ctx.fillRect(mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);

      ctx.fillStyle = '#71717a';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Carregando Radar GTA SA...', width / 2, height / 2);
      ctx.textAlign = 'start';
    }

    // 3. Draw World Border ([-3000, 3000])
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapTopLeft.sx, mapTopLeft.sy, mapDrawW, mapDrawH);

    // 4. Draw Coordinate Grid Lines if enabled
    if (showGrid) {
      const step = viewport.zoom > 1.2 ? 250 : viewport.zoom > 0.4 ? 500 : 1000;
      ctx.lineWidth = 0.8;

      for (let g = MAP_MIN_COORD; g <= MAP_MAX_COORD; g += step) {
        // Vertical lines (X)
        const pTop = gtaToScreen(g, MAP_MAX_COORD, width, height, viewport);
        const pBottom = gtaToScreen(g, MAP_MIN_COORD, width, height, viewport);
        
        ctx.strokeStyle = g === 0 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(pTop.sx, Math.max(0, pTop.sy));
        ctx.lineTo(pBottom.sx, Math.min(height, pBottom.sy));
        ctx.stroke();

        // Horizontal lines (Y)
        const pLeft = gtaToScreen(MAP_MIN_COORD, g, width, height, viewport);
        const pRight = gtaToScreen(MAP_MAX_COORD, g, width, height, viewport);
        
        ctx.strokeStyle = g === 0 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(Math.max(0, pLeft.sx), pLeft.sy);
        ctx.lineTo(Math.min(width, pRight.sx), pRight.sy);
        ctx.stroke();

        // Coordinate labels along axes
        if (pLeft.sy >= 20 && pLeft.sy <= height - 20) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '10px ui-monospace, monospace';
          ctx.fillText(`Y:${g}`, Math.max(10, pLeft.sx + 6), pLeft.sy - 4);
        }
        if (pTop.sx >= 20 && pTop.sx <= width - 20) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '10px ui-monospace, monospace';
          ctx.fillText(`X:${g}`, pTop.sx + 4, Math.max(20, pTop.sy + 14));
        }
      }
    }

    // 5. Draw Landmarks / Blips
    if (showLandmarks) {
      LANDMARKS.forEach(lm => {
        const pos = gtaToScreen(lm.x, lm.y, width, height, viewport);
        if (pos.sx < -30 || pos.sx > width + 30 || pos.sy < -30 || pos.sy > height + 30) return;

        // Pin icon
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.sx, pos.sy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle =
          lm.iconType === 'gang'
            ? '#10b981'
            : lm.iconType === 'casino'
            ? '#f59e0b'
            : lm.iconType === 'police'
            ? '#3b82f6'
            : lm.iconType === 'airport'
            ? '#ec4899'
            : '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label if zoomed in enough
        if (viewport.zoom > 0.45) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = '10px sans-serif';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 4;
          ctx.fillText(lm.name, pos.sx + 7, pos.sy + 3);
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      });
    }

    // 6. Draw Gang Zones
    zones.forEach(zone => {
      if (!zone.visible) return;

      const isSelected = zone.id === selectedZoneId;
      const nw = gtaToScreen(zone.minX, zone.maxY, width, height, viewport);
      const se = gtaToScreen(zone.maxX, zone.minY, width, height, viewport);
      const zw = se.sx - nw.sx;
      const zh = se.sy - nw.sy;

      // Color computation with flashing
      let fillColor = toRgbaString(zone.color, zone.alpha);
      if (zone.flashing && zone.flashColor) {
        fillColor = flashTick
          ? toRgbaString(zone.flashColor, zone.flashAlpha || zone.alpha)
          : toRgbaString(zone.color, zone.alpha);
      }

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
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        
        const centerX = nw.sx + zw / 2;
        const centerY = nw.sy + zh / 2;
        ctx.fillText(zone.name, centerX, centerY - (zh > 45 ? 6 : 0));

        if (zh > 45 && zw > 60) {
          ctx.font = '9px ui-monospace, monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          const wUnits = Math.round(zone.maxX - zone.minX);
          const hUnits = Math.round(zone.maxY - zone.minY);
          ctx.fillText(`${wUnits}m × ${hUnits}m`, centerX, centerY + 8);
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });

    // 7. Draw Resize / Transform Handles for Selected Zone
    if (selectedZoneId && toolMode === 'select') {
      const selected = zones.find(z => z.id === selectedZoneId);
      if (selected && selected.visible && !selected.locked) {
        const nw = gtaToScreen(selected.minX, selected.maxY, width, height, viewport);
        const ne = gtaToScreen(selected.maxX, selected.maxY, width, height, viewport);
        const se = gtaToScreen(selected.maxX, selected.minY, width, height, viewport);
        const sw = gtaToScreen(selected.minX, selected.minY, width, height, viewport);
        const n = { sx: (nw.sx + ne.sx) / 2, sy: nw.sy };
        const s = { sx: (sw.sx + se.sx) / 2, sy: sw.sy };
        const w = { sx: nw.sx, sy: (nw.sy + sw.sy) / 2 };
        const e = { sx: ne.sx, sy: (ne.sy + se.sy) / 2 };

        const handles = [nw, ne, se, sw, n, s, e, w];

        handles.forEach(h => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(h.sx - 4.5, h.sy - 4.5, 9, 9);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(h.sx - 4.5, h.sy - 4.5, 9, 9);
        });
      }
    }

    // 8. Draw Live Zone Being Drawn
    if (drawStartGta && drawCurrentGta && toolMode === 'draw-box') {
      const minX = Math.min(drawStartGta.x, drawCurrentGta.x);
      const maxX = Math.max(drawStartGta.x, drawCurrentGta.x);
      const minY = Math.min(drawStartGta.y, drawCurrentGta.y);
      const maxY = Math.max(drawStartGta.y, drawCurrentGta.y);

      const nw = gtaToScreen(minX, maxY, width, height, viewport);
      const se = gtaToScreen(maxX, minY, width, height, viewport);
      const zw = se.sx - nw.sx;
      const zh = se.sy - nw.sy;

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(nw.sx, nw.sy, zw, zh);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(nw.sx, nw.sy, zw, zh);

      // Coordinate badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(nw.sx, Math.max(10, nw.sy - 26), 180, 22);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `W: ${Math.round(maxX - minX)}m | H: ${Math.round(maxY - minY)}m`,
        nw.sx + 6,
        Math.max(10, nw.sy - 26) + 11
      );
      ctx.restore();
    }

    // 9. Draw Measurement Ruler
    if (measureStartGta && measureCurrentGta && toolMode === 'measure') {
      const p1 = gtaToScreen(measureStartGta.x, measureStartGta.y, width, height, viewport);
      const p2 = gtaToScreen(measureCurrentGta.x, measureCurrentGta.y, width, height, viewport);
      const dist = Math.hypot(
        measureCurrentGta.x - measureStartGta.x,
        measureCurrentGta.y - measureStartGta.y
      );

      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();

      // Start & End dots
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(p1.sx, p1.sy, 4, 0, Math.PI * 2);
      ctx.arc(p2.sx, p2.sy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Distance tag
      const midX = (p1.sx + p2.sx) / 2;
      const midY = (p1.sy + p2.sy) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(midX - 45, midY - 12, 90, 24);
      ctx.strokeStyle = '#facc15';
      ctx.strokeRect(midX - 45, midY - 12, 90, 24);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(dist)} m`, midX, midY);
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
    mapStyle,
    textureVersion,
    drawStartGta,
    drawCurrentGta,
    measureStartGta,
    measureCurrentGta,
    flashTick,
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

    if (e.button !== 0) return; // Only left click below

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
      // 1. Check if clicking on active handle of selected zone
      if (selectedZoneId) {
        const selected = zones.find(z => z.id === selectedZoneId);
        if (selected && !selected.locked) {
          const handle = getHandleAtPoint(
            sx,
            sy,
            selected,
            canvasDimensions.width,
            canvasDimensions.height
          );
          if (handle) {
            setIsDragging(true);
            setDragHandle({
              type: handle,
              zoneId: selected.id,
              startX: snappedGta.x,
              startY: snappedGta.y,
              initialMinX: selected.minX,
              initialMinY: selected.minY,
              initialMaxX: selected.maxX,
              initialMaxY: selected.maxY,
            });
            return;
          }
        }
      }

      // 2. Check if clicking on any zone to select it
      const hitZone = getZoneAtGtaCoords(gta.x, gta.y);
      if (hitZone) {
        onSelectZone(hitZone.id);
        if (!hitZone.locked) {
          setIsDragging(true);
          setDragHandle({
            type: 'move',
            zoneId: hitZone.id,
            startX: snappedGta.x,
            startY: snappedGta.y,
            initialMinX: hitZone.minX,
            initialMinY: hitZone.minY,
            initialMaxX: hitZone.maxX,
            initialMaxY: hitZone.maxY,
          });
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

    setCursorPos({ x: gta.x, y: gta.y });

    // Handle Panning
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      const baseDim = Math.min(canvasDimensions.width, canvasDimensions.height);
      const scale = (baseDim / 6000) * viewport.zoom;
      onViewportChange({
        ...viewport,
        centerX: panStart.vpX - dx / scale,
        centerY: panStart.vpY + dy / scale,
      });
      return;
    }

    // Handle Measuring
    if (measureStartGta && toolMode === 'measure') {
      setMeasureCurrentGta(snappedGta);
      return;
    }

    // Handle Box Drawing
    if (drawStartGta && toolMode === 'draw-box') {
      setDrawCurrentGta(snappedGta);
      return;
    }

    // Handle Drag Resize / Move
    if (isDragging && dragHandle) {
      const zone = zones.find(z => z.id === dragHandle.zoneId);
      if (!zone || zone.locked) return;

      const deltaX = snappedGta.x - dragHandle.startX;
      const deltaY = snappedGta.y - dragHandle.startY;

      let newMinX = dragHandle.initialMinX;
      let newMinY = dragHandle.initialMinY;
      let newMaxX = dragHandle.initialMaxX;
      let newMaxY = dragHandle.initialMaxY;

      switch (dragHandle.type) {
        case 'move':
          newMinX += deltaX;
          newMaxX += deltaX;
          newMinY += deltaY;
          newMaxY += deltaY;
          break;
        case 'nw':
          newMinX += deltaX;
          newMaxY += deltaY;
          break;
        case 'ne':
          newMaxX += deltaX;
          newMaxY += deltaY;
          break;
        case 'se':
          newMaxX += deltaX;
          newMinY += deltaY;
          break;
        case 'sw':
          newMinX += deltaX;
          newMinY += deltaY;
          break;
        case 'n':
          newMaxY += deltaY;
          break;
        case 's':
          newMinY += deltaY;
          break;
        case 'e':
          newMaxX += deltaX;
          break;
        case 'w':
          newMinX += deltaX;
          break;
      }

      // Maintain minimum 10m size & proper coordinate bounds
      if (newMaxX - newMinX >= 5 && newMaxY - newMinY >= 5) {
        onUpdateZone({
          ...zone,
          minX: snapToGrid(newMinX, gridSnap),
          minY: snapToGrid(newMinY, gridSnap),
          maxX: snapToGrid(newMaxX, gridSnap),
          maxY: snapToGrid(newMaxY, gridSnap),
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }

    if (isDragging) {
      setIsDragging(false);
      setDragHandle(null);
    }

    if (measureStartGta) {
      setMeasureStartGta(null);
      setMeasureCurrentGta(null);
    }

    if (drawStartGta && drawCurrentGta && toolMode === 'draw-box') {
      const minX = Math.min(drawStartGta.x, drawCurrentGta.x);
      const maxX = Math.max(drawStartGta.x, drawCurrentGta.x);
      const minY = Math.min(drawStartGta.y, drawCurrentGta.y);
      const maxY = Math.max(drawStartGta.y, drawCurrentGta.y);

      // Only create if size is at least 15 units
      if (maxX - minX >= 15 && maxY - minY >= 15) {
        onCreateZone({
          minX: snapToGrid(minX, gridSnap),
          minY: snapToGrid(minY, gridSnap),
          maxX: snapToGrid(maxX, gridSnap),
          maxY: snapToGrid(maxY, gridSnap),
        });
      }
      setDrawStartGta(null);
      setDrawCurrentGta(null);
    }
  };

  // Zoom on wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(6.0, Math.max(0.15, viewport.zoom * zoomFactor));

    // Keep cursor point stable in world coordinates
    const gtaBefore = screenToGta(sx, sy, canvasDimensions.width, canvasDimensions.height, viewport);
    const newVp = { ...viewport, zoom: newZoom };
    const gtaAfter = screenToGta(sx, sy, canvasDimensions.width, canvasDimensions.height, newVp);

    onViewportChange({
      zoom: newZoom,
      centerX: viewport.centerX + (gtaBefore.x - gtaAfter.x),
      centerY: viewport.centerY + (gtaBefore.y - gtaAfter.y),
    });
  };

  const handleZoomIn = () => {
    onViewportChange({
      ...viewport,
      zoom: Math.min(6.0, viewport.zoom * 1.3),
    });
  };

  const handleZoomOut = () => {
    onViewportChange({
      ...viewport,
      zoom: Math.max(0.15, viewport.zoom / 1.3),
    });
  };

  const handleResetView = () => {
    onViewportChange({
      zoom: 0.22,
      centerX: 0,
      centerY: 0,
    });
  };

  return (
    <div
      ref={containerRef}
      id="map-canvas-container"
      className="relative w-full h-full bg-[#0c0c0e] overflow-hidden select-none"
      onContextMenu={e => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        id="gtasa-map-canvas"
        className={`w-full h-full block ${
          toolMode === 'pan' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : toolMode === 'draw-box'
            ? 'cursor-crosshair'
            : toolMode === 'measure'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Coordinate & Status HUD (Top Left) */}
      <div
        id="hud-coords-badge"
        className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2.5 bg-[#141417]/95 px-2.5 py-1 rounded border border-[#2a2a2e] text-xs font-mono text-[#e0e0e0]"
      >
        <div className="flex items-center gap-1 text-[#2ecc71]">
          <Crosshair className="w-3 h-3" />
          <span className="font-semibold">GTA SA</span>
        </div>
        <div className="h-3 w-px bg-[#2a2a2e]" />
        <div>
          <span className="text-[#71717a]">X: </span>
          <span className="text-[#e0e0e0] font-medium">
            {cursorPos ? formatFloat(cursorPos.x) : '0.00'}
          </span>
        </div>
        <div>
          <span className="text-[#71717a]">Y: </span>
          <span className="text-[#e0e0e0] font-medium">
            {cursorPos ? formatFloat(cursorPos.y) : '0.00'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[#71717a]">
          <span>Snap: </span>
          <span className="text-[#a1a1aa]">{gridSnap > 0 ? `${gridSnap}m` : 'Off'}</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[#71717a]">
          <span>Zoom: </span>
          <span className="text-[#a1a1aa]">{Math.round(viewport.zoom * 100)}%</span>
        </div>
      </div>

      {/* Floating Zoom Controls (Bottom Right) */}
      <div
        id="hud-zoom-controls"
        className="absolute bottom-3 right-3 z-10 flex flex-col gap-0.5 bg-[#141417]/95 p-0.5 rounded border border-[#2a2a2e]"
      >
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-1.5 text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20] rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-1.5 text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20] rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-reset-zoom"
          onClick={handleResetView}
          title="Resetar Zoom"
          className="p-1.5 text-[#a1a1aa] hover:text-[#e0e0e0] hover:bg-[#1c1c20] rounded transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
