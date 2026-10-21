export type UserRole = 'visitor' | 'student' | 'owner' | 'admin';

export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type SharingType = 'single' | 'double' | 'triple' | 'four';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface RoomType {
  id: string;
  hostelId: string;
  name: string;
  sharingType: SharingType;
  capacity: number;
  rent: number;
  deposit: number;
  billingPeriod: 'monthly';
  extraCharges: { name: string; amount: number; optional: boolean }[];
  included: string[];
  available: boolean;
  features: string[];
}

export interface Hostel {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  locality: string;
  address: string;
  category: 'boys' | 'girls' | 'co-ed';
  status: ListingStatus;
  amenities: string[];
  coverImage: string;
  images: string[];
  videoUrl?: string;
  photoCaptions?: Record<string, string>;
  photography?: 'illustrative' | 'property';
  contact?: { phone?: string; email?: string };
  reviews?: { rating: number; count: number };
  refundPolicy?: string;
  location?: { status: 'demo' | 'owner-provided' | 'verified'; source?: string; checkedAt?: string };
  latitude?: number;
  longitude?: number;
  houseRules?: string[];
  electricityPolicy?: string;
  extraChargesNote?: string;
  roomTypes: RoomType[];
  createdAt: string;
  updatedAt: string;
}

export interface VisitRequest {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  hostelName: string;
  roomTypeId?: string;
  roomTypeName?: string;
  visitDate: string;
  message?: string;
  studentPhone?: string;
  consentAt?: string;
  status: 'requested' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Favourite {
  studentId: string;
  hostelId: string;
  addedAt: string;
}

export interface SearchFilters {
  locality: string;
  minBudget: number;
  maxBudget: number;
  sharingType: SharingType | '';
  category: '' | 'boys' | 'girls' | 'co-ed';
}
