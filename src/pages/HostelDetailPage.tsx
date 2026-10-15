import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Heart, ArrowLeft, Check, BedDouble, Calendar, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DEMO_NOTE } from '../data/mockData';
import type { RoomType } from '../types';

export function HostelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hostels, user, toggleFavourite, isFavourite, scheduleVisit } = useApp();
  const navigate = useNavigate();
  const hostel = hostels.find(h => h.id === id && h.status === 'approved');
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [message, setMessage] = useState('');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  if (!hostel) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Hostel not found</h1>
        <p className="mt-2 text-slate-500">This listing may be pending approval or does not exist.</p>
        <Link to="/" className="mt-6 inline-block text-teal-600 font-medium">← Back to hostels</Link>
      </div>
    );
  }

  const fav = isFavourite(hostel.id);
  const images = hostel.images.length > 0 ? hostel.images : [hostel.coverImage];

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user || user.role !== 'student') {
      navigate('/login?role=student&redirect=' + encodeURIComponent(`/hostel/${id}`));
      return;
    }
    if (!visitDate) { setError('Please select a visit date'); return; }
    if (visitDate < today) { setError('Visit date cannot be in the past'); return; }
    scheduleVisit({
      hostelId: hostel.id, hostelName: hostel.name,
      roomTypeId: selectedRoom?.id, roomTypeName: selectedRoom?.name,
      visitDate, message: message.trim() || undefined,
    });
    setSuccess(true);
    setShowVisitForm(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to hostels
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden bg-slate-100">
              <img src={images[0]} alt={hostel.name} className="w-full aspect-[16/10] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'; }} />
            </div>
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="teal">Verified</Badge>
                    <Badge className="capitalize">{hostel.category}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">{hostel.name}</h1>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-600"><MapPin className="w-4 h-4" /><span>{hostel.address}</span></div>
                </div>
                {user?.role === 'student' && (
                  <button onClick={() => toggleFavourite(hostel.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${fav ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />{fav ? 'Saved' : 'Save'}
                  </button>
                )}
              </div>
              <p className="mt-4 text-slate-600">{hostel.description}</p>
              <p className="mt-2 text-xs text-slate-400">{DEMO_NOTE}</p>
            </div>
            <Card className="p-5">
              <h2 className="font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hostel.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-teal-600" />{a}</div>
                ))}
              </div>
            </Card>
            <div>
              <h2 className="font-semibold text-xl mb-4">Room options</h2>
              <div className="space-y-4">
                {hostel.roomTypes.map(rt => (
                  <Card key={rt.id} className={`p-5 ${selectedRoom?.id === rt.id ? 'ring-2 ring-teal-500' : ''} ${!rt.available ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{rt.name}</h3>
                          {!rt.available && <Badge variant="warning">Full</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{rt.sharingType} · {rt.capacity} person{rt.capacity > 1 ? 's' : ''}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600"><span className="font-medium">Included:</span> {rt.included.join(', ')}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold">₹{rt.rent.toLocaleString()}</div>
                        <div className="text-sm text-slate-500">/month</div>
                        <div className="text-xs text-slate-400 mt-1">Deposit ₹{rt.deposit.toLocaleString()}</div>
                        {rt.available && (
                          <Button size="sm" variant={selectedRoom?.id === rt.id ? 'primary' : 'outline'} className="mt-3"
                            onClick={() => { setSelectedRoom(rt); setShowVisitForm(true); setSuccess(false); }}>
                            Schedule visit
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-1">Schedule a visit</h3>
                <p className="text-sm text-slate-500 mb-4">Select a date only. Exact time coordinated with owner later.</p>
                {success ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-emerald-600" /></div>
                    <p className="font-semibold text-emerald-800">Visit Confirmed!</p>
                    <p className="text-sm text-slate-600 mt-2">Frontend simulation. Owner will coordinate exact time.</p>
                    <p className="text-xs text-slate-400 mt-3">This is <strong>not</strong> a room reservation.</p>
                  </div>
                ) : showVisitForm || selectedRoom ? (
                  <form onSubmit={handleSchedule} className="space-y-4">
                    {selectedRoom && (
                      <div className="p-3 bg-teal-50 rounded-xl text-sm">
                        <span className="font-medium text-teal-800">{selectedRoom.name}</span>
                        <span className="text-teal-600"> · ₹{selectedRoom.rent.toLocaleString()}/mo</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Visit date *</label>
                      <input type="date" min={today} value={visitDate} onChange={e => setVisitDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                      <p className="text-xs text-slate-400 mt-1">Date only — no time selection</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optional)</label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                        placeholder="Any specific questions..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" className="w-full"><Calendar className="w-4 h-4" /> Confirm visit request</Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-4">Select a room type above to schedule a visit</p>
                    <Button variant="outline" className="w-full" onClick={() => setShowVisitForm(true)}>Schedule general visit</Button>
                  </div>
                )}
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 text-sm text-slate-600"><Shield className="w-4 h-4 text-teal-600" /><span>Listing reviewed by admin</span></div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
