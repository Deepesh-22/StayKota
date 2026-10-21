import { validCoordinates } from './coordinates';
export interface LocationEvidence {
  latitude?: number;
  longitude?: number;
  location?: { status: 'demo' | 'owner-provided' | 'verified'; source?: string; checkedAt?: string };
}
export function locationLabel(place: LocationEvidence): string {
  if (!validCoordinates(place.latitude, place.longitude)) return 'Location not provided';
  if (place.location?.status === 'demo') return 'Demo location';
  // A status alone is insufficient evidence of verification.
  if (place.location?.status === 'verified' && place.location.source?.trim() && place.location.checkedAt
    && /^\d{4}-\d{2}-\d{2}$/.test(place.location.checkedAt)) return 'Location checked';
  return 'Location unverified';
}
