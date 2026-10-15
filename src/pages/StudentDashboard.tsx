import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid, Heart, Calendar, User, Search, MapPin, Key,
  X, Check, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

type Section = 'overview' | 'saved' | 'visits' | 'profile';

export function StudentDashboard() {
  const {
    user, hostels, favourites, visits,
    toggleFavourite, cancelVisit, rescheduleVisit, updateProfile, logout,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = (searchParams.get('tab') as Section) || 'overview';

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <p className="text-slate-600">Please log in as a student to view your dashboard.</p>
        <Link to="/login?role=student&redirect=/dashboard" className="mt-4 inline-block">
          <Button>Log in as student</Button>
        </Link>
      </div>
    );
  }

  const setSection = (tab: Section) => {
    setSearchParams(tab === 'overview' ? {} : { tab });
    setActionMsg('');
    setError('');
  };

  const myFavs = favourites.filter(f => f.studentId === user.id);
  const savedHostels = hostels.filter(h =>
    myFavs.some(f => f.hostelId === h.id) && h.status === 'approved'
  );
  const myVisits = visits.filter(v => v.studentId === user.id);
  const confirmedVisits = myVisits.filter(v => v.status === 'confirmed');
  const cancelledVisits = myVisits.filter(v => v.status === 'cancelled');
  const upcoming = confirmedVisits.filter(v => v.visitDate >= today);
  const past = confirmedVisits.filter(v => v.visitDate < today);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch {
      return iso;
    }
  };

  const handleReschedule = () => {
    setError('');
    if (!rescheduleId || !rescheduleDate) {
      setError('Select a new date');
      return;
    }
    if (rescheduleDate < today) {
      setError('Date cannot be in the past');
      return;
    }
    rescheduleVisit(rescheduleId, rescheduleDate);
    setRescheduleId(null);
    setRescheduleDate('');
    setActionMsg('Visit date updated. Exact time will still be coordinated with the owner.');
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleCancel = () => {
    if (!cancelId) return;
    cancelVisit(cancelId);
    setCancelId(null);
    setActionMsg('Visit cancelled. This was a local demo action only.');
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('Name is required');
      return;
    }
    updateProfile({ name: profileName.trim(), phone: profilePhone.trim() || undefined });
    setProfileSaved(true);
    setError('');
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const menu: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'saved', label: 'Saved hostels', icon: <Heart className="w-4 h-4" /> },
    { id: 'visits', label: 'Visit requests', icon: <Calendar className="w-4 h-4" />, badge: upcoming.length || undefined },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  const hostelThumb = (id: string) => {
    const h = hostels.find(x => x.id === id);
    return h?.coverImage || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200&q=60';
  };

  return (
    <div className="animate-fade-in bg-[#faf8f5] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Namaste, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Student account · Demo dashboard · Visits are not room reservations
            </p>
          </div>
          <Link to="/explore">
            <Button className="rounded-full">
              <Search className="w-4 h-4" /> Continue exploring
            </Button>
          </Link>
        </div>

        {actionMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 animate-fade-in">
            <Check className="w-4 h-4 flex-shrink-0" />
            {actionMsg}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 flex-shrink-0">
            <Card className="p-3 sticky top-24">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Student menu
              </p>
              <nav className="space-y-0.5">
                {menu.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSection(m.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      section === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.icon}
                    <span className="flex-1 text-left">{m.label}</span>
                    {m.badge != null && m.badge > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        section === m.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>{m.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="mt-4 mx-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700">Need help?</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Demo prototype — no live chat.</p>
                <Link to="/how-it-works">
                  <Button variant="outline" size="sm" className="w-full mt-2 rounded-lg text-xs">How it works</Button>
                </Link>
              </div>
            </Card>
          </aside>

          <div className="flex-1 min-w-0 space-y-6">
            {section === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: <Heart className="w-5 h-5 text-teal-600" />, value: savedHostels.length, label: 'Saved hostels' },
                  { icon: <Calendar className="w-5 h-5 text-teal-600" />, value: myVisits.length, label: 'Visit requests' },
                  { icon: <Key className="w-5 h-5 text-teal-600" />, value: confirmedVisits.length, label: 'Confirmed visits' },
                ].map(s => (
                  <Card key={s.label} className="p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">{s.icon}</div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                      <p className="text-sm text-slate-500">{s.label}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {section === 'overview' && (
              <>
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Visit requests</h2>
                    <button type="button" onClick={() => setSection('visits')} className="text-sm text-teal-700 font-medium hover:underline">View all</button>
                  </div>
                  {myVisits.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No visits yet.{' '}
                      <Link to="/explore" className="text-teal-700 font-medium hover:underline">Explore hostels</Link>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {myVisits.slice(0, 5).map(v => (
                        <li key={v.id} className="py-3.5 flex items-center gap-3">
                          <img src={hostelThumb(v.hostelId)} alt="" className="w-14 h-11 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{v.hostelName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatDate(v.visitDate)}{v.roomTypeName ? ` · ${v.roomTypeName}` : ''}
                            </p>
                          </div>
                          <Badge variant={v.status === 'confirmed' ? 'success' : 'default'}>
                            {v.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                          </Badge>
                          <Link to={`/hostel/${v.hostelId}`}>
                            <Button variant="outline" size="sm" className="rounded-lg">Details</Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    Confirmed = visit request accepted in this prototype. Not a room reservation. Exact time coordinated with owner later.
                  </p>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Saved hostels</h2>
                    <button type="button" onClick={() => setSection('saved')} className="text-sm text-teal-700 font-medium hover:underline">
                      {savedHostels.length > 0 ? `View all (${savedHostels.length})` : 'View'}
                    </button>
                  </div>
                  {savedHostels.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No saved hostels.{' '}
                      <Link to="/explore" className="text-teal-700 font-medium hover:underline">Browse</Link>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {savedHostels.slice(0, 4).map(h => {
                        const minRent = Math.min(...h.roomTypes.map(r => r.rent));
                        return (
                          <div key={h.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <img src={h.coverImage} alt="" className="w-20 h-16 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{h.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{h.locality} · ₹{minRent.toLocaleString()}/mo</p>
                              <div className="flex gap-2 mt-2">
                                <Link to={`/hostel/${h.id}`}>
                                  <Button size="sm" className="rounded-lg text-xs h-8 px-2.5">Request visit</Button>
                                </Link>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs h-8 px-2.5" onClick={() => toggleFavourite(h.id)}>Remove</Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </>
            )}

            {section === 'saved' && (
              <Card className="p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Saved hostels ({savedHostels.length})</h2>
                {savedHostels.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No favourites yet</p>
                    <Link to="/explore" className="mt-4 inline-block"><Button>Explore hostels</Button></Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedHostels.map(h => {
                      const minRent = Math.min(...h.roomTypes.map(r => r.rent));
                      return (
                        <div key={h.id} className="flex gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-sm transition-shadow">
                          <img src={h.coverImage} alt="" className="w-24 h-20 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <Link to={`/hostel/${h.id}`} className="font-medium text-slate-900 hover:text-teal-700">{h.name}</Link>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {h.locality} · ₹{minRent.toLocaleString()}/mo
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Link to={`/hostel/${h.id}`}><Button size="sm" className="rounded-lg">Request visit</Button></Link>
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toggleFavourite(h.id)}>Remove</Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {section === 'visits' && (
              <div className="space-y-6">
                <Card className="p-5">
                  <h2 className="font-semibold text-slate-900 mb-1">Upcoming visits</h2>
                  <p className="text-xs text-slate-400 mb-4">
                    All new requests are Confirmed in this prototype. Exact time is coordinated with the owner later. A visit is not a room booking.
                  </p>
                  {upcoming.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No upcoming visits.{' '}
                      <Link to="/explore" className="text-teal-700 font-medium hover:underline">Find a hostel</Link>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {upcoming.map(v => (
                        <li key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <img src={hostelThumb(v.hostelId)} alt="" className="w-16 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900">{v.hostelName}</p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {formatDate(v.visitDate)}{v.roomTypeName ? ` · ${v.roomTypeName}` : ''}
                            </p>
                          </div>
                          <Badge variant="success">Confirmed</Badge>
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/hostel/${v.hostelId}`}><Button variant="outline" size="sm">Details</Button></Link>
                            <Button variant="outline" size="sm" onClick={() => { setRescheduleId(v.id); setRescheduleDate(v.visitDate); setError(''); }}>Reschedule</Button>
                            <Button variant="ghost" size="sm" onClick={() => setCancelId(v.id)}>Cancel</Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                {past.length > 0 && (
                  <Card className="p-5">
                    <h2 className="font-semibold text-slate-900 mb-4">Past visits</h2>
                    <ul className="divide-y divide-slate-100">
                      {past.map(v => (
                        <li key={v.id} className="py-3 flex items-center gap-3">
                          <img src={hostelThumb(v.hostelId)} alt="" className="w-12 h-10 rounded-lg object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{v.hostelName}</p>
                            <p className="text-xs text-slate-500">{formatDate(v.visitDate)}</p>
                          </div>
                          <Badge>Completed</Badge>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {cancelledVisits.length > 0 && (
                  <Card className="p-5">
                    <h2 className="font-semibold text-slate-900 mb-4">Cancelled</h2>
                    <ul className="divide-y divide-slate-100">
                      {cancelledVisits.map(v => (
                        <li key={v.id} className="py-3 flex items-center gap-3 opacity-70">
                          <img src={hostelThumb(v.hostelId)} alt="" className="w-12 h-10 rounded-lg object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{v.hostelName}</p>
                            <p className="text-xs text-slate-500">{formatDate(v.visitDate)}</p>
                          </div>
                          <Badge variant="default">Cancelled</Badge>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            {section === 'profile' && (
              <Card className="p-6 max-w-lg">
                <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                    <input value={profileName} onChange={e => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input value={user.email} disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-500" />
                    <p className="text-xs text-slate-400 mt-1">Email is set by demo login and cannot be changed here.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 …"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {profileSaved && (
                    <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Profile saved (local only)
                    </p>
                  )}
                  <Button type="submit" className="rounded-xl">Save changes</Button>
                </form>
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>Log out</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRescheduleId(null)} />
          <Card className="relative w-full max-w-md p-6 animate-slide-up shadow-xl">
            <button type="button" onClick={() => setRescheduleId(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-slate-900">Reschedule visit</h3>
            <p className="text-sm text-slate-500 mt-1">Date only — no time selection. Owner coordinates exact time later.</p>
            <input type="date" min={today} value={rescheduleDate}
              onChange={e => { setRescheduleDate(e.target.value); setError(''); }}
              className="mt-4 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              <Button className="flex-1 rounded-xl" onClick={handleReschedule}>Update date</Button>
              <Button variant="ghost" onClick={() => setRescheduleId(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelId(null)} />
          <Card className="relative w-full max-w-md p-6 animate-slide-up shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Cancel this visit?</h3>
                <p className="text-sm text-slate-500 mt-1">Demo only — marks the request cancelled in local storage. No owner notification is sent.</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="danger" className="flex-1 rounded-xl" onClick={handleCancel}>Yes, cancel visit</Button>
              <Button variant="ghost" onClick={() => setCancelId(null)}>Keep visit</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
