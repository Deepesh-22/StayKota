import { locationLabel } from '../lib/location-status';
import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, BedDouble, BookOpen, Calendar, Camera, Check,
  CheckCircle2, ChevronLeft, ChevronRight, Clock3, Droplets, Flag, Heart,
  Info, MapPin, Share2, ShieldCheck, Users, Utensils, Wifi, Wind, X, Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RoomShowcase } from '../components/hostel/RoomShowcase';
import { CAMPUSES } from '../data/campuses';
import { distanceKm, formatDistance, getCampus, getMatchingRooms, monthlyTotal } from '../lib/discovery';
import type { RoomType, VisitRequest } from '../types';
import '../styles/detail.css';

const money = (amount: number) => '₹' + amount.toLocaleString('en-IN');
const localToday = () => {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
};
const readableDate = (value: string) => new Date(value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const imageFallback = (event: SyntheticEvent<HTMLImageElement>) => {
  if (!event.currentTarget.src.endsWith('/images/room-shared.webp')) event.currentTarget.src = '/images/room-shared.webp';
};

const amenityIcons: Record<string, ReactNode> = {
  WiFi: <Wifi />, AC: <Wind />, Meals: <Utensils />, Laundry: <Droplets />,
  'Study Room': <BookOpen />, 'Power Backup': <Zap />, 'Hot Water': <Droplets />,
  'RO Water': <Droplets />, CCTV: <ShieldCheck />,
};
const amenityLabel = (value: string) => ({ WiFi: 'Wi-Fi', Meals: 'Mess facility', CCTV: 'CCTV', 'Study Room': 'Study space' }[value] || value);

function DetailDialog({ open, onClose, title, children, gallery = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; gallery?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return (
    <dialog ref={ref} className={'detail-dialog' + (gallery ? ' detail-dialog--gallery' : '')}
      aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="detail-dialog__inner">
        <div className="detail-dialog__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="detail-icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function RoomPrice({ room, electricity, notes }: { room: RoomType; electricity?: string; notes?: string }) {
  const mandatory = room.extraCharges.filter(charge => !charge.optional);
  const optional = room.extraCharges.filter(charge => charge.optional);
  return (
    <div className="detail-price">
      <div className="detail-price__label">PER STUDENT · PER MONTH</div>
      <dl>
        <div><dt>Room rent</dt><dd>{money(room.rent)}</dd></div>
        {mandatory.map((charge, index) => <div key={charge.name + index}><dt>{charge.name}</dt><dd>{money(charge.amount)}</dd></div>)}
        <div className="detail-price__total"><dt>Fixed monthly total</dt><dd>{money(monthlyTotal(room))}</dd></div>
        <div><dt>Electricity</dt><dd>{electricity || 'Confirm charging policy with owner'}</dd></div>
        <div className="detail-price__deposit"><dt>Refundable deposit <small>One-time · refund terms apply</small></dt><dd>{money(room.deposit)}</dd></div>
      </dl>
      {room.included.length > 0 && <p className="detail-price__included"><Check size={14} /> Included in rent: {room.included.map(amenityLabel).join(', ')}</p>}
      {optional.length > 0 && <p className="detail-price__optional">Optional: {optional.map(charge => charge.name + ' ' + money(charge.amount) + '/month').join(' · ')}. Not included in the fixed total.</p>}
      {notes && <p className="detail-price__optional">{notes}</p>}
    </div>
  );
}

export function HostelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hostels, user, toggleFavourite, isFavourite, scheduleVisit, updateProfile } = useApp();
  const hostel = hostels.find(item => item.id === id && item.status === 'approved');
  const campus = getCampus(searchParams.get('campus'));
  const availableRooms = hostel ? getMatchingRooms(hostel) : [];
  const roomId = searchParams.get('room');
  const selectedRoom = availableRooms.find(room => room.id === roomId)
    || availableRooms.find(room => room.sharingType === 'double') || availableRooms[0];
  const galleryImages = hostel ? [...new Set([hostel.coverImage, ...hostel.images].filter(Boolean))] : [];
  if (!galleryImages.length) galleryImages.push('/images/room-shared.webp');

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [visitError, setVisitError] = useState('');
  const [receipt, setReceipt] = useState<VisitRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Incorrect price or availability');
  const [reportSaved, setReportSaved] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    setGalleryOpen(false);
    setGalleryIndex(0);
    setVisitOpen(false);
    setReceipt(null);
    setShareState('idle');
  }, [id]);
  useEffect(() => {
    if (visitOpen && !receipt) setPhone(user?.phone || '');
  }, [visitOpen, user?.phone, receipt]);
  useEffect(() => {
    if (user?.role === 'student' && searchParams.get('request') === 'visit' && selectedRoom) {
      setVisitOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete('request');
      setSearchParams(params, { replace: true });
    }
  }, [user?.role, searchParams, selectedRoom, setSearchParams]);
  useEffect(() => { if (receipt) receiptHeading.current?.focus(); }, [receipt]);
  useEffect(() => {
    if (shareState !== 'copied') return;
    const timeout = window.setTimeout(() => setShareState('idle'), 3500);
    return () => window.clearTimeout(timeout);
  }, [shareState]);
  useEffect(() => {
    if (!galleryOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      setGalleryIndex(index => (index + (event.key === 'ArrowRight' ? 1 : -1) + galleryImages.length) % galleryImages.length);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [galleryOpen, galleryImages.length]);

  if (!hostel) return (
    <section className="detail-not-found">
      <MapPin size={40} strokeWidth={1.3} />
      <p className="detail-eyebrow">A DIFFERENT TURN</p>
      <h1>This stay isn’t on the map.</h1>
      <p>The listing may be unavailable or awaiting review. Let’s find another room near your campus.</p>
      <Link className="detail-primary" to={'/explore?campus=' + campus.id}><ArrowLeft size={17} /> Explore hostels</Link>
    </section>
  );

  const displayedImage = galleryImages[galleryIndex % galleryImages.length] || '/images/room-shared.webp';
  const saved = isFavourite(hostel.id);
  const distance = distanceKm(hostel, campus);
  const category = hostel.category === 'co-ed' ? 'Co-ed stay' : hostel.category === 'girls' ? 'Girls hostel' : 'Boys hostel';
  const directionsUrl = 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(hostel.address);
  const viewRoom = (room: RoomType) => {
    if (!room.available) return;
    const params = new URLSearchParams(searchParams);
    params.set('campus', campus.id);
    params.set('room', room.id);
    setSearchParams(params, { replace: true });
  };
  const loginRedirect = (request = false) => {
    const params = new URLSearchParams(searchParams);
    params.set('campus', campus.id);
    if (selectedRoom) params.set('room', selectedRoom.id);
    if (request) params.set('request', 'visit');
    navigate('/login?role=student&redirect=' + encodeURIComponent('/hostel/' + hostel.id + '?' + params.toString()));
  };
  const startVisit = () => {
    if (!selectedRoom) return;
    if (user?.role !== 'student') { loginRedirect(true); return; }
    setReceipt(null);
    setConsent(false);
    setVisitError('');
    submittingRef.current = false;
    setVisitOpen(true);
  };
  const handleSave = () => user?.role === 'student' ? toggleFavourite(hostel.id) : loginRedirect();
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: hostel.name + ' · StayKota', url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      setShareState('copied');
    } catch { setShareState('manual'); }
  };
  const submitVisit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setVisitError('');
    if (!selectedRoom || !selectedRoom.available) { setVisitError('Choose an available room before requesting a visit.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || visitDate < localToday()) { setVisitError('Choose today or a future date for your visit.'); return; }
    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) { setVisitError('Enter a valid 10-digit Indian mobile number.'); return; }
    if (!consent) { setVisitError('Please agree to sharing your contact details for this visit.'); return; }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const request = scheduleVisit({
        hostelId: hostel.id, hostelName: hostel.name, roomTypeId: selectedRoom.id,
        roomTypeName: selectedRoom.name, visitDate, message: message.trim() || undefined,
        studentPhone: '+91' + normalizedPhone, consentAt: new Date().toISOString(),
      });
      updateProfile({ phone: '+91' + normalizedPhone });
      setReceipt(request);
    } catch (error) {
      setVisitError(error instanceof Error ? error.message : 'We couldn’t save this request. Please try again.');
      submittingRef.current = false;
    } finally { setSubmitting(false); }
  };
  const saveReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportError('');
    try {
      const value = localStorage.getItem('staykota_reports');
      const existing: unknown = value ? JSON.parse(value) : [];
      const reports = Array.isArray(existing) ? existing : [];
      localStorage.setItem('staykota_reports', JSON.stringify([{
        id: 'report-' + Date.now(), hostelId: hostel.id, hostelName: hostel.name,
        reason: reportReason, reporter: user?.name || 'Visitor', createdAt: new Date().toISOString(), status: 'open',
      }, ...reports]));
      setReportSaved(true);
    } catch { setReportError('Your browser could not save this report. Please try again.'); }
  };

  return (
    <div className="detail-page">
      <div className="detail-shell">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link to={'/explore?campus=' + campus.id}><ArrowLeft size={15} /> Back to nearby stays</Link>
          <span aria-hidden="true">/</span><span>{hostel.name}</span>
        </nav>

        <header className="detail-heading">
          <div>
            <div className="detail-heading__top"><span className="detail-eyebrow">A LITTLE CLOSER TO YOUR NEXT CHAPTER</span><span className="detail-category">{category}</span></div>
            <h1>{hostel.name}</h1>
            <p><MapPin size={16} /> {hostel.locality}, Kota <span className="detail-heading__dot">·</span> <a href="#detail-location">See neighbourhood <ArrowUpRight size={14} /></a></p>
          </div>
          <div className="detail-heading__actions">
            <button type="button" className={'detail-outline' + (saved ? ' is-saved' : '')} onClick={handleSave} aria-pressed={saved}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save stay'}</button>
            <button type="button" className="detail-outline" onClick={handleShare}><Share2 size={17} />{shareState === 'copied' ? 'Link copied' : 'Share'}</button>
          </div>
        </header>
        {shareState === 'copied' && <p className="detail-notice" role="status">Link copied. Share this room with a parent or friend.</p>}
        {shareState === 'manual' && <div className="detail-share-fallback" role="status"><label htmlFor="detail-share-link">Copy this link to share your selected room</label><input id="detail-share-link" value={window.location.href} readOnly onFocus={event => event.target.select()} /></div>}

        <section className={'detail-gallery' + (galleryImages.length === 1 ? ' detail-gallery--single' : '')} aria-label="Hostel photos">
          <button type="button" className="detail-gallery__main" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }} aria-label="Open hostel photo gallery">
            <img src={galleryImages[0] || '/images/room-shared.webp'} alt={'Illustrative room photo for ' + hostel.name} onError={imageFallback} fetchPriority="high" />
            <span className="detail-gallery__caption"><BedDouble size={15} /> A space to settle in</span>
          </button>
          {galleryImages.length > 1 && <div className={'detail-gallery__side' + (galleryImages.length === 2 ? ' detail-gallery__side--single' : '')}>
            {galleryImages.slice(1, 3).map((image, index) => <button type="button" key={image} onClick={() => { setGalleryIndex(index + 1); setGalleryOpen(true); }} aria-label={'View hostel photo ' + (index + 2)}>
              <img src={image} alt={'Illustrative property photo ' + (index + 2)} onError={imageFallback} />
              {index === Math.min(galleryImages.length - 2, 1) && <span className="detail-gallery__all"><Camera size={15} /> View all photos</span>}
            </button>)}
          </div>}
          <span className="detail-gallery__sample">Illustrative photos · sample listing</span>
        </section>

        <div className="detail-campus-strip">
          <span className="detail-campus-strip__icon"><MapPin size={21} /></span>
          <div><span className="detail-eyebrow">YOUR DAILY COMMUTE</span><p><strong>{formatDistance(distance)}</strong> from {campus.name}<span>Approximate straight-line distance · demo locations</span></p></div>
          <label className="detail-campus-select"><span className="sr-only">Choose coaching campus</span><select value={campus.id} onChange={event => { const params = new URLSearchParams(searchParams); params.set('campus', event.target.value); setSearchParams(params, { replace: true }); }}>{CAMPUSES.map(item => <option key={item.id} value={item.id}>{item.institute} · {item.name}</option>)}</select></label>
        </div>

        <div className="detail-columns">
          <div className="detail-main">
            <section className="detail-section" id="detail-rooms" aria-labelledby="room-heading">
              <div className="detail-section__heading"><div><p className="detail-eyebrow">FIND YOUR FIT</p><h2 id="room-heading">One hostel. Your kind of room.</h2></div><span className="detail-tiny-note">Per student / month</span></div>
              <p className="detail-section__intro">A little privacy or a little company? Choose a room to see its full monthly cost.</p>
              <div className="detail-room-options">
                {hostel.roomTypes.map(room => <button key={room.id} type="button" disabled={!room.available} onClick={() => viewRoom(room)} aria-pressed={selectedRoom?.id === room.id} className={'detail-room-option' + (selectedRoom?.id === room.id ? ' is-selected' : '')}>
                  <span className="detail-room-option__icon"><BedDouble size={25} strokeWidth={1.3} />{selectedRoom?.id === room.id && <span><Check size={12} /></span>}</span>
                  <span className="detail-room-option__name">{room.name}</span>
                  <strong>{money(monthlyTotal(room))}<small>/month</small></strong>
                  <span className={'detail-room-option__availability' + (!room.available ? ' is-full' : '')}>{room.available ? 'Available in demo' : 'Currently full'}</span>
                </button>)}
              </div>
              {selectedRoom && <div className="detail-room-scene" key={'scene-' + selectedRoom.id}><div><span className="detail-eyebrow">A LITTLE ROOM TO IMAGINE</span><h3>{selectedRoom.name}</h3><p>Room layout illustration.<br />Not a measured floor plan.</p></div><RoomShowcase capacity={selectedRoom.capacity} /></div>}
              {selectedRoom ? <div className="detail-room-facts" key={selectedRoom.id}>
                <div><Users size={17} /><span>{selectedRoom.capacity} {selectedRoom.capacity === 1 ? 'student' : 'students'} per room</span></div>
                {selectedRoom.features.map((feature, index) => <div key={feature + index}><Check size={17} /><span>{feature}</span></div>)}
              </div> : <div className="detail-info"><Info size={18} /><p>No room is currently available. Try another stay near your campus.</p></div>}
            </section>

            <section className="detail-section detail-section--cost" aria-labelledby="cost-heading">
              <div className="detail-section__heading"><div><p className="detail-eyebrow">NO GUESSWORK</p><h2 id="cost-heading">Know what you’ll pay.</h2></div></div>
              <p className="detail-section__intro">Monthly charges and your one-time deposit, kept separate.</p>
              {selectedRoom ? <RoomPrice room={selectedRoom} electricity={hostel.electricityPolicy} notes={hostel.extraChargesNote} /> : <p>Select an available room to see its costs.</p>}
            </section>

            <section className="detail-section" aria-labelledby="life-heading">
              <div className="detail-section__heading"><div><p className="detail-eyebrow">THE EVERYDAY DETAILS</p><h2 id="life-heading">A place for your routine.</h2></div></div>
              <p className="detail-about">{hostel.description}</p>
              <div className="detail-amenities">{hostel.amenities.map(amenity => <div key={amenity}><span>{amenityIcons[amenity] || <Check />}</span><p>{amenityLabel(amenity)}</p></div>)}</div>
              <p className="detail-small-print">Hostel facilities can differ from room inclusions. Check your selected room’s features and costs above.</p>
            </section>

            <section className="detail-section" aria-labelledby="rules-heading">
              <div className="detail-section__heading"><div><p className="detail-eyebrow">GOOD TO KNOW</p><h2 id="rules-heading">Before you move in.</h2></div></div>
              {hostel.houseRules?.length ? <ul className="detail-rules">{hostel.houseRules.map((rule, index) => <li key={rule + index}><Check size={17} /><span>{rule}</span></li>)}</ul> : <p className="detail-about">House rules haven’t been provided. Ask the owner about gate timings, visitors, notice periods and deposit refunds before deciding.</p>}
              <div className="detail-info"><Info size={18} /><p><strong>Owner-provided information.</strong> This is a sample listing, not an independently verified property. Confirm the room, costs and policies in person.</p></div>
            </section>

            <section className="detail-section" id="detail-location" aria-labelledby="location-heading">
              <div className="detail-section__heading"><div><p className="detail-eyebrow">YOUR NEW NEIGHBOURHOOD</p><h2 id="location-heading">A little closer to class.</h2></div></div>
              <div className="detail-location-card">
                <div className="detail-map-art" aria-hidden="true"><span className="detail-map-art__road road-one" /><span className="detail-map-art__road road-two" /><span className="detail-map-art__road road-three" /><span className="detail-map-art__park" /><span className="detail-map-art__pin"><MapPin size={24} fill="currentColor" /></span><span className="detail-map-art__campus"><BookOpen size={17} /></span><small>Illustrative neighbourhood</small></div>
                <div className="detail-location-card__copy"><span className="detail-category">{hostel.locality}</span><h3>{hostel.name}</h3><p>{hostel.address}</p><p className="detail-location-card__distance"><MapPin size={15} /> {formatDistance(distance)} straight-line to {campus.name}</p><a className="detail-text-link" href={directionsUrl} target="_blank" rel="noopener noreferrer">Open address in OpenStreetMap <ArrowUpRight size={16} /></a><small>{locationLabel(hostel)} · Confirm the entrance with the owner before travelling.</small></div>
              </div>
            </section>
            <button type="button" className="detail-report" onClick={() => { setReportOpen(true); setReportSaved(false); setReportError(''); }}><Flag size={15} /> Something doesn’t look right? Report this listing <ArrowUpRight size={15} /></button>
          </div>

          <aside className="detail-sidebar" aria-label="Selected room and visit request">
            <div className="detail-enquiry">
              <div className="detail-enquiry__top"><span className="detail-eyebrow">YOUR NEXT CHAPTER</span><span className="detail-enquiry__symbol"><BedDouble size={24} strokeWidth={1.2} /></span></div>
              {selectedRoom ? <><h2>{selectedRoom.name}</h2><p className="detail-enquiry__price">{money(monthlyTotal(selectedRoom))}<span>/ month</span></p><p className="detail-enquiry__unit">Fixed charges per student. Electricity separate.</p><RoomPrice room={selectedRoom} electricity={hostel.electricityPolicy} /><button type="button" className="detail-primary detail-primary--full" onClick={startVisit}><Calendar size={18} /> Request a visit <ArrowUpRight size={17} /></button><p className="detail-enquiry__disclaimer">A visit request does not reserve a room.</p></> : <><h2>Full for now.</h2><p className="detail-about">There are no available room options at this stay.</p><Link to={'/explore?campus=' + campus.id} className="detail-primary detail-primary--full">Find another stay <ArrowUpRight size={17} /></Link></>}
              <div className="detail-enquiry__footer"><ShieldCheck size={19} /><p>Visit first. Ask questions.<br /><strong>Choose with confidence.</strong></p></div>
            </div>
            <div className="detail-sidebar-note"><span className="detail-sidebar-note__spark">✳</span><p>A room for your books,<br />your big plans,<br /><em>and a fresh start.</em></p></div>
          </aside>
        </div>
      </div>

      {selectedRoom && <div className="detail-mobile-bar"><div><span>{selectedRoom.name}</span><strong>{money(monthlyTotal(selectedRoom))}<small>/mo</small></strong></div><button type="button" className="detail-primary" onClick={startVisit}>Request a visit <ArrowUpRight size={17} /></button></div>}

      <DetailDialog open={galleryOpen} onClose={() => setGalleryOpen(false)} title={hostel.name + ' · photos'} gallery>
        <div className="detail-lightbox">
          <img src={displayedImage} alt={'Illustrative hostel photo ' + (galleryIndex + 1)} onError={imageFallback} />
          <div className="detail-lightbox__controls"><button type="button" className="detail-icon-button" aria-label="Previous photo" disabled={galleryImages.length < 2} onClick={() => setGalleryIndex(index => (index - 1 + galleryImages.length) % galleryImages.length)}><ChevronLeft /></button><span>{galleryIndex + 1} / {galleryImages.length || 1} <small>Illustrative sample photos</small></span><button type="button" className="detail-icon-button" aria-label="Next photo" disabled={galleryImages.length < 2} onClick={() => setGalleryIndex(index => (index + 1) % galleryImages.length)}><ChevronRight /></button></div>
        </div>
      </DetailDialog>

      <DetailDialog open={visitOpen} onClose={() => setVisitOpen(false)} title={receipt ? 'Your visit request' : 'Come and see your next room'}>
        {receipt ? <div className="detail-receipt"><div className="detail-receipt__icon"><CheckCircle2 size={35} strokeWidth={1.4} /></div><p className="detail-eyebrow">ONE STEP CLOSER</p><h3 ref={receiptHeading} tabIndex={-1}>Request saved.</h3><p>Your visit request is saved on this device.</p><div className="detail-receipt__summary"><strong>{hostel.name}</strong><span>{receipt.roomTypeName}</span><span><Calendar size={16} /> {readableDate(receipt.visitDate)}</span><small>Reference: {receipt.id}</small><span className="detail-status"><Clock3 size={14} /> Coordination pending</span></div><div className="detail-info"><Info size={18} /><p>This is a frontend demo. No owner has been notified, and the visit is not confirmed. It does not reserve a room.</p></div><Link className="detail-primary detail-primary--full" to="/dashboard?tab=visits" onClick={() => setVisitOpen(false)}>View my requests <ArrowUpRight size={17} /></Link><button className="detail-text-link" type="button" onClick={() => setVisitOpen(false)}>Keep exploring this stay</button></div> : <form className="detail-visit-form" onSubmit={submitVisit} noValidate>
          <div className="detail-visit-property"><img src={hostel.coverImage} alt="" onError={imageFallback} /><div><strong>{hostel.name}</strong><span>{selectedRoom?.name}</span><span>{selectedRoom ? money(monthlyTotal(selectedRoom)) : '—'} fixed / student / month</span></div></div>
          <p className="detail-form-intro">Choose a date that works for you. Exact timing needs to be coordinated with the owner.</p>
          <div className="detail-form-field"><label htmlFor="visit-date">Preferred visit date</label><input id="visit-date" name="visitDate" type="date" min={localToday()} required value={visitDate} onChange={event => { setVisitDate(event.target.value); setVisitError(''); }} /><small>Date only. This does not reserve a time slot.</small></div>
          <div className="detail-form-row"><div className="detail-form-field"><label htmlFor="visit-name">Your profile name</label><input id="visit-name" value={user?.name || ''} readOnly autoComplete="name" /></div><div className="detail-form-field"><label htmlFor="visit-phone">Mobile number</label><input id="visit-phone" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="10-digit mobile number" value={phone} onChange={event => setPhone(event.target.value)} required /></div></div>
          <div className="detail-form-field"><label htmlFor="visit-message">Anything you’d like to ask? <span>(optional)</span></label><textarea id="visit-message" name="message" rows={3} maxLength={500} placeholder="Ask about the room, mess or visit arrangements…" value={message} onChange={event => setMessage(event.target.value)} /></div>
          <label className="detail-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>I agree to share my contact details with this hostel’s owner for visit coordination when the live service is connected.</span></label>
          <p className="detail-form-demo"><Info size={15} /> Demo: this request stays on your device. No SMS, call or message will be sent.</p>
          {visitError && <p role="alert" className="detail-form-error">{visitError}</p>}
          <button type="submit" className="detail-primary detail-primary--full" disabled={submitting || !selectedRoom}>{submitting ? 'Saving request…' : 'Save visit request'}<ArrowUpRight size={17} /></button>
          <p className="detail-enquiry__disclaimer">A visit request is not a room reservation or payment.</p>
        </form>}
      </DetailDialog>

      <DetailDialog open={reportOpen} onClose={() => setReportOpen(false)} title="Help keep the details accurate">
        {reportSaved ? <div className="detail-receipt"><CheckCircle2 size={40} /><h3>Report saved on this device.</h3><p>Thanks for helping improve the sample listing. This demo does not send reports to a moderation team.</p><button type="button" className="detail-primary" onClick={() => setReportOpen(false)}>Back to the hostel</button></div> : <form className="detail-visit-form" onSubmit={saveReport}><p className="detail-form-intro">What should be checked on {hostel.name}?</p><div className="detail-form-field"><label htmlFor="report-reason">Reason</label><select id="report-reason" value={reportReason} onChange={event => setReportReason(event.target.value)}><option>Incorrect price or availability</option><option>Photos or address do not match</option><option>Unclear or unexpected charges</option><option>Other listing information</option></select></div><p className="detail-form-demo"><Info size={15} /> Reports are saved locally in this frontend demo.</p>{reportError && <p role="alert" className="detail-form-error">{reportError}</p>}<button className="detail-primary detail-primary--full" type="submit">Save report <Flag size={16} /></button></form>}
      </DetailDialog>
    </div>
  );
}
