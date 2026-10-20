import { distanceKm } from './discovery';
import { validCoordinates } from './coordinates';

export type AreaBounds = [[number, number], [number, number]];
/** Configured Kota urban navigation envelope, not a surveyed municipal boundary. */
export const KOTA_CITY_BOUNDS: AreaBounds = [[75.75, 25.08], [75.94, 25.26]];
export const KOTA_BUFFER_KM = 3;
export function bufferedBounds(bounds: AreaBounds, km: number): AreaBounds {
  const latitude = (bounds[0][1] + bounds[1][1]) / 2;
  const latPadding = km / 111.195;
  const lngPadding = km / (111.195 * Math.cos(Math.max(Math.abs(bounds[0][1]), Math.abs(bounds[1][1]), Math.abs(latitude)) * Math.PI / 180));
  return [[bounds[0][0] - lngPadding, bounds[0][1] - latPadding], [bounds[1][0] + lngPadding, bounds[1][1] + latPadding]];
}
export const KOTA_MAP_BOUNDS = bufferedBounds(KOTA_CITY_BOUNDS, KOTA_BUFFER_KM);
function destination(longitude: number, latitude: number, bearing: number): number[] {
  const rad = Math.PI / 180, angular = KOTA_BUFFER_KM / 6371;
  const phi = latitude * rad, theta = bearing * rad;
  const lat = Math.asin(Math.sin(phi) * Math.cos(angular) + Math.cos(phi) * Math.sin(angular) * Math.cos(theta));
  const lng = longitude * rad + Math.atan2(Math.sin(theta) * Math.sin(angular) * Math.cos(phi), Math.cos(angular) - Math.sin(phi) * Math.sin(lat));
  return [lng / rad, lat / rad];
}
const [[west,south],[east,north]] = KOTA_CITY_BOUNDS;
const edge = [[east,south,180], [east,north,90], [west,north,0], [west,south,-90]]
  .flatMap(([lng,lat,bearing]) => Array.from({ length: 17 }, (_, step) => destination(lng,lat,bearing - step * 90 / 16)));
edge.push([...edge[0]]);
/** Rounded corners keep the 3 km buffer from growing to 4.2 km diagonally. */
export const KOTA_AREA_POLYGON: GeoJSON.Polygon = { type: 'Polygon', coordinates: [edge] };
function nearestCityPoint(place: { latitude?: number; longitude?: number }) {
  return { latitude: Math.min(north, Math.max(south, place.latitude!)), longitude: Math.min(east, Math.max(west, place.longitude!)) };
}
export function inKotaMapArea(place: { latitude?: number; longitude?: number }): boolean {
  if (!validCoordinates(place.latitude, place.longitude)) return false;
  return (distanceKm(place, nearestCityPoint(place)) ?? Infinity) <= KOTA_BUFFER_KM + 1e-8;
}
export function constrainedMapCentre(latitude: number, longitude: number): { latitude: number; longitude: number } {
  const point = { latitude, longitude };
  if (inKotaMapArea(point)) return point;
  const nearest = nearestCityPoint(point);
  const distance = distanceKm(point, nearest);
  if (!distance) return nearest;
  const fraction = Math.min(1, (KOTA_BUFFER_KM - .003) / distance);
  const result = { latitude: nearest.latitude + (latitude - nearest.latitude) * fraction, longitude: nearest.longitude + (longitude - nearest.longitude) * fraction };
  return inKotaMapArea(result) ? result : nearest;
}

/** Match the unpitched viewport constraint so the zoom slider has no inactive range. */
export function minimumKotaZoom(width: number, height: number): number {
  const [[west, south], [east, north]] = KOTA_MAP_BOUNDS;
  const mercatorY = (latitude: number) => (1 - Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360)) / Math.PI) / 2;
  const xSpan = (east - west) / 360, ySpan = mercatorY(south) - mercatorY(north);
  return Math.max(Math.log2(Math.max(1, width) / (512 * xSpan)), Math.log2(Math.max(1, height) / (512 * ySpan)));
}
