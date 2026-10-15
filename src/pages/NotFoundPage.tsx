import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/explore?q=${encodeURIComponent(q)}`);
    else navigate('/explore');
  };

  return (
    <div className="animate-fade-in bg-[#faf8f5] min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm mb-6">
        <MapPin className="w-3.5 h-3.5 text-teal-600" />
        Error 404 · This room seems vacant
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight max-w-xl">
        Looks like this page checked out.
      </h1>
      <p className="mt-4 text-slate-500 max-w-md text-sm sm:text-base">
        The link may be old, or the hostel moved. Let's get you back to hostels in Kota.
      </p>

      <div className="mt-10 mb-10 relative">
        <div className="absolute inset-0 bg-teal-100/40 rounded-3xl blur-2xl scale-110 -z-10" />
        <img
          src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=640&q=80"
          alt=""
          className="w-full max-w-md h-48 sm:h-56 object-cover rounded-2xl shadow-lg border border-white/50"
        />
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-lg flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Try “Talwandi double sharing under ₹7k”…'
            className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-label="Search hostels"
          />
        </div>
        <Button type="submit" className="rounded-xl flex-shrink-0">
          Search
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button className="rounded-xl px-6">Back to home</Button>
        </Link>
        <Link to="/explore">
          <Button variant="outline" className="rounded-xl px-6">
            Browse all hostels
          </Button>
        </Link>
      </div>
    </div>
  );
}
