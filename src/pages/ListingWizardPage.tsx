import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check, ChevronLeft, ChevronRight, Plus, Trash2, ImagePlus, X, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LOCALITIES, AMENITIES } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Hostel, RoomType, SharingType, ListingStatus } from '../types';

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Rooms & pricing' },
  { id: 3, label: 'Amenities & rules' },
  { id: 4, label: 'Photos' },
  { id: 5, label: 'Review' },
] as const;

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
];

const emptyRoom = (): RoomType => ({
  id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  hostelId: '',
  name: 'Double Sharing',
  sharingType: 'double',
  capacity: 2,
  rent: 6500,
  deposit: 5000,
  billingPeriod: 'monthly',
  extraCharges: [],
  included: ['WiFi'],
  available: true,
  features: ['Attached bath'],
});

export function ListingWizardPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, hostels, addHostel, updateHostel } = useApp();

  const existing = isEdit ? hostels.find(h => h.id === id) : null;

  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'boys' | 'girls' | 'co-ed'>('boys');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState(LOCALITIES[0]);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [rooms, setRooms] = useState<RoomType[]>([emptyRoom()]);
  const [defaultDeposit, setDefaultDeposit] = useState(10000);
  const [electricity, setElectricity] = useState('Actuals · sub-metered');
  const [extraChargesNote, setExtraChargesNote] = useState('');
  const [amenities, setAmenities] = useState<string[]>(['WiFi', 'Meals']);
  const [rules, setRules] = useState('No smoking. Visitors as per hostel policy. Security deposit refunded after inspection.');
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategory(existing.category);
      setDescription(existing.description);
      setLocality(existing.locality);
      setAddress(existing.address);
      setRooms(existing.roomTypes.map(r => ({ ...r, extraCharges: [...r.extraCharges] })));
      setAmenities([...existing.amenities]);
      setImages(existing.images.length ? [...existing.images] : [existing.coverImage]);
      setDefaultDeposit(existing.roomTypes[0]?.deposit || 5000);
      setDirty(false);
    }
  }, [existing?.id]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const strength = useMemo(() => {
    let s = 0;
    if (name.trim()) s += 15;
    if (address.trim()) s += 10;
    if (description.trim().length > 40) s += 10;
    if (rooms.length > 0 && rooms.every(r => r.rent > 0)) s += 20;
    if (amenities.length >= 3) s += 15;
    if (images.length >= 1) s += 15;
    if (images.length >= 3) s += 10;
    if (rules.trim().length > 20) s += 5;
    return Math.min(100, s);
  }, [name, address, description, rooms, amenities, images, rules]);

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Owner login required.</p>
        <Link to="/login?role=owner" className="text-teal-600 font-medium mt-4 inline-block">Login as Owner</Link>
      </div>
    );
  }

  if (isEdit && !existing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Listing not found.</p>
        <Link to="/owner" className="text-teal-600 font-medium mt-4 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!name.trim()) e.name = 'Hostel name is required';
      if (!address.trim()) e.address = 'Address is required';
      if (!locality) e.locality = 'Locality is required';
    }
    if (s === 2) {
      if (rooms.length === 0) e.rooms = 'Add at least one room type';
      rooms.forEach((r, i) => {
        if (!r.name.trim()) e[`room-name-${i}`] = 'Name required';
        if (r.rent <= 0) e[`room-rent-${i}`] = 'Rent must be > 0';
      });
    }
    if (s === 4 && images.length === 0) {
      e.images = 'Add at least one photo (demo URL is fine)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(5, s + 1));
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  const buildHostel = (status: ListingStatus): Hostel => {
    const hostelId = existing?.id || `h-${Date.now()}`;
    const cover = images[coverIndex] || images[0] || SAMPLE_IMAGES[0];
    return {
      id: hostelId,
      ownerId: user.id.startsWith('demo-') ? 'u2' : user.id,
      name: name.trim(),
      description: description.trim() || 'Owner-managed hostel listing.',
      locality,
      address: [address.trim(), landmark.trim()].filter(Boolean).join(' · '),
      category,
      status,
      amenities,
      coverImage: cover,
      images: images.length ? images : [cover],
      roomTypes: rooms.map((r, i) => ({
        ...r,
        id: r.id || `rt-${hostelId}-${i}`,
        hostelId,
        deposit: r.deposit || defaultDeposit,
      })),
      createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  };

  const saveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      const h = buildHostel('draft');
      if (existing) updateHostel(h);
      else addHostel(h);
      setSaving(false);
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      if (!isEdit) navigate(`/owner/listing/${h.id}/edit`, { replace: true });
    }, 400);
  };

  const submitForReview = () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      setStep(1);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const h = buildHostel('pending');
      if (existing) updateHostel(h);
      else addHostel(h);
      setSaving(false);
      setDirty(false);
      navigate('/owner');
    }, 500);
  };

  const simulateUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 20 + Math.random() * 25;
      if (p >= 100) {
        clearInterval(t);
        setUploadProgress(100);
        const next = SAMPLE_IMAGES[images.length % SAMPLE_IMAGES.length];
        setImages(prev => [...prev, next]);
        markDirty();
        setTimeout(() => { setUploading(false); setUploadProgress(0); }, 300);
      } else setUploadProgress(Math.min(99, Math.floor(p)));
    }, 180);
  };

  const updateRoom = (idx: number, patch: Partial<RoomType>) => {
    setRooms(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    markDirty();
  };

  return (
    <div className="animate-fade-in bg-[#faf8f5] min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-slate-500 mb-3">
          <Link to="/owner" className="hover:text-teal-700">Owner dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-800">{isEdit ? 'Edit listing' : 'Add new hostel'}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {isEdit ? 'Edit listing' : 'List your hostel'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Takes ~10 minutes. Listings go live after admin review (under 24 hrs in production).
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
            {lastSaved ? `Draft · auto-saved ${lastSaved}` : 'Draft · not saved yet'}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => { if (s.id < step || validateStep(step)) setStep(s.id); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  step === s.id
                    ? 'bg-teal-600 text-white'
                    : step > s.id
                      ? 'bg-teal-50 text-teal-800'
                      : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {step > s.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">{s.id}</span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-4 sm:w-8 flex-shrink-0 ${step > s.id ? 'bg-teal-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_240px] gap-6">
          <div className="space-y-5">
            {step === 1 && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">Basic information</h2>
                <div>
                  <label className="text-sm font-medium text-slate-700">Hostel name *</label>
                  <input value={name} onChange={e => { setName(e.target.value); markDirty(); }}
                    className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="e.g. Shree Residency Boys Hostel" />
                  {errors.name && <p className="text-xs text-red-600 mt-1" role="alert">{errors.name}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select value={category} onChange={e => { setCategory(e.target.value as typeof category); markDirty(); }}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                      <option value="boys">Boys</option>
                      <option value="girls">Girls</option>
                      <option value="co-ed">Co-ed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Locality *</label>
                    <select value={locality} onChange={e => { setLocality(e.target.value); markDirty(); }}
                      className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm ${errors.locality ? 'border-red-400' : 'border-slate-200'}`}>
                      {LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Full address *</label>
                  <input value={address} onChange={e => { setAddress(e.target.value); markDirty(); }}
                    className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.address ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="House / street, Kota" />
                  {errors.address && <p className="text-xs text-red-600 mt-1" role="alert">{errors.address}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Nearby landmark / coaching</label>
                  <input value={landmark} onChange={e => { setLandmark(e.target.value); markDirty(); }}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    placeholder="e.g. Near Allen Sangyan, Talwandi" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea value={description} onChange={e => { setDescription(e.target.value); markDirty(); }} rows={4}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Tell students about food, study environment, distance from coachings…" />
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">Rooms & pricing</h2>
                {errors.rooms && <p className="text-sm text-red-600" role="alert">{errors.rooms}</p>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rooms.map((r, idx) => (
                    <div key={r.id} className="relative p-4 rounded-2xl border-2 border-teal-100 bg-teal-50/30">
                      {rooms.length > 1 && (
                        <button type="button" onClick={() => { setRooms(rs => rs.filter((_, i) => i !== idx)); markDirty(); }}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <input value={r.name} onChange={e => updateRoom(idx, { name: e.target.value })}
                        className="font-semibold text-slate-900 bg-transparent border-0 p-0 w-full focus:outline-none text-sm" />
                      <p className="text-2xl font-bold text-slate-900 mt-1">₹{r.rent.toLocaleString()}</p>
                      <div className="mt-2 space-y-1.5">
                        <select value={r.sharingType} onChange={e => {
                          const v = e.target.value as SharingType;
                          updateRoom(idx, {
                            sharingType: v,
                            capacity: v === 'single' ? 1 : v === 'double' ? 2 : v === 'triple' ? 3 : 4,
                          });
                        }} className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200">
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                          <option value="four">Four / Dorm</option>
                        </select>
                        <input type="number" value={r.rent} onChange={e => updateRoom(idx, { rent: Number(e.target.value) })}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200" placeholder="Monthly rent" />
                        <input type="number" value={r.deposit} onChange={e => updateRoom(idx, { deposit: Number(e.target.value) })}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200" placeholder="Deposit" />
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input type="checkbox" checked={r.available} onChange={e => updateRoom(idx, { available: e.target.checked })} /> Available
                        </label>
                      </div>
                      {(errors[`room-name-${idx}`] || errors[`room-rent-${idx}`]) && (
                        <p className="text-xs text-red-600 mt-1">{errors[`room-name-${idx}`] || errors[`room-rent-${idx}`]}</p>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => { setRooms(rs => [...rs, emptyRoom()]); markDirty(); }}
                    className="min-h-[140px] rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-700 flex flex-col items-center justify-center gap-1 text-sm">
                    <Plus className="w-5 h-5" />
                    Add room type
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Default refundable deposit *</label>
                    <input type="number" value={defaultDeposit} onChange={e => { setDefaultDeposit(Number(e.target.value)); markDirty(); }}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    <p className="text-xs text-slate-400 mt-1">Returned on checkout after room inspection.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Electricity</label>
                    <input value={electricity} onChange={e => { setElectricity(e.target.value); markDirty(); }}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="Actuals · sub-metered" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Extra charges (optional note)</label>
                  <input value={extraChargesNote} onChange={e => { setExtraChargesNote(e.target.value); markDirty(); }}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    placeholder="Laundry ₹400/mo · Cooler ₹300/mo (Apr–Jul)" />
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <div>
                  <h2 className="font-semibold text-lg text-slate-900">Amenities</h2>
                  <p className="text-sm text-slate-500 mt-1">Select all that apply — students report mismatches.</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {AMENITIES.map(a => {
                      const on = amenities.includes(a);
                      return (
                        <button key={a} type="button" onClick={() => {
                          setAmenities(prev => on ? prev.filter(x => x !== a) : [...prev, a]);
                          markDirty();
                        }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}>{a}</button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">House rules</label>
                  <textarea value={rules} onChange={e => { setRules(e.target.value); markDirty(); }} rows={4}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">Photos</h2>
                <p className="text-sm text-slate-500">Rooms, mess, exterior — min 1 photo for demo (production: 5+).</p>
                {errors.images && <p className="text-sm text-red-600" role="alert">{errors.images}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button type="button" onClick={simulateUpload} disabled={uploading}
                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-teal-400 transition-colors">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs font-medium">{uploading ? `Uploading ${uploadProgress}%` : 'Add cover photo'}</span>
                    {uploading && (
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    )}
                  </button>
                  {images.map((src, i) => (
                    <div key={src + i} className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 ${coverIndex === i ? 'border-teal-500' : 'border-transparent'}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                        <button type="button" onClick={() => setCoverIndex(i)} className="px-2 py-1 bg-white rounded-lg text-xs font-medium">
                          {coverIndex === i ? 'Cover' : 'Set cover'}
                        </button>
                        <button type="button" onClick={() => {
                          setImages(imgs => imgs.filter((_, j) => j !== i));
                          if (coverIndex >= images.length - 1) setCoverIndex(0);
                          markDirty();
                        }} className="p-1.5 bg-white rounded-lg text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {coverIndex === i && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-teal-600 text-white text-[10px] font-semibold rounded-full">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">Demo upload inserts sample Unsplash images — no real files leave your browser.</p>
              </Card>
            )}

            {step === 5 && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">Review & submit</h2>
                <div className="flex gap-4">
                  {images[0] && <img src={images[coverIndex] || images[0]} alt="" className="w-28 h-20 rounded-xl object-cover" />}
                  <div>
                    <p className="font-semibold text-slate-900">{name || 'Untitled hostel'}</p>
                    <p className="text-sm text-slate-500">{locality} · {category} · {address}</p>
                    <p className="text-xs text-slate-400 mt-1">{rooms.length} room types · {amenities.length} amenities · {images.length} photos</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100 text-sm">
                  {rooms.map(r => (
                    <li key={r.id} className="py-2 flex justify-between">
                      <span>{r.name} ({r.sharingType})</span>
                      <span className="font-medium">₹{r.rent.toLocaleString()}/mo · dep ₹{r.deposit.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Submitting sets status to <strong>Pending Review</strong>. An admin must approve before the listing appears on Explore.
                    This is a frontend simulation — no real notification is sent.
                  </p>
                </div>
              </Card>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step > 1 ? (
                <Button variant="outline" className="rounded-xl" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <Link to="/owner">
                  <Button variant="outline" className="rounded-xl"><ChevronLeft className="w-4 h-4" /> Dashboard</Button>
                </Link>
              )}
              <div className="flex-1" />
              <Button variant="outline" className="rounded-xl" loading={saving} onClick={saveDraft}>Save draft</Button>
              {step < 5 ? (
                <Button className="rounded-xl" onClick={goNext}>Continue <ChevronRight className="w-4 h-4" /></Button>
              ) : (
                <Button className="rounded-xl" loading={saving} onClick={submitForReview}>Submit for review</Button>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="p-4 sticky top-24">
              <p className="text-sm font-semibold text-slate-900">Listing strength</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${strength}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">{strength}% complete</p>
              <p className="text-xs text-slate-400 mt-1">
                {strength < 90 ? 'Add photos + amenities to strengthen this listing.' : 'Looking good for review.'}
              </p>
            </Card>
            <Card className="p-4 bg-amber-50 border-amber-100">
              <p className="text-sm font-medium text-amber-900">Tip for Kota owners</p>
              <p className="text-xs text-amber-800 mt-1">
                Clear rent breakup and real mess photos reduce student mismatches after visits.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
