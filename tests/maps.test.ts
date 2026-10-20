import { withinKota } from '../src/lib/coordinates';
import { locationLabel } from '../src/lib/location-status';
import { distanceKm } from '../src/lib/discovery';
import { satelliteSource, SATELLITE_TILE_URL } from '../src/lib/satellite-map';
import { OPEN_MAP_STYLE_URL, studentMapStyle, radiusPolygon } from '../src/lib/open-map-style';
import type { StyleSpecification } from 'maplibre-gl';
import { groupMapPins, type StudentMapPin } from '../src/lib/map-clusters';
import { CAMPUSES } from '../src/data/campuses';
import { describe, expect, it } from 'vitest';
import { CITY_TARGET, validCoordinates, nearestCampus, campusDistance, withinCampusRadius } from '../src/lib/maps';

describe('keyless OpenFreeMap configuration', () => {
  it('starts over Kota and uses a public style with no API key', () => {
    expect(CITY_TARGET).toMatchObject({ lat: 25.183, lng: 75.839, zoom: 12 });
    expect(new URL(OPEN_MAP_STYLE_URL).origin).toBe('https://tiles.openfreemap.org');
    expect(new URL(OPEN_MAP_STYLE_URL).search).toBe('');
  });
  it('hides businesses and transit symbols while retaining roads, city labels and attribution', () => {
    const style: StyleSpecification = { version: 8, sources: { base: { type: 'vector', tiles: ['https://example.com/{z}/{x}/{y}.pbf'], attribution: 'Test source attribution' } }, layers: [
      { id: 'shops', type: 'symbol', source: 'base', 'source-layer': 'poi' },
      { id: 'stations', type: 'symbol', source: 'base', 'source-layer': 'transportation' },
      { id: 'roads', type: 'symbol', source: 'base', 'source-layer': 'transportation_name' },
      { id: 'city', type: 'symbol', source: 'base', 'source-layer': 'place' },
      { id: 'buildings', type: 'fill', source: 'base', 'source-layer': 'building' },
    ] };
    const filtered = studentMapStyle(style);
    expect(filtered.layers.find(l => l.id === 'shops')?.layout?.visibility).toBe('none');
    expect(filtered.layers.find(l => l.id === 'stations')?.layout?.visibility).toBe('none');
    expect(filtered.layers.find(l => l.id === 'roads')?.layout?.visibility).not.toBe('none');
    expect(filtered.layers.find(l => l.id === 'city')?.layout?.visibility).not.toBe('none');
    expect(filtered.layers.find(l => l.id === 'staykota-buildings-3d')).toMatchObject({ type: 'fill-extrusion', source: 'base', minzoom: 14 });
    expect(filtered.sources).toEqual(style.sources);
    expect(style.layers).toHaveLength(5);
  });
  it('draws closed radius polygons at the requested distance', () => {
    const polygon = radiusPolygon(25.146, 75.852, 3);
    const coordinates = polygon.geometry.coordinates[0];
    expect(coordinates[0]).toEqual(coordinates.at(-1));
    for (const [longitude, latitude] of coordinates) expect(campusDistance({ latitude, longitude }, { latitude: 25.146, longitude: 75.852 })).toBeCloseTo(3, 5);
  });
  it('rejects missing and invalid pin coordinates', () => {
    expect(validCoordinates(undefined, 75)).toBe(false);
    expect(validCoordinates(91, 75)).toBe(false);
    expect(validCoordinates(NaN, 75)).toBe(false);
  });
});

describe('coaching proximity', () => {
  it('finds the nearest coaching campus from coordinates', () => {
    expect(nearestCampus({ latitude: 25.148, longitude: 75.852 })?.campus.id).toBe('allen-talwandi');
    expect(nearestCampus({ latitude: 25.216, longitude: 75.855 })?.campus.id).toBe('allen-landmark');
  });
  it('includes a hostel at the boundary and excludes one beyond the chosen radius', () => {
    const campus = CAMPUSES[0];
    const location = { latitude: 25.216, longitude: 75.855 };
    const distance = campusDistance(location, campus)!;
    expect(withinCampusRadius(location, campus, distance)).toBe(true);
    expect(withinCampusRadius(location, campus, distance - 0.01)).toBe(false);
    expect(withinCampusRadius(location, CAMPUSES[1], 1)).toBe(false);
  });
  it('never assigns missing or invalid coordinates to a nearby campus', () => {
    expect(nearestCampus({})).toBeNull();
    expect(nearestCampus({ latitude: 91, longitude: 75.85 })).toBeNull();
    expect(withinCampusRadius({}, CAMPUSES[0], 5)).toBe(false);
  });
});

