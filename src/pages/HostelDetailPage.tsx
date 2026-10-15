import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Heart, Share2, Check, Calendar, Phone,
  Shield, Wifi, Wind, Utensils, Droplets, X, ChevronLeft, ChevronRight,
  Camera, Zap, Car, BookOpen, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DEMO_NOTE } from '../data/mockData';
import type { RoomType } from '../types';

const amenityMeta: Record<string, { icon: React.ReactNode; label: string }> = {
  Meals: { icon: <Utensils className="w-3.5 h-3.5" />, label: 'Mess (veg)' },
  WiFi: { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Wi-Fi' },
  Laundry: { icon: <Droplets className="w-3.5 h-3.5" />, label: 'Laundry' },
  CCTV: { icon: <Eye className="w-3.5 h-3.5" />, label: 'CCTV & warden' },
  'Power Backup': { icon: <Zap className="w-3.5 h-3.5" />, label: 'Power backup' },
  'Study Room': { icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Study hall' },
  'RO Water': { icon: <Droplets className="w-3.5 h-3.5" />, label: 'RO water' },
  Parking: { icon: <Car className="w-3.5 h-3.5" />, label: 'Parking' },
  AC: { icon: <Wind className="w-3.5 h-3.5" />, label: 'AC' },
  'Hot Water': { icon: <Droplets className="w-3.5 h-3.5" />, label: 'Hot water' },
  Gym: { icon: <Zap className="w-3.5 h-3.5" />, label: 'Gym' },
  Housekeeping: { icon: <Check className="w-3.5 h-3.5" />, label: 'Housekeeping' },
};

const HOUSE_RULES = [
  'Gate closes at 10:30 PM',
  'Visitors allowed till 7 PM in common room',
  'No smoking or alcohol on premises',
  '1 month notice before vacating',
];

export function HostelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hostels, user, toggleFavourite, isFavourite, scheduleVisit } = useApp();
  const navigate = useNavigate();
  const hostel = hostels.find(h => h.id === id && h.status === 'approved');

  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'idle' | 'date' | 'confirm' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!hostel) return;
    const available = hostel.roomTypes.filter(r => r.available);
    if (available.length === 0) return;
    const sorted = [...available].sort((a, b) => a.rent - b.rent);
    const double = sorted.find(r => r.sharingType === 'double');
    setSelectedRoom(double || sorted[0]);
  }, [hostel]);

  if (!hostel) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">Hostel not found</h1>
        <p className="mt-2 text-slate-500">This listing may be pending approval or does not exist.</p>
        <Link to="/explore" className="mt-6 inline-block text-teal-600 font-medium hover:underline">← Browse hostels</Link>
      </div>
    );
  }

  const images = hostel.images.length > 0 ? hostel.images : [hostel.coverImage];
  const galleryImages = images.length >= 4 ? images : [...images, ...Array(Math.max(0, 4 - images.length)).fill(hostel.coverImage)];
  const fav = isFavourite(hostel.id);
  const minRent = Math.min(...hostel.roomTypes.map(r => r.rent));
  const depositForSelected = selectedRoom?.deposit;
  const categoryLabel = hostel.category === 'boys' ? 'Boys' : hostel.category === 'girls' ? 'Girls' : 'Co-ed';

  const mostPopularId = useMemo(() => {
    const doubles = hostel.roomTypes.filter(r => r.sharingType === 'double' && r.available);
    if (doubles.length) return doubles.sort((a, b) => a.rent - b.rent)[0].id;
    const avail = hostel.roomTypes.filter(r => r.available);
    return avail.length ? avail.sort((a, b) => a.rent - b.rent)[0].id : null;
  }, [hostel]);

  const openGallery = (index: number) => { setGalleryIndex(index); setGalleryOpen(true); };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: hostel.name, url });
      else { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
    } catch {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const startVisitFlow = () => {
    setError('');
    if (!user || user.role !== 'student') {
      navigate(`/login?role=student&redirect=${encodeURIComponent(`/hostel/${id}`)}`);
      return;
    }
    setStep('date');
  };

  const goToConfirm = () => {
    setError('');
    if (!visitDate) { setError('Please select a visit date'); return; }
    if (visitDate < today) { setError('Visit date cannot be in the past'); return; }
    setStep('confirm');
  };

  const submitVisit = () => {
    if (step === 'submitting') return;
    setError('');
    setStep('submitting');
    setTimeout(() => {
      try {
        scheduleVisit({
          hostelId: hostel.id,
          hostelName: hostel.name,
          roomTypeId: selectedRoom?.id,
          roomTypeName: selectedRoom?.name,
          visitDate,
          message: message.trim() || undefined,
        });
        setStep('success');
      } catch {
        setError('Something went wrong. Please try again.');
        setStep('error');
      }
    }, 600);
  };

  const formatDisplayDate = (iso: string) => {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return iso; }
  };

  return (
    <div className="animate-fade-in bg-[#faf8f5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 flex-wrap">
          <Link to="/" className="hover:text-teal-700">Home</Link>
          <span>/</span>
          <Link to={`/explore?locality=${encodeURIComponent(hostel.locality)}`} className="hover:text-teal-700">{hostel.locality}</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate">{hostel.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{hostel.name}</h1>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{categoryLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600 flex-wrap">
              <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span>{hostel.address}</span>
              <span className="text-slate-300">·</span>
              <button type="button" className="text-teal-700 font-medium hover:underline">View on map</button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {user?.role === 'student' && (
              <button onClick={() => toggleFavourite(hostel.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  fav ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}>
                <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                {fav ? 'Saved' : 'Save'}
              </button>
            )}
            <button onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300">
              <Share2 className="w-4 h-4" />
              {shareCopied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden mb-8">
          <button type="button" onClick={() => openGallery(0)}
            className="md:col-span-2 md:row-span-2 relative aspect-[4/3] md:aspect-auto md:min-h-[320px] bg-slate-100 group">
            <img src={galleryImages[0]} alt={hostel.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'; }} />
          </button>
          {[1, 2, 3].map((i) => (
            <button key={i} type="button" onClick={() => openGallery(i)}
              className={`relative aspect-[4/3] bg-slate-100 group overflow-hidden ${i === 3 ? 'hidden sm:block' : ''}`}>
              <img src={galleryImages[i] || hostel.coverImage} alt=""
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = hostel.coverImage; }} />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium text-sm">
                  <Camera className="w-4 h-4 mr-1.5" />+{images.length - 3} photos
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About this hostel</h2>
              <p className="text-slate-600 leading-relaxed">{hostel.description}</p>
              <p className="mt-3 text-xs text-slate-400">{DEMO_NOTE}</p>

              <h3 className="font-semibold text-slate-900 mt-6 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {hostel.amenities.map(a => {
                  const meta = amenityMeta[a] || { icon: <Check className="w-3.5 h-3.5" />, label: a };
                  return (
                    <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-sm text-slate-700">
                      {meta.icon}{meta.label}
                    </span>
                  );
                })}
              </div>

              <h3 className="font-semibold text-slate-900 mt-6 mb-3">House rules</h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {HOUSE_RULES.map(rule => (
                  <div key={rule} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Room types & rent</h2>
              <p className="text-sm text-slate-500 mb-5">Rent is monthly. Deposit and extras are separate — see breakup below.</p>

              <div className="grid sm:grid-cols-3 gap-4">
                {hostel.roomTypes.map(rt => {
                  const isSelected = selectedRoom?.id === rt.id;
                  const isPopular = rt.id === mostPopularId;
                  return (
                    <div key={rt.id}
                      className={`relative rounded-2xl border-2 p-4 transition-all ${
                        isSelected ? 'border-teal-500 bg-teal-50/40 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                      } ${!rt.available ? 'opacity-60' : ''}`}>
                      {isPopular && rt.available && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-semibold uppercase tracking-wide">
                          Most popular
                        </span>
                      )}
                      <h3 className="font-semibold text-slate-900 text-sm mt-1">{rt.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {rt.capacity} bed{rt.capacity > 1 ? 's' : ''}
                        {rt.sharingType === 'single' ? ' · attached bath' : ' · common bath'}
                      </p>
                      <div className="mt-3">
                        <span className="text-xl font-bold text-slate-900">₹{rt.rent.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">/mo</span>
                      </div>
                      <p className="text-xs mt-1">
                        {rt.available
                          ? <span className="text-emerald-600 font-medium">Available</span>
                          : <span className="text-amber-600 font-medium">Currently full</span>}
                      </p>
                      <Button size="sm" variant={isSelected ? 'primary' : 'outline'} className="w-full mt-3 rounded-xl"
                        disabled={!rt.available} onClick={() => setSelectedRoom(rt)}>
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {selectedRoom && (
                <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-5">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3">Transparent price breakup ({selectedRoom.name})</h3>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Monthly rent</dt>
                      <dd className="font-medium text-slate-900">₹{selectedRoom.rent.toLocaleString()}</dd>
                    </div>
                    {selectedRoom.included.map(item => (
                      <div key={item} className="flex justify-between">
                        <dt className="text-slate-600">{item}</dt>
                        <dd className="text-slate-500">Included</dd>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Refundable deposit (one-time)</dt>
                      <dd className="font-medium text-slate-900">
                        {selectedRoom.deposit > 0 ? `₹${selectedRoom.deposit.toLocaleString()}` : 'Not specified'}
                      </dd>
                    </div>
                    {selectedRoom.extraCharges.map(ec => (
                      <div key={ec.name} className="flex justify-between">
                        <dt className="text-slate-600">{ec.name}{ec.optional ? ' (optional)' : ''}</dt>
                        <dd className="font-medium text-slate-900">₹{ec.amount.toLocaleString()}{ec.optional ? ' / month' : ''}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <dt className="text-slate-600">Electricity</dt>
                      <dd className="text-slate-500">Actuals, sub-metered</dd>
                    </div>
                  </dl>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5 shadow-md border-slate-100">
                {step === 'success' ? (
                  <div className="text-center py-4 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-slide-up">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-bold text-emerald-800">Visit Confirmed</p>
                    <p className="text-sm text-slate-600 mt-2">
                      <strong>{formatDisplayDate(visitDate)}</strong>
                      {selectedRoom && <> · {selectedRoom.name}</>}
                    </p>
                    <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                      Exact visit time will be coordinated with the owner later.
                    </p>
                    <p className="text-xs text-slate-400 mt-4 px-2">
                      This is a <strong>visit request</strong>, not a room reservation or payment.
                      Demo only — nothing was emailed or messaged.
                    </p>
                    <Button variant="outline" className="mt-5 w-full rounded-xl"
                      onClick={() => { setStep('idle'); setVisitDate(''); setMessage(''); }}>
                      Request another visit
                    </Button>
                    <Link to="/visits" className="block mt-3 text-sm text-teal-700 font-medium hover:underline">
                      View my visits →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">₹{(selectedRoom?.rent ?? minRent).toLocaleString()}</span>
                        <span className="text-sm text-slate-500">onwards / month</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {depositForSelected != null && depositForSelected > 0
                          ? `+ ₹${depositForSelected.toLocaleString()} refundable deposit`
                          : 'Deposit not specified'}
                        {' · No brokerage'}
                      </p>
                    </div>

                    {(step === 'date' || step === 'confirm' || step === 'submitting' || step === 'error') && (
                      <div className="mb-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Visit date</label>
                          <input type="date" min={today} value={visitDate}
                            onChange={e => { setVisitDate(e.target.value); setError(''); }}
                            disabled={step === 'confirm' || step === 'submitting'}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50" />
                          <p className="text-xs text-slate-400 mt-1">Date only — no time selection</p>
                        </div>
                        {step === 'date' && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optional)</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
                              placeholder="Any questions for the owner…"
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                          </div>
                        )}
                      </div>
                    )}

                    {step === 'confirm' && (
                      <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-100 text-sm">
                        <p className="font-medium text-teal-900">Confirm visit request</p>
                        <p className="text-teal-800 mt-1">{hostel.name}</p>
                        <p className="text-teal-700 mt-0.5">
                          {formatDisplayDate(visitDate)}
                          {selectedRoom && ` · ${selectedRoom.name}`}
                        </p>
                        <p className="text-xs text-teal-600 mt-2">Not a reservation. Owner will coordinate exact time later.</p>
                      </div>
                    )}

                    {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                    {step === 'idle' && (
                      <Button className="w-full rounded-xl" size="lg" onClick={startVisitFlow}>
                        <Calendar className="w-4 h-4" /> Request a visit
                      </Button>
                    )}
                    {step === 'date' && (
                      <div className="space-y-2">
                        <Button className="w-full rounded-xl" size="lg" onClick={goToConfirm}>Continue</Button>
                        <Button variant="ghost" className="w-full" onClick={() => setStep('idle')}>Cancel</Button>
                      </div>
                    )}
                    {step === 'confirm' && (
                      <div className="space-y-2">
                        <Button className="w-full rounded-xl" size="lg" onClick={submitVisit}>Confirm visit request</Button>
                        <Button variant="ghost" className="w-full" onClick={() => setStep('date')}>Back</Button>
                      </div>
                    )}
                    {step === 'submitting' && (
                      <Button className="w-full rounded-xl" size="lg" disabled loading>Submitting…</Button>
                    )}
                    {step === 'error' && (
                      <Button className="w-full rounded-xl" size="lg" onClick={submitVisit}>Try again</Button>
                    )}

                    <button type="button"
                      className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => alert('Demo only: owner contact would open here. No real call is placed.')}>
                      <Phone className="w-4 h-4" /> Call owner
                    </button>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-semibold text-sm flex-shrink-0">RS</div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Hostel Owner</p>
                        <p className="text-xs text-slate-500">On StayKota · Demo listing</p>
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-teal-600" />
                          Never pay token money online. Always visit first.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">{galleryIndex + 1} / {images.length}</span>
            <button onClick={() => setGalleryOpen(false)} className="p-2 rounded-full hover:bg-white/10" aria-label="Close gallery">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-4">
            <button onClick={() => setGalleryIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img src={images[galleryIndex]} alt="" className="max-h-[80vh] max-w-full object-contain rounded-lg" />
            <button onClick={() => setGalleryIndex(i => (i + 1) % images.length)}
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex justify-center gap-2 pb-6 overflow-x-auto px-4">
            {images.map((src, i) => (
              <button key={i} onClick={() => setGalleryIndex(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                  i === galleryIndex ? 'border-white' : 'border-transparent opacity-60'
                }`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
