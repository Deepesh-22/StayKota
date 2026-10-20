import type { RasterSourceSpecification } from 'maplibre-gl';
export type MapBasemap = 'street' | 'satellite';
export const SATELLITE_SOURCE_ID = 'staykota-satellite';
export const SATELLITE_SERVICE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';
export const SATELLITE_METADATA_URL = `${SATELLITE_SERVICE_URL}?f=json`;
export const SATELLITE_TILE_URL = `${SATELLITE_SERVICE_URL}/tile/{z}/{y}/{x}`;
export function satelliteSource(copyright = ''): RasterSourceSpecification {
  const escaped = copyright.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  return {
    type: 'raster', tiles: [SATELLITE_TILE_URL], tileSize: 256, minzoom: 0, maxzoom: 19,
    attribution: `<a href="${SATELLITE_SERVICE_URL}" target="_blank" rel="noopener">Imagery © Esri and contributors</a>${escaped ? ` · ${escaped}` : ''}`,
  };
}
