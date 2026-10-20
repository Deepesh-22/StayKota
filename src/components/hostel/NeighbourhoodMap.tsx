import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { distanceKm, formatDistance, monthlyTotal } from '../../lib/discovery';
import { CITY_TARGET, validCoordinates, type MapTarget } from '../../lib/maps';
import { GoogleCityMap } from '../maps/GoogleCityMap';
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
    <section className="google-map-panel" aria-label="Google map of Kota">
      <div className="google-map-panel__heading">
        <span>
          <MapPin size={13} />
          Kota on Google Maps
        </span>
        <Link to="/map">
          Explore the whole city <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="google-map-panel__viewport">
        <GoogleCityMap
          campus={campus}
          items={items}
          selectedHostelId={activeHostelId}
          onSelect={select}
          target={target}
        />
      </div>
      {selected && (
        <Link
          className="google-map-panel__summary"
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
      <p className="google-map-panel__note">
        <strong>Google’s real city map.</strong> StayKota hostel and campus locations are sample
        data. Distances are straight-line estimates, not walking routes.
      </p>
    </section>
  );
}
