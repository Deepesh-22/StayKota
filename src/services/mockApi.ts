/**
 * Mock service layer for StayKota Phase 1.
 * All functions simulate async API latency and operate on in-memory / localStorage data.
 * Phase 2: replace implementations with real Go REST clients (fetch/axios).
 */

import type { Hostel, VisitRequest, Favourite, User, ListingStatus } from '../types';
import { MOCK_HOSTELS, MOCK_USERS } from '../data/mockData';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

const KEYS = {
  hostels: 'staykota_hostels',
  visits: 'staykota_visits',
  favourites: 'staykota_favourites',
  user: 'staykota_user',
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getHostels(opts?: { includeAll?: boolean }): Promise<Hostel[]> {
  await delay();
  const all = readJson<Hostel[]>(KEYS.hostels, MOCK_HOSTELS);
  if (opts?.includeAll) return all;
  return all.filter(h => h.status === 'approved');
}

export async function getHostelById(id: string): Promise<Hostel | null> {
  await delay();
  const all = readJson<Hostel[]>(KEYS.hostels, MOCK_HOSTELS);
  return all.find(h => h.id === id) ?? null;
}

export async function saveHostel(hostel: Hostel): Promise<Hostel> {
  await delay(300);
  const all = readJson<Hostel[]>(KEYS.hostels, MOCK_HOSTELS);
  const idx = all.findIndex(h => h.id === hostel.id);
  if (idx >= 0) all[idx] = hostel;
  else all.unshift(hostel);
  writeJson(KEYS.hostels, all);
  return hostel;
}

export async function setHostelStatus(id: string, status: ListingStatus): Promise<void> {
  await delay(200);
  const all = readJson<Hostel[]>(KEYS.hostels, MOCK_HOSTELS);
  const next = all.map(h =>
    h.id === id ? { ...h, status, updatedAt: new Date().toISOString().slice(0, 10) } : h
  );
  writeJson(KEYS.hostels, next);
}

export async function getVisits(studentId?: string): Promise<VisitRequest[]> {
  await delay();
  const all = readJson<VisitRequest[]>(KEYS.visits, []);
  if (studentId) return all.filter(v => v.studentId === studentId);
  return all;
}

/** Date-only visit — immediately Confirmed. No owner-approval queue. */
export async function createVisit(
  data: Omit<VisitRequest, 'id' | 'status' | 'createdAt'>
): Promise<VisitRequest> {
  await delay(400);
  const visit: VisitRequest = {
    ...data,
    id: `v-${Date.now()}`,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  const all = readJson<VisitRequest[]>(KEYS.visits, []);
  writeJson(KEYS.visits, [visit, ...all]);
  return visit;
}

export async function updateVisit(
  id: string,
  patch: Partial<Pick<VisitRequest, 'visitDate' | 'status'>>
): Promise<void> {
  await delay(200);
  const all = readJson<VisitRequest[]>(KEYS.visits, []);
  writeJson(
    KEYS.visits,
    all.map(v => (v.id === id ? { ...v, ...patch } : v))
  );
}

export async function getFavourites(studentId: string): Promise<Favourite[]> {
  await delay();
  return readJson<Favourite[]>(KEYS.favourites, []).filter(f => f.studentId === studentId);
}

export async function toggleFavourite(studentId: string, hostelId: string): Promise<Favourite[]> {
  await delay(150);
  const all = readJson<Favourite[]>(KEYS.favourites, []);
  const exists = all.find(f => f.studentId === studentId && f.hostelId === hostelId);
  const next = exists
    ? all.filter(f => !(f.studentId === studentId && f.hostelId === hostelId))
    : [...all, { studentId, hostelId, addedAt: new Date().toISOString() }];
  writeJson(KEYS.favourites, next);
  return next.filter(f => f.studentId === studentId);
}

/** Demo login only — not secure. Phase 2: real JWT auth. */
export async function demoLogin(email: string, role: User['role']): Promise<User> {
  await delay(300);
  const found = MOCK_USERS.find(u => u.email === email && u.role === role);
  if (found) {
    writeJson(KEYS.user, found);
    return found;
  }
  const demo: User = {
    id: `demo-${role}-${Date.now()}`,
    name: role === 'student' ? 'Demo Student' : role === 'owner' ? 'Demo Owner' : 'Demo Admin',
    email,
    role,
  };
  writeJson(KEYS.user, demo);
  return demo;
}

export function demoLogout() {
  localStorage.removeItem(KEYS.user);
}

export function getStoredUser(): User | null {
  return readJson<User | null>(KEYS.user, null);
}

export function resetPrototypeData() {
  localStorage.removeItem(KEYS.hostels);
  localStorage.removeItem(KEYS.visits);
  localStorage.removeItem(KEYS.favourites);
  localStorage.removeItem(KEYS.user);
}
