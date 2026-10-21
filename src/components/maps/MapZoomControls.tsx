import { useEffect, useId, useState } from 'react';
import { Maximize, MousePointer2 } from 'lucide-react';
import { useCityMap } from './MapContext';
import { minimumKotaZoom } from '../../lib/map-area';
import { CITY_TARGET } from '../../lib/maps';

export function MapZoomControls() {
  const map = useCityMap();
  const id = useId();
  const [zoom, setZoom] = useState(12);
  const [minimum, setMinimum] = useState(10);
  useEffect(() => {
    if (!map) return;
    const update = () => { setZoom(map.getZoom()); setMinimum(Math.max(map.getMinZoom(), minimumKotaZoom(map.getContainer().clientWidth, map.getContainer().clientHeight))); };
    update(); map.on('zoom', update); map.on('resize', update);
    return () => { map.off('zoom', update); map.off('resize', update); };
  }, [map]);
  const ease = (value: number) => map?.easeTo({ zoom: value, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180 });
  return <aside className="student-zoom-panel" aria-label="Easy map zoom controls">
    <div><label htmlFor={id}>Zoom</label><output htmlFor={id}>{zoom.toFixed(1)}</output></div>
    <input id={id} type="range" min={Math.min(minimum, zoom)} max="19" step="any" value={zoom} onChange={event => ease(Number(event.target.value))} aria-label="Map zoom level" aria-valuetext={`Zoom level ${zoom.toFixed(1)}`}/>
    <button type="button" onClick={() => map?.easeTo({ center: [CITY_TARGET.lng, CITY_TARGET.lat], zoom: CITY_TARGET.zoom, bearing: 0, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 })}><Maximize size={14}/>Reset Kota view</button>
    <span><MousePointer2 size={11}/>Scroll or pinch · drag to move</span>
  </aside>;
}
