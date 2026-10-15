import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import type { Hostel } from '../../types';
import { useApp } from '../../context/AppContext';

interface HostelCardProps { hostel: Hostel; }

export function HostelCard({ hostel }: HostelCardProps) {
  const { user, toggleFavourite, isFavourite } = useApp();
  const fav = isFavourite(hostel.id);
  const minRent = Math.min(...hostel.roomTypes.map(r => r.rent));
  const availableRooms = hostel.roomTypes.filter(r => r.available);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (user?.role === 'student') toggleFavourite(hostel.id);
  };

  const categoryLabel = hostel.category === 'boys' ? 'Boys' : hostel.category === 'girls' ? 'Girls' : 'Co-ed';
  const tags: string[] = [];
  if (availableRooms[0]) tags.push(availableRooms[0].sharingType.charAt(0).toUpperCase() + availableRooms[0].sharingType.slice(1) + ' sharing');
  if (hostel.amenities.includes('Meals')) tags.push('Mess');
  if (hostel.amenities.includes('WiFi')) tags.push('Wi-Fi');
  if (hostel.amenities.includes('Laundry')) tags.push('Laundry');

  return (
    <Link to={`/hostel/${hostel.id}`} className="block group h-full">
      <article className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img src={hostel.coverImage} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=70'; }} />
          <div className="absolute top-3 left-3">
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-white">{categoryLabel}</span>
          </div>
          {user?.role === 'student' && (
            <button onClick={handleFav} className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center ${
              fav ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-600'}`} aria-label="Favourite">
              <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-slate-900 text-[15px] group-hover:text-teal-700 transition-colors">{hostel.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-slate-500"><MapPin className="w-3.5 h-3.5" /><span>{hostel.locality}, Kota</span></div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-slate-50 text-[11px] text-slate-600 border border-slate-100">{t}</span>
            ))}
          </div>
          <div className="mt-auto pt-3 flex items-center justify-between">
            <div><span className="text-lg font-bold text-slate-900">₹{minRent.toLocaleString()}</span><span className="text-xs text-slate-500">/month onwards</span></div>
            <span className="text-sm font-medium text-teal-700 group-hover:underline">View details</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
