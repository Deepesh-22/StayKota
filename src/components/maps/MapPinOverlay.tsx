import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from '@vis.gl/react-google-maps';

/** HTML pins without a map ID, so inline POI styling works on the base map. */
export function MapPinOverlay({ lat, lng, zIndex = 1, children }: {
  lat: number; lng: number; zIndex?: number; children: ReactNode;
}) {
  const map = useMap();
  const [container] = useState(() => document.createElement('div'));
  const preventsHits = useRef(false);
  useEffect(() => { container.style.zIndex = String(zIndex); }, [container, zIndex]);
  useEffect(() => {
    if (!map) return;
    class Pin extends google.maps.OverlayView {
      onAdd() {
        container.style.position = 'absolute';
        container.style.transform = 'translate(-50%, -100%)';
        this.getPanes()?.overlayMouseTarget.appendChild(container);
        if (!preventsHits.current) {
          google.maps.OverlayView.preventMapHitsAndGesturesFrom(container);
          preventsHits.current = true;
        }
      }
      draw() {
        const point = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (point) { container.style.left = `${point.x}px`; container.style.top = `${point.y}px`; }
      }
      onRemove() { container.remove(); }
    }
    const pin = new Pin(); pin.setMap(map);
    return () => pin.setMap(null);
  }, [map, container, lat, lng]);
  return createPortal(children, container);
}
