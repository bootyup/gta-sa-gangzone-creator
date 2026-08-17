export interface GangZone {
  id: string;
  name: string;
  variableName: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  color: string; // Hex format #RRGGBB or #RRGGBBAA
  alpha: number; // 0 to 255 (SA-MP transparency)
  flashColor?: string;
  flashAlpha?: number;
  flashing: boolean;
  visible: boolean;
  locked: boolean;
  notes?: string;
  gangPreset?: string;
}

export type ToolMode = 'select' | 'draw-box' | 'pan' | 'measure';

export type MapStyle = 'radar' | 'satellite' | 'blueprint' | 'vector';

export interface Viewport {
  zoom: number; // 0.1 to 10
  centerX: number; // In GTA SA coordinate space (-3000 to +3000)
  centerY: number; // In GTA SA coordinate space (-3000 to +3000)
}

export interface DragHandle {
  type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';
  zoneId: string;
  startX: number;
  startY: number;
  initialMinX: number;
  initialMinY: number;
  initialMaxX: number;
  initialMaxY: number;
}

export interface Landmark {
  name: string;
  category: 'ls' | 'sf' | 'lv' | 'country' | 'desert';
  x: number;
  y: number;
  iconType: 'casino' | 'airport' | 'gang' | 'mountain' | 'police' | 'landmark';
}

export interface GangPreset {
  id: string;
  name: string;
  shortName: string;
  city: 'Los Santos' | 'San Fierro' | 'Las Venturas' | 'San Andreas';
  hexColor: string;
  alpha: number; // default SA-MP alpha (e.g. 150/255 ~ 0x96)
  flashColor: string;
  tag: string;
}

export type ExportFormat = 'pawn-simple' | 'pawn-array' | 'pawn-system' | 'mta-lua' | 'json' | 'csv';
