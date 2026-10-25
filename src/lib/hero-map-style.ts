import type { StyleSpecification, LayerSpecification } from 'maplibre-gl';

/** Real vector geometry; no business labels, invented polygons or demo property pins. */
export function heroMapStyle(style: StyleSpecification, mode: 'colour' | 'ink' = 'colour'): StyleSpecification {
  const layers: LayerSpecification[] = [];
  for (const layer of style.layers) {
    const sourceLayer = 'source-layer' in layer ? layer['source-layer'] ?? '' : '';
    if (layer.type === 'background') layers.push({ ...layer, paint: { 'background-color': '#f5f2e9' } });
    if (layer.type === 'fill') {
      const water = /water/.test(sourceLayer) || /water/.test(layer.id);
      const green = /park|landcover/.test(sourceLayer) || /park|forest|grass|garden/.test(layer.id);
      const building = /building/.test(sourceLayer);
      layers.push({ ...layer, paint: { 'fill-color': mode === 'ink' ? (water ? '#eeede3' : '#f5f2e9') : water ? '#80b6bc' : green ? '#bfcfa5' : building ? '#d7b499' : '#e8e5d6', 'fill-opacity': .9, 'fill-outline-color': mode === 'ink' ? (water ? '#50584c' : '#a4a897') : water ? '#568e98' : building ? '#b38f75' : '#d1d3c0' } });
    }
    if (layer.type === 'line' && !/boundary/.test(sourceLayer)) {
      const water = /water/.test(sourceLayer) || /water/.test(layer.id);
      const paint = { ...layer.paint };
      delete paint['line-pattern'];
      layers.push({ ...layer, paint: { ...paint, 'line-color': mode === 'ink' ? '#626758' : water ? '#619ca5' : '#bd9a79', 'line-opacity': .85 } });
    }
  }
  const used = new Set(layers.flatMap(layer => 'source' in layer && typeof layer.source === 'string' ? [layer.source] : []));
  return { version: 8, sources: Object.fromEntries(Object.entries(style.sources).filter(([key]) => used.has(key))), layers };
}
