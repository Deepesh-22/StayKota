import { CAMPUSES } from '../src/data/campuses';
import { describe, expect, it } from 'vitest';
import { CITY_TARGET, googleEmbedUrl, googleExternalUrl, validCoordinates, nearestCampus, campusDistance, withinCampusRadius } from '../src/lib/maps';

describe('whole-city Google map configuration', () => {
  it('opens Kota at city scale, not the extent of the sample inventory', () => {
    const url = new URL(googleEmbedUrl(CITY_TARGET));
    expect(url.origin).toBe('https://www.google.com');
    expect(url.pathname).toBe('/maps');
    expect(url.searchParams.get('q')).toBe('25.183,75.839');
    expect(url.searchParams.get('z')).toBe('12');
    expect(url.searchParams.get('output')).toBe('embed');
  });
  it('requests real Google satellite imagery without changing the target', () => {
    const url = new URL(googleEmbedUrl(CITY_TARGET, 'satellite'));
    expect(url.searchParams.get('t')).toBe('k');
    expect(url.searchParams.get('q')).toBe('25.183,75.839');
  });
  it('uses an explicit coordinate target when a hostel is selected', () => {
    const url = new URL(googleEmbedUrl({ lat: 25.148, lng: 75.852, zoom: 16, id: 'h1' }));
    expect(url.searchParams.get('q')).toBe('25.148,75.852');
    expect(url.searchParams.get('z')).toBe('16');
  });
  it('encodes area searches safely and keeps Kota context', () => {
    const url = new URL(googleEmbedUrl(CITY_TARGET, 'roadmap', ' Railway station & bazaar '));
    expect(url.searchParams.get('q')).toBe('Railway station & bazaar, Kota, Rajasthan, India');
    expect([...url.searchParams.keys()]).toEqual(['q', 'z', 't', 'hl', 'output']);
  });
  it('offers a normal Google Maps URL for blocked embeds', () => {
    const url = new URL(googleExternalUrl(CITY_TARGET, 'Chambal Garden'));
    expect(url.origin).toBe('https://www.google.com');
    expect(url.searchParams.get('query')).toBe('Chambal Garden, Kota, Rajasthan, India');
    expect(url.searchParams.has('key')).toBe(false);
  });
  it('rejects missing, non-finite and out-of-range map pins', () => {
    expect(validCoordinates(25.18, 75.83)).toBe(true);
    expect(validCoordinates(undefined, 75.83)).toBe(false);
    expect(validCoordinates(NaN, 75.83)).toBe(false);
    expect(validCoordinates(100, 75.83)).toBe(false);
    expect(validCoordinates(25.18, -181)).toBe(false);
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
