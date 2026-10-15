import type { Hostel, User } from '../types';

export const LOCALITIES = [
  'Talwandi',
  'Landmark',
  'Rajeev Gandhi Nagar',
  'Indraprastha Industrial Area',
  'Jawahar Nagar',
  'Rangbari',
  'Mahaveer Nagar',
  'Dadabari',
];

export const AMENITIES = [
  'WiFi', 'AC', 'Laundry', 'Meals', 'Parking', 'Power Backup',
  'CCTV', 'Study Room', 'Gym', 'Hot Water', 'Housekeeping', 'RO Water'
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Aarav Sharma', email: 'aarav@student.com', role: 'student', phone: '+91 98765 43210' },
  { id: 'u2', name: 'Priya Patel', email: 'priya@owner.com', role: 'owner', phone: '+91 87654 32109' },
  { id: 'u3', name: 'Admin User', email: 'admin@staykota.com', role: 'admin' },
];

export const MOCK_HOSTELS: Hostel[] = [
  {
    id: 'h1',
    ownerId: 'u2',
    name: 'Comfort Stay Hostel',
    description: 'Clean and well-maintained hostel near major coaching centres. Spacious rooms, reliable WiFi and homely meals.',
    locality: 'Talwandi',
    address: '12, Near Allen Career Institute, Talwandi, Kota',
    category: 'boys',
    status: 'approved',
    amenities: ['WiFi', 'Laundry', 'Meals', 'Power Backup', 'CCTV', 'Study Room', 'Hot Water', 'RO Water'],
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    ],
    roomTypes: [
      {
        id: 'rt1', hostelId: 'h1', name: 'Single Occupancy', sharingType: 'single', capacity: 1,
        rent: 8500, deposit: 5000, billingPeriod: 'monthly',
        extraCharges: [{ name: 'AC (optional)', amount: 1500, optional: true }],
        included: ['WiFi', 'Meals (Breakfast + Dinner)', 'Housekeeping'],
        available: true, features: ['Attached bathroom', 'Study table', 'Wardrobe'],
      },
      {
        id: 'rt2', hostelId: 'h1', name: 'Double Sharing', sharingType: 'double', capacity: 2,
        rent: 5500, deposit: 4000, billingPeriod: 'monthly', extraCharges: [],
        included: ['WiFi', 'Meals (Breakfast + Dinner)'],
        available: true, features: ['Shared bathroom', 'Study table'],
      },
      {
        id: 'rt3', hostelId: 'h1', name: 'Triple Sharing', sharingType: 'triple', capacity: 3,
        rent: 4500, deposit: 3000, billingPeriod: 'monthly', extraCharges: [],
        included: ['WiFi', 'Meals'], available: true, features: ['Shared bathroom'],
      },
    ],
    createdAt: '2025-08-01', updatedAt: '2025-10-10',
  },
  {
    id: 'h2', ownerId: 'u2', name: "Scholar's PG",
    description: 'Premium PG for focused students. Quiet environment and excellent food.',
    locality: 'Landmark', address: '45, Landmark City, Kota', category: 'boys', status: 'approved',
    amenities: ['WiFi', 'AC', 'Laundry', 'Meals', 'Parking', 'Power Backup', 'CCTV', 'Gym'],
    coverImage: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
    roomTypes: [
      {
        id: 'rt4', hostelId: 'h2', name: 'Single AC', sharingType: 'single', capacity: 1,
        rent: 11000, deposit: 8000, billingPeriod: 'monthly', extraCharges: [],
        included: ['AC', 'WiFi', 'Meals', 'Laundry'], available: true,
        features: ['Attached bathroom', 'AC', 'Study table'],
      },
      {
        id: 'rt5', hostelId: 'h2', name: 'Double Sharing', sharingType: 'double', capacity: 2,
        rent: 7000, deposit: 5000, billingPeriod: 'monthly',
        extraCharges: [{ name: 'AC', amount: 1200, optional: true }],
        included: ['WiFi', 'Meals'], available: true, features: ['Attached bathroom', 'Study table'],
      },
    ],
    createdAt: '2025-07-15', updatedAt: '2025-10-05',
  },
  {
    id: 'h3', ownerId: 'u2', name: 'The Student House',
    description: 'Affordable and hygienic accommodation for girls with strict security.',
    locality: 'Rajeev Gandhi Nagar', address: '78, R.G. Nagar, Kota', category: 'girls', status: 'approved',
    amenities: ['WiFi', 'Laundry', 'Meals', 'CCTV', 'Hot Water', 'RO Water'],
    coverImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'],
    roomTypes: [
      {
        id: 'rt6', hostelId: 'h3', name: 'Double Sharing', sharingType: 'double', capacity: 2,
        rent: 6000, deposit: 4000, billingPeriod: 'monthly', extraCharges: [],
        included: ['WiFi', 'Meals (3 times)', 'Laundry'], available: true,
        features: ['Attached bathroom', 'Study table'],
      },
      {
        id: 'rt7', hostelId: 'h3', name: 'Triple Sharing', sharingType: 'triple', capacity: 3,
        rent: 4800, deposit: 3000, billingPeriod: 'monthly', extraCharges: [],
        included: ['WiFi', 'Meals'], available: true, features: ['Shared bathroom'],
      },
    ],
    createdAt: '2025-09-01', updatedAt: '2025-10-12',
  },
  {
    id: 'h4', ownerId: 'u2', name: 'Kota Living PG',
    description: 'Modern co-ed PG with separate floors for boys and girls.',
    locality: 'Indraprastha Industrial Area', address: 'Plot 22, IPIA, Kota', category: 'co-ed', status: 'approved',
    amenities: ['WiFi', 'AC', 'Laundry', 'Meals', 'Parking', 'Gym', 'Power Backup', 'CCTV'],
    coverImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'],
    roomTypes: [
      {
        id: 'rt8', hostelId: 'h4', name: 'Single', sharingType: 'single', capacity: 1,
        rent: 9500, deposit: 6000, billingPeriod: 'monthly', extraCharges: [],
        included: ['AC', 'WiFi', 'Meals'], available: true, features: ['Attached bathroom', 'AC'],
      },
      {
        id: 'rt9', hostelId: 'h4', name: 'Double', sharingType: 'double', capacity: 2,
        rent: 6200, deposit: 4500, billingPeriod: 'monthly', extraCharges: [],
        included: ['WiFi', 'Meals'], available: false, features: ['Attached bathroom'],
      },
    ],
    createdAt: '2025-06-20', updatedAt: '2025-09-28',
  },
  {
    id: 'h5', ownerId: 'u2', name: 'Focus Nest Hostel',
    description: 'Budget-friendly option for serious aspirants.',
    locality: 'Jawahar Nagar', address: '3rd Cross, Jawahar Nagar, Kota', category: 'boys', status: 'pending',
    amenities: ['WiFi', 'Meals', 'Power Backup', 'CCTV'],
    coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    images: [],
    roomTypes: [
      {
        id: 'rt10', hostelId: 'h5', name: 'Triple Sharing', sharingType: 'triple', capacity: 3,
        rent: 4000, deposit: 2500, billingPeriod: 'monthly', extraCharges: [],
        included: ['WiFi', 'Meals'], available: true, features: ['Shared bathroom'],
      },
    ],
    createdAt: '2025-10-08', updatedAt: '2025-10-08',
  },
];

export const DEMO_NOTE = 'Demo content — prices, availability and listings are sample data for prototype only.';
