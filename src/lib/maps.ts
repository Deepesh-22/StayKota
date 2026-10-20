import type { Campus } from '../data/campuses';
import { distanceKm } from './discovery';

export type MapPerspective = '2d' | '3d';
export function validCoordinates(latitude?: number, longitude?: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude!) <= 90 && Math.abs(longitude!) <= 180;
}
/** Real coordinate distances control inclusion; the illustrated scene is not a street map. */
export function campusDistance(location: { latitude?: number; longitude?: number }, campus: Campus): number | null {
  return validCoordinates(location.latitude, location.longitude) ? distanceKm(location, campus) : null;
}
export function withinCampusRadius(location: { latitude?: number; longitude?: number }, campus: Campus, radiusKm: number) {
  const distance = campusDistance(location, campus);
  return Number.isFinite(radiusKm) && radiusKm > 0 && distance !== null && distance <= radiusKm;
}

/** Spread labels while keeping their approximate direction from the campus. */
export function neighbourhoodPositions(locations: { id: string; latitude?: number; longitude?: number }[], campus: Campus) {
  const located = locations.filter(location => validCoordinates(location.latitude, location.longitude));
  const extent = Math.max(0.35, ...located.map(location => campusDistance(location, campus)!));
  const placed: { id: string; x: number; y: number }[] = [];
  for (const location of located) {
    const east = (location.longitude! - campus.longitude) * 111.32 * Math.cos(campus.latitude * Math.PI / 180);
    const north = (location.latitude! - campus.latitude) * 111.32;
    let x = 450 + east / extent * 290;
    let y = 320 - north / extent * 195;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (Math.hypot((x - 450) / 1.6, y - 320) > 100
        && placed.every(point => Math.abs(point.x - x) > 125 || Math.abs(point.y - y) > 95)) break;
      const angle = attempt * 2.4 + located.indexOf(location);
      x = Math.max(125, Math.min(775, 450 + east / extent * 240 + Math.cos(angle) * (75 + attempt * 3)));
      y = Math.max(135, Math.min(515, 320 - north / extent * 170 + Math.sin(angle) * (75 + attempt * 3)));
    }
    placed.push({ id: location.id, x, y });
  }
  return placed;
}
