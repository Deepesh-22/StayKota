import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, LocateFixed } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { distanceKm, formatDistance, monthlyTotal } from '../../lib/discovery';
import { validCoordinates, type MapTarget } from '../../lib/maps';
import { MapLayerToggle } from '../maps/MapLayerToggle';
import type { MapBasemap } from '../../lib/satellite-map';
import { locationLabel } from '../../lib/location-status';
import { KotaMap } from '../maps/KotaMap';
export interface MappedHostel {
  hostel: Hostel;
  room: RoomType;
}
interface Props {
  campus: Campus;
  items: MappedHostel[];
  activeHostelId?: string | null;
  onActivate: (id: string) => void;
  onCampusChange?: (id: string) => void;
  focusRevision?: number;
}
export function NeighbourhoodMap({ campus, items, activeHostelId, onActivate, onCampusChange, focusRevision = 0 }: Props) {
  const [basemap, setBasemap] = useState<MapBasemap>('street');
  const selected = items.find(({ hostel }) => hostel.id === activeHostelId);
  const [campusView, setCampusView] = useState(false);
  const selectedId = selected?.hostel.id;
  const [centreRevision, setCentreRevision] = useState(0);
  useEffect(() => { setCampusView(false); }, [selectedId, focusRevision]);
  const found = !campusView ? selected?.hostel : undefined;
  const target: MapTarget = found && validCoordinates(found.latitude, found.longitude)
    ? { lat: found.latitude!, lng: found.longitude!, zoom: 15, id: found.id }
    : { lat: campus.latitude, lng: campus.longitude, zoom: 14, id: `${campus.id}-${centreRevision}` };
  return (
    <section className="student-map-panel" aria-label="Kota hostel and coaching map">
      <div className="student-map-panel__heading">
        <span>
          <MapPin size={13} />
          Your Kota neighbourhood
        </span>
        <Link to="/map">
          Explore the whole city <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="student-compact-layer"><MapLayerToggle basemap={basemap} onChange={setBasemap}/><button type="button" className="discovery-campus-centre" onClick={() => { setCampusView(true); setCentreRevision(n => n + 1); }}><LocateFixed size={15}/>Centre on campus</button></div>
      <div className="student-map-panel__viewport">
        <KotaMap
          campus={campus}
          items={items}
          selectedHostelId={activeHostelId}
          onSelect={id => { setCampusView(false); onActivate(id); }}
          activeCampusId={campus.id}
          onCampusSelect={onCampusChange}
          target={target}
          basemap={basemap}
        />
      </div>
      {selected && (
        <Link
          className="student-map-panel__summary"
          to={`/hostel/${selected.hostel.id}?campus=${campus.id}&room=${selected.room.id}`}
        >
          <img src={selected.hostel.coverImage} alt="" />
          <span>
            <strong>{selected.hostel.name}</strong>
            <small>
              {formatDistance(distanceKm(selected.hostel, campus))} · straight-line · {locationLabel(selected.hostel)}
            </small>
          </span>
          <b>₹{monthlyTotal(selected.room).toLocaleString('en-IN')}</b>
          <ArrowUpRight size={15} />
        </Link>
      )}
      <p className="student-map-panel__note">
        <strong>OpenStreetMap · OpenFreeMap.</strong> StayKota hostel and campus locations are sample
        data. Distances are straight-line estimates, not walking routes.
      </p>
    </section>
  );
}
