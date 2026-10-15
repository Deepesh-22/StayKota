import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HostelCard } from '../components/hostel/HostelCard';
import { LOCALITIES } from '../data/mockData';
import { Button } from '../components/ui/Button';
import type { SharingType } from '../types';

export function ExplorePage() {
  const { hostels } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [locality, setLocality] = useState(searchParams.get('locality') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('maxBudget') || '50000');
  const [sharing, setSharing] = useState<SharingType | ''>((searchParams.get('sharing') as SharingType) || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLocality(searchParams.get('locality') || '');
    setMaxBudget(searchParams.get('maxBudget') || '50000');
    setSharing((searchParams.get('sharing') as SharingType) || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (locality) params.set('locality', locality);
    if (maxBudget && maxBudget !== '50000') params.set('maxBudget', maxBudget);
    if (sharing) params.set('sharing', sharing);
    if (category) params.set('category', category);
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setLocality(''); setMaxBudget('50000'); setSharing(''); setCategory('');
    setSearchParams({});
  };

  const approved = useMemo(() => hostels.filter(h => h.status === 'approved'), [hostels]);
  const filtered = useMemo(() => {
    const max = Number(maxBudget) || 50000;
    return approved.filter(h => {
      if (locality && h.locality !== locality) return false;
      if (category && h.category !== category) return false;
      const minRent = Math.min(...h.roomTypes.map(r => r.rent));
      if (minRent > max) return false;
      if (sharing && !h.roomTypes.some(r => r.sharingType === sharing && r.available)) return false;
      return true;
    });
  }, [approved, locality, maxBudget, sharing, category]);

  const hasFilters = !!(locality || sharing || category || maxBudget !== '50000');

  return (
    <div className="animate-fade-in min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Explore hostels in Kota</h1>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} listing{filtered.length !== 1 ? 's' : ''} · Demo content only</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
            {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4" /> Clear</Button>}
          </div>
        </div>
        <div className="flex gap-8">
          <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-24 space-y-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Search className="w-4 h-4 text-teal-600" /> Filters</h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Locality</label>
                <select value={locality} onChange={e => setLocality(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">All localities</option>
                  {LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Budget (max)</label>
                <select value={maxBudget} onChange={e => setMaxBudget(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="50000">Any budget</option>
                  <option value="5000">Under ₹5,000</option>
                  <option value="8000">Under ₹8,000</option>
                  <option value="12000">Under ₹12,000</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Sharing</label>
                <select value={sharing} onChange={e => setSharing(e.target.value as SharingType | '')} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">Any</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">All</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="co-ed">Co-ed</option>
                </select>
              </div>
              <Button onClick={applyFilters} className="w-full">Apply filters</Button>
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-500 text-lg">No hostels match your filters</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear all filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(h => <HostelCard key={h.id} hostel={h} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
