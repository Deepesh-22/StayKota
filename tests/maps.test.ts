import { describe, expect, it } from 'vitest';
import { CAMPUSES } from '../src/data/campuses';
import { campusDistance, neighbourhoodPositions, validCoordinates, withinCampusRadius } from '../src/lib/maps';

const campus = CAMPUSES.find(c => c.id === 'allen-talwandi')!;
const nearby = { id: 'near', latitude: 25.148, longitude: 75.852 };
const far = { id: 'far', latitude: 25.216, longitude: 75.855 };
describe('custom coaching neighbourhood map', () => {
  it('includes nearby hostels and excludes distant hostels regardless of rendering mode', () => {
    expect(withinCampusRadius(nearby, campus, 1)).toBe(true);
    expect(withinCampusRadius(far, campus, 5)).toBe(false);
  });
  it('includes the exact distance boundary and rejects smaller radii', () => {
    const distance = campusDistance(nearby, campus)!;
    expect(withinCampusRadius(nearby, campus, distance)).toBe(true);
    expect(withinCampusRadius(nearby, campus, distance - .01)).toBe(false);
  });
  it('does not invent coordinates for unlocated or invalid listings', () => {
    expect(validCoordinates(undefined, 75)).toBe(false);
    expect(validCoordinates(91, 75)).toBe(false);
    expect(validCoordinates(25, NaN)).toBe(false);
    expect(campusDistance({}, campus)).toBeNull();
    expect(withinCampusRadius({}, campus, 5)).toBe(false);
    expect(withinCampusRadius(nearby, campus, Infinity)).toBe(false);
    expect(withinCampusRadius(nearby, campus, -1)).toBe(false);
  });
  it('spaces colocated hostel labels and produces stable scene positions', () => {
    const locations = [nearby, { ...nearby, id: 'second' }, { ...nearby, id: 'third' }];
    const positions = neighbourhoodPositions(locations, campus);
    expect(positions).toEqual(neighbourhoodPositions(locations, campus));
    expect(new Set(positions.map(p => `${p.x},${p.y}`)).size).toBe(3);
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(100);
      expect(p.x).toBeLessThanOrEqual(800);
      expect(p.y).toBeGreaterThanOrEqual(100);
      expect(p.y).toBeLessThanOrEqual(550);
    }
    expect(neighbourhoodPositions([{ id: 'missing' }], campus)).toEqual([]);
  });
});
