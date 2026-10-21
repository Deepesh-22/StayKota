import { CAMPUSES, type Campus } from '../data/campuses';
import { distanceKm } from './discovery';
/** Kota starting view; shared renderer constrains navigation to the configured city envelope plus a 3 km buffer. */
export const KOTA_VIEW = { lat: 25.183, lng: 75.839, zoom: 12 };
export type MapPerspective = '2d' | '3d';
export interface MapTarget {
  bounds?: [[number, number], [number, number]];
  lat: number;
  lng: number;
  zoom: number;
  id: string;
}
export const CITY_TARGET: MapTarget = { ...KOTA_VIEW, id: 'kota' };

export { validCoordinates } from './coordinates';
import { validCoordinates } from './coordinates';
/** Only known coordinates participate in proximity filters; distances are straight-line. */
export function campusDistance(location: { latitude?: number; longitude?: number }, campus: Pick<Campus, 'latitude' | 'longitude'>): number | null {
  return validCoordinates(location.latitude, location.longitude) ? distanceKm(location, campus) : null;
}
export function nearestCampus(location: { latitude?: number; longitude?: number }) {
  return CAMPUSES.map(campus => ({ campus, distance: campusDistance(location, campus) }))
    .filter((entry): entry is { campus: Campus; distance: number } => entry.distance !== null)
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}
export function withinCampusRadius(location: { latitude?: number; longitude?: number }, campus: Pick<Campus, 'latitude' | 'longitude'>, radiusKm: number) {
  const distance = campusDistance(location, campus);
  return distance !== null && distance <= radiusKm;
}
