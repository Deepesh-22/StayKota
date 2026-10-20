import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, GraduationCap, Heart, LayoutGrid, Map, MapPin, RotateCcw, Scale, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCompare } from '../context/CompareContext';
import { CAMPUSES } from '../data/campuses';
import { distanceKm, getCampus, getMatchingRooms, monthlyTotal } from '../lib/discovery';
import { HostelCard } from '../components/hostel/HostelCard';
import { NeighbourhoodMap } from '../components/hostel/NeighbourhoodMap';
import '../styles/discovery.css';

const PAGE_SIZE = 6;
const AMENITIES = ['Meals', 'AC', 'WiFi', 'Laundry', 'Power Backup', 'CCTV', 'Study Room', 'Hot Water', 'Parking'];
const QUICK_AMENITIES = [{ id: 'Meals', label: 'With mess' }, { id: 'AC', label: 'AC included' }, { id: 'WiFi', label: 'Wi-Fi' }, { id: 'Laundry', label: 'Laundry' }, { id: 'Study Room', label: 'Study room' }];
const SHARING_OPTIONS = [{ id: '', label: 'Any sharing' }, { id: 'single', label: 'Single room' }, { id: 'double', label: 'Double sharing' }, { id: 'triple', label: 'Triple sharing' }, { id: 'four', label: 'Four sharing' }];
type Sort = 'distance' | 'price-asc' | 'price-desc' | 'name';
type Filters = { campus: string; sharing: string; minBudget: number; maxBudget?: number; category: string; amenities: string[]; sort: Sort; page: number };
const numberParam = (value: string | null, fallback: number) => value != null && value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback;

function readFilters(params: URLSearchParams): Filters {
  const sharing = params.get('sharing') || '', category = params.get('category') || '', sortValue = params.get('sort');
  const sort: Sort = sortValue === 'price-asc' || sortValue === 'rent-asc' ? 'price-asc' : sortValue === 'price-desc' || sortValue === 'rent-desc' ? 'price-desc' : sortValue === 'name' ? 'name' : 'distance';
  const minBudget = numberParam(params.get('minBudget'), 0), rawMax = params.get('maxBudget');
  return {
    campus: getCampus(params.get('campus')).id,
    sharing: SHARING_OPTIONS.some(option => option.id === sharing) ? sharing : '',
    minBudget,
    maxBudget: rawMax != null ? Math.max(minBudget, numberParam(rawMax, 25000)) : undefined,
    category: ['boys', 'girls', 'co-ed'].includes(category) ? category : '',
    amenities: (params.get('amenities') || '').split(',').filter((value, index, all) => AMENITIES.includes(value) && all.indexOf(value) === index),
    sort,
    page: Math.max(1, Math.floor(numberParam(params.get('page'), 1))),
  };
}

