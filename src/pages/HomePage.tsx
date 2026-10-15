import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, IndianRupee, Users, FileText, Phone, GraduationCap, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HostelCard } from '../components/hostel/HostelCard';
import { LOCALITIES } from '../data/mockData';
import type { SharingType } from '../types';

export function HomePage() {
  const { hostels } = useApp();
  const navigate = useNavigate();
  const [locality, setLocality] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sharing, setSharing] = useState<SharingType | ''>('');

  const approved = hostels.filter(h => h.status === 'approved');
  const featured = approved.slice(0, 3);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (locality) params.set('locality', locality);
    if (maxBudget) params.set('maxBudget', maxBudget);
    if (sharing) params.set('sharing', sharing);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in">
      <section className="relative bg-[#faf8f5] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-12 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 text-white overflow-hidden animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-medium mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Kota · Hostel & PG discovery
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight tracking-tight">
                  Find a hostel in Kota<br className="hidden sm:block" /> that feels like home
                </h1>
                <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-md leading-relaxed">
                  Search by locality, budget and sharing type. See real rooms and clear pricing before you visit.
                </p>
                <form onSubmit={handleSearch} className="mt-7 bg-white rounded-2xl p-2.5 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select value={locality} onChange={e => setLocality(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-800 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                        <option value="">Locality / near coaching</option>
                        {LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-800 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                        <option value="">Monthly budget</option>
                        <option value="5000">Under ₹5,000</option>
                        <option value="8000">Under ₹8,000</option>
                        <option value="12000">Under ₹12,000</option>
                      </select>
                    </div>
                    <div className="relative flex gap-1.5">
                      <div className="relative flex-1">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select value={sharing} onChange={e => setSharing(e.target.value as SharingType | '')}
                          className="w-full pl-9 pr-3 py-3 rounded-xl text-sm text-slate-800 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                          <option value="">Sharing</option>
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                        </select>
                      </div>
                      <button type="submit" className="flex-shrink-0 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm flex items-center gap-2">
                        <Search className="w-4 h-4" /><span className="hidden sm:inline">Search</span>
                      </button>
                    </div>
                  </div>
                </form>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Girls hostels', 'Under ₹6k', 'With mess'].map(l => (
                    <button key={l} onClick={() => navigate('/explore')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10">{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden min-h-[280px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=900&q=80" alt="Kota campus" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/95 shadow-lg text-sm">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="font-medium text-slate-800">Demo listings for Kota students</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500 mr-1">Popular:</span>
          {LOCALITIES.slice(0, 6).map((l, i) => (
            <Link key={l} to={`/explore?locality=${encodeURIComponent(l)}`}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'}`}>{l}</Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-sm text-teal-600 font-medium mb-1">Handpicked for this admission season</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Featured hostels near coaching hubs</h2>
          </div>
          <Link to="/explore" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">View all stays <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((h, i) => (
            <div key={h.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <HostelCard hostel={h} />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: <FileText className="w-5 h-5" />, title: 'Transparent rent breakup', desc: 'Monthly rent, deposit and extras shown separately. No hidden charges.' },
            { icon: <Phone className="w-5 h-5" />, title: 'Direct owner contact', desc: 'Request a visit in one step. No middlemen, no commission.' },
            { icon: <GraduationCap className="w-5 h-5" />, title: 'Built for students', desc: 'Filters for sharing type, mess and coaching distance.' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">{item.icon}</div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: '01', title: 'Search & compare', desc: 'Filter by budget, locality and sharing.' },
            { num: '02', title: 'Request a visit', desc: 'Pick a date. Owner confirms on call.' },
            { num: '03', title: 'Visit the room', desc: 'Check room, mess and washrooms.' },
            { num: '04', title: 'Move in', desc: 'Pay deposit with receipt.' },
          ].map(s => (
            <div key={s.num} className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden">
              <span className="absolute top-4 right-4 text-3xl font-bold text-slate-100">{s.num}</span>
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center mb-3 text-slate-600"><Check className="w-4 h-4" /></div>
              <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
