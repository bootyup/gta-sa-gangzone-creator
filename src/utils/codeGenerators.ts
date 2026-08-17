import { GangZone, ExportFormat } from '../types';
import { toSampHex, hexToRgb, formatFloat } from './coordinates';

export function generatePawnSimple(zones: GangZone[]): string {
  const varLines = zones.map(z => `new ${z.variableName};`).join('\n');
  
  const createLines = zones
    .map(
      z =>
        `    // ${z.name}\n` +
        `    ${z.variableName} = GangZoneCreate(${formatFloat(z.minX)}, ${formatFloat(z.minY)}, ${formatFloat(z.maxX)}, ${formatFloat(z.maxY)});`
    )
    .join('\n\n');

  const showLines = zones
    .map(
      z =>
        `    GangZoneShowForPlayer(playerid, ${z.variableName}, ${toSampHex(z.color, z.alpha)});` +
        (z.flashColor
          ? `\n    // GangZoneFlashForPlayer(playerid, ${z.variableName}, ${toSampHex(z.flashColor, z.flashAlpha || 255)});`
          : '')
    )
    .join('\n');

  return `/*
 * =========================================================================
 *   GTA SA Gang Zones - Criado com GTA SA GangZone Creator
 *   Total de Zonas: ${zones.length}
 * =========================================================================
 */

#include <a_samp>

// --- Variaveis Globais das GangZones ---
${varLines}

public OnGameModeInit()
{
    // --- Criacao das GangZones (minX, minY, maxX, maxY) ---
${createLines}

    return 1;
}

public OnPlayerSpawn(playerid)
{
    // --- Exibicao das GangZones para o Jogador ---
${showLines}

    return 1;
}

public OnGameModeExit()
{
    // --- Destruicao das GangZones ao descarregar GM ---
${zones.map(z => `    GangZoneDestroy(${z.variableName});`).join('\n')}
    return 1;
}
`;
}

export function generatePawnArray(zones: GangZone[]): string {
  const rows = zones
    .map(
      (z, idx) =>
        `    {"${z.name.replace(/"/g, '')}", ${formatFloat(z.minX)}, ${formatFloat(z.minY)}, ${formatFloat(z.maxX)}, ${formatFloat(z.maxY)}, ${toSampHex(z.color, z.alpha)}, ${toSampHex(z.flashColor || z.color, z.flashAlpha || 255)}}` +
        (idx < zones.length - 1 ? ',' : '')
    )
    .join('\n');

  return `/*
 * =========================================================================
 *   Sistema Modular de GangZones em Array/Enum (SA-MP / open.mp)
 *   Total de Zonas: ${zones.length}
 * =========================================================================
 */

#include <a_samp>

#define MAX_GANG_ZONES (${zones.length})

enum E_GANG_ZONE_DATA {
    E_GZ_NAME[40],
    Float:E_GZ_MIN_X,
    Float:E_GZ_MIN_Y,
    Float:E_GZ_MAX_X,
    Float:E_GZ_MAX_Y,
    E_GZ_COLOR,
    E_GZ_FLASH_COLOR,
    E_GZ_ZONE_ID
};

new g_GangZoneData[MAX_GANG_ZONES][E_GANG_ZONE_DATA] = {
${rows}
};

public OnGameModeInit()
{
    for(new i = 0; i < MAX_GANG_ZONES; i++)
    {
        g_GangZoneData[i][E_GZ_ZONE_ID] = GangZoneCreate(
            g_GangZoneData[i][E_GZ_MIN_X],
            g_GangZoneData[i][E_GZ_MIN_Y],
            g_GangZoneData[i][E_GZ_MAX_X],
            g_GangZoneData[i][E_GZ_MAX_Y]
        );
    }
    printf("[GangZones] Carregadas %d zonas de gangue com sucesso!", MAX_GANG_ZONES);
    return 1;
}

public OnPlayerSpawn(playerid)
{
    for(new i = 0; i < MAX_GANG_ZONES; i++)
    {
        if(g_GangZoneData[i][E_GZ_ZONE_ID] != -1)
        {
            GangZoneShowForPlayer(playerid, g_GangZoneData[i][E_GZ_ZONE_ID], g_GangZoneData[i][E_GZ_COLOR]);
        }
    }
    return 1;
}

public OnGameModeExit()
{
    for(new i = 0; i < MAX_GANG_ZONES; i++)
    {
        if(g_GangZoneData[i][E_GZ_ZONE_ID] != -1)
        {
            GangZoneDestroy(g_GangZoneData[i][E_GZ_ZONE_ID]);
            g_GangZoneData[i][E_GZ_ZONE_ID] = -1;
        }
    }
    return 1;
}
`;
}

export function generatePawnSystem(zones: GangZone[]): string {
  const arrayCode = generatePawnArray(zones);
  return `${arrayCode}

// =========================================================================
// Funcoes Auxiliares de Verificacao de Jogador dentro da Zona
// =========================================================================

stock bool:IsPlayerInGangZone(playerid, zoneIndex)
{
    if(zoneIndex < 0 || zoneIndex >= MAX_GANG_ZONES) return false;
    
    new Float:px, Float:py, Float:pz;
    GetPlayerPos(playerid, px, py, pz);
    
    if(px >= g_GangZoneData[zoneIndex][E_GZ_MIN_X] && px <= g_GangZoneData[zoneIndex][E_GZ_MAX_X] &&
       py >= g_GangZoneData[zoneIndex][E_GZ_MIN_Y] && py <= g_GangZoneData[zoneIndex][E_GZ_MAX_Y])
    {
        return true;
    }
    return false;
}

stock GetPlayerCurrentGangZone(playerid)
{
    for(new i = 0; i < MAX_GANG_ZONES; i++)
    {
        if(IsPlayerInGangZone(playerid, i))
        {
            return i;
        }
    }
    return -1; // Jogador fora de qualquer zona
}
`;
}

