/** City-wide starting view; panning is deliberately not restricted to a rectangle. */
export const KOTA_VIEW = { lat: 25.183, lng: 75.839, zoom: 12 };
export type CityMapType = 'roadmap' | 'satellite';
export interface MapTarget {
  lat: number;
  lng: number;
  zoom: number;
  id: string;
}
export const CITY_TARGET: MapTarget = { ...KOTA_VIEW, id: 'kota' };

export function validCoordinates(latitude?: number, longitude?: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude!) <= 90 &&
    Math.abs(longitude!) <= 180
  );
}
export function googleEmbedUrl(
  target: MapTarget,
  type: CityMapType = 'roadmap',
  search = ''
): string {
  const params = new URLSearchParams({
    q: search.trim() ? `${search.trim()}, Kota, Rajasthan, India` : `${target.lat},${target.lng}`,
    z: String(target.zoom),
    t: type === 'satellite' ? 'k' : 'm',
    hl: 'en',
    output: 'embed',
  });
  return `https://www.google.com/maps?${params}`;
}
export function googleExternalUrl(target: MapTarget, search = ''): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: search.trim() ? `${search.trim()}, Kota, Rajasthan, India` : `${target.lat},${target.lng}` })}`;
}
