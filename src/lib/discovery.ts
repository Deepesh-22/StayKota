import { validCoordinates } from './coordinates';
import type { Hostel, RoomType } from '../types';
import { CAMPUSES, DEFAULT_CAMPUS_ID, type Campus } from '../data/campuses';

export function getCampus(id?: string | null): Campus {
  return CAMPUSES.find(c => c.id === id) ?? CAMPUSES.find(c => c.id === DEFAULT_CAMPUS_ID)!;
}

/** Fixed monthly charges only. Deposits, optional services and metered costs are separate. */
export function monthlyTotal(room: RoomType): number {
  return room.rent + room.extraCharges.filter(c => !c.optional).reduce((sum, charge) => sum + charge.amount, 0);
}

export interface RoomFilters { sharing?: string; minBudget?: number; maxBudget?: number }
export function getMatchingRooms(hostel: Hostel, filters: RoomFilters = {}): RoomType[] {
  return hostel.roomTypes.filter(room => {
    const total = monthlyTotal(room);
    return room.available && (!filters.sharing || room.sharingType === filters.sharing)
      && (filters.minBudget === undefined || total >= filters.minBudget)
      && (filters.maxBudget === undefined || total <= filters.maxBudget);
  }).sort((a, b) => monthlyTotal(a) - monthlyTotal(b));
}

/** Haversine distance between sample coordinates; never a walking route or travel time. */
export function distanceKm(hostel: Pick<Hostel, 'latitude' | 'longitude'>, campus: Pick<Campus, 'latitude' | 'longitude'>): number | null {
  if (!validCoordinates(hostel.latitude, hostel.longitude) || !validCoordinates(campus.latitude, campus.longitude)) return null;
  const rad = Math.PI / 180;
  const lat1 = hostel.latitude! * rad;
  const lat2 = campus.latitude * rad;
  const dLat = lat2 - lat1;
  const dLon = (campus.longitude - hostel.longitude!) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function formatDistance(km: number | null): string {
  if (km === null || !Number.isFinite(km)) return 'Location not provided';
  return km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${km.toFixed(1)} km`;
}

export function localDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
