import { validCoordinates } from './coordinates';
import type { LocationEvidence } from './location-status';
/** Demo pins cannot be used as real routing endpoints. */
export function canRouteBetween(hostel: LocationEvidence, campus: LocationEvidence): boolean {
  return validCoordinates(hostel.latitude, hostel.longitude) && validCoordinates(campus.latitude, campus.longitude)
    && hostel.location?.status !== 'demo' && campus.location?.status !== 'demo';
}
export function directionsLink(hostel: LocationEvidence, campus: LocationEvidence, mode: 'walking' | 'driving'): string | null {
  if (!canRouteBetween(hostel, campus)) return null;
  const params = new URLSearchParams({ api: '1', origin: `${campus.latitude},${campus.longitude}`, destination: `${hostel.latitude},${hostel.longitude}`, travelmode: mode });
  return `https://www.google.com/maps/dir/?${params}`;
}
