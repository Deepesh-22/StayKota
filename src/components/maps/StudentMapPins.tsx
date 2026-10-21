import { useEffect, useState } from 'react';
import { useCityMap } from './MapContext';
import { GraduationCap, House } from 'lucide-react';
import { CAMPUSES } from '../../data/campuses';
import { locationLabel } from '../../lib/location-status';
import { monthlyTotal } from '../../lib/discovery';
import { groupMapPins, type PinGroup, type StudentMapPin } from '../../lib/map-clusters';
import { saveMapCameraSnapshot } from '../../lib/marker-transition';
import { useHostelTransition } from '../../context/HostelTransitionContext';
import type { KotaMapProps } from './KotaMap';
import { inKotaMapArea } from '../../lib/map-area';
import { HoverMapPin } from './HoverMapPin';
import { MapPinOverlay } from './MapPinOverlay';

export function StudentMapPins({
  items,
  campus,
  campusPins = CAMPUSES,
  activeCampusId,
  selectedHostelId,
  onSelect,
  onCampusSelect,
  perspective,
}: KotaMapProps) {
  const map = useCityMap();
  const { returnedHostelId } = useHostelTransition();
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    if (!map) return;
    const update = () => setZoom(map.getZoom() ?? 12);
    update();
    map.on('zoom', update);
    return () => {
      map.off('zoom', update);
    };
  }, [map]);

  const selectedCampusId = activeCampusId ?? (onCampusSelect ? undefined : campus.id);
  const pins: StudentMapPin[] = [
    ...campusPins
      .filter((c) => inKotaMapArea(c))
      .map((c) => ({ id: c.id, kind: 'campus' as const, latitude: c.latitude, longitude: c.longitude })),
    ...items
      .filter(({ hostel }) => inKotaMapArea(hostel))
      .map(({ hostel }) => ({
        id: hostel.id,
        kind: 'hostel' as const,
        latitude: hostel.latitude!,
        longitude: hostel.longitude!,
      })),
  ];

  const groups = groupMapPins(pins, zoom, [selectedHostelId, selectedCampusId].filter((id): id is string => !!id));

  const expand = (group: PinGroup) => {
    if (!map) return;
    const lngs = group.pins.map((pin) => pin.longitude);
    const lats = group.pins.map((pin) => pin.latitude);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: 70,
        maxZoom: 18,
        pitch: perspective === '3d' ? 50 : 0,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
      },
    );
  };

  return groups.map((group) => {
    if (group.pins.length > 1) {
      const hostels = group.pins.filter((pin) => pin.kind === 'hostel').length;
      const coachings = group.pins.length - hostels;
      const description = [hostels ? `${hostels} hostels` : '', coachings ? `${coachings} coaching campuses` : '']
        .filter(Boolean)
        .join(' and ');
      return (
        <MapPinOverlay key={`group:${group.id}`} lat={group.latitude} lng={group.longitude} zIndex={15}>
          <button
            type="button"
            className="student-pin-group"
            aria-label={`Zoom in to ${description}`}
            title={`Zoom in to ${description}`}
            onClick={() => expand(group)}
          >
            <strong>{group.pins.length}</strong>
            <span>
              {!!hostels && <House size={14} />} {!!coachings && <GraduationCap size={16} />}
            </span>
            <small>{hostels ? `${hostels} stays` : `${coachings} coaching`}</small>
          </button>
        </MapPinOverlay>
      );
    }

    const pin = group.pins[0];
    if (pin.kind === 'campus') {
      const c = campusPins.find((item) => item.id === pin.id)!;
      return (
        <MapPinOverlay key={`campus:${c.id}`} lat={c.latitude} lng={c.longitude} zIndex={c.id === selectedCampusId ? 25 : 10}>
          <HoverMapPin id={c.id} name={`${c.institute} ${c.name}`} subtitle={c.area} kind="campus">
            <button
              type="button"
              aria-label={`Select ${c.institute} ${c.name} — ${locationLabel(c)}`}
              aria-pressed={c.id === selectedCampusId}
              onClick={() => onCampusSelect?.(c.id)}
              className={`student-campus-pin${c.id === selectedCampusId ? ' is-selected' : ''}`}
            >
              <GraduationCap size={20} />
              <span>
                {c.institute}
                <small>{c.name}</small>
              </span>
            </button>
          </HoverMapPin>
        </MapPinOverlay>
      );
    }

    const { hostel, room } = items.find((entry) => entry.hostel.id === pin.id)!;
    const isReturned = returnedHostelId === hostel.id;

    return (
      <MapPinOverlay
        key={`hostel:${hostel.id}`}
        lat={hostel.latitude!}
        lng={hostel.longitude!}
        zIndex={selectedHostelId === hostel.id ? 30 : 20}
      >
        <HoverMapPin
          id={hostel.id}
          name={hostel.name}
          subtitle={hostel.locality}
          image={hostel.coverImage}
          kind="hostel"
          onActivate={(origin) => {
            if (map && typeof window !== 'undefined') {
              const centre = map.getCenter();
              saveMapCameraSnapshot({
                lat: centre.lat,
                lng: centre.lng,
                zoom: map.getZoom(),
                pitch: map.getPitch(),
                bearing: map.getBearing(),
                hostelId: hostel.id,
                pathname: window.location.pathname,
                search: window.location.search,
              });
              if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                map.easeTo({
                  center: [hostel.longitude!, hostel.latitude!],
                  zoom: Math.max(map.getZoom(), 15.2),
                  duration: 300,
                });
              }
            }
            onSelect(hostel.id, origin);
          }}
        >
          <button
            type="button"
            aria-label={`Select ${hostel.name} on map`}
            aria-description={`${hostel.locality}, Kota · ₹${monthlyTotal(room).toLocaleString('en-IN')} per month`}
            aria-pressed={selectedHostelId === hostel.id}
            onClick={(event) =>
              onSelect(hostel.id, { markerElement: event.currentTarget, apertureElement: null })
            }
            className={`student-hostel-pin${selectedHostelId === hostel.id ? ' is-selected' : ''}${
              isReturned ? ' is-returned-origin' : ''
            }`}
          >
            <House size={15} /> ₹{monthlyTotal(room).toLocaleString('en-IN')}
          </button>
        </HoverMapPin>
      </MapPinOverlay>
    );
  });
}
