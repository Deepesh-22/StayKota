import { hostelPreviewHref } from '../lib/hostel-navigation';
import { inKotaMapArea } from '../lib/map-area';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  GraduationCap,
  List,
  Map as MapIcon,
  Maximize2,
  LocateFixed,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useApp } from '../context/AppContext';
import { CAMPUSES } from '../data/campuses';
import { formatDistance, getCampus, getMatchingRooms, monthlyTotal } from '../lib/discovery';
import {
  CITY_TARGET,
  campusDistance,
  nearestCampus,
  withinCampusRadius,
  validCoordinates,
  type MapTarget,
} from '../lib/maps';
import { MapLayerToggle } from '../components/maps/MapLayerToggle';
import { KotaMap } from '../components/maps/KotaMap';
import '../styles/city-map.css';

export function KotaMapPage() {
  const { hostels } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const campus = getCampus(params.get('campus'));
  const live = useLiveLocation();
  const location = live.tracking ? live.location : null;
  const query = params.get('q') || '';
  const [search, setSearch] = useState(query);
  const [notice, setNotice] = useState('');
  const [supports3D, setSupports3D] = useState(false);
  const [showStays, setShowStays] = useState(false);
  const [revision, setRevision] = useState(0);
  const sidebar = useRef<HTMLElement>(null);
  const staysTrigger = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    setSearch(query);
  }, [query]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 761px)');
    const releasePanel = () => { if (desktop.matches) setShowStays(false); };
    desktop.addEventListener('change', releasePanel);
    return () => desktop.removeEventListener('change', releasePanel);
  }, []);
  useEffect(() => {
    if (!showStays) return;
    const before = document.activeElement as HTMLElement | null;
    const node = sidebar.current;
    node?.querySelector<HTMLButtonElement>('.city-close-stays')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowStays(false);
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const controls = [
        ...node.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],select,input'),
      ].filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      before?.focus();
    };
  }, [showStays]);
  const rawBudget = Number(params.get('budget'));
  const budget = Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : undefined;
  const sharing = ['single', 'double', 'triple', 'four'].includes(params.get('sharing') || '')
    ? params.get('sharing')!
    : '';
  const category = ['boys', 'girls', 'co-ed'].includes(params.get('category') || '')
    ? params.get('category')!
    : '';
  const basemap = params.get('type') === 'satellite' ? 'satellite' : 'street';
  const perspective = supports3D && params.get('view') === '3d' ? '3d' : '2d';
  const activeCampus = CAMPUSES.find(c => c.id === params.get('campus'));
  const origin = location || activeCampus;
  const radius = origin && [1, 3, 5].includes(Number(params.get('radius')))
    ? Number(params.get('radius')) : location ? 3 : undefined;
  const items = hostels
    .filter((h) => h.status === 'approved' && (!category || h.category === category))
    .filter(h => !query || `${h.name} ${h.locality}`.toLowerCase().includes(query.toLowerCase()))
    .filter(h => !radius || (origin && withinCampusRadius(h, origin, radius)))
    .flatMap((hostel) => {
      const room = getMatchingRooms(hostel, { sharing, maxBudget: budget })[0];
      return room ? [{ hostel, room }] : [];
    }).sort((a, b) => origin
      ? (campusDistance(a.hostel, origin) ?? Infinity) - (campusDistance(b.hostel, origin) ?? Infinity) : 0);
  const selected = items.find((item) => item.hostel.id === params.get('hostel'));
  let target: MapTarget = { ...CITY_TARGET, id: `kota-${revision}` };
  if (activeCampus)
    target = {
      lat: campus.latitude, lng: campus.longitude,
      zoom: radius === 5 ? 12 : radius === 3 ? 13 : 14,
      id: `${campus.id}-${radius || 'all'}`,
    };
  if (location) target = { lat: location.latitude, lng: location.longitude, zoom: radius === 1 ? 15 : radius === 5 ? 12 : 13, id: `your-location-${revision}` };
  if (selected && validCoordinates(selected.hostel.latitude, selected.hostel.longitude))
    target = {
      lat: selected.hostel.latitude!,
      lng: selected.hostel.longitude!,
      zoom: 16,
      id: selected.hostel.id,
    };
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };
  const focusHostel = (id: string) => {
    update({ hostel: id, q: null });
    setShowStays(false);
  };
  const selectHostel = (id: string) => {
    const item = items.find(value => value.hostel.id === id);
    if (!item) return;
    const back = new URLSearchParams(params);
    back.set('hostel',id); back.delete('q');
    const previewCampus = activeCampus || nearestCampus(item.hostel)?.campus || campus;
    navigate(hostelPreviewHref(id,previewCampus.id,item.room.id,`/map?${back}`));
  };
  const selectCampus = (id: string) => { live.stop(); update({ campus: id, hostel: null, q: null }); };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    live.stop();
    const term = search.trim().slice(0, 180);
    const normalized = term.toLowerCase();
    const hostelMatch = term && hostels.find(h => h.status === 'approved' && h.name.toLowerCase().includes(normalized));
    const campusMatch = term && CAMPUSES.find(c => `${c.institute} ${c.name} ${c.area}`.toLowerCase().includes(normalized));
    if (hostelMatch) update({ q: null, hostel: hostelMatch.id, campus: null, radius: null });
    else if (campusMatch) update({ q: null, hostel: null, campus: campusMatch.id });
    else update({ q: term || null, hostel: null, campus: null });
    setShowStays(false);
  };
  const locate = () => {
    setShowStays(false);
    if (location) { update({ hostel: null, q: null }); setRevision(n => n + 1); }
    else { live.start(); update({ campus: null, hostel: null, q: null, radius: '3' }); }
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice(
        'Full screen is not available in this browser. You can still pan and zoom here.'
      );
    }
  };
  return (
    <div className="city-page">
      <div className="city-toolbar">
        <div className="city-title">
          <span>
            <MapIcon size={19} />
          </span>
          <div>
            <h1>Explore Kota</h1>
            <p>The whole city. Your next neighbourhood.</p>
          </div>
        </div>
        <form className="city-search" onSubmit={submitSearch}>
          <Search size={17} />
          <label className="sr-only" htmlFor="city-search">
            Search a hostel, coaching or locality
          </label>
          <input
            id="city-search"
            placeholder="Search a hostel, coaching or locality"
            value={search}
            maxLength={180}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear map search"
              onClick={() => {
                setSearch('');
                update({ q: null });
              }}
            >
              <X size={14} />
            </button>
          )}
          <button type="submit" className="city-search-submit">
            Search
          </button>
        </form>
        <div className="city-toolbar-actions">
          <button
            type="button"
            onClick={() => {
              live.stop();
              setRevision((n) => n + 1);
              update({ campus: null, hostel: null, q: null, radius: null });
            }}
            className="city-reset"
          >
            <MapIcon size={15} />
            Whole Kota
          </button>
        </div>
      </div>
      <div className="city-location-bar">
        <button type="button" onClick={locate} disabled={live.pending}>
          <LocateFixed size={16} /> {live.pending ? 'Locating…' : location ? inKotaMapArea(location) ? 'Centre on me' : 'Show Kota map' : 'Use my location'}
        </button>
        {live.tracking && <button type="button" onClick={live.stop}>Stop location</button>}
        <span role="status">{location
          ? `Live location on · accuracy about ${Math.round(location.accuracy)} m · ${inKotaMapArea(location) ? `stays within ${radius} km` : 'outside the Kota map area'}`
          : live.pending ? 'Waiting for your browser’s location permission…' : 'Find nearby hostels. Location is used only while this page is open.'}</span>
        {live.error && <p role="alert">{live.error}</p>}
      </div>
      {notice && (
        <p className="city-notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss map notice">
            <X size={14} />
          </button>
        </p>
      )}
      <div className="city-body">
        <aside
          ref={sidebar}
          className={`city-sidebar${showStays ? ' is-open' : ''}`}
          role={showStays ? 'dialog' : undefined}
          aria-modal={showStays || undefined}
          aria-label="Hostel filters and sample stays"
        >
          <div className="city-sidebar-top">
            <div>
              <span className="sk-eyebrow">MAKE KOTA YOUR OWN</span>
              <h2>A place to start.</h2>
            </div>
            <button
              className="city-close-stays"
              type="button"
              onClick={() => setShowStays(false)}
              aria-label="Close hostel list"
            >
              <X size={20} />
            </button>
          </div>
          <div className="city-campus">
            <GraduationCap size={18} />
            <label className="sr-only" htmlFor="city-campus">
              Centre map on a coaching campus
            </label>
            <select
              id="city-campus"
              value={params.get('campus') || ''}
              onChange={(e) => selectCampus(e.target.value)}
            >
              <option value="">All of Kota</option>
              {CAMPUSES.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.institute} · {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
          <label className="city-radius">
            {location ? 'Distance from your location' : 'Distance from coaching'}
            <select aria-label={location ? 'Distance from your location' : 'Distance from coaching'} disabled={!origin}
              value={radius || ''} onChange={e => update({ radius: e.target.value, hostel: null })}>
              {!location && <option value="">All distances</option>}
              <option value="1">Within 1 km</option>
              <option value="3">Within 3 km</option>
              <option value="5">Within 5 km</option>
            </select>
            <small>{origin ? 'Nearest first · straight-line distance, not walking distance' : 'Choose a coaching campus to filter nearby stays.'}</small>
          </label>
          <div className="city-room-filters">
            <label>
              Room type
              <select
                aria-label="Map room sharing"
                value={sharing}
                onChange={(e) => update({ sharing: e.target.value, hostel: null })}
              >
                <option value="">Any sharing</option>
                <option value="single">Single room</option>
                <option value="double">Double sharing</option>
                <option value="triple">Triple sharing</option>
                <option value="four">Four sharing</option>
              </select>
            </label>
            <label>
              Fixed monthly budget
              <select
                aria-label="Map monthly budget"
                value={budget || ''}
                onChange={(e) => update({ budget: e.target.value, hostel: null })}
              >
                <option value="">Any budget</option>
                <option value="5000">Up to ₹5,000</option>
                <option value="8000">Up to ₹8,000</option>
                <option value="12000">Up to ₹12,000</option>
                <option value="15000">Up to ₹15,000</option>
                {budget && ![5000, 8000, 12000, 15000].includes(budget) && (
                  <option value={budget}>Up to ₹{budget.toLocaleString('en-IN')}</option>
                )}
              </select>
            </label>
          </div>
          <div className="city-category" aria-label="Map hostel category">
            {[
              { id: '', name: 'All' },
              { id: 'boys', name: 'Boys' },
              { id: 'girls', name: 'Girls' },
              { id: 'co-ed', name: 'Co-ed' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => update({ category: c.id, hostel: null })}
              >
                {c.name}
              </button>
            ))}
          </div>
          <p className="city-result-count" aria-live="polite">
            {items.length} matching sample {items.length === 1 ? 'stay' : 'stays'}{' '}
            <span>Not live inventory</span>
          </p>
          <div className="city-stays">
            {items.length ? (
              items.map(({ hostel, room }) => {
                const nearest = nearestCampus(hostel);
                const nearby = activeCampus ? { campus, distance: campusDistance(hostel, campus) } : nearest;
                return (
                  <article
                    className={`city-stay${selected?.hostel.id === hostel.id ? ' is-selected' : ''}`}
                    key={hostel.id}
                  >
                    <button
                      type="button"
                      className="city-stay-select"
                      onClick={() => focusHostel(hostel.id)}
                      aria-label={`Show ${hostel.name} on map`}
                      aria-pressed={selected?.hostel.id === hostel.id}
                    >
                      <img src={hostel.coverImage} alt="" loading="lazy" />
                      <span>
                        <strong>{hostel.name}</strong>
                        <small>
                          {hostel.locality} · {room.name}
                        </small>
                        {location && <small className="city-coaching-distance">{formatDistance(campusDistance(hostel, location))} from your location · straight-line</small>}
                        {nearby && <small className="city-coaching-distance">
                          {formatDistance(nearby.distance)} from {nearby.campus.institute} · {nearby.campus.name}
                        </small>}
                        <b>
                          ₹{monthlyTotal(room).toLocaleString('en-IN')}
                          <em> fixed / month</em>
                        </b>
                      </span>
                    </button>
                    <Link to={hostelPreviewHref(hostel.id,nearby?.campus.id || campus.id,room.id,`/map?${params}`)}>
                      Preview stay <ArrowUpRight size={13} />
                    </Link>
                  </article>
                );
              })
            ) : (
              <div className="city-empty">
                <SlidersHorizontal size={26} />
                <h3>A little more room in your search?</h3>
                <p>{location ? `No sample hostels match within ${radius} km of your location. Try 5 km, change room filters or choose a coaching campus. Demo inventory only covers parts of Kota.` : 'No available sample rooms match these filters.'}</p>
                <button
                  type="button"
                  onClick={() => update({ sharing: null, category: null, budget: null, radius: null })}
                >
                  Reset room filters
                </button>
              </div>
            )}
          </div>
          <p className="city-sample-note">
            OpenFreeMap supplies the OpenStreetMap basemap. StayKota listings and campus locations are illustrative
            sample data.
          </p>
        </aside>
        <section
          className="city-map-stage"
          ref={stage}
          aria-label="Interactive whole-city Kota map"
        >
          <div className="city-map-tools">
            <MapLayerToggle basemap={basemap} onChange={value => update({ type: value === 'satellite' ? 'satellite' : null })}/>
            <div className="city-layer-toggle city-perspective-toggle" role="group" aria-label="Map perspective">
              <button type="button" aria-pressed={perspective === '2d'}
                onClick={() => update({ view: null })}>2D</button>
              <button type="button" aria-pressed={perspective === '3d'} disabled={!supports3D}
                aria-describedby="city-perspective-help"
                onClick={() => update({ view: '3d' })}>3D tilt</button>
            </div>
            {selected && <button type="button" className="city-clear-selection" aria-label="Clear selected hostel" onClick={() => update({ hostel:null })}><X size={14}/><span>Clear selection</span></button>}
            <button
              type="button"
              className="city-fullscreen"
              onClick={fullscreen}
              aria-label="Expand city map to full screen"
            >
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              className="city-show-stays"
              ref={staysTrigger}
              aria-expanded={showStays}
              onClick={() => setShowStays(true)}
            >
              <List size={15} />
              Stays ({items.length})
            </button>
          </div>
          {query && (
            <div className="city-search-context">
              <Search size={13} />
              <span>
                StayKota search: <strong>{query}</strong>
              </span>
              <button
                type="button"
                onClick={() => update({ q: null })}
                aria-label="Return to Kota map"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="city-map-surface">
            <div className="city-map-location-controls" role="group" aria-label="Current location map controls">
              <button type="button" className={`city-map-locate${live.tracking ? ' is-active' : ''}`}
                aria-label={location ? inKotaMapArea(location) ? 'Centre map on my current location' : 'Show Kota map while outside the service area' : 'Use my current location on map'}
                title={live.pending ? 'Finding your location…' : location ? inKotaMapArea(location) ? 'Centre on your current location' : 'Show Kota map while outside the service area' : 'Show your current location'}
                aria-pressed={live.tracking} aria-busy={live.pending} disabled={live.pending} onClick={locate}>
                <LocateFixed size={22} className={live.pending ? 'animate-pulse' : undefined}/>
              </button>
              {live.tracking && <button type="button" className="city-map-stop-location" aria-label="Turn off current location on map" title="Turn off location" onClick={live.stop}><X size={17}/></button>}
            </div>
            <KotaMap
              campus={campus}
              items={items}
              selectedHostelId={selected?.hostel.id}
              onSelect={selectHostel}
              onCampusSelect={selectCampus}
              target={target}
              radiusKm={radius}
              activeCampusId={activeCampus?.id}
              userLocation={location}
              perspective={perspective}
              basemap={basemap}
              on3DAvailabilityChange={setSupports3D}
            />
          </div>
          <p className="city-map-caption" id="city-perspective-help">
            Explore Kota and its configured 3 km buffer. Hover or focus a hostel/coaching pin for a circular preview; click a hostel to open its preview page. 2D is flat; 3D tilts the map. Zoom in for buildings where OpenStreetMap data is available.
            Only StayKota hostel/coaching pins are shown. Locations are demo data; distances are straight-line.
          </p>
        </section>
      </div>
    </div>
  );
}
