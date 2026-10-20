import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  Layers,
  List,
  Map as MapIcon,
  Maximize2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CAMPUSES } from '../data/campuses';
import { formatDistance, getCampus, getMatchingRooms, monthlyTotal } from '../lib/discovery';
import {
  CITY_TARGET,
  campusDistance,
  nearestCampus,
  withinCampusRadius,
  googleExternalUrl,
  validCoordinates,
  type CityMapType,
  type MapTarget,
} from '../lib/maps';
import { GoogleCityMap } from '../components/maps/GoogleCityMap';
import '../styles/city-map.css';

export function KotaMapPage() {
  const { hostels } = useApp();
  const [params, setParams] = useSearchParams();
  const campus = getCampus(params.get('campus'));
  const query = params.get('q') || '';
  const [search, setSearch] = useState(query);
  const [notice, setNotice] = useState('');
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
  const mapType: CityMapType = params.get('type') === 'satellite' ? 'satellite' : 'roadmap';
  const activeCampus = CAMPUSES.find(c => c.id === params.get('campus'));
  const radius = activeCampus && [1, 3, 5].includes(Number(params.get('radius')))
    ? Number(params.get('radius')) : undefined;
  const items = hostels
    .filter((h) => h.status === 'approved' && (!category || h.category === category))
    .filter(h => !radius || withinCampusRadius(h, campus, radius))
    .flatMap((hostel) => {
      const room = getMatchingRooms(hostel, { sharing, maxBudget: budget })[0];
      return room ? [{ hostel, room }] : [];
    }).sort((a, b) => activeCampus
      ? (campusDistance(a.hostel, campus) ?? Infinity) - (campusDistance(b.hostel, campus) ?? Infinity) : 0);
  const selected = items.find((item) => item.hostel.id === params.get('hostel'));
  let target: MapTarget = { ...CITY_TARGET, id: `kota-${revision}` };
  if (activeCampus)
    target = {
      lat: campus.latitude, lng: campus.longitude,
      zoom: radius === 5 ? 12 : radius === 3 ? 13 : 14,
      id: `${campus.id}-${radius || 'all'}`,
    };
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
  const selectHostel = (id: string) => {
    update({ hostel: id, q: null });
    setShowStays(false);
  };
  const selectCampus = (id: string) => update({ campus: id, hostel: null, q: null });
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: search.trim().slice(0, 180) || null, hostel: null, campus: null });
    setShowStays(false);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice(
        'Full screen is not available in this browser. You can open the map in Google Maps.'
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
            Search an area, road or landmark in Kota
          </label>
          <input
            id="city-search"
            placeholder="Search an area, road or landmark"
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
              setRevision((n) => n + 1);
              update({ campus: null, hostel: null, q: null, radius: null });
            }}
            className="city-reset"
          >
            <MapIcon size={15} />
            Whole Kota
          </button>
          <a
            href={googleExternalUrl(target, query)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open this view in Google Maps"
          >
            <ExternalLink size={16} />
            <span>Google Maps</span>
          </a>
        </div>
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
            Distance from coaching
            <select aria-label="Distance from coaching" disabled={!activeCampus}
              value={radius || ''} onChange={e => update({ radius: e.target.value, hostel: null })}>
              <option value="">All distances</option>
              <option value="1">Within 1 km</option>
              <option value="3">Within 3 km</option>
              <option value="5">Within 5 km</option>
            </select>
            <small>{activeCampus ? 'Nearest first · straight-line distance, not walking distance' : 'Choose a coaching campus to filter nearby stays.'}</small>
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
                      onClick={() => selectHostel(hostel.id)}
                      aria-label={`Show ${hostel.name} on map`}
                      aria-pressed={selected?.hostel.id === hostel.id}
                    >
                      <img src={hostel.coverImage} alt="" loading="lazy" />
                      <span>
                        <strong>{hostel.name}</strong>
                        <small>
                          {hostel.locality} · {room.name}
                        </small>
                        {nearby && <small className="city-coaching-distance">
                          {formatDistance(nearby.distance)} from {nearby.campus.institute} · {nearby.campus.name}
                        </small>}
                        <b>
                          ₹{monthlyTotal(room).toLocaleString('en-IN')}
                          <em> fixed / month</em>
                        </b>
                      </span>
                    </button>
                    <Link to={`/hostel/${hostel.id}?campus=${campus.id}&room=${room.id}`}>
                      Room details <ArrowUpRight size={13} />
                    </Link>
                  </article>
                );
              })
            ) : (
              <div className="city-empty">
                <SlidersHorizontal size={26} />
                <h3>A little more room in your search?</h3>
                <p>No available sample rooms match these filters.</p>
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
            Google supplies the city map. StayKota listings and campus locations are illustrative
            sample data.
          </p>
        </aside>
        <section
          className="city-map-stage"
          ref={stage}
          aria-label="Interactive whole-city Google map"
        >
          <div className="city-map-tools">
            <div className="city-layer-toggle" aria-label="Google map layer">
              <button
                type="button"
                aria-pressed={mapType === 'roadmap'}
                onClick={() => update({ type: null })}
              >
                <MapIcon size={14} />
                Map
              </button>
              <button
                type="button"
                aria-pressed={mapType === 'satellite'}
                onClick={() => update({ type: 'satellite' })}
              >
                <Layers size={14} />
                Satellite
              </button>
            </div>
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
                Google place search: <strong>{query}</strong>
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
            <GoogleCityMap
              campus={campus}
              items={items}
              selectedHostelId={selected?.hostel.id}
              onSelect={selectHostel}
              onCampusSelect={selectCampus}
              target={target}
              mapType={mapType}
              search={query}
              radiusKm={radius}
              activeCampusId={activeCampus?.id}
            />
          </div>
          {selected && (
            <div className="city-selected">
              <img src={selected.hostel.coverImage} alt="" />
              <div>
                <small>SAMPLE LOCATION SELECTED</small>
                <strong>{selected.hostel.name}</strong>
                <span>
                  {selected.room.name} · ₹{monthlyTotal(selected.room).toLocaleString('en-IN')}{' '}
                  fixed / student / month
                </span>
              </div>
              <Link
                to={`/hostel/${selected.hostel.id}?campus=${campus.id}&room=${selected.room.id}`}
              >
                View rooms <ArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => update({ hostel: null })}
                aria-label="Clear selected hostel"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <p className="city-map-caption">
            Pan and zoom freely to explore Kota’s roads, neighbourhoods and landmarks. Hostel pins
            use sample coordinates.
          </p>
        </section>
      </div>
    </div>
  );
}
