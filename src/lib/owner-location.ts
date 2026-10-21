import { validCoordinates, withinKota } from './coordinates';
import { distanceKm } from './discovery';

const LOCALITY_ANCHORS: { name: string; latitude: number; longitude: number }[] = [
  { name: 'Talwandi', latitude: 25.146, longitude: 75.852 },
  { name: 'Landmark', latitude: 25.215, longitude: 75.86 },
  { name: 'Rajeev Gandhi Nagar', latitude: 25.154, longitude: 75.862 },
  { name: 'Indraprastha Industrial Area', latitude: 25.149, longitude: 75.857 },
  { name: 'Jawahar Nagar', latitude: 25.172, longitude: 75.85 },
  { name: 'Rangbari', latitude: 25.133, longitude: 75.845 },
  { name: 'Mahaveer Nagar', latitude: 25.138, longitude: 75.856 },
  { name: 'Dadabari', latitude: 25.166, longitude: 75.836 },
];

export interface OwnerCoordinateCheck {
  valid: boolean;
  empty: boolean;
  swapped?: boolean;
  latitude?: number;
  longitude?: number;
  outsideKota?: boolean;
  error?: string;
}

/**
 * Validates optional owner latitude/longitude inputs:
 * - Accepts empty pair (no coordinates stored)
 * - Catches incomplete pairs, non-numeric values, out-of-world ranges, and swapped lat/lng (e.g. 75.85, 25.14)
 * - Accepts any valid real-world coordinate pair so "Use my current location" works anywhere
 */
export function validateOwnerCoordinates(latInput: string, lngInput: string): OwnerCoordinateCheck {
  const latRaw = latInput.trim();
  const lngRaw = lngInput.trim();
  if (!latRaw && !lngRaw) {
    return { valid: true, empty: true };
  }
  if (!latRaw || !lngRaw) {
    return {
      valid: false,
      empty: false,
      error: 'Enter both latitude and longitude (within Kota: latitude is around 25.xx, longitude around 75.xx), or clear both fields.',
    };
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!validCoordinates(lat, lng)) {
    return {
      valid: false,
      empty: false,
      error: 'Enter valid coordinates between -90..90 latitude and -180..180 longitude (within Kota: about 25.18, 75.85).',
    };
  }
  if (lat >= 68 && lat <= 98 && lng >= 8 && lng <= 38) {
    return {
      valid: false,
      empty: false,
      swapped: true,
      error: 'Latitude and longitude look swapped — within Kota, latitude comes first (about 25) and longitude second (about 75).',
    };
  }
  return {
    valid: true,
    empty: false,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    outsideKota: !withinKota(lat, lng),
  };
}

/** Returns the closest known Kota locality when the coordinate falls inside Kota; null otherwise. */
export function inferNearestKotaLocality(latitude: number, longitude: number): string | null {
  if (!withinKota(latitude, longitude)) return null;
  let best: { name: string; distance: number } | null = null;
  for (const anchor of LOCALITY_ANCHORS) {
    const d = distanceKm({ latitude, longitude }, anchor);
    if (d !== null && (!best || d < best.distance)) {
      best = { name: anchor.name, distance: d };
    }
  }
  return best ? best.name : null;
}

export interface FetchedOwnerLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  nearestLocality: string | null;
  outsideKota: boolean;
}

function requestPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Fetches the hostel owner's current browser location automatically.
 * Tries high-accuracy GPS first and falls back to network/Wi-Fi positioning if GPS times out indoors.
 */
export async function fetchCurrentOwnerPosition(): Promise<FetchedOwnerLocation> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported in this browser. Please enter coordinates manually.');
  }
  if (!window.isSecureContext) {
    throw new Error('Browser location requires HTTPS or localhost.');
  }

  let position: GeolocationPosition;
  try {
    position = await requestPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  } catch (firstError) {
    const geoErr = firstError as GeolocationPositionError | undefined;
    if (geoErr && geoErr.code === 1) {
      throw new Error('Location permission was denied. Please allow location access in your browser address bar and try again.');
    }
    try {
      position = await requestPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    } catch (secondError) {
      const retryErr = secondError as GeolocationPositionError | undefined;
      if (retryErr?.code === 1) {
        throw new Error('Location permission was denied. Please allow location access in your browser settings.');
      }
      if (retryErr?.code === 3) {
        throw new Error('Location request timed out. Move near a window or turn on device location services and retry.');
      }
      throw new Error('Unable to detect your current location automatically. Check device location settings or enter manually.');
    }
  }

  const { latitude, longitude, accuracy } = position.coords;
  if (!validCoordinates(latitude, longitude)) {
    throw new Error('Received invalid coordinates from device sensor. Please try again.');
  }

  const roundedLat = Number(latitude.toFixed(6));
  const roundedLng = Number(longitude.toFixed(6));
  return {
    latitude: roundedLat,
    longitude: roundedLng,
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : 0,
    nearestLocality: inferNearestKotaLocality(roundedLat, roundedLng),
    outsideKota: !withinKota(roundedLat, roundedLng),
  };
}
