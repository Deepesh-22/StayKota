import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, BedDouble, Check, ChevronDown, GraduationCap, MapPin, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FeaturedHostelDeck } from '../components/home/FeaturedHostelDeck';
import { KotaGeographicHero } from '../components/home/KotaGeographicHero';
import { CAMPUSES, DEFAULT_CAMPUS_ID } from '../data/campuses';
import { distanceKm, getCampus, getMatchingRooms } from '../lib/discovery';
import type { SharingType } from '../types';
import '../styles/home.css';
import '../styles/kota-geographic-hero.css';

const STEPS = [
  { number: '01', title: 'Your campus. Your corner.', description: 'Choose your coaching campus, then find a neighbourhood that fits your day.', icon: GraduationCap },
  { number: '02', title: 'A little less guesswork.', description: 'See the room, compare the monthly costs, and save the stays you like.', icon: BedDouble },
  { number: '03', title: 'Come over. Look around.', description: 'Request a visit and speak to the owner. Choose your place after you have seen it.', icon: MapPin },
];

export function HomePage() {
  const { hostels } = useApp();
  const navigate = useNavigate();
  const [campusId, setCampusId] = useState(DEFAULT_CAMPUS_ID);
  const [maxBudget, setMaxBudget] = useState('');
  const [sharing, setSharing] = useState<SharingType | ''>('');
  const [category, setCategory] = useState('');
  const campus = getCampus(campusId);

  const featured = useMemo(() => hostels
    .filter(hostel => hostel.status === 'approved' && (!category || hostel.category === category))
    .map(hostel => ({ hostel, rooms: getMatchingRooms(hostel, { sharing, maxBudget: maxBudget ? Number(maxBudget) : undefined }) }))
    .filter(item => item.rooms.length > 0)
    .sort((a, b) => (distanceKm(a.hostel, campus) ?? Infinity) - (distanceKm(b.hostel, campus) ?? Infinity))
    .slice(0, 4), [hostels, campus, sharing, maxBudget, category]);

  const searchParams = () => {
    const params = new URLSearchParams({ campus: campusId });
    if (maxBudget) params.set('maxBudget', maxBudget);
    if (sharing) params.set('sharing', sharing);
    if (category) params.set('category', category);
    return params.toString();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(`/explore?${searchParams()}`);
  };

  const changeCampus = (id: string) => {
    setCampusId(id);
  };

  return (
    <div className="home-page">
      <section className="home-hero home-hero--geographic" aria-labelledby="home-heading">
        <div className="home-hero-inner home-container">
          <div className="home-hero-copy">
            <div className="home-eyebrow"><span className="home-status-dot" /> KOTA IS CALLING.</div>
            <h1 id="home-heading">Your Kota{' '}<br />starts <span className="home-heading-here">here.<svg viewBox="0 0 260 25" aria-hidden="true"><path d="M6 17C67 4 159 3 251 11M54 23C116 12 179 12 221 16" /></svg></span></h1>
            <p className="home-hero-description">Get to know the city before you call it home. Explore Kota, choose your coaching and find a little space of your own.</p>
            <div className="home-hero-detail"><span><Check size={14} /> Clear room costs</span><span><Check size={14} /> Your campus, nearby</span></div>
            <Link to={`/map?campus=${campusId}`} className="home-hero-map-link">Get to know Kota <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>

          <div className="home-hero-art">
            <KotaGeographicHero campusId={campusId} />
          </div>

          <div className="home-search-wrap">
            <form className="home-search" onSubmit={handleSearch}>
              <div className="home-search-field home-campus-field">
                <GraduationCap className="home-search-icon" size={21} aria-hidden="true" />
                <div><label htmlFor="home-campus">My coaching campus</label><div className="home-select-wrap"><select id="home-campus" value={campusId} onChange={event => changeCampus(event.target.value)}>{CAMPUSES.map(item => <option key={item.id} value={item.id}>{item.institute} · {item.name}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div></div>
              </div>
              <div className="home-search-field">
                <span className="home-rupee" aria-hidden="true">₹</span>
                <div><label htmlFor="home-budget">Monthly budget</label><div className="home-select-wrap"><select id="home-budget" value={maxBudget} onChange={event => { setMaxBudget(event.target.value); }}><option value="">A little flexible</option><option value="5000">Up to ₹5,000</option><option value="8000">Up to ₹8,000</option><option value="12000">Up to ₹12,000</option><option value="15000">Up to ₹15,000</option></select><ChevronDown size={14} aria-hidden="true" /></div></div>
              </div>
              <div className="home-search-field">
                <BedDouble className="home-search-icon" size={20} aria-hidden="true" />
                <div><label htmlFor="home-sharing">My kind of room</label><div className="home-select-wrap"><select id="home-sharing" value={sharing} onChange={event => { setSharing(event.target.value as SharingType | ''); }}><option value="">Any sharing</option><option value="single">A room to myself</option><option value="double">Double sharing</option><option value="triple">Triple sharing</option><option value="four">Four sharing</option></select><ChevronDown size={14} aria-hidden="true" /></div></div>
              </div>
              <button className="home-search-submit" type="submit"><Search size={19} aria-hidden="true" /><span>Find my stay</span><ArrowUpRight size={18} className="home-search-arrow" aria-hidden="true" /></button>
            </form>
            <div className="home-category-choice" role="group" aria-label="Hostel preference"><span>A stay for</span>{[{value:'', label:'Everyone'}, {value:'boys', label:'Boys'}, {value:'girls', label:'Girls'}, {value:'co-ed', label:'Co-ed'}].map(option => <button key={option.value} type="button" aria-pressed={category === option.value} onClick={() => { setCategory(option.value); }}>{option.label}</button>)}</div>
            <div className="home-search-caption"><span><span className="home-caption-dot" /> Explore first. No sign-up needed.</span><span>Demo experience · sample stays & locations</span></div>
          </div>
        </div>
      </section>

      <section className="home-campus-section home-container" aria-label="Choose a coaching campus">
        <div className="home-campus-intro"><span>Closer to class.</span><span>More room for life.</span></div>
        <div className="home-campus-chips">{CAMPUSES.slice(0, 4).map(item => <button key={item.id} type="button" className={`home-campus-chip ${item.id === campusId ? 'is-active' : ''}`} aria-pressed={item.id === campusId} onClick={() => changeCampus(item.id)}><span className="home-campus-chip-icon"><GraduationCap size={17} /></span><span><strong>{item.institute}</strong><small>{item.area}</small></span><ArrowUpRight size={15} className="home-campus-chip-arrow" aria-hidden="true" /></button>)}</div>
      </section>

      <section className="home-featured-section" aria-labelledby="home-featured-heading">
        <div className="home-container">
          <div className="home-section-topline"><span className="home-section-kicker"><span /> SPACES FOR YOUR NEXT CHAPTER</span><span className="home-section-note">Sample collection</span></div>
          <div className="home-section-heading"><div><h2 id="home-featured-heading">A place to settle.<br /><span>A little closer to you.</span></h2><p>Room to study, switch off, and feel at home near {campus.institute}’s {campus.name}.</p></div><Link to={`/explore?${searchParams()}`} className="home-text-link">Explore all stays <ArrowUpRight size={19} /></Link></div>

          {featured.length > 0 ? <FeaturedHostelDeck key={`${campusId}:${maxBudget}:${sharing}:${category}`} items={featured} campus={campus} /> : <div className="home-empty"><SlidersHorizontal size={27} /><h3>A little more room in your search?</h3><p>No sample rooms match these preferences. Try another budget or sharing type.</p><button onClick={() => { setMaxBudget(''); setSharing(''); setCategory(''); }} type="button">Reset room preferences <ArrowRight size={17} /></button></div>}
        </div>
      </section>

      <section className="home-how-section home-container" aria-labelledby="home-how-heading">
        <div className="home-how-heading"><span className="home-section-kicker"><span /> SMALL STEPS. A FRESH START.</span><h2 id="home-how-heading">Less searching.<br />More settling in.</h2><Link to="/how-it-works" className="home-text-link">Here’s how it works <ArrowRight size={18} /></Link></div>
        <div className="home-steps">{STEPS.map(({ number, title, description, icon: Icon }) => <article className="home-step" key={number}><div className="home-step-top"><span className="home-step-icon"><Icon size={23} strokeWidth={1.6} /></span><span className="home-step-number">{number}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="home-owner-section home-container" aria-labelledby="home-owner-heading"><div className="home-owner-strip"><div className="home-owner-illustration" aria-hidden="true"><div className="home-tiny-building"><span /><span /><span /><span /><span /><span /></div><div className="home-tiny-plant"><i /><i /><i /></div><Sparkles size={22} /></div><div><span className="home-section-kicker">A GOOD PLACE DESERVES TO BE FOUND</span><h2 id="home-owner-heading">Got room for someone’s next chapter?</h2><p>Bring your hostel to students looking for a place just like yours.</p></div><Link to="/login?role=owner" className="home-owner-link">List your hostel <ArrowUpRight size={20} /></Link></div></section>

      <div className="home-end-note home-container"><span>Kota is a new beginning.</span><span>Let’s find your little corner of it. <ArrowDown size={14} aria-hidden="true" /></span></div>
    </div>
  );
}