function writeFilters(filters: Filters) {
  const params = new URLSearchParams();
  params.set('campus', filters.campus);
  if (filters.sharing) params.set('sharing', filters.sharing);
  if (filters.minBudget > 0) params.set('minBudget', String(filters.minBudget));
  if (filters.maxBudget != null) params.set('maxBudget', String(filters.maxBudget));
  if (filters.category) params.set('category', filters.category);
  if (filters.amenities.length) params.set('amenities', filters.amenities.join(','));
  if (filters.sort !== 'distance') params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function ExplorePage() {
  const { hostels } = useApp();
  const { comparisonIds, toggleCompare, clearComparison } = useCompare();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const applied = useMemo(() => readFilters(new URLSearchParams(paramsString)), [paramsString]);
  const [draft, setDraft] = useState<Filters>(applied);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeHostel, setActiveHostel] = useState<string | null>(null);
  const filterDialog = useRef<HTMLDialogElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const campus = getCampus(applied.campus);

  useEffect(() => { setDraft(applied); }, [applied]);
  useEffect(() => {
    if (filterOpen) filterDialog.current?.showModal();
    else if (filterDialog.current?.open) filterDialog.current.close();
  }, [filterOpen]);

  const updateFilters = (patch: Partial<Filters>) => setSearchParams(writeFilters({ ...applied, ...patch, page: patch.page || 1 }));
  const resetFilters = () => {
    const next: Filters = { campus: applied.campus, sharing: '', minBudget: 0, maxBudget: undefined, category: '', amenities: [], sort: 'distance', page: 1 };
    setDraft(next);
    setSearchParams(writeFilters(next));
  };
  const applySearch = (event?: FormEvent) => {
    event?.preventDefault();
    setSearchParams(writeFilters({ ...draft, page: 1 }));
    setFilterOpen(false);
  };

  const results = useMemo(() => {
    const matches = hostels.filter(hostel => hostel.status === 'approved')
      .filter(hostel => !applied.category || hostel.category === applied.category)
      .filter(hostel => applied.amenities.filter(amenity => amenity !== 'AC').every(amenity => hostel.amenities.includes(amenity)))
      .flatMap(hostel => {
        const room = getMatchingRooms(hostel, { sharing: applied.sharing, minBudget: applied.minBudget, maxBudget: applied.maxBudget }).find(candidate => {
          if (!applied.amenities.includes('AC')) return true;
          const hasOptionalAC = candidate.extraCharges.some(charge => charge.optional && /\bac\b/i.test(charge.name));
          return candidate.included.some(value => /\bac\b/i.test(value))
            || (!hasOptionalAC && candidate.features.some(value => /\bac\b/i.test(value)));
        });
        return room ? [{ hostel, room }] : [];
      });
    return matches.sort((a, b) => {
      const priceDifference = monthlyTotal(a.room) - monthlyTotal(b.room);
      if (applied.sort === 'price-asc') return priceDifference || a.hostel.name.localeCompare(b.hostel.name);
      if (applied.sort === 'price-desc') return -priceDifference || a.hostel.name.localeCompare(b.hostel.name);
      if (applied.sort === 'name') return a.hostel.name.localeCompare(b.hostel.name);
      const aDistance = distanceKm(a.hostel, campus) ?? Infinity, bDistance = distanceKm(b.hostel, campus) ?? Infinity;
      return (aDistance === bDistance ? priceDifference : aDistance - bDistance) || a.hostel.name.localeCompare(b.hostel.name);
    });
  }, [hostels, applied, campus]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE)), page = Math.min(applied.page, totalPages);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedHostels = comparisonIds.map(id => hostels.find(hostel => hostel.id === id)).filter((hostel): hostel is NonNullable<typeof hostel> => Boolean(hostel));
  const filterCount = applied.amenities.length + Number(Boolean(applied.sharing)) + Number(Boolean(applied.category)) + Number(applied.minBudget > 0 || applied.maxBudget != null);
  const budgetValue = draft.maxBudget == null ? '' : [5000, 8000, 10000, 12000, 15000].includes(draft.maxBudget) && draft.minBudget === 0 ? String(draft.maxBudget) : 'custom';
  const compareParams = new URLSearchParams({ campus: campus.id });
  if (applied.sharing) compareParams.set('sharing', applied.sharing);
  if (applied.minBudget > 0) compareParams.set('minBudget', String(applied.minBudget));
  if (applied.maxBudget != null) compareParams.set('maxBudget', String(applied.maxBudget));
  const toggleQuickAmenity = (amenity: string) => updateFilters({ amenities: applied.amenities.includes(amenity) ? applied.amenities.filter(value => value !== amenity) : [...applied.amenities, amenity] });
  const closeFilters = () => { setFilterOpen(false); filterTrigger.current?.focus(); };

  return (
    <div className={`discovery-page${selectedHostels.length ? ' discovery-page--comparing' : ''}`}>
      <section className="discovery-intro discovery-shell">
        <div className="discovery-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Find your stay</span></div>
        <div className="discovery-eyebrow"><span />A little closer to your goals</div>
        <div className="discovery-intro-heading"><h1>Less commute.<br className="discovery-mobile-break" /> More <em>possibility.</em></h1><p>A room you love, near the campus you choose.<br />Find your own corner of Kota.</p></div>
      </section>
      <div className="discovery-shell">
        <form className="discovery-search" onSubmit={applySearch}>
          <label className="discovery-search-field discovery-search-campus"><span>YOUR COACHING CAMPUS</span><div><GraduationCap size={19} aria-hidden="true" /><select value={draft.campus} onChange={event => setDraft(value => ({ ...value, campus: event.target.value }))} aria-label="Your coaching campus">{CAMPUSES.map(option => <option key={option.id} value={option.id}>{option.institute} · {option.name}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div></label>
          <label className="discovery-search-field"><span>MONTHLY FIXED BUDGET</span><div><span className="discovery-rupee" aria-hidden="true">₹</span><select value={budgetValue} onChange={event => { if (event.target.value !== 'custom') setDraft(value => ({ ...value, minBudget: 0, maxBudget: event.target.value ? Number(event.target.value) : undefined })); }} aria-label="Monthly fixed budget"><option value="">Any budget</option><option value="5000">Up to ₹5,000</option><option value="8000">Up to ₹8,000</option><option value="10000">Up to ₹10,000</option><option value="12000">Up to ₹12,000</option><option value="15000">Up to ₹15,000</option>{budgetValue === 'custom' && <option value="custom">₹{draft.minBudget.toLocaleString('en-IN')}–{draft.maxBudget?.toLocaleString('en-IN') || 'any'}</option>}</select><ChevronDown size={15} aria-hidden="true" /></div></label>
          <label className="discovery-search-field"><span>YOUR ROOM, YOUR WAY</span><div><Heart size={17} aria-hidden="true" /><select value={draft.sharing} onChange={event => setDraft(value => ({ ...value, sharing: event.target.value }))} aria-label="Room sharing type">{SHARING_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div></label>
          <button className="discovery-search-button" type="submit"><Search size={18} aria-hidden="true" />Find my stay<ArrowUpRight size={18} aria-hidden="true" /></button>
        </form>
        <div className="discovery-filter-row">
          <button type="button" className={`discovery-filter-all${filterCount ? ' is-active' : ''}`} ref={filterTrigger} onClick={() => setFilterOpen(true)}><SlidersHorizontal size={16} aria-hidden="true" />All filters{filterCount > 0 && <span>{filterCount}</span>}</button><span className="discovery-filter-divider" />
          <div className="discovery-quick-filters">{QUICK_AMENITIES.map(amenity => <button type="button" key={amenity.id} className={applied.amenities.includes(amenity.id) ? 'is-active' : ''} onClick={() => toggleQuickAmenity(amenity.id)} aria-pressed={applied.amenities.includes(amenity.id)}>{applied.amenities.includes(amenity.id) && <Check size={12} aria-hidden="true" />}{amenity.label}</button>)}</div>
          {filterCount > 0 && <button type="button" className="discovery-clear" onClick={resetFilters}><X size={13} aria-hidden="true" />Clear filters</button>}
        </div>
        <div className="discovery-results-heading">
          <div><span className="discovery-eyebrow discovery-eyebrow--small"><MapPin size={13} aria-hidden="true" />YOUR CAMPUS NEIGHBOURHOOD</span><h2>Rooms near <em>{campus.institute} {campus.name}</em></h2><p aria-live="polite">{results.length} sample {results.length === 1 ? 'stay' : 'stays'} with rooms that match{applied.sharing ? ` · ${SHARING_OPTIONS.find(option => option.id === applied.sharing)?.label.toLowerCase()}` : ''}.</p></div>
          <label className="discovery-sort"><span>Sort by</span><select aria-label="Sort hostels" value={applied.sort} onChange={event => updateFilters({ sort: event.target.value as Sort })}><option value="distance">Nearest campus</option><option value="price-asc">Monthly cost: low to high</option><option value="price-desc">Monthly cost: high to low</option><option value="name">Name: A to Z</option></select><ChevronDown size={14} aria-hidden="true" /></label>
        </div>
        <div className="discovery-view-toggle" aria-label="Results view"><button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}><LayoutGrid size={16} aria-hidden="true" />List view</button><button type="button" className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')} aria-pressed={view === 'map'}><Map size={16} aria-hidden="true" />Map view</button></div>
        <div className={`discovery-results-layout discovery-results-layout--${view}`}>
          <div className="discovery-results-list">
            {results.length > 0 ? <div className="discovery-grid">{pageItems.map(({ hostel, room }) => <HostelCard key={hostel.id} hostel={hostel} room={room} campus={campus} onHover={setActiveHostel} />)}</div> : <div className="discovery-no-results"><div><Search size={29} strokeWidth={1.3} aria-hidden="true" /></div><span className="discovery-eyebrow">A LITTLE MORE ROOM TO EXPLORE</span><h3>Your next room is still out there.</h3><p>No available sample rooms match all your filters.<br />Try a wider budget or another sharing type.</p><button type="button" onClick={resetFilters}><RotateCcw size={16} aria-hidden="true" />Reset my filters</button></div>}
            {totalPages > 1 && <nav className="discovery-pagination" aria-label="Results pages"><button type="button" onClick={() => updateFilters({ page: page - 1 })} disabled={page <= 1} aria-label="Previous results page"><ArrowLeft size={15} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map(value => <button type="button" key={value} className={page === value ? 'is-active' : ''} onClick={() => updateFilters({ page: value })} aria-current={page === value ? 'page' : undefined} aria-label={`Results page ${value}`}>{value}</button>)}<button type="button" onClick={() => updateFilters({ page: page + 1 })} disabled={page >= totalPages} aria-label="Next results page"><ArrowRight size={15} /></button></nav>}
          </div>
          <aside className="discovery-results-map"><NeighbourhoodMap campus={campus} items={pageItems} activeHostelId={activeHostel} onActivate={setActiveHostel} /></aside>
        </div>
        <p className="discovery-results-disclaimer"><Sparkles size={13} aria-hidden="true" />A preview of better hostel hunting. Listings, photos, prices and locations are sample content.</p>
      </div>
      {selectedHostels.length > 0 && <aside className="discovery-compare-tray" aria-label="Selected hostel comparison"><div className="discovery-compare-thumbs">{selectedHostels.map(hostel => <div className="discovery-compare-item" key={hostel.id}><img src={hostel.coverImage || '/images/room-shared.webp'} alt="" /><span><strong>{hostel.name}</strong><small>{hostel.locality}</small></span><button type="button" onClick={() => toggleCompare(hostel.id)} aria-label={`Remove ${hostel.name} from comparison`}><X size={14} /></button></div>)}</div><div className="discovery-compare-actions"><span aria-live="polite">{comparisonIds.length} of 3 selected</span><button type="button" className="discovery-compare-clear" onClick={clearComparison} aria-label="Clear selected hostels">Clear</button><Link to={`/compare?${compareParams.toString()}`} className="discovery-compare-link"><Scale size={17} aria-hidden="true" /><span>Compare<span className="discovery-compare-link-extra"> selected</span></span><ArrowUpRight size={16} aria-hidden="true" /></Link></div></aside>}
      <dialog className="discovery-filter-dialog" ref={filterDialog} onCancel={closeFilters} onClose={() => setFilterOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeFilters(); }} aria-labelledby="discovery-filter-title">
        <form onSubmit={applySearch}><div className="discovery-dialog-header"><div><span className="discovery-eyebrow">MAKE YOURSELF AT HOME</span><h2 id="discovery-filter-title">A room that fits you.</h2></div><button type="button" onClick={closeFilters} aria-label="Close filters"><X size={21} /></button></div>
          <fieldset><legend>Monthly fixed cost <small>Per student, excluding deposit</small></legend><div className="discovery-budget-fields"><label>Minimum ₹<input type="number" min="0" step="100" value={draft.minBudget} onChange={event => { const minBudget = Math.max(0, Number(event.target.value) || 0); setDraft(value => ({ ...value, minBudget, maxBudget: value.maxBudget != null && value.maxBudget < minBudget ? minBudget : value.maxBudget })); }} /></label><span>—</span><label>Maximum ₹<input type="number" min={draft.minBudget} step="100" value={draft.maxBudget ?? ''} placeholder="Any budget" onChange={event => setDraft(value => ({ ...value, maxBudget: event.target.value === '' ? undefined : Math.max(value.minBudget, Number(event.target.value) || 0) }))} /></label></div><p className="discovery-dialog-hint">Includes rent and mandatory fixed extras. Variable charges and optional services are shown in room details.</p></fieldset>
          <fieldset><legend>Sharing type</legend><div className="discovery-filter-options">{SHARING_OPTIONS.map(option => <button key={option.id} type="button" className={draft.sharing === option.id ? 'is-active' : ''} onClick={() => setDraft(value => ({ ...value, sharing: option.id }))} aria-pressed={draft.sharing === option.id}>{option.label}</button>)}</div></fieldset>
          <fieldset><legend>Hostel category</legend><div className="discovery-filter-options">{[{ id: '', label: 'All hostels' }, { id: 'boys', label: 'For boys' }, { id: 'girls', label: 'For girls' }, { id: 'co-ed', label: 'Co-ed' }].map(option => <button type="button" key={option.id} className={draft.category === option.id ? 'is-active' : ''} onClick={() => setDraft(value => ({ ...value, category: option.id }))} aria-pressed={draft.category === option.id}>{option.label}</button>)}</div></fieldset>
          <fieldset><legend>Little things that matter</legend><div className="discovery-amenity-options">{AMENITIES.map(amenity => <label key={amenity}><input type="checkbox" checked={draft.amenities.includes(amenity)} onChange={() => setDraft(value => ({ ...value, amenities: value.amenities.includes(amenity) ? value.amenities.filter(item => item !== amenity) : [...value.amenities, amenity] }))} /><span>{amenity === 'Meals' ? 'Mess available' : amenity === 'AC' ? 'AC included' : amenity === 'WiFi' ? 'Wi-Fi' : amenity}</span></label>)}</div></fieldset>
          <div className="discovery-dialog-footer"><button type="button" onClick={() => setDraft(value => ({ ...value, sharing: '', minBudget: 0, maxBudget: undefined, category: '', amenities: [] }))}>Reset filters</button><button type="submit" className="discovery-search-button">Show matching stays<ArrowRight size={17} aria-hidden="true" /></button></div>
        </form>
      </dialog>
    </div>
  );
}
