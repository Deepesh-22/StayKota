import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HostelCard } from '../components/hostel/HostelCard';

export function FavouritesPage() {
  const { user, hostels, favourites } = useApp();

  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Please login as a student to view favourites.</p>
        <Link to="/login?role=student" className="mt-4 inline-block text-teal-600 font-medium">Login</Link>
      </div>
    );
  }

  const favHostels = hostels.filter(h =>
    favourites.some(f => f.hostelId === h.id && f.studentId === user.id) && h.status === 'approved'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Favourites</h1>
      <p className="text-slate-500 mb-8">{favHostels.length} saved hostel{favHostels.length !== 1 ? 's' : ''}</p>

      {favHostels.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No favourites yet</p>
          <Link to="/" className="mt-4 inline-block text-teal-600 font-medium hover:underline">
            Browse hostels
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favHostels.map(h => (
            <HostelCard key={h.id} hostel={h} />
          ))}
        </div>
      )}
    </div>
  );
}
