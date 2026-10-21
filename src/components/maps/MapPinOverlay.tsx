import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Marker } from 'maplibre-gl';
import { useCityMap } from './MapContext';
export function MapPinOverlay({ lat, lng, zIndex = 1, children }: { lat: number; lng: number; zIndex?: number; children: ReactNode }) {
  const map = useCityMap();
  const [container] = useState(() => document.createElement('div'));
  useEffect(() => { container.style.zIndex = String(zIndex); }, [container, zIndex]);
  useEffect(() => {
    if (!map) return;
    const marker = new Marker({ element: container, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
    return () => { marker.remove(); };
  }, [map, container, lat, lng]);
  return createPortal(children, container);
}
