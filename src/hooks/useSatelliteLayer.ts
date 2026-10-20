import { useEffect, useRef, useState } from 'react';
import type { Map as LibreMap } from 'maplibre-gl';
import { SATELLITE_METADATA_URL, SATELLITE_SOURCE_ID, satelliteSource, type MapBasemap } from '../lib/satellite-map';

/** Change imagery without replacing the map, its camera, vector overlays or HTML pins. */
export function useSatelliteLayer(map: LibreMap | null, ready: boolean, basemap: MapBasemap) {
  const [state, setState] = useState<'off' | 'loading' | 'ready' | 'error'>('off');
  const [revision, setRevision] = useState(0);
  const original = useRef<{ map: LibreMap; layers: { id: string; visibility: 'visible' | 'none' }[] } | null>(null);
  useEffect(() => {
    if (!map || !ready) return;
    if (original.current?.map !== map) original.current = {
      map, layers: map.getStyle().layers.filter(layer => !layer.id.startsWith('staykota-'))
        .map(layer => ({ id: layer.id, visibility: layer.layout?.visibility === 'none' ? 'none' : 'visible' })),
    };
    const showStreets = (visible: boolean) => {
      if (!map.getStyle()) return;
      for (const layer of original.current!.layers)
        if (map.getLayer(layer.id)) map.setLayoutProperty(layer.id, 'visibility', visible ? layer.visibility : 'none');
    };
    if (basemap === 'street') { showStreets(true); setState('off'); return; }
    let cancelled = false, failed = false, settled = false;
    const controller = new AbortController();
    setState('loading'); showStreets(true);
    const fail = () => {
      if (cancelled || failed) return;
      failed = true; controller.abort(); setState('error'); showStreets(true);
      if (map.getLayer(SATELLITE_SOURCE_ID)) map.setLayoutProperty(SATELLITE_SOURCE_ID, 'visibility', 'none');
    };
    const timer = setTimeout(fail, 15000);
    const loaded = () => {
      if (!cancelled && !failed && !settled && map.getSource(SATELLITE_SOURCE_ID) && map.isSourceLoaded(SATELLITE_SOURCE_ID)) {
        settled = true; clearTimeout(timer); showStreets(false); setState('ready');
      }
    };
    const error = (event: object) => { if ('sourceId' in event && event.sourceId === SATELLITE_SOURCE_ID) { clearTimeout(timer); fail(); } };
    map.on('idle', loaded); map.on('error', error);
    const addImagery = async () => {
      let copyright = '';
      try {
        const response = await fetch(SATELLITE_METADATA_URL, { signal: controller.signal });
        if (response.ok) {
          const metadata = await response.json();
          if (typeof metadata.copyrightText === 'string') copyright = metadata.copyrightText;
        }
      } catch { /* The source still includes a direct link to Esri's published service credits. */ }
      if (cancelled || failed) return;
      try {
        map.addSource(SATELLITE_SOURCE_ID, satelliteSource(copyright));
        map.addLayer({ id: SATELLITE_SOURCE_ID, source: SATELLITE_SOURCE_ID, type: 'raster', paint: { 'raster-fade-duration': 200 } }, map.getStyle().layers[0]?.id);
      } catch { fail(); }
    };
    void addImagery();
    return () => {
      cancelled = true; controller.abort(); clearTimeout(timer);
      map.off('idle', loaded); map.off('error', error);
      if (map.getStyle()) {
        if (map.getLayer(SATELLITE_SOURCE_ID)) map.removeLayer(SATELLITE_SOURCE_ID);
        if (map.getSource(SATELLITE_SOURCE_ID)) map.removeSource(SATELLITE_SOURCE_ID);
        showStreets(true);
      }
    };
  }, [map, ready, basemap, revision]);
  return { state, retry: () => setRevision(n => n + 1) };
}
