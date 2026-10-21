import { safeAppPath, hostelPreviewHref, hostelLoginHref } from '../src/lib/hostel-navigation';
import { describe, expect, it } from 'vitest';
import { MOCK_HOSTELS } from '../src/data/mockData';
import { CAMPUSES } from '../src/data/campuses';
import { distanceKm, formatDistance, getCampus, getMatchingRooms, monthlyTotal } from '../src/lib/discovery';

const comfort = MOCK_HOSTELS.find(h => h.id === 'h1')!;
const living = MOCK_HOSTELS.find(h => h.id === 'h4')!;
describe('room matching and truthful pricing', () => {
  it('matches sharing and budget on the SAME available room', () => {
    expect(getMatchingRooms(comfort, { sharing: 'single', maxBudget: 6000 })).toEqual([]);
    expect(getMatchingRooms(comfort, { sharing: 'double', maxBudget: 6000 }).map(r => r.id)).toEqual(['rt2']);
  });
  it('does not advertise the cheapest unavailable room', () => {
    expect(getMatchingRooms(living).map(r => r.id)).toEqual(['rt8']);
    expect(monthlyTotal(getMatchingRooms(living)[0])).toBe(9500);
    expect(getMatchingRooms(living, { sharing: 'double' })).toEqual([]);
  });
  it('adds mandatory monthly extras but excludes optional charges and deposit', () => {
    const room = { ...comfort.roomTypes[0], rent: 6000, deposit: 9000, extraCharges: [{ name: 'Mess', amount: 1200, optional: false }, { name: 'Optional laundry', amount: 500, optional: true }] };
    expect(monthlyTotal(room)).toBe(7200);
    expect(getMatchingRooms({ ...comfort, roomTypes: [room] }, { maxBudget: 7000 })).toEqual([]);
  });
  it('sorts matching rooms by fixed monthly costs without mutating inventory', () => {
    const before = comfort.roomTypes.map(r => r.id);
    expect(getMatchingRooms(comfort).map(monthlyTotal)).toEqual([4500, 5500, 8500]);
    expect(comfort.roomTypes.map(r => r.id)).toEqual(before);
  });
  it('uses inclusive minimum and maximum bounds', () => {
    expect(getMatchingRooms(comfort, { minBudget: 5500, maxBudget: 5500 }).map(r => r.id)).toEqual(['rt2']);
  });
});
describe('campus and sample distance', () => {
  it('resolves a known campus and safely defaults unknown IDs', () => {
    expect(getCampus('allen-talwandi').id).toBe('allen-talwandi');
    expect(getCampus('unrecognised').id).toBe('allen-landmark');
  });
  it('calculates zero and known approximate distances using coordinates', () => {
    const campus = CAMPUSES[0];
    expect(distanceKm({ latitude: campus.latitude, longitude: campus.longitude }, campus)).toBeCloseTo(0);
    expect(distanceKm({ latitude: campus.latitude + 1, longitude: campus.longitude }, campus)).toBeCloseTo(111.19, 1);
  });
  it('does not invent distance when coordinates are missing', () => {
    expect(distanceKm({}, CAMPUSES[0])).toBeNull();
    expect(formatDistance(null)).toBe('Location not provided');
  });
  it('formats metres and kilometres without claiming walking time', () => {
    expect(formatDistance(.452)).toBe('450 m');
    expect(formatDistance(2.14)).toBe('2.1 km');
  });
});

describe('hostel preview and login navigation', () => {
  it('keeps return paths inside the app, rejecting protocol-relative, external and control-character URLs', () => {
    for(const path of ['https://example.com','//example.com','/\\example.com','/\n/evil']) expect(safeAppPath(path,'/map')).toBe('/map');
    expect(safeAppPath('/map?sharing=double&hostel=h1')).toBe('/map?sharing=double&hostel=h1');
  });
  it('preserves room and campus context through preview and signup links', () => {
    const preview=new URL(hostelPreviewHref('h1','allen-talwandi','rt2','/map?type=satellite'),'https://staykota.invalid');
    expect(preview.pathname).toBe('/hostel/h1/preview');
    expect(preview.searchParams.get('room')).toBe('rt2');
    expect(preview.searchParams.get('returnTo')).toBe('/map?type=satellite');
    const login=new URL(hostelLoginHref('/hostel/h1?campus=allen-talwandi&room=rt2',true),'https://staykota.invalid');
    expect(login.searchParams.get('mode')).toBe('signup');
    expect(login.searchParams.get('redirect')).toBe('/hostel/h1?campus=allen-talwandi&room=rt2');
  });
});
