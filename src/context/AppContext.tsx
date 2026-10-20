import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Hostel, VisitRequest, Favourite, ListingStatus } from '../types';
import { MOCK_USERS, MOCK_HOSTELS } from '../data/mockData';
import { localDate } from '../lib/discovery';

type VisitInput = Omit<VisitRequest, 'id' | 'status' | 'createdAt' | 'studentId' | 'studentName'>;
interface AppContextType {
  user: User | null; hostels: Hostel[]; favourites: Favourite[]; visits: VisitRequest[];
  storageError: boolean;
  login: (email: string, role: User['role']) => boolean;
  logout: () => void;
  toggleFavourite: (hostelId: string) => void;
  isFavourite: (hostelId: string) => boolean;
  scheduleVisit: (data: VisitInput) => VisitRequest;
  cancelVisit: (visitId: string) => void;
  rescheduleVisit: (visitId: string, newDate: string) => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone'>>) => void;
  updateHostelStatus: (hostelId: string, status: ListingStatus) => void;
  addHostel: (hostel: Hostel) => void;
  updateHostel: (hostel: Hostel) => void;
}
const AppContext = createContext<AppContextType | null>(null);
function read<T>(key: string, fallback: T): T {
  try { const text = localStorage.getItem(key); return text ? JSON.parse(text) as T : fallback; } catch { return fallback; }
}
function storedList<T>(key: string, fallback: T[]): T[] {
  const value = read<unknown>(key, fallback);
  return Array.isArray(value) ? value.filter(x => x && typeof x === 'object') as T[] : fallback;
}
function loadHostels(): Hostel[] {
  return storedList<Hostel>('staykota_hostels', MOCK_HOSTELS).filter(h => typeof h.id === 'string' && Array.isArray(h.roomTypes)).map(h => {
    const seed = MOCK_HOSTELS.find(x => x.id === h.id);
    const externalSample = h.coverImage?.startsWith('https://images.unsplash.com/');
    return { ...seed, ...h, latitude: h.location ? h.latitude : h.latitude ?? seed?.latitude, longitude: h.location ? h.longitude : h.longitude ?? seed?.longitude,
      electricityPolicy: h.electricityPolicy ?? seed?.electricityPolicy,
      houseRules: h.houseRules ?? seed?.houseRules,
      coverImage: externalSample ? seed?.coverImage ?? '/images/room-shared.webp' : h.coverImage,
      images: externalSample ? seed?.images ?? ['/images/room-shared.webp'] : h.images,
    };
  });
}
function validVisitDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < localDate()) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === value;
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = read<User | null>('staykota_user', null);
    return saved && typeof saved.id === 'string' && ['student', 'owner', 'admin'].includes(saved.role) ? saved : null;
  });
  const [hostels, setHostels] = useState<Hostel[]>(loadHostels);
  const [favourites, setFavourites] = useState(() => storedList<Favourite>('staykota_favourites', []));
  const [visits, setVisits] = useState(() => storedList<VisitRequest>('staykota_visits', []));
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      if (user) localStorage.setItem('staykota_user', JSON.stringify(user)); else localStorage.removeItem('staykota_user');
      localStorage.setItem('staykota_hostels', JSON.stringify(hostels));
      localStorage.setItem('staykota_favourites', JSON.stringify(favourites));
      localStorage.setItem('staykota_visits', JSON.stringify(visits));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [user, hostels, favourites, visits]);
  const login = (email: string, role: User['role']) => {
    if (!['student', 'owner', 'admin'].includes(role)) return false;
    const normalized = email.trim().toLowerCase();
    const existing = MOCK_USERS.find(u => u.email === normalized && u.role === role);
    const stableId = `demo-${role}-${encodeURIComponent(normalized)}`;
    const savedProfiles = read<Record<string, User>>('staykota_profiles', {});
    const phone = normalized.split('@')[0];
    const profile = savedProfiles && typeof savedProfiles === 'object' ? savedProfiles[existing?.id ?? stableId] : null;
    setUser(profile ?? existing ?? {
      id: stableId, name: role === 'student' ? 'Kota Student' : role === 'owner' ? 'Hostel Owner' : 'Demo Admin', email: normalized, role,
      ...(/^\d{10}$/.test(phone) ? { phone: `+91 ${phone}` } : {}),
    });
    return true;
  };
  const toggleFavourite = (hostelId: string) => {
    if (!user || user.role !== 'student' || !hostels.some(h => h.id === hostelId && h.status === 'approved')) return;
    setFavourites(prev => prev.some(f => f.hostelId === hostelId && f.studentId === user.id)
      ? prev.filter(f => !(f.hostelId === hostelId && f.studentId === user.id))
      : [...prev, { studentId: user.id, hostelId, addedAt: new Date().toISOString() }]);
  };
  const scheduleVisit = (data: VisitInput): VisitRequest => {
    if (!user || user.role !== 'student') throw new Error('Sign in as a student to request a visit.');
    const hostel = hostels.find(h => h.id === data.hostelId && h.status === 'approved');
    if (!hostel || !hostel.roomTypes.some(r => r.id === data.roomTypeId && r.available)) throw new Error('Choose an available room in a published hostel.');
    if (!validVisitDate(data.visitDate)) throw new Error('Choose today or a future date.');
    if (!data.consentAt) throw new Error('Consent is required to save your visit enquiry.');
    const duplicate = visits.find(v => v.studentId === user.id && v.hostelId === data.hostelId && v.roomTypeId === data.roomTypeId && v.visitDate === data.visitDate && v.status !== 'cancelled');
    if (duplicate) return duplicate;
    const visit: VisitRequest = { ...data, id: `v-${crypto.randomUUID()}`, studentId: user.id, studentName: user.name,
      hostelName: hostel.name, roomTypeName: hostel.roomTypes.find(r => r.id === data.roomTypeId)?.name,
      status: 'requested', createdAt: new Date().toISOString() };
    setVisits(prev => [visit, ...prev]);
    return visit;
  };
  const cancelVisit = (id: string) => {
    if (!user) return;
    setVisits(prev => prev.map(v => v.id === id && ((user.role === 'student' && v.studentId === user.id) || (user.role === 'owner' && hostels.some(h => h.id === v.hostelId && h.ownerId === user.id))) ? { ...v, status: 'cancelled' } : v));
  };
  const rescheduleVisit = (id: string, date: string) => {
    if (!user || !validVisitDate(date)) throw new Error('Choose a valid future date.');
    setVisits(prev => prev.map(v => v.id === id && v.status !== 'cancelled' && ((user.role === 'student' && v.studentId === user.id) || (user.role === 'owner' && hostels.some(h => h.id === v.hostelId && h.ownerId === user.id))) ? { ...v, visitDate: date, status: 'requested' } : v));
  };
  const updateProfile = (data: Partial<Pick<User, 'name' | 'phone'>>) => {
    if (!user || (data.name !== undefined && !data.name.trim())) return;
    const profile = { ...user, ...data, name: data.name?.trim() ?? user.name };
    setUser(profile);
    try { const profiles = read<Record<string, User>>('staykota_profiles', {}); localStorage.setItem('staykota_profiles', JSON.stringify({ ...profiles, [user.id]: profile })); } catch { setStorageError(true); }
  };
  const updateHostelStatus = (id: string, status: ListingStatus) => {
    if (user?.role !== 'admin') throw new Error('Only the demo administrator can moderate listings.');
    setHostels(prev => prev.map(h => h.id === id ? { ...h, status, updatedAt: localDate() } : h));
  };
  const addHostel = (hostel: Hostel) => {
    if (user?.role !== 'owner' || hostel.ownerId !== user.id) throw new Error('Only an owner can add their own listing.');
    setHostels(prev => [{ ...hostel, status: hostel.status === 'draft' ? 'draft' : 'pending' }, ...prev]);
  };
  const updateHostel = (hostel: Hostel) => {
    if (user?.role !== 'owner' || !hostels.some(h => h.id === hostel.id && h.ownerId === user.id) || hostel.ownerId !== user.id) throw new Error('This listing belongs to another owner.');
    setHostels(prev => prev.map(h => h.id === hostel.id ? { ...hostel, status: hostel.status === 'draft' ? 'draft' : 'pending', updatedAt: localDate() } : h));
  };
  return <AppContext.Provider value={{ user, hostels, favourites, visits, storageError, login, logout: () => setUser(null), toggleFavourite,
    isFavourite: id => !!user && favourites.some(f => f.studentId === user.id && f.hostelId === id),
    scheduleVisit, cancelVisit, rescheduleVisit, updateProfile, updateHostelStatus, addHostel, updateHostel }}>{children}</AppContext.Provider>;
}
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error('useApp must be used within AppProvider'); return ctx; }
