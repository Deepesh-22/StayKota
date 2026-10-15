import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid, Building2, Calendar, CreditCard, Plus, Eye, Clock,
  CheckCircle, XCircle, Phone, Pencil, Trash2, X, Search, BedDouble
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LOCALITIES, AMENITIES } from '../data/mockData';
import type { Hostel, ListingStatus, RoomType, SharingType } from '../types';

type Section = 'overview' | 'listings' | 'visits' | 'payments';

const emptyRoom = (hostelId: string): RoomType => ({
  id: `rt-${Date.now()}`,
  hostelId,
  name: 'Double Sharing',
  sharingType: 'double',
  capacity: 2,
  rent: 6000,
  deposit: 4000,
  billingPeriod: 'monthly',
  extraCharges: [],
  included: ['WiFi', 'Meals'],
  available: true,
  features: ['Shared bathroom', 'Study table'],
});

export function OwnerDashboard() {
  const {
    user, hostels, visits,
    addHostel, updateHostel, updateHostelStatus,
    cancelVisit, rescheduleVisit,
  } = useApp();

  const [section, setSection] = useState<Section>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | ''>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Hostel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cancelVisitId, setCancelVisitId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [fName, setFName] = useState('');
  const [fLocality, setFLocality] = useState(LOCALITIES[0]);
  const [fAddress, setFAddress] = useState('');
  const [fCategory, setFCategory] = useState<'boys' | 'girls' | 'co-ed'>('boys');
  const [fDesc, setFDesc] = useState('');
  const [fAmenities, setFAmenities] = useState<string[]>(['WiFi', 'Meals']);
  const [fCover, setFCover] = useState('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80');
  const [fRooms, setFRooms] = useState<RoomType[]>([emptyRoom('new')]);
  const [fStatus, setFStatus] = useState<ListingStatus>('draft');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const PAGE_SIZE = 6;

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <p className="text-slate-600">Please log in as a hostel owner.</p>
        <Link to="/login?role=owner" className="mt-4 inline-block text-teal-600 font-medium">Login as Owner</Link>
      </div>
    );
  }

  const myHostels = hostels.filter(
    h => h.ownerId === user.id || user.id.startsWith('demo-owner') || h.ownerId === 'u2'
  );
  const myVisits = visits.filter(v => myHostels.some(h => h.id === v.hostelId));
  const confirmedVisits = myVisits.filter(v => v.status === 'confirmed');
  const upcomingVisits = confirmedVisits.filter(v => v.visitDate >= today);
  const liveCount = myHostels.filter(h => h.status === 'approved').length;
  const draftCount = myHostels.filter(h => h.status === 'draft').length;
  const pendingCount = myHostels.filter(h => h.status === 'pending').length;

  const filteredListings = useMemo(() => {
    let list = myHostels;
    if (statusFilter) list = list.filter(h => h.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.locality.toLowerCase().includes(q));
    }
    return list;
  }, [myHostels, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE));
  const pageItems = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const statusBadge = (status: ListingStatus) => {
    const map: Record<ListingStatus, React.ReactNode> = {
      draft: <Badge>Draft</Badge>,
      pending: <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending review</Badge>,
      approved: <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Live</Badge>,
      rejected: <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>,
    };
    return map[status];
  };

  const openCreate = () => {
    setEditing(null);
    setFName(''); setFLocality(LOCALITIES[0]); setFAddress(''); setFCategory('boys');
    setFDesc(''); setFAmenities(['WiFi', 'Meals']);
    setFCover('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80');
    setFRooms([emptyRoom('new')]); setFStatus('draft'); setError(''); setFormOpen(true);
  };

  const openEdit = (h: Hostel) => {
    setEditing(h);
    setFName(h.name); setFLocality(h.locality); setFAddress(h.address);
    setFCategory(h.category); setFDesc(h.description); setFAmenities([...h.amenities]);
    setFCover(h.coverImage); setFRooms(h.roomTypes.map(r => ({ ...r })));
    setFStatus(h.status); setError(''); setFormOpen(true);
  };

  const saveListing = () => {
    setError('');
    if (!fName.trim()) { setError('Hostel name is required'); return; }
    if (!fAddress.trim()) { setError('Address is required'); return; }
    if (fRooms.length === 0) { setError('Add at least one room type'); return; }
    for (const r of fRooms) {
      if (!r.name.trim() || r.rent <= 0) { setError('Each room needs a name and rent > 0'); return; }
    }
    setSaving(true);
    setTimeout(() => {
      const id = editing?.id || `h-${Date.now()}`;
      const hostel: Hostel = {
        id,
        ownerId: user.id.startsWith('demo-') ? 'u2' : user.id,
        name: fName.trim(),
        description: fDesc.trim() || 'Owner-managed hostel listing.',
        locality: fLocality,
        address: fAddress.trim(),
        category: fCategory,
        status: fStatus,
        amenities: fAmenities,
        coverImage: fCover,
        images: [fCover],
        roomTypes: fRooms.map((r, i) => ({
          ...r,
          id: r.id.startsWith('rt-') && editing ? r.id : `rt-${id}-${i}`,
          hostelId: id,
        })),
        createdAt: editing?.createdAt || today,
        updatedAt: today,
      };
      if (editing) updateHostel(hostel);
      else addHostel(hostel);
      setSaving(false);
      setFormOpen(false);
      showToast(editing ? 'Listing updated (local only)' : 'Listing created (local only)');
      setSection('listings');
    }, 400);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    updateHostelStatus(deleteId, 'rejected');
    setDeleteId(null);
    showToast('Listing removed from public view (demo).');
  };

  const publish = (h: Hostel) => {
    updateHostelStatus(h.id, 'pending');
    showToast('Submitted for admin review (demo).');
  };

  const unpublish = (h: Hostel) => {
    updateHostelStatus(h.id, 'draft');
    showToast('Moved to draft (demo).');
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch { return iso; }
  };

  const menu: { id: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'listings', label: 'My listings', icon: <Building2 className="w-4 h-4" /> },
    { id: 'visits', label: 'Visit requests', icon: <Calendar className="w-4 h-4" />, badge: upcomingVisits.length || undefined },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="animate-fade-in bg-[#faf8f5] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{user.name.split(' ')[0]}'s hostels</h1>
            <p className="text-sm text-slate-500 mt-1">
              {liveCount} live · {draftCount} draft · {pendingCount} pending review · Demo owner panel
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setSection('listings')}>Edit listings</Button>
            <Button className="rounded-full" onClick={openCreate}><Plus className="w-4 h-4" /> Add new hostel</Button>
          </div>
        </div>

        {toast && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 animate-fade-in">{toast}</div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 flex-shrink-0">
            <Card className="p-3 sticky top-24">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Owner menu</p>
              <nav className="space-y-0.5">
                {menu.map(m => (
                  <button key={m.id} type="button" onClick={() => setSection(m.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      section === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    {m.icon}
                    <span className="flex-1 text-left">{m.label}</span>
                    {m.badge != null && m.badge > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${section === m.id ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>{m.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="mt-4 mx-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700">Phase 1 prototype</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Changes save to localStorage only.</p>
              </div>
            </Card>
          </aside>

          <div className="flex-1 min-w-0 space-y-6">
            {section === 'overview' && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Live listings', value: liveCount, sub: `${myHostels.length} total` },
                    { label: 'Visit requests', value: myVisits.length, sub: `${upcomingVisits.length} upcoming` },
                    { label: 'Confirmed visits', value: confirmedVisits.length, sub: 'No approval queue' },
                    { label: 'Pending review', value: pendingCount, sub: 'Awaiting admin' },
                  ].map(s => (
                    <Card key={s.label} className="p-4">
                      <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{s.label}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                    </Card>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {myHostels.slice(0, 4).map(h => (
                    <Card key={h.id} className="p-4 flex gap-3">
                      <img src={h.coverImage} alt="" className="w-20 h-16 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{h.name}</p>
                        <p className="text-xs text-slate-500">{h.locality} · {h.roomTypes.length} room types</p>
                        <div className="mt-1.5">{statusBadge(h.status)}</div>
                        <div className="flex gap-2 mt-2">
                          {h.status === 'approved' && (
                            <Link to={`/hostel/${h.id}`}><Button size="sm" variant="outline" className="text-xs h-7 rounded-lg">View page</Button></Link>
                          )}
                          <Button size="sm" variant="outline" className="text-xs h-7 rounded-lg" onClick={() => openEdit(h)}>Edit</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-900">Latest visit requests</h2>
                    <button type="button" onClick={() => setSection('visits')} className="text-sm text-teal-700 font-medium hover:underline">View all</button>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Visits are confirmed when students submit — no owner approval step in this prototype.</p>
                  {upcomingVisits.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No upcoming visits</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {upcomingVisits.slice(0, 5).map(v => (
                        <li key={v.id} className="py-3 flex flex-wrap items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-sm font-semibold">{v.studentName.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900">{v.studentName}</p>
                            <p className="text-xs text-slate-500">{v.hostelName} · {formatDate(v.visitDate)}{v.roomTypeName ? ` · ${v.roomTypeName}` : ''}</p>
                          </div>
                          <Badge variant="success">Confirmed</Badge>
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => alert('Demo only — no real call.')}>
                            <Phone className="w-3.5 h-3.5" /> Call
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}

            {section === 'listings' && (
              <Card className="p-5">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search listings…"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as ListingStatus | ''); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    <option value="">All statuses</option>
                    <option value="approved">Live</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <Button onClick={openCreate} className="rounded-xl"><Plus className="w-4 h-4" /> Add</Button>
                </div>

                {pageItems.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>No listings match</p>
                    <Button className="mt-4" onClick={openCreate}>Add your first hostel</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pageItems.map(h => (
                      <div key={h.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
                        <img src={h.coverImage} alt="" className="w-full sm:w-28 h-20 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900">{h.name}</p>
                            {statusBadge(h.status)}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {h.locality} · {h.category} · {h.roomTypes.length} room types · from ₹{Math.min(...h.roomTypes.map(r => r.rent)).toLocaleString()}/mo
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {h.status === 'approved' && (
                            <Link to={`/hostel/${h.id}`}><Button size="sm" variant="outline"><Eye className="w-3.5 h-3.5" /> View</Button></Link>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEdit(h)}><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                          {h.status === 'draft' && <Button size="sm" onClick={() => publish(h)}>Submit for review</Button>}
                          {h.status === 'approved' && <Button size="sm" variant="outline" onClick={() => unpublish(h)}>Unpublish</Button>}
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(h.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-full text-sm font-medium ${page === p ? 'bg-slate-900 text-white' : 'border border-slate-200'}`}>{p}</button>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {section === 'visits' && (
              <Card className="p-5">
                <h2 className="font-semibold text-slate-900 mb-1">Visit requests</h2>
                <p className="text-xs text-slate-400 mb-4">Date only · Already confirmed when student submitted · No owner-approval queue in Phase 1</p>
                {myVisits.length === 0 ? (
                  <p className="text-center py-12 text-slate-500 text-sm">No visit requests yet</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {myVisits.map(v => (
                      <li key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-semibold text-sm">{v.studentName.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{v.studentName}</p>
                          <p className="text-sm text-slate-500">{v.hostelName} · {formatDate(v.visitDate)}{v.roomTypeName ? ` · ${v.roomTypeName}` : ''}</p>
                          {v.message && <p className="text-xs text-slate-400 italic mt-0.5">"{v.message}"</p>}
                        </div>
                        <Badge variant={v.status === 'confirmed' ? 'success' : 'default'}>{v.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}</Badge>
                        {v.status === 'confirmed' && (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => alert('Demo only — no real call.')}><Phone className="w-3.5 h-3.5" /> Call</Button>
                            <Button size="sm" variant="outline" onClick={() => { setRescheduleId(v.id); setRescheduleDate(v.visitDate); setError(''); }}>Change date</Button>
                            <Button size="sm" variant="ghost" onClick={() => setCancelVisitId(v.id)}>Cancel</Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {section === 'payments' && (
              <Card className="p-10 text-center">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="font-semibold text-slate-900">Payments</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Payment tracking is planned for Phase 2. This prototype does not process money.</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setFormOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit listing' : 'Add new hostel'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Demo form · Saves to localStorage · Publishing goes to Pending review</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Hostel name *</label>
                <input value={fName} onChange={e => setFName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Locality</label>
                  <select value={fLocality} onChange={e => setFLocality(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    {LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select value={fCategory} onChange={e => setFCategory(e.target.value as typeof fCategory)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                    <option value="co-ed">Co-ed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Address *</label>
                <input value={fAddress} onChange={e => setFAddress(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Cover image URL</label>
                <input value={fCover} onChange={e => setFCover(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(a => (
                    <button key={a} type="button" onClick={() => setFAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${fAmenities.includes(a) ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600'}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Room types</label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setFRooms(r => [...r, emptyRoom(editing?.id || 'new')])}>
                    <Plus className="w-3.5 h-3.5" /> Add room
                  </Button>
                </div>
                <div className="space-y-3">
                  {fRooms.map((r, idx) => (
                    <div key={r.id + idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> Room {idx + 1}</span>
                        {fRooms.length > 1 && (
                          <button type="button" className="text-xs text-red-500" onClick={() => setFRooms(rs => rs.filter((_, i) => i !== idx))}>Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Name" value={r.name} onChange={e => { const v = e.target.value; setFRooms(rs => rs.map((x, i) => i === idx ? { ...x, name: v } : x)); }} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
                        <select value={r.sharingType} onChange={e => {
                          const v = e.target.value as SharingType;
                          setFRooms(rs => rs.map((x, i) => i === idx ? { ...x, sharingType: v, capacity: v === 'single' ? 1 : v === 'double' ? 2 : v === 'triple' ? 3 : 4 } : x));
                        }} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm">
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                          <option value="four">Four / Dorm</option>
                        </select>
                        <input type="number" placeholder="Rent" value={r.rent} onChange={e => { const v = Number(e.target.value); setFRooms(rs => rs.map((x, i) => i === idx ? { ...x, rent: v } : x)); }} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
                        <input type="number" placeholder="Deposit" value={r.deposit} onChange={e => { const v = Number(e.target.value); setFRooms(rs => rs.map((x, i) => i === idx ? { ...x, deposit: v } : x)); }} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" checked={r.available} onChange={e => { const v = e.target.checked; setFRooms(rs => rs.map((x, i) => i === idx ? { ...x, available: v } : x)); }} /> Available
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 rounded-xl" loading={saving} onClick={saveListing}>{editing ? 'Save changes' : 'Create listing'}</Button>
                <Button variant="ghost" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <Card className="relative w-full max-w-md p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Remove this listing?</h3>
            <p className="text-sm text-slate-500 mt-1">Demo action — marks as rejected / hidden from public. Real delete comes in Phase 2.</p>
            <div className="mt-5 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={handleDelete}>Remove</Button>
              <Button variant="ghost" onClick={() => setDeleteId(null)}>Keep</Button>
            </div>
          </Card>
        </div>
      )}

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRescheduleId(null)} />
          <Card className="relative w-full max-w-md p-6 shadow-xl">
            <h3 className="font-semibold">Change visit date</h3>
            <p className="text-sm text-slate-500 mt-1">Date only — no time.</p>
            <input type="date" min={today} value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)}
              className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={() => {
                if (rescheduleDate < today) { setError('Past date not allowed'); return; }
                rescheduleVisit(rescheduleId, rescheduleDate);
                setRescheduleId(null);
                showToast('Visit date updated (demo).');
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setRescheduleId(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {cancelVisitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelVisitId(null)} />
          <Card className="relative w-full max-w-md p-6 shadow-xl">
            <h3 className="font-semibold">Cancel this visit?</h3>
            <p className="text-sm text-slate-500 mt-1">Local demo only — student is not notified.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => {
                cancelVisit(cancelVisitId);
                setCancelVisitId(null);
                showToast('Visit cancelled (demo).');
              }}>Cancel visit</Button>
              <Button variant="ghost" onClick={() => setCancelVisitId(null)}>Keep</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
