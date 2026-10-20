import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
export const OPEN_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const orientationLabels = new Set(['place', 'transportation_name', 'water_name', 'waterway']);
/** Keep road/city orientation, but omit all base-map businesses, institutions and transit POIs. */
export function studentMapStyle(style: StyleSpecification): StyleSpecification {
  const layers = style.layers.map(layer => layer.type === 'symbol' && !orientationLabels.has('source-layer' in layer ? layer['source-layer'] || '' : '')
    ? { ...layer, layout: { ...layer.layout, visibility: 'none' as const } } : layer);
  const buildings = layers.find(layer => 'source-layer' in layer && layer['source-layer'] === 'building');
  if (buildings && 'source' in buildings && buildings.source) {
    const extrusion: LayerSpecification = {
      id: 'staykota-buildings-3d', type: 'fill-extrusion', source: buildings.source,
      'source-layer': 'building', minzoom: 14, layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': '#d1c9b0', 'fill-extrusion-opacity': .78,
        'fill-extrusion-height': ['to-number', ['get', 'render_height'], ['get', 'height'], 8],
        'fill-extrusion-base': ['to-number', ['get', 'render_min_height'], ['get', 'min_height'], 0],
      },
    };
    const firstLabel = layers.findIndex(layer => layer.type === 'symbol');
    layers.splice(firstLabel < 0 ? layers.length : firstLabel, 0, extrusion);
  }
  return { ...style, layers };
}
/** Spherical straight-line radius, never a road/walking route. */
export function radiusPolygon(latitude: number, longitude: number, radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const angular = radiusKm / 6371, rad = Math.PI / 180;
  const lat = latitude * rad, lng = longitude * rad;
  const coordinates = Array.from({ length: 65 }, (_, i) => {
    const bearing = i / 64 * Math.PI * 2;
    const phi = Math.asin(Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing));
    const lambda = lng + Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat), Math.cos(angular) - Math.sin(lat) * Math.sin(phi));
    return [lambda / rad, phi / rad];
  });
  coordinates[64] = [...coordinates[0]];
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coordinates] } };
}
