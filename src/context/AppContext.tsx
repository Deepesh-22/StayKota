import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Hostel, VisitRequest, Favourite, ListingStatus } from '../types';
import { MOCK_USERS, MOCK_HOSTELS } from '../data/mockData';

interface AppContextType {
  user: User | null;
  hostels: Hostel[];
  favourites: Favourite[];
  visits: VisitRequest[];
  login: (email: string, role: User['role']) => boolean;
  logout: () => void;
  toggleFavourite: (hostelId: string) => void;
  isFavourite: (hostelId: string) => boolean;
  scheduleVisit: (data: Omit<VisitRequest, 'id' | 'status' | 'createdAt' | 'studentId' | 'studentName'>) => VisitRequest;
  cancelVisit: (visitId: string) => void;
  rescheduleVisit: (visitId: string, newDate: string) => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone'>>) => void;
  updateHostelStatus: (hostelId: string, status: ListingStatus) => void;
  addHostel: (hostel: Hostel) => void;
  updateHostel: (hostel: Hostel) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  user: 'staykota_user',
  favourites: 'staykota_favourites',
  visits: 'staykota_visits',
  hostels: 'staykota_hostels',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.user);
    return saved ? JSON.parse(saved) : null;
  });

  const [hostels, setHostels] = useState<Hostel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.hostels);
    return saved ? JSON.parse(saved) : MOCK_HOSTELS;
  });

  const [favourites, setFavourites] = useState<Favourite[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.favourites);
    return saved ? JSON.parse(saved) : [];
  });

  const [visits, setVisits] = useState<VisitRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.visits);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.hostels, JSON.stringify(hostels));
  }, [hostels]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favourites, JSON.stringify(favourites));
  }, [favourites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(visits));
  }, [visits]);

  const login = (email: string, role: User['role']) => {
    const found = MOCK_USERS.find(u => u.email === email && u.role === role);
    if (found) {
      setUser(found);
      return true;
    }
    const demoUser: User = {
      id: `demo-${role}-${Date.now()}`,
      name: role === 'student' ? 'Demo Student' : role === 'owner' ? 'Demo Owner' : 'Demo Admin',
      email,
      role,
    };
    setUser(demoUser);
    return true;
  };

  const logout = () => setUser(null);

  const toggleFavourite = (hostelId: string) => {
    if (!user || user.role !== 'student') return;
    setFavourites(prev => {
      const exists = prev.find(f => f.hostelId === hostelId && f.studentId === user.id);
      if (exists) return prev.filter(f => !(f.hostelId === hostelId && f.studentId === user.id));
      return [...prev, { studentId: user.id, hostelId, addedAt: new Date().toISOString() }];
    });
  };

  const isFavourite = (hostelId: string) => {
    if (!user) return false;
    return favourites.some(f => f.hostelId === hostelId && f.studentId === user.id);
  };

  const scheduleVisit = (data: Omit<VisitRequest, 'id' | 'status' | 'createdAt' | 'studentId' | 'studentName'>) => {
    if (!user || user.role !== 'student') throw new Error('Only students can schedule visits');
    const visit: VisitRequest = {
      ...data,
      id: `v-${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    setVisits(prev => [visit, ...prev]);
    return visit;
  };

  const cancelVisit = (visitId: string) => {
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'cancelled' as const } : v));
  };

  const rescheduleVisit = (visitId: string, newDate: string) => {
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, visitDate: newDate, status: 'confirmed' as const } : v));
  };

  const updateProfile = (data: Partial<Pick<User, 'name' | 'phone'>>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  const updateHostelStatus = (hostelId: string, status: ListingStatus) => {
    setHostels(prev => prev.map(h => h.id === hostelId ? { ...h, status, updatedAt: new Date().toISOString().slice(0, 10) } : h));
  };

  const addHostel = (hostel: Hostel) => {
    setHostels(prev => [hostel, ...prev]);
  };

  const updateHostel = (hostel: Hostel) => {
    setHostels(prev => prev.map(h => h.id === hostel.id ? hostel : h));
  };

  return (
    <AppContext.Provider value={{
      user, hostels, favourites, visits,
      login, logout, toggleFavourite, isFavourite,
      scheduleVisit, cancelVisit, rescheduleVisit, updateProfile,
      updateHostelStatus, addHostel, updateHostel,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
