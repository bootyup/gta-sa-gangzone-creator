export const MAP_MIN_COORD = -3000;
export const MAP_MAX_COORD = 3000;
export const MAP_SIZE_UNITS = 6000;

/**
 * Converts GTA SA game world coordinates (X, Y) where X in [-3000, 3000] and Y in [-3000, 3000]
 * to canvas normalized coordinates [0, 1] x [0, 1].
 * Note: GTA SA +Y is North (up), so higher Y = lower pixel Y on screen.
 */
export function gtaToNormalized(x: number, y: number): { nx: number; ny: number } {
  const nx = (x - MAP_MIN_COORD) / MAP_SIZE_UNITS;
  const ny = (MAP_MAX_COORD - y) / MAP_SIZE_UNITS;
  return { nx, ny };
}

/**
 * Converts canvas normalized coordinates [0, 1] back to GTA SA game world coordinates.
 */
export function normalizedToGta(nx: number, ny: number): { x: number; y: number } {
  const x = MAP_MIN_COORD + nx * MAP_SIZE_UNITS;
  const y = MAP_MAX_COORD - ny * MAP_SIZE_UNITS;
  return { x, y };
}

/**
 * Transforms GTA coordinate to screen pixel coordinate based on canvas dimensions and viewport.
 */
export function gtaToScreen(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  viewport: { zoom: number; centerX: number; centerY: number }
): { sx: number; sy: number } {
  const baseDim = Math.min(canvasWidth, canvasHeight);
  const scale = (baseDim / MAP_SIZE_UNITS) * viewport.zoom;
  
  const sx = canvasWidth / 2 + (x - viewport.centerX) * scale;
  const sy = canvasHeight / 2 - (y - viewport.centerY) * scale; // Invert Y because screen Y goes down
  return { sx, sy };
}

/**
 * Transforms screen pixel coordinate back to GTA SA game world coordinate.
 */
export function screenToGta(
  sx: number,
  sy: number,
  canvasWidth: number,
  canvasHeight: number,
  viewport: { zoom: number; centerX: number; centerY: number }
): { x: number; y: number } {
  const baseDim = Math.min(canvasWidth, canvasHeight);
  const scale = (baseDim / MAP_SIZE_UNITS) * viewport.zoom;
  
  const x = viewport.centerX + (sx - canvasWidth / 2) / scale;
  const y = viewport.centerY - (sy - canvasHeight / 2) / scale;
  return { x, y };
}

/**
 * Snaps a coordinate to the given grid step.
 */
export function snapToGrid(value: number, gridStep: number): number {
  if (!gridStep || gridStep <= 0) return Math.round(value * 100) / 100;
  return Math.round(value / gridStep) * gridStep;
}

/**
 * Clamps a coordinate within GTA SA map bounds [-3000, 3000].
 */
export function clampCoord(val: number): number {
  return Math.max(MAP_MIN_COORD, Math.min(MAP_MAX_COORD, val));
}

/**
 * Formats color and alpha into SA-MP Pawn HEX string (0xRRGGBBAA).
 */
export function toSampHex(hexColor: string, alpha: number = 170): string {
  let cleanHex = hexColor.replace('#', '').toUpperCase();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const hexAlpha = Math.max(0, Math.min(255, Math.round(alpha)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `0x${cleanHex.substring(0, 6)}${hexAlpha}`;
}

/**
 * Formats color and alpha into rgba(r,g,b,a) string for CSS canvas.
 */
export function toRgbaString(hexColor: string, alpha: number = 170): string {
  let cleanHex = hexColor.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const a = Math.round((alpha / 255) * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Extracts RGB components from hex.
 */
export function hexToRgb(hexColor: string): { r: number; g: number; b: number } {
  let cleanHex = hexColor.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  return {
    r: parseInt(cleanHex.substring(0, 2), 16) || 0,
    g: parseInt(cleanHex.substring(2, 4), 16) || 0,
    b: parseInt(cleanHex.substring(4, 6), 16) || 0,
  };
}

/**
 * Formats a float coordinate to 2 decimal places.
 */
export function formatFloat(val: number): string {
  return val.toFixed(2);
}
