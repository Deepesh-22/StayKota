import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Check, Clock3, Heart, LayoutGrid, LogOut, MapPin, Search, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCompare } from '../context/CompareContext';
import { CAMPUSES } from '../data/campuses';
import { getCampus } from '../lib/discovery';
import { HostelCard } from '../components/hostel/HostelCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { VisitRequest } from '../types';
import '../styles/workspaces.css';

type Section = 'overview' | 'saved' | 'visits' | 'profile';
const SECTIONS: Section[] = ['overview', 'saved', 'visits', 'profile'];
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const displayDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export function StudentDashboard() {
  const { user, hostels, favourites, visits, cancelVisit, rescheduleVisit, updateProfile, logout } = useApp();
  const { comparisonIds } = useCompare();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab') as Section;
  const section = SECTIONS.includes(rawTab) ? rawTab : 'overview';
  const campus = getCampus(params.get('campus'));
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const today = localDate();

  useEffect(() => {
    setProfileName(user?.name || '');
    setProfilePhone(user?.phone || '');
  }, [user?.id]);

  if (!user || user.role !== 'student') return (
    <div className="workspace-gate">
      <span className="workspace-gate-icon"><Heart size={28} /></span>
      <p className="workspace-eyebrow">Your student space</p>
      <h1>A little closer to your new home.</h1>
      <p>Sign in to keep your shortlist and visit requests together.</p>
      <Link className="workspace-primary-link" to={`/login?role=student&redirect=${encodeURIComponent(`/dashboard${params.size ? `?${params}` : ''}`)}`}>Student sign in <ArrowUpRight size={16} /></Link>
      <span className="workspace-fineprint">Demo sign in · No real SMS is sent</span>
    </div>
  );

  const setSection = (tab: Section) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next);
    setError('');
    setNotice('');
  };
  const savedIds = favourites.filter(f => f.studentId === user.id).map(f => f.hostelId);
  const savedHostels = hostels.filter(h => h.status === 'approved' && savedIds.includes(h.id));
  const myVisits = visits.filter(v => v.studentId === user.id);
  const active = myVisits.filter(v => v.status !== 'cancelled');
  const upcoming = active.filter(v => v.visitDate >= today);
  const past = active.filter(v => v.visitDate < today);
  const cancelled = myVisits.filter(v => v.status === 'cancelled');
  const exploreUrl = `/explore?campus=${campus.id}`;
  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'saved' as const, label: 'Saved hostels', icon: Heart },
    { id: 'visits' as const, label: 'Visit requests', icon: CalendarDays },
    { id: 'profile' as const, label: 'Profile', icon: UserRound },
  ];

  const saveDate = () => {
    setError('');
    if (!rescheduleId || !rescheduleDate) { setError('Choose your preferred date.'); return; }
    if (rescheduleDate < today) { setError('Please choose today or a future date.'); return; }
    try {
      rescheduleVisit(rescheduleId, rescheduleDate);
      setRescheduleId(null);
      setNotice('Preferred date updated in this demo. Visit coordination is still pending.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update this request.'); }
  };
  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) { setError('Please enter your name.'); return; }
    const digits = profilePhone.replace(/\D/g, '');
    if (digits && (digits.length < 10 || digits.length > 13)) { setError('Enter a valid phone number, including country code if needed.'); return; }
    updateProfile({ name: profileName.trim(), phone: profilePhone.trim() || undefined });
    setError('');
    setNotice('Your profile is saved on this device.');
  };
  const visitCard = (visit: VisitRequest, allowActions = false) => {
    const hostel = hostels.find(h => h.id === visit.hostelId);
    return <article key={visit.id} className="workspace-visit-card">
      <img src={hostel?.coverImage || '/images/room-shared.webp'} alt="" loading="lazy" />
      <div className="workspace-visit-info">
        <Link to={`/hostel/${visit.hostelId}?campus=${campus.id}`}>{visit.hostelName}</Link>
        <span><CalendarDays size={14} /> {displayDate(visit.visitDate)}</span>
        {visit.roomTypeName && <small>{visit.roomTypeName}</small>}
        <Badge variant={visit.status === 'cancelled' ? 'default' : visit.status === 'confirmed' ? 'success' : 'warning'}>
          {visit.status === 'cancelled' ? 'Cancelled' : visit.status === 'confirmed' ? 'Confirmed · demo' : 'Coordination pending'}
        </Badge>
      </div>
      {allowActions && <div className="workspace-visit-actions">
        <button type="button" onClick={() => { setRescheduleId(visit.id); setRescheduleDate(visit.visitDate); setError(''); }}>Change date</button>
        <button type="button" onClick={() => setCancelId(visit.id)}>Cancel request</button>
      </div>}
    </article>;
  };
  const empty = (message: string, detail: string) => <div className="workspace-empty"><MapPin size={30} /><h3>{message}</h3><p>{detail}</p><Link to={exploreUrl}>Explore nearby hostels <ArrowUpRight size={15} /></Link></div>;

  return <div className="workspace-shell student-workspace">
    <div className="workspace-heading">
      <div><p className="workspace-eyebrow">A place for your next chapter</p><h1>Hi, {user.name.split(' ')[0]}<span className="workspace-wave" aria-hidden="true"> ✳</span></h1><p>Keep exploring, compare your favourites, and plan your visits.</p></div>
      <label className="workspace-campus"><MapPin size={17} /><span><small>Your coaching campus</small><select aria-label="Your coaching campus" value={campus.id} onChange={e => { const next = new URLSearchParams(params); next.set('campus', e.target.value); setParams(next); }}>{CAMPUSES.map(c => <option key={c.id} value={c.id}>{c.institute} · {c.name}</option>)}</select></span></label>
    </div>
    <div className="workspace-grid">
      <aside className="workspace-sidebar"><nav aria-label="Student dashboard">{sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}><Icon size={18} /><span>{label}</span>{id === 'visits' && upcoming.length > 0 && <small>{upcoming.length}</small>}</button>)}</nav><div className="workspace-sidebar-note"><ArrowUpRight aria-hidden="true" /><p>Same goals.<br />A place to grow.</p><Link to="/how-it-works">A little help along the way</Link></div></aside>
      <div className="workspace-main">
        {notice && <p className="workspace-notice" role="status"><Check size={16} />{notice}</p>}
        {section === 'overview' && <>
          <section className="workspace-welcome"><div><p className="workspace-eyebrow">Room to focus. Space to feel at home.</p><h2>Your Kota shortlist</h2><p>A few good options, one clearer decision.</p><Link to={exploreUrl}>Continue exploring <ArrowUpRight size={16} /></Link></div><div className="workspace-mini-city" aria-hidden="true"><i /><i /><i /><i /><i /><span>✦</span></div></section>
          <div className="workspace-section-heading"><h2>Saved for later <span>{savedHostels.length}</span></h2><button onClick={() => setSection('saved')}>View all <ArrowUpRight size={15} /></button></div>
          {savedHostels.length ? <div className="workspace-saved-grid">{savedHostels.slice(0, 2).map(h => <HostelCard key={h.id} hostel={h} campus={campus} />)}</div> : empty('Your shortlist starts here', 'Save a hostel while you browse. It will be waiting right here.')}
          <div className="workspace-overview-bottom"><section className="workspace-panel"><div className="workspace-section-heading"><h2>Visit requests</h2><button onClick={() => setSection('visits')}>View all</button></div>{myVisits.length ? myVisits.slice(0, 2).map(v => visitCard(v)) : <div className="workspace-small-empty"><CalendarDays size={24} /><p>No visits requested yet.</p><span>Find a room you like, then choose a day to visit.</span></div>}</section><section className="workspace-panel workspace-next-step"><Heart size={22} /><h2>Deciding together?</h2><p>Compare room costs and facilities side by side before you visit.</p><Link to={comparisonIds.length >= 2 ? `/compare?campus=${campus.id}` : exploreUrl}>{comparisonIds.length >= 2 ? `Compare ${comparisonIds.length} hostels` : 'Build your shortlist'} <ArrowUpRight size={16} /></Link><small>Shared photos and prices are sample content in this demo.</small></section></div>
        </>}
        {section === 'saved' && <><div className="workspace-section-heading"><div><p className="workspace-eyebrow">Keep the good ones close</p><h2>Saved hostels <span>{savedHostels.length}</span></h2></div><Link to={exploreUrl}><Search size={15} /> Find more</Link></div>{savedHostels.length ? <div className="workspace-saved-grid">{savedHostels.map(h => <HostelCard key={h.id} hostel={h} campus={campus} />)}</div> : empty('Nothing saved just yet', 'Tap the heart on a hostel to add it to your shortlist.')}</>}
        {section === 'visits' && <><div className="workspace-section-heading"><div><p className="workspace-eyebrow">See it for yourself</p><h2>Your visit requests</h2></div></div><p className="workspace-local-note"><Clock3 size={16} />Requests are saved on this device. No owner has been notified; a requested visit is not a room reservation.</p><section className="workspace-panel"><h3>Upcoming requests</h3>{upcoming.length ? upcoming.map(v => visitCard(v, true)) : empty('No upcoming requests', 'Explore a few rooms and choose a date that works for you.')}</section>{past.length > 0 && <section className="workspace-panel"><h3>Past requests</h3><p className="workspace-muted">The preferred date has passed. This does not confirm that a visit took place.</p>{past.map(v => visitCard(v))}</section>}{cancelled.length > 0 && <section className="workspace-panel"><h3>Cancelled requests</h3>{cancelled.map(v => visitCard(v))}</section>}</>}
        {section === 'profile' && <section className="workspace-panel workspace-profile"><p className="workspace-eyebrow">Make yourself at home</p><h2>Your profile</h2><p>Keep your details ready for your next enquiry.</p><form onSubmit={saveProfile}><label htmlFor="profile-name">Full name</label><input id="profile-name" value={profileName} onChange={e => setProfileName(e.target.value)} maxLength={80} autoComplete="name" required /><label htmlFor="profile-email">Demo account</label><input id="profile-email" value={user.email} disabled /><label htmlFor="profile-phone">Phone number <span>(optional)</span></label><input id="profile-phone" type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} autoComplete="tel" placeholder="Your phone number" maxLength={20} />{error && <p className="workspace-form-error" role="alert">{error}</p>}<Button type="submit">Save profile</Button></form><p className="workspace-fineprint">Stored locally in this browser. No data is sent to a server.</p><button type="button" className="workspace-logout" onClick={() => { logout(); navigate('/'); }}><LogOut size={16} />Log out</button></section>}
        <p className="workspace-footer-note">A little closer to your campus. A little closer to home. <span>Frontend demo · Local data only</span></p>
      </div>
    </div>
    <Modal open={Boolean(rescheduleId)} onClose={() => { setRescheduleId(null); setError(''); }} title="Change your preferred date"><p className="workspace-muted">Pick a day to visit. The exact time still needs to be coordinated with the owner.</p><label className="workspace-modal-label" htmlFor="reschedule-date">Preferred visit date</label><input id="reschedule-date" className="workspace-modal-input" type="date" min={today} value={rescheduleDate} onChange={e => { setRescheduleDate(e.target.value); setError(''); }} />{error && <p className="workspace-form-error" role="alert">{error}</p>}<div className="workspace-modal-actions"><Button onClick={saveDate}>Save preferred date</Button><Button variant="ghost" onClick={() => setRescheduleId(null)}>Keep current date</Button></div></Modal>
    <Modal open={Boolean(cancelId)} onClose={() => setCancelId(null)} title="Cancel this visit request?"><p className="workspace-muted">This updates your saved demo request only. No notification is sent to the hostel owner.</p><div className="workspace-modal-actions"><Button variant="danger" onClick={() => { if (cancelId) cancelVisit(cancelId); setCancelId(null); setNotice('Visit request cancelled on this device.'); }}>Cancel request</Button><Button variant="ghost" onClick={() => setCancelId(null)}>Keep request</Button></div></Modal>
  </div>;
}
