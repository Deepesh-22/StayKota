import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { LiveLocation } from '../../hooks/useLiveLocation';
import type { Campus } from '../../data/campuses';
import type { Hostel, RoomType } from '../../types';
import type { MapBasemap } from '../../lib/satellite-map';
import type { MapTarget, MapPerspective } from '../../lib/maps';
import '../../styles/student-map.css';
const OpenMapRenderer = lazy(() => import('./OpenMapRenderer'));
export interface MapHostel { hostel: Hostel; room: RoomType }
export interface KotaMapProps {
  campus: Campus; items: MapHostel[]; selectedHostelId?: string | null;
  onSelect: (id: string) => void; onCampusSelect?: (id: string) => void;
  target?: MapTarget; radiusKm?: number; activeCampusId?: string;
  basemap?: MapBasemap;
  perspective?: MapPerspective; userLocation?: LiveLocation | null;
  on3DAvailabilityChange?: (available: boolean) => void;
}
export function KotaMap(props: KotaMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '100px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="student-map-mount">
    {visible ? <Suspense fallback={<div className="student-city-map__loading" role="status">Loading Kota map…</div>}><OpenMapRenderer {...props}/></Suspense>
      : <div className="student-city-map__loading">Explore Kota</div>}
  </div>;
}
