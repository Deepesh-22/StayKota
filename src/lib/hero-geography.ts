import geography from '../data/kota-geography.json';

export const KOTA_GEOGRAPHY = geography;
export const ATLAS_WIDTH = 700;
export const ATLAS_HEIGHT = 650;
const [west, south, east, north] = geography.bbox;
const mercator = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360)) * 180 / Math.PI;
const scale = Math.min((ATLAS_WIDTH - 46) / (east - west), (ATLAS_HEIGHT - 32) / (mercator(north) - mercator(south)));
const left = (ATLAS_WIDTH - (east - west) * scale) / 2;
const top = (ATLAS_HEIGHT - (mercator(north) - mercator(south)) * scale) / 2;

/** One north-up Web Mercator projection is shared by ink, colour and focus locations. */
export function projectKota(longitude: number, latitude: number): [number, number] {
  return [left + (longitude - west) * scale, top + (mercator(north) - mercator(latitude)) * scale];
}

export function geographicPath(geometry: { type: string; coordinates: unknown }): string {
  const line = (points: number[][]) => points.map(([longitude, latitude], index) => {
    const [x, y] = projectKota(longitude, latitude);
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join('');
  if (geometry.type === 'LineString') return line(geometry.coordinates as number[][]);
  if (geometry.type === 'MultiLineString') return (geometry.coordinates as number[][][]).map(line).join('');
  if (geometry.type === 'Polygon') return (geometry.coordinates as number[][][]).map(ring => line(ring) + 'Z').join('');
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates as number[][][][]).flatMap(polygon => polygon.map(ring => line(ring) + 'Z')).join('');
  return '';
}

export const KOTA_GEOGRAPHIC_PATHS = geography.features.map((feature, index) => ({
  id: `${feature.properties.layer}-${index}`,
  layer: feature.properties.layer,
  name: feature.properties.name,
  d: geographicPath(feature.geometry),
}));

// These are camera focus areas, not administrative zones, campus pins or surveyed POIs.
export const KOTA_FOCUS_AREAS = [
  { id: 'city', name: 'Whole Kota', caption: 'A city. A new beginning.', longitude: 75.837, latitude: 25.18 },
  { id: 'river', name: 'The Chambal', caption: 'Follow the river through Kota.', longitude: 75.832, latitude: 25.195 },
  { id: 'north', name: 'North Kota', caption: 'Get to know the north side.', longitude: 75.856, latitude: 25.225 },
  { id: 'south', name: 'South Kota', caption: 'Discover the south side.', longitude: 75.838, latitude: 25.135 },
] as const;

const scaleLatitude = 25.18;
export const ATLAS_TWO_KM = projectKota(75.84 + 2 / (111.195 * Math.cos(scaleLatitude * Math.PI / 180)), scaleLatitude)[0] - projectKota(75.84, scaleLatitude)[0];
