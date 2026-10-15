import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HostelCard } from '../components/hostel/HostelCard';
import { LOCALITIES } from '../data/mockData';
import { Button } from '../components/ui/Button';
import type { SharingType } from '../types';

const PAGE_SIZE = 6;
const AMENITY_OPTIONS = ['Meals', 'WiFi', 'Laundry', 'Power Backup', 'AC', 'CCTV', 'Hot Water'];
type SortKey = 'rent-asc' | 'rent-desc' | 'name';

export function ExplorePage() {
  const { hostels } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localities, setLocalities] = useState<string[]>(() => {
    const l = searchParams.get('locality');
    return l ? l.split(',').filter(Boolean) : [];
  });
  const [minBudget, setMinBudget] = useState(Number(searchParams.get('minBudget') || 0));
  const [maxBudget, setMaxBudget] = useState(Number(searchParams.get('maxBudget') || 15000));
  const [sharing, setSharing] = useState<SharingType | ''>((searchParams.get('sharing') as SharingType) || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [amenities, setAmenities] = useState<string[]>(() => {
    const a = searchParams.get('amenities');
    return a ? a.split(',').filter(Boolean) : [];
  });
  const [applied, setApplied] = useState({ localities, minBudget, maxBudget, sharing, category, amenities });
  const [sort, setSort] = useState<SortKey>('rent-asc');
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const l = searchParams.get('locality');
    const locs = l ? l.split(',').filter(Boolean) : [];
    const min = Number(searchParams.get('minBudget') || 0);
    const max = Number(searchParams.get('maxBudget') || 15000);
    const sh = (searchParams.get('sharing') as SharingType) || '';
    const cat = searchParams.get('category') || '';
    const am = searchParams.get('amenities');
    const amList = am ? am.split(',').filter(Boolean) : [];
    setLocalities(locs); setMinBudget(min); setMaxBudget(max); setSharing(sh); setCategory(cat); setAmenities(amList);
    setApplied({ localities: locs, minBudget: min, maxBudget: max, sharing: sh, category: cat, amenities: amList });
    setPage(1);
  }, [searchParams]);

  const approved = useMemo(() => hostels.filter(h => h.status === 'approved'), [hostels]);
  const localityCounts = useMemo(() => {
    const map: Record<string, number> = {};
    LOCALITIES.forEach(l => { map[l] = 0; });
    approved.forEach(h => { map[h.locality] = (map[h.locality] || 0) + 1; });
    return map;
  }, [approved]);

  const filtered = useMemo(() => {
    let list = approved.filter(h => {
      if (applied.localities.length && !applied.localities.includes(h.locality)) return false;
      if (applied.category && h.category !== applied.category) return false;
      const minRent = Math.min(...h.roomTypes.map(r => r.rent));
      if (minRent < applied.minBudget || minRent > applied.maxBudget) return false;
      if (applied.sharing && !h.roomTypes.some(r => r.sharingType === applied.sharing && r.available)) return false;
      if (applied.amenities.length && !applied.amenities.every(a => h.amenities.includes(a))) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const ra = Math.min(...a.roomTypes.map(r => r.rent));
      const rb = Math.min(...b.roomTypes.map(r => r.rent));
      if (sort === 'rent-asc') return ra - rb;
      if (sort === 'rent-desc') return rb - ra;
      return a.name.localeCompare(b.name);
    });
  }, [approved, applied, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const applyFilters = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (localities.length) params.set('locality', localities.join(','));
    if (minBudget > 0) params.set('minBudget', String(minBudget));
    if (maxBudget < 15000) params.set('maxBudget', String(maxBudget));
    if (sharing) params.set('sharing', sharing);
    if (category) params.set('category', category);
    if (amenities.length) params.set('amenities', amenities.join(','));
    setSearchParams(params);
    setApplied({ localities, minBudget, maxBudget, sharing, category, amenities });
    setPage(1);
    setMobileFilters(false);
    setTimeout(() => setLoading(false), 280);
  };

  const clearAll = () => {
    setLocalities([]); setMinBudget(0); setMaxBudget(15000); setSharing(''); setCategory(''); setAmenities([]);
    setApplied({ localities: [], minBudget: 0, maxBudget: 15000, sharing: '', category: '', amenities: [] });
    setSearchParams({}); setPage(1); setMobileFilters(false);
  };

  const toggleLocality = (l: string) => setLocalities(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  const toggleAmenity = (a: string) => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const hasFilters = applied.localities.length > 0 || !!applied.sharing || !!applied.category || applied.minBudget > 0 || applied.maxBudget < 15000 || applied.amenities.length > 0;

  const searchSummary = useMemo(() => {
    const parts: string[] = [];
    if (applied.localities.length) parts.push(applied.localities.join(', ')); else parts.push('Kota');
    if (applied.minBudget > 0 || applied.maxBudget < 15000) parts.push(`₹${(applied.minBudget / 1000).toFixed(0)}k–₹${(applied.maxBudget / 1000).toFixed(0)}k`);
    if (applied.sharing) parts.push(applied.sharing.charAt(0).toUpperCase() + applied.sharing.slice(1));
    if (applied.category) parts.push(applied.category.charAt(0).toUpperCase() + applied.category.slice(1));
    return parts.join(' · ');
  }, [applied]);

  const resultLabel = useMemo(() => {
    if (applied.localities.length === 1) return `${filtered.length} stay${filtered.length !== 1 ? 's' : ''} in ${applied.localities[0]} & nearby`;
    if (applied.localities.length > 1) return `${filtered.length} stay${filtered.length !== 1 ? 's' : ''} in selected areas`;
    return `${filtered.length} stay${filtered.length !== 1 ? 's' : ''} in Kota`;
  }, [filtered.length, applied.localities]);

  const FiltersPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Filters</h2>
        {hasFilters && <button onClick={clearAll} className="text-sm text-teal-600 hover:text-teal-700 font-medium">Clear all</button>}
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2.5">Locality</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {LOCALITIES.map(l => (
            <label key={l} className="flex items-center gap-2.5 cursor-pointer group">
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${localities.includes(l) ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 group-hover:border-teal-400'}`}>
                {localities.includes(l) && <Check className="w-3.5 h-3.5" />}
              </span>
              <input type="checkbox" className="sr-only" checked={localities.includes(l)} onChange={() => toggleLocality(l)} />
              <span className="text-sm text-slate-700 flex-1">{l}</span>
              <span className="text-xs text-slate-400">({localityCounts[l] || 0})</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2.5">Monthly budget</h3>
        <input type="range" min={0} max={15000} step={500} value={maxBudget} onChange={e => setMaxBudget(Number(e.target.value))} className="w-full accent-teal-600" />
        <div className="flex justify-between mt-2 gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 uppercase">Min</label>
            <input type="number" min={0} max={maxBudget} step={500} value={minBudget} onChange={e => setMinBudget(Math.min(Number(e.target.value) || 0, maxBudget))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 uppercase">Max</label>
            <input type="number" min={minBudget} max={20000} step={500} value={maxBudget} onChange={e => setMaxBudget(Math.max(Number(e.target.value) || 15000, minBudget))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2.5">Sharing type</h3>
        <div className="flex flex-wrap gap-2">
          {(['single', 'double', 'triple', 'four'] as SharingType[]).map(s => (
            <button key={s} type="button" onClick={() => setSharing(sharing === s ? '' : s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${sharing === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
              {s === 'four' ? 'Dorm' : s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2.5">Category</h3>
        <div className="flex flex-wrap gap-2">
          {['boys', 'girls', 'co-ed'].map(c => (
            <button key={c} type="button" onClick={() => setCategory(category === c ? '' : c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${category === c ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2.5">Amenities</h3>
        <div className="space-y-2">
          {AMENITY_OPTIONS.map(a => (
            <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${amenities.includes(a) ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 group-hover:border-teal-400'}`}>
                {amenities.includes(a) && <Check className="w-3.5 h-3.5" />}
              </span>
              <input type="checkbox" className="sr-only" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} />
              <span className="text-sm text-slate-700">{a === 'Meals' ? 'Mess included' : a === 'WiFi' ? 'Wi-Fi' : a}</span>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={applyFilters} className="w-full rounded-xl">Show {filtered.length} stay{filtered.length !== 1 ? 's' : ''}</Button>
    </div>
  );

  return (
    <div className="animate-fade-in min-h-[70vh] bg-[#faf8f5]">
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 bg-white rounded-full border border-slate-200 shadow-sm px-4 py-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-slate-700 truncate">{searchSummary || 'All hostels in Kota'}</span>
            <button type="button" onClick={() => setMobileFilters(true)} className="lg:hidden flex items-center gap-1.5 text-sm text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <Button size="sm" onClick={applyFilters} className="rounded-full px-5 flex-shrink-0">Search</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-36 shadow-sm">{FiltersPanel}</div>
          </aside>

          <div className="flex-1 min-w-0">
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {applied.localities.map(l => (
                  <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100">{l}</span>
                ))}
                {(applied.minBudget > 0 || applied.maxBudget < 15000) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100">₹{applied.minBudget.toLocaleString()}–₹{applied.maxBudget.toLocaleString()}</span>
                )}
                {applied.sharing && <span className="inline-flex px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100 capitalize">{applied.sharing}</span>}
                {applied.category && <span className="inline-flex px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100 capitalize">{applied.category}</span>}
                {applied.amenities.map(a => (
                  <span key={a} className="inline-flex px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100">{a}</span>
                ))}
                <button onClick={clearAll} className="text-xs text-teal-600 font-medium hover:underline">Clear all</button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h1 className="text-lg font-semibold text-slate-900">{resultLabel}</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Sort:</span>
                <select value={sort} onChange={e => { setSort(e.target.value as SortKey); setPage(1); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="rent-asc">Rent: Low to High</option>
                  <option value="rent-desc">Rent: High to Low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-slate-200" /><div className="p-4 space-y-3"><div className="h-4 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-500 text-lg">No hostels match your filters</p>
                <p className="text-sm text-slate-400 mt-2">Try adjusting locality, budget or sharing type</p>
                <Button variant="outline" className="mt-4" onClick={clearAll}>Clear all filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pageItems.map((h, i) => (
                    <div key={h.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 5) * 0.05}s` }}>
                      <HostelCard hostel={h} />
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-1.5">
                    <button disabled={pageSafe <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Previous">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-full text-sm font-medium ${pageSafe === p ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                    ))}
                    <button disabled={pageSafe >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Next">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
            <p className="mt-6 text-center text-xs text-slate-400">Demo content only · Prices and availability are sample data</p>
          </div>
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileFilters(false)} className="p-2 rounded-full hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            {FiltersPanel}
          </div>
        </div>
      )}
    </div>
  );
}