describe('student location proximity', () => {
  it('uses any coordinate origin without assigning it a coaching identity', () => {
    const origin = { latitude: 25.146, longitude: 75.852 };
    expect(withinCampusRadius({ latitude: 25.148, longitude: 75.852 }, origin, 1)).toBe(true);
    expect(withinCampusRadius({ latitude: 25.216, longitude: 75.855 }, origin, 1)).toBe(false);
    expect(withinCampusRadius({ latitude: 25.148, longitude: 75.852 }, { latitude: 28.61, longitude: 77.2 }, 5)).toBe(false);
  });
});

describe('zoom-aware student map pins', () => {
  const pins: StudentMapPin[] = [
    { id: 'h1', kind: 'hostel', latitude: 25.148, longitude: 75.852 },
    { id: 'allen', kind: 'campus', latitude: 25.146, longitude: 75.852 },
    { id: 'pw', kind: 'campus', latitude: 25.15, longitude: 75.854 },
    { id: 'h2', kind: 'hostel', latitude: 25.216, longitude: 75.855 },
  ];
  it('groups nearby hostels and coaching pins at city zoom without losing any', () => {
    const groups = groupMapPins(pins, 12);
    expect(groups.some(group => group.pins.some(p => p.kind === 'hostel') && group.pins.some(p => p.kind === 'campus'))).toBe(true);
    expect(groups.flatMap(group => group.pins.map(p => p.id)).sort()).toEqual(pins.map(p => p.id).sort());
    expect(groups).toEqual(groupMapPins([...pins].reverse(), 12));
  });
  it('reveals individual pins on zoom in and keeps a selected hostel separate at every zoom', () => {
    expect(groupMapPins(pins, 19)).toHaveLength(4);
    const selected = groupMapPins(pins, 10, ['h1']).find(group => group.pins.some(p => p.id === 'h1'))!;
    expect(selected.pins.map(p => p.id)).toEqual(['h1']);
  });
  it('does not invent pins for invalid coordinates or count duplicates after regrouping', () => {
    const invalid = { id: 'missing', kind: 'hostel' as const, latitude: NaN, longitude: 75 };
    expect(groupMapPins([invalid], 12)).toEqual([]);
    expect(groupMapPins(pins, 8).flatMap(group => group.pins)).toHaveLength(pins.length);
    expect(groupMapPins(pins, 19).flatMap(group => group.pins)).toHaveLength(pins.length);
  });
});


describe('satellite source', () => {
  it('uses the ArcGIS z/y/x tile ordering and retains provider attribution without a key', () => {
    const source = satelliteSource('Imagery contributor');
    expect(source.type).toBe('raster');
    expect(SATELLITE_TILE_URL).toContain('/tile/{z}/{y}/{x}');
    expect(source.tiles).toEqual([SATELLITE_TILE_URL]);
    expect(source.attribution).toContain('Esri');
    expect(source.attribution).toContain('Imagery contributor');
    expect(new URL(SATELLITE_TILE_URL).search).toBe('');
  });
  it('treats remote credit text as text rather than inserting active HTML', () => {
    const source = satelliteSource('<script>alert("credits")</script>');
    expect(source.attribution).not.toContain('<script>');
    expect(source.attribution).toContain('&lt;script&gt;');
  });
});

describe('location accuracy and evidence', () => {
  it('rejects swapped Kota coordinates and incomplete pairs', () => {
    expect(withinKota(25.148, 75.852)).toBe(true);
    expect(withinKota(75.852, 25.148)).toBe(false);
    expect(withinKota(25.148, undefined)).toBe(false);
    expect(distanceKm({ latitude: 91, longitude: 75.8 }, CAMPUSES[0])).toBeNull();
    expect(distanceKm({ latitude: 25.1, longitude: 75.8 }, { latitude: NaN, longitude: 75.8 })).toBeNull();
  });
  it('does not equate a claimed verified status with location evidence', () => {
    const point = { latitude: 25.148, longitude: 75.852 };
    expect(locationLabel(point)).toBe('Location unverified');
    expect(locationLabel({ ...point, location: { status: 'verified' } })).toBe('Location unverified');
    expect(locationLabel({ ...point, location: { status: 'verified', source: 'https://example.org/official-address', checkedAt: '2026-10-21' } })).toBe('Location checked');
    expect(locationLabel({ location: { status: 'verified', source: 'https://example.org', checkedAt: '2026-10-21' } })).toBe('Location not provided');
    expect(CAMPUSES.every(c => locationLabel(c) === 'Demo location')).toBe(true);
  });
});