export function generateMtaLua(zones: GangZone[]): string {
  const lines = zones
    .map(z => {
      const width = z.maxX - z.minX;
      const height = z.maxY - z.minY;
      const rgb = hexToRgb(z.color);
      return `    -- ${z.name}\n    radarAreas["${z.variableName}"] = createRadarArea(${formatFloat(z.minX)}, ${formatFloat(z.minY)}, ${formatFloat(width)}, ${formatFloat(height)}, ${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(z.alpha)})`;
    })
    .join('\n\n');

  return `-- =========================================================================
--   MTA: San Andreas Radar Area Script (Client/Server)
--   Total de Zonas: ${zones.length}
-- =========================================================================

local radarAreas = {}

function initGangRadarAreas()
${lines}
    outputDebugString("[MTA Radar] ${zones.length} Gang Zones carregadas com sucesso!")
end
addEventHandler("onClientResourceStart", resourceRoot, initGangRadarAreas)
`;
}

export function generateJson(zones: GangZone[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      map: 'GTA: San Andreas',
      totalZones: zones.length,
      zones: zones,
    },
    null,
    2
  );
}

export function generateCsv(zones: GangZone[]): string {
  const header = 'id,name,variableName,minX,minY,maxX,maxY,colorHex,alpha,sampHex,notes\n';
  const rows = zones
    .map(
      z =>
        `"${z.id}","${z.name.replace(/"/g, '""')}","${z.variableName}",${z.minX},${z.minY},${z.maxX},${z.maxY},"${z.color}",${z.alpha},"${toSampHex(z.color, z.alpha)}","${(z.notes || '').replace(/"/g, '""')}"`
    )
    .join('\n');
  return header + rows;
}

export function exportCode(format: ExportFormat, zones: GangZone[]): string {
  switch (format) {
    case 'pawn-simple':
      return generatePawnSimple(zones);
    case 'pawn-array':
      return generatePawnArray(zones);
    case 'pawn-system':
      return generatePawnSystem(zones);
    case 'mta-lua':
      return generateMtaLua(zones);
    case 'json':
      return generateJson(zones);
    case 'csv':
      return generateCsv(zones);
    default:
      return generatePawnSimple(zones);
  }
}

/**
 * Reverse-parses pasted Pawn / SA-MP code to extract GangZones.
 */
export function parsePawnCode(code: string): GangZone[] {
  const result: GangZone[] = [];
  
  // Match GangZoneCreate(minX, minY, maxX, maxY)
  // Optional variable assignment: (new\s+)?([a-zA-Z0-9_]+)\s*=\s*GangZoneCreate\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)
  const regexWithVar = /(?:new\s+)?([a-zA-Z0-9_]+)\s*=\s*GangZoneCreate\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g;
  let match: RegExpExecArray | null;

  const foundVars = new Set<string>();

  while ((match = regexWithVar.exec(code)) !== null) {
    const varName = match[1];
    const minX = parseFloat(match[2]);
    const minY = parseFloat(match[3]);
    const maxX = parseFloat(match[4]);
    const maxY = parseFloat(match[5]);

    foundVars.add(varName);

    // Try finding associated color in GangZoneShowForPlayer/All
    let hexColor = '#00AA00';
    let alpha = 170;
    
    const colorRegex = new RegExp(`GangZoneShowFor(?:Player|All)\\s*\\([^,]+,\\s*${varName}\\s*,\\s*(0x[0-9a-fA-F]{6,8})`, 'i');
    const colorMatch = colorRegex.exec(code);
    if (colorMatch && colorMatch[1]) {
      const parsedHex = colorMatch[1];
      if (parsedHex.length >= 8) {
        hexColor = '#' + parsedHex.substring(2, 8);
        if (parsedHex.length === 10) {
          alpha = parseInt(parsedHex.substring(8, 10), 16) || 170;
        }
      }
    }

    result.push({
      id: `imported_${Date.now()}_${result.length}`,
      name: varName.replace(/^gz_?|^g_?|^zone_?/i, '') || `Zona ${result.length + 1}`,
      variableName: varName,
      minX: Math.min(minX, maxX),
      minY: Math.min(minY, maxY),
      maxX: Math.max(minX, maxX),
      maxY: Math.max(minY, maxY),
      color: hexColor,
      alpha: alpha,
      flashing: false,
      visible: true,
      locked: false,
      notes: 'Importado de código Pawn',
    });
  }

  // If no variable assigned GangZoneCreate found, match standalone GangZoneCreate(...)
  if (result.length === 0) {
    const standaloneRegex = /GangZoneCreate\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g;
    let sMatch: RegExpExecArray | null;
    let count = 1;
    while ((sMatch = standaloneRegex.exec(code)) !== null) {
      const minX = parseFloat(sMatch[1]);
      const minY = parseFloat(sMatch[2]);
      const maxX = parseFloat(sMatch[3]);
      const maxY = parseFloat(sMatch[4]);

      result.push({
        id: `imported_${Date.now()}_${count}`,
        name: `Zona Importada ${count}`,
        variableName: `gz_Zone${count}`,
        minX: Math.min(minX, maxX),
        minY: Math.min(minY, maxY),
        maxX: Math.max(minX, maxX),
        maxY: Math.max(minY, maxY),
        color: '#990099',
        alpha: 170,
        flashing: false,
        visible: true,
        locked: false,
        notes: 'Importado de GangZoneCreate',
      });
      count++;
    }
  }

  return result;
}
