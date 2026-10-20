import { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { GraduationCap, House } from 'lucide-react';
import { CAMPUSES } from '../../data/campuses';
import { monthlyTotal } from '../../lib/discovery';
import { groupMapPins, type PinGroup, type StudentMapPin } from '../../lib/map-clusters';
import { validCoordinates } from '../../lib/maps';
import type { GoogleCityMapProps } from './GoogleCityMap';
import { MapPinOverlay } from './MapPinOverlay';

export function StudentMapPins({ items, campus, activeCampusId, selectedHostelId, onSelect, onCampusSelect, perspective }: GoogleCityMapProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(12);
  useEffect(() => {
    if (!map) return;
    const update = () => setZoom(map.getZoom() ?? 12);
    update();
    const listener = map.addListener('zoom_changed', update);
    return () => listener.remove();
  }, [map]);
  const selectedCampusId = activeCampusId ?? (onCampusSelect ? undefined : campus.id);
  const pins: StudentMapPin[] = [
    ...CAMPUSES.map(c => ({ id: c.id, kind: 'campus' as const, latitude: c.latitude, longitude: c.longitude })),
    ...items.filter(({ hostel }) => validCoordinates(hostel.latitude, hostel.longitude))
      .map(({ hostel }) => ({ id: hostel.id, kind: 'hostel' as const, latitude: hostel.latitude!, longitude: hostel.longitude! })),
  ];
  const groups = groupMapPins(pins, zoom, [selectedHostelId, selectedCampusId].filter((id): id is string => !!id));
  const expand = (group: PinGroup) => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    group.pins.forEach(pin => bounds.extend({ lat: pin.latitude, lng: pin.longitude }));
    const heading = map.getHeading() ?? 0;
    if (perspective === '3d') google.maps.event.addListenerOnce(map, 'idle', () => map.moveCamera({ tilt: 45, heading }));
    map.fitBounds(bounds, 70);
  };
  return groups.map(group => {
    if (group.pins.length > 1) {
      const hostels = group.pins.filter(pin => pin.kind === 'hostel').length;
      const coachings = group.pins.length - hostels;
      const description = [hostels ? `${hostels} hostels` : '', coachings ? `${coachings} coaching campuses` : ''].filter(Boolean).join(' and ');
      return <MapPinOverlay key={`group:${group.id}`} lat={group.latitude} lng={group.longitude} zIndex={15}>
        <button type="button" className="google-pin-group" aria-label={`Zoom in to ${description}`} title={`Zoom in to ${description}`} onClick={() => expand(group)}>
          <strong>{group.pins.length}</strong><span>{!!hostels && <House size={14}/>} {!!coachings && <GraduationCap size={16}/>}</span>
          <small>{hostels ? `${hostels} stays` : `${coachings} coaching`}</small>
        </button>
      </MapPinOverlay>;
    }
    const pin = group.pins[0];
    if (pin.kind === 'campus') {
      const c = CAMPUSES.find(c => c.id === pin.id)!;
      return <MapPinOverlay key={`campus:${c.id}`} lat={c.latitude} lng={c.longitude} zIndex={c.id === selectedCampusId ? 25 : 10}>
        <button type="button" title={`${c.institute} ${c.name} — demo campus`} aria-label={`Select ${c.institute} ${c.name} — demo campus`} aria-pressed={c.id === selectedCampusId} onClick={() => onCampusSelect?.(c.id)} className={`google-campus-pin${c.id === selectedCampusId ? ' is-selected' : ''}`}>
          <GraduationCap size={20}/><span>{c.institute}<small>{c.name}</small></span>
        </button>
      </MapPinOverlay>;
    }
    const { hostel, room } = items.find(({ hostel }) => hostel.id === pin.id)!;
    return <MapPinOverlay key={`hostel:${hostel.id}`} lat={hostel.latitude!} lng={hostel.longitude!} zIndex={selectedHostelId === hostel.id ? 30 : 20}>
      <button type="button" title={`${hostel.name} — demo hostel`} aria-label={`Select ${hostel.name} on map`} aria-pressed={selectedHostelId === hostel.id} onClick={() => onSelect(hostel.id)} className={`google-hostel-pin${selectedHostelId === hostel.id ? ' is-selected' : ''}`}>
        <House size={15}/> ₹{monthlyTotal(room).toLocaleString('en-IN')}
      </button>
    </MapPinOverlay>;
  });
}
