import { validCoordinates } from './maps';

export interface StudentMapPin {
  id: string;
  kind: 'hostel' | 'campus';
  latitude: number;
  longitude: number;
}

export interface PinGroup {
  id: string;
  latitude: number;
  longitude: number;
  pins: StudentMapPin[];
}

/** Individual pins only — every hostel and coaching campus renders as its own separate pin at all zoom levels. */
export function groupMapPins(pins: StudentMapPin[], _zoom: number, _selectedIds: string[] = []): PinGroup[] {
  return [...pins]
    .filter(p => validCoordinates(p.latitude, p.longitude))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(pin => ({ id: pin.id, latitude: pin.latitude, longitude: pin.longitude, pins: [pin] }));
}
