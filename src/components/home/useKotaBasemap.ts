import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { heroMapStyle } from '../../lib/hero-map-style';
import { KOTA_GEOGRAPHY } from '../../lib/hero-geography';
import { OPEN_MAP_STYLE_URL } from '../../lib/open-map-style';
import type { Map as MapInstance, StyleSpecification } from 'maplibre-gl';

/** Render one real north-up basemap, freeze it, then release its WebGL context.
 * Both treatments are captured from the same camera and cached tiles; only paint changes.
 */
export function useKotaBasemap(figure: RefObject<HTMLElement | null>, renderer: RefObject<HTMLDivElement | null>) {
  const [image, setImage] = useState<{ ink: string; colour: string } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [visible, setVisible] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!figure.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '150px' });
    observer.observe(figure.current);
    return () => observer.disconnect();
  }, [figure]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false, map: MapInstance | undefined, capturing = false;
    let phase: 'colour' | 'ink' = 'colour';
    const urls: string[] = [];
    const controller = new AbortController();
    const stop = () => { map?.remove(); map = undefined; };
    const fail = () => {
      if (cancelled) return;
      cancelled = true; clearTimeout(timer); controller.abort(); stop(); setStatus('error');
    };
    setStatus('loading');
    const timer = setTimeout(fail, 15000);
    const start = async () => {
      try {
        const response = await fetch(OPEN_MAP_STYLE_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Map style unavailable');
        const original = await response.json() as StyleSpecification;
        const style = heroMapStyle(original);
        const ink = heroMapStyle(original, 'ink');
        const [{ Map, setWorkerUrl }, worker] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl-worker.mjs?url')]);
        if (cancelled || !renderer.current) return;
        setWorkerUrl(worker.default);
        const [west, south, east, north] = KOTA_GEOGRAPHY.bbox;
        map = new Map({ container: renderer.current, style, interactive: false, attributionControl: false, renderWorldCopies: false,
          bounds: [[west, south], [east, north]], fitBoundsOptions: { padding: { left: 23, right: 23, top: 16, bottom: 16 } },
          canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true }, pixelRatio: 1.5,
        });
        map.on('error', fail);
        map.on('idle', () => {
          if (cancelled || capturing || !map?.areTilesLoaded()) return;
          capturing = true;
          map.getCanvas().toBlob(blob => {
            if (cancelled) return;
            if (!blob) { fail(); return; }
            const next = URL.createObjectURL(blob);
            urls.push(next);
            if (phase === 'colour') {
              phase = 'ink'; capturing = false;
              for (const layer of ink.layers) {
                if (layer.type === 'fill') {
                  map?.setPaintProperty(layer.id, 'fill-color', layer.paint?.['fill-color']);
                  map?.setPaintProperty(layer.id, 'fill-outline-color', layer.paint?.['fill-outline-color']);
                } else if (layer.type === 'line') {
                  map?.setPaintProperty(layer.id, 'line-color', layer.paint?.['line-color']);
                }
              }
              map?.triggerRepaint();
            } else {
              cancelled = true; clearTimeout(timer); setImage({ colour: urls[0], ink: next }); setStatus('ready'); stop();
            }
          }, 'image/png');
        });
      } catch { fail(); }
    };
    void start();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); stop(); urls.forEach(value => URL.revokeObjectURL(value)); };
  }, [renderer, revision, visible]);
  return { image, status, retry: () => setRevision(value => value + 1) };
}
