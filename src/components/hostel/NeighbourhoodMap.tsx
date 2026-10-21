import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, LocateFixed } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { hostelPreviewHref } from '../../lib/hostel-navigation';
import { validCoordinates, type MapTarget } from '../../lib/maps';
import { useHostelTransition } from '../../context/HostelTransitionContext';
import { MapLayerToggle } from '../maps/MapLayerToggle';
import type { MapBasemap } from '../../lib/satellite-map';
import { KotaMap } from '../maps/KotaMap';

export interface MappedHostel {
  hostel: Hostel;
  room: RoomType;
}

interface Props {
  campus: Campus;
  items: MappedHostel[];
  activeHostelId?: string | null;
  onCampusChange?: (id: string) => void;
  focusRevision?: number;
}

export function NeighbourhoodMap({ campus, items, activeHostelId, onCampusChange, focusRevision = 0 }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { startHostelTransition } = useHostelTransition();
  const [basemap, setBasemap] = useState<MapBasemap>('street');
  const selected = items.find(({ hostel }) => hostel.id === activeHostelId);
  const [campusView, setCampusView] = useState(false);
  const selectedId = selected?.hostel.id;
  const [centreRevision, setCentreRevision] = useState(0);

  useEffect(() => {
    setCampusView(false);
  }, [selectedId, focusRevision]);

  const found = !campusView ? selected?.hostel : undefined;
  const target: MapTarget =
    found && validCoordinates(found.latitude, found.longitude)
      ? { lat: found.latitude!, lng: found.longitude!, zoom: 15, id: `${found.id}-${focusRevision}` }
      : { lat: campus.latitude, lng: campus.longitude, zoom: 14, id: `${campus.id}-${centreRevision}` };

  return (
    <section className="student-map-panel" aria-label="Kota hostel and coaching map">
      <div className="student-map-panel__heading">
        <span>
          <MapPin size={14} />
          Nearby hostels &amp; coaching
        </span>
        <Link to="/map">
          Full-screen map <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="student-compact-layer">
        <MapLayerToggle basemap={basemap} onChange={setBasemap} />
        <button
          type="button"
          className="discovery-campus-centre"
          onClick={() => {
            setCampusView(true);
            setCentreRevision((n) => n + 1);
          }}
        >
          <LocateFixed size={15} />
          Centre on coaching
        </button>
      </div>
      <div className="student-map-panel__viewport">
        <KotaMap
          campus={campus}
          items={items}
          selectedHostelId={activeHostelId}
          onSelect={(id, origin) => {
            const matched = items.find((value) => value.hostel.id === id);
            if (matched) {
              const targetHref = hostelPreviewHref(
                id,
                campus.id,
                matched.room.id,
                location.pathname + location.search,
              );
              if (origin?.markerElement) {
                startHostelTransition({
                  hostelId: id,
                  hostelName: matched.hostel.name,
                  coverImage: matched.hostel.coverImage,
                  targetHref,
                  markerElement: origin.markerElement,
                  apertureElement: origin.apertureElement,
                });
                return;
              }
              navigate(targetHref);
            }
          }}
          activeCampusId={campus.id}
          onCampusSelect={onCampusChange}
          target={target}
          basemap={basemap}
        />
      </div>
    </section>
  );
}
