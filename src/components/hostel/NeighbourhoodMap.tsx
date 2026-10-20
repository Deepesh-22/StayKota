import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { distanceKm, formatDistance, monthlyTotal } from '../../lib/discovery';
import { CITY_TARGET, validCoordinates, type MapTarget } from '../../lib/maps';
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
}
export function NeighbourhoodMap({ campus, items, activeHostelId, onActivate }: Props) {
  const [target, setTarget] = useState<MapTarget>(CITY_TARGET);
  const selected = items.find(({ hostel }) => hostel.id === activeHostelId);
  const select = (id: string) => {
    onActivate(id);
    const found = items.find((item) => item.hostel.id === id)?.hostel;
    if (found && validCoordinates(found.latitude, found.longitude))
      setTarget({ lat: found.latitude!, lng: found.longitude!, zoom: 15, id: found.id });
  };
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
      <div className="student-map-panel__viewport">
        <KotaMap
          campus={campus}
          items={items}
          selectedHostelId={activeHostelId}
          onSelect={select}
          target={target}
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
              {formatDistance(distanceKm(selected.hostel, campus))} · sample straight-line
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
