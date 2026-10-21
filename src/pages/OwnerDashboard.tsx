import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FilePenLine,
  Images,
  LayoutGrid,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { KotaHorizon3DCanvas } from '../components/three/KotaHorizon3DCanvas';
import type { Hostel, ListingStatus } from '../types';
import { monthlyTotal } from '../lib/discovery';
import { validCoordinates } from '../lib/coordinates';
import { fetchCurrentOwnerPosition } from '../lib/owner-location';
import { hasRealUploadedPhotos } from '../lib/owner-media';
import '../styles/owner-workspace.css';

type Section = 'overview' | 'listings' | 'visits';

const statusLabels: Record<ListingStatus, string> = {
  draft: 'Draft',
  pending: 'Pending review',
  approved: 'Published · Live',
  rejected: 'Hidden / rejected',
};

const categoryLabels: Record<Hostel['category'], string> = {
  boys: 'Boys hostel',
  girls: 'Girls hostel',
  'co-ed': 'Co-ed stay',
};

const dateLabel = (value: string) =>
  new Date(value + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const localToday = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

export function OwnerDashboard() {
  const { user, hostels, visits, updateHostel, deleteHostel, confirmVisit, cancelVisit } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [section, setSection] = useState<Section>('overview');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListingStatus | ''>('');
  const [notice, setNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const [publishedBannerHostelId, setPublishedBannerHostelId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Hostel | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const today = localToday();

  const myHostels = useMemo(
    () => hostels.filter((hostel) => hostel.ownerId === user?.id),
    [hostels, user?.id],
  );

  useEffect(() => {
    const pub = searchParams.get('published');
    const submitted = searchParams.get('submitted');
    if (pub) {
      setPublishedBannerHostelId(pub);
      const next = new URLSearchParams(searchParams);
      next.delete('published');
      setSearchParams(next, { replace: true });
    } else if (submitted) {
      const target = myHostels.find((h) => h.id === submitted);
      setNotice(
        `“${target?.name || 'Your hostel'}” was submitted for admin review. You can also click “Publish now” anytime to make it live immediately.`,
      );
      const next = new URLSearchParams(searchParams);
      next.delete('submitted');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, myHostels]);

  const myVisits = useMemo(
    () =>
      visits.filter((visit) =>
        myHostels.some((hostel) => hostel.id === visit.hostelId),
      ),
    [visits, myHostels],
  );

  const filtered = useMemo(
    () =>
      myHostels.filter(
        (hostel) =>
          (!status || hostel.status === status) &&
          (hostel.name + ' ' + hostel.locality + ' ' + hostel.address)
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ),
    [myHostels, status, search],
  );

  const activeVisits = myVisits.filter(
    (visit) => visit.status !== 'cancelled' && visit.visitDate >= today,
  );
  const published = myHostels.filter((hostel) => hostel.status === 'approved');
  const draftsAndPending = myHostels.filter(
    (hostel) => hostel.status === 'draft' || hostel.status === 'pending',
  );
  const availableRoomTypes = myHostels.reduce(
    (sum, h) => sum + h.roomTypes.filter((r) => r.available).length,
    0,
  );

  if (!user || user.role !== 'owner') {
    return (
      <div className="owner-guard">
        <Building2 size={36} />
        <h1>Your hostel, thoughtfully managed.</h1>
        <p>
          Sign in as a hostel owner to list properties, set live GPS entrance
          coordinates, upload real property photos, and manage student visits.
        </p>
        <Link className="owner-primary" to="/login?role=owner&redirect=/owner">
          Owner sign in <ArrowUpRight size={17} />
        </Link>
      </div>
    );
  }

  function changeStatus(hostel: Hostel, next: ListingStatus) {
    if (hostel.ownerId !== user?.id) return;
    setErrorNotice('');
    updateHostel({ ...hostel, status: next });
    if (next === 'approved') {
      setPublishedBannerHostelId(hostel.id);
      setNotice(`“${hostel.name}” is now live on Explore Hostels and Explore Kota Map.`);
    } else if (next === 'pending') {
      setNotice(`“${hostel.name}” sent to the moderation queue.`);
    } else {
      setPublishedBannerHostelId(null);
      setNotice(`“${hostel.name}” moved to Draft and hidden from public search.`);
    }
  }

  async function handleQuickCurrentLocation(hostel: Hostel) {
    if (locatingId) return;
    setLocatingId(hostel.id);
    setErrorNotice('');
    setNotice('');
    try {
      const pos = await fetchCurrentOwnerPosition();
      updateHostel({
        ...hostel,
        latitude: pos.latitude,
        longitude: pos.longitude,
        locality: pos.nearestLocality || hostel.locality,
        location: { status: 'owner-provided' },
      });
      setNotice(
        `Saved current GPS location for “${hostel.name}”: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}${
          pos.accuracy ? ` (±${pos.accuracy} m)` : ''
        }${pos.nearestLocality ? ` · ${pos.nearestLocality}` : ''}.`,
      );
    } catch (err) {
      setErrorNotice(
        err instanceof Error
          ? err.message
          : 'Could not read current location. Please check browser location permissions.',
      );
    } finally {
      setLocatingId(null);
    }
  }

  const publishedBannerHostel = publishedBannerHostelId
    ? myHostels.find((h) => h.id === publishedBannerHostelId && h.status === 'approved')
    : null;

  const startingPrice = (hostel: Hostel) => {
    const totals = hostel.roomTypes.filter((r) => r.available).map(monthlyTotal);
    if (!totals.length) return null;
    return Math.min(...totals);
  };

  const listingCard = (hostel: Hostel) => {
    const hasCoords = validCoordinates(hostel.latitude, hostel.longitude);
    const minPrice = startingPrice(hostel);
    const realPhotos = hasRealUploadedPhotos(hostel.images);
    const photoCount = Math.max(1, hostel.images.length);
    const isLocating = locatingId === hostel.id;

    return (
      <article className="owner-listing" key={hostel.id}>
        <div className="owner-listing-media">
          <img
            src={hostel.coverImage}
            alt={hostel.name + ' accommodation'}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = '/images/room-shared.webp';
            }}
          />
          <span className="owner-photo-badge">
            <Images size={12} /> {photoCount} {realPhotos ? 'real' : 'sample'}
          </span>
        </div>

        <div className="owner-listing-main">
          <div className="owner-listing-title">
            <h3>{hostel.name}</h3>
            <span className={'owner-status owner-status-' + hostel.status}>
              {statusLabels[hostel.status]}
            </span>
            <span className="owner-category-chip">{categoryLabels[hostel.category]}</span>
          </div>

          <p className="owner-listing-meta">
            <span>
              <MapPin size={14} /> {hostel.locality}, Kota
              {hostel.address ? ` · ${hostel.address}` : ''}
            </span>
          </p>

          <div className="owner-listing-pills">
            <span className="owner-room-count">
              <BedDouble size={14} />
              {hostel.roomTypes.filter((room) => room.available).length} of{' '}
              {hostel.roomTypes.length} room types open
            </span>
            {minPrice !== null && (
              <span className="owner-price-pill">
                From ₹{minPrice.toLocaleString('en-IN')}/mo
              </span>
            )}
            {hasCoords ? (
              <a
                className="owner-coord-pill is-set"
                href={`https://www.openstreetmap.org/?mlat=${hostel.latitude}&mlon=${hostel.longitude}#map=17/${hostel.latitude}/${hostel.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Verify saved coordinates on OpenStreetMap"
              >
                <LocateFixed size={12} />
                {hostel.latitude!.toFixed(5)}, {hostel.longitude!.toFixed(5)} ↗
              </a>
            ) : (
              <span className="owner-coord-pill is-missing">
                <MapPin size={12} /> GPS pin not set
              </span>
            )}
          </div>
        </div>

        <div className="owner-listing-actions">
          <button
            type="button"
            className="owner-loc-btn"
            disabled={Boolean(locatingId)}
            onClick={() => void handleQuickCurrentLocation(hostel)}
            title="Fetch your current latitude & longitude automatically"
          >
            {isLocating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Locating…
              </>
            ) : (
              <>
                <LocateFixed size={14} />{' '}
                {hasCoords ? 'Update GPS' : 'Use current location'}
              </>
            )}
          </button>

          <Link
            className="owner-secondary"
            to={'/owner/listing/' + hostel.id + '/edit'}
          >
            <FilePenLine size={14} /> Edit
          </Link>

          {hostel.status !== 'approved' ? (
            <button
              type="button"
              className="owner-publish-btn"
              onClick={() => changeStatus(hostel, 'approved')}
            >
              <Rocket size={14} /> Publish now
            </button>
          ) : (
            <>
              <Link
                to={'/hostel/' + hostel.id}
                aria-label={'View ' + hostel.name}
                className="owner-secondary"
              >
                Live page <ArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                className="owner-text-action"
                onClick={() => changeStatus(hostel, 'draft')}
              >
                Unpublish
              </button>
            </>
          )}

          <button
            type="button"
            className="owner-icon-link owner-remove"
            aria-label={'Hide ' + hostel.name}
            title="Unpublish or delete listing"
            onClick={() => setRemoveTarget(hostel)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </article>
    );
  };

  const visitCards = (limit?: number) => {
    const items = (section === 'overview' ? activeVisits : myVisits).slice(0, limit);
    return items.length ? (
      <div className="owner-visits">
        {items.map((visit) => (
          <article className="owner-visit" key={visit.id}>
            <div className="owner-student-avatar">
              {visit.studentName.charAt(0).toUpperCase()}
            </div>
            <div className="owner-visit-content">
              <div className="owner-visit-header">
                <h3>{visit.studentName}</h3>
                {visit.studentPhone && (
                  <a href={`tel:${visit.studentPhone.replace(/[^+\d]/g, '')}`} className="owner-phone-pill">
                    <Phone size={12} /> {visit.studentPhone}
                  </a>
                )}
              </div>
              <p>
                {visit.hostelName}
                {visit.roomTypeName ? ' · ' + visit.roomTypeName : ''}
              </p>
              <span>
                <CalendarDays size={13} /> Preferred visit: {dateLabel(visit.visitDate)}
              </span>
              {visit.message && <blockquote>{visit.message}</blockquote>}
            </div>
            <div className="owner-visit-actions">
              <Badge
                variant={
                  visit.status === 'cancelled'
                    ? 'default'
                    : visit.status === 'confirmed'
                      ? 'success'
                      : 'warning'
                }
              >
                {visit.status === 'cancelled'
                  ? 'Cancelled'
                  : visit.status === 'confirmed'
                    ? 'Confirmed'
                    : 'Coordination pending'}
              </Badge>
              <div className="owner-visit-btn-row">
                {visit.status === 'requested' && (
                  <button
                    type="button"
                    className="owner-confirm-btn"
                    onClick={() => {
                      confirmVisit(visit.id);
                      setNotice(`Marked ${visit.studentName}’s visit on ${dateLabel(visit.visitDate)} as confirmed.`);
                    }}
                  >
                    <CheckCircle2 size={13} /> Confirm
                  </button>
                )}
                <button type="button" onClick={() => setRequestId(visit.id)}>
                  Details <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="owner-empty">
        <CalendarDays size={30} />
        <h3>No visit requests yet</h3>
        <p>
          When students book a visit on your published hostel pages, their
          preferred date and contact number will show right here.
        </p>
      </div>
    );
  };

  return (
    <div className="owner-workspace">
      <div className="owner-layout">
        <aside className="owner-sidebar">
          <p className="owner-eyebrow">OWNER STUDIO</p>
          <h2>
            Good stays.
            <br />
            Better beginnings.
          </h2>
          <nav aria-label="Owner workspace">
            {(
              [
                { id: 'overview', label: 'Overview', icon: LayoutGrid, badge: 0 },
                { id: 'listings', label: 'My hostels', icon: Building2, badge: myHostels.length },
                { id: 'visits', label: 'Visit requests', icon: CalendarDays, badge: activeVisits.length },
              ] as const
            ).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setSection(item.id);
                  setErrorNotice('');
                }}
                aria-current={section === item.id ? 'page' : undefined}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge > 0 && <small>{item.badge}</small>}
              </button>
            ))}
          </nav>

          <Link className="owner-sidebar-cta" to="/owner/listing/new">
            <Plus size={16} /> List a new hostel
          </Link>

          <div className="owner-sidebar-note">
            <ShieldCheck size={20} />
            <strong>Built for Kota hostel owners</strong>
            <p>
              Capture exact entrance GPS with one click, upload real room photos,
              and publish transparent pricing directly to students.
            </p>
          </div>
        </aside>

        <div className="owner-main">
          <header className="owner-page-header sk-horizon-wrap">
            <KotaHorizon3DCanvas />
            <div className="sk-horizon-content">
              <p className="owner-eyebrow">HOSTEL OWNER DASHBOARD</p>
              <h1>
                {section === 'visits'
                  ? 'Student visit requests'
                  : section === 'listings'
                    ? 'Manage your hostels'
                    : 'Welcome back, ' + user.name.split(' ')[0]}
              </h1>
              <p>
                {section === 'visits'
                  ? 'Coordinate visit dates directly with students and parents.'
                  : 'Add real room photos, auto-detect your GPS entrance pin in one click, and publish straight to Explore & Kota Map.'}
              </p>
            </div>
            <div className="owner-header-actions sk-horizon-content">
              <Link className="owner-secondary" to="/map">
                <MapPin size={15} /> Kota Map
              </Link>
              <Link className="owner-primary" to="/owner/listing/new">
                <Plus size={17} /> Add new hostel
              </Link>
            </div>
          </header>

          {publishedBannerHostel && (
            <div className="owner-published-banner" role="status">
              <Sparkles size={20} />
              <div>
                <strong>“{publishedBannerHostel.name}” is live!</strong>
                <p>
                  Students can now discover this hostel across Explore Hostels and
                  on the interactive Kota Map.
                </p>
              </div>
              <div className="owner-published-links">
                <Link to={`/hostel/${publishedBannerHostel.id}`}>
                  Open live page <ExternalLink size={13} />
                </Link>
                <Link to={`/map?hostel=${publishedBannerHostel.id}`}>
                  View on Map <MapPin size={13} />
                </Link>
                <button
                  type="button"
                  aria-label="Dismiss published banner"
                  onClick={() => setPublishedBannerHostelId(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {notice && (
            <div className="owner-notice" role="status">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice('')}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {errorNotice && (
            <div className="owner-notice owner-notice-error" role="alert">
              <XCircle size={18} />
              <span>{errorNotice}</span>
              <button
                type="button"
                onClick={() => setErrorNotice('')}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {section === 'overview' && (
            <>
              <div className="owner-stats">
                {[
                  {
                    icon: Building2,
                    label: 'Published hostels',
                    value: published.length,
                    note: 'Live on Explore & Map',
                  },
                  {
                    icon: Clock3,
                    label: 'Drafts & pending',
                    value: draftsAndPending.length,
                    note: 'Ready to publish anytime',
                  },
                  {
                    icon: BedDouble,
                    label: 'Open room types',
                    value: availableRoomTypes,
                    note: 'Accepting student enquiries',
                  },
                  {
                    icon: CalendarDays,
                    label: 'Upcoming visits',
                    value: activeVisits.length,
                    note: 'Scheduled student visits',
                  },
                ].map((item) => (
                  <article key={item.label}>
                    <span className="owner-stat-icon">
                      <item.icon size={19} />
                    </span>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>

              <section className="owner-section">
                <div className="owner-section-header">
                  <div>
                    <p className="owner-eyebrow">YOUR PROPERTIES</p>
                    <h2>Hostel listings ({myHostels.length})</h2>
                  </div>
                  <button type="button" onClick={() => setSection('listings')}>
                    View all listings <ChevronRight size={16} />
                  </button>
                </div>
                {myHostels.length ? (
                  <div className="owner-listings">
                    {myHostels.slice(0, 4).map(listingCard)}
                  </div>
                ) : (
                  <div className="owner-empty">
                    <Building2 size={34} />
                    <h3>Your first hostel listing starts here</h3>
                    <p>
                      Add your rooms, use current GPS location in one click,
                      upload real hostel photos, and publish instantly.
                    </p>
                    <Link className="owner-primary" to="/owner/listing/new">
                      <Plus size={16} /> Create your first listing
                    </Link>
                  </div>
                )}
              </section>

              <section className="owner-section">
                <div className="owner-section-header">
                  <div>
                    <p className="owner-eyebrow">STUDENT ENQUIRIES</p>
                    <h2>Recent visit requests</h2>
                  </div>
                  <button type="button" onClick={() => setSection('visits')}>
                    View all requests <ChevronRight size={16} />
                  </button>
                </div>
                {visitCards(3)}
              </section>

              <div className="owner-help-strip">
                <LocateFixed size={24} />
                <div>
                  <strong>Standing at your hostel gate right now?</strong>
                  <p>
                    Click <b>Use current location</b> on any hostel card above (or inside
                    the listing editor) to fetch your exact latitude &amp; longitude automatically.
                  </p>
                </div>
                <Link to="/owner/listing/new">
                  New listing <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          )}

          {section === 'listings' && (
            <section className="owner-section">
              <div className="owner-filter-bar">
                <label>
                  <Search size={17} />
                  <input
                    aria-label="Search your listings"
                    placeholder="Search hostel name, locality, or street…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <CustomSelect
                  ariaLabel="Filter listing status"
                  value={status}
                  className="owner-status-select"
                  options={[
                    { value: '', label: `All statuses (${myHostels.length})` },
                    { value: 'approved', label: `Published (${published.length})` },
                    { value: 'pending', label: 'Pending review' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'rejected', label: 'Hidden / rejected' },
                  ]}
                  onChange={(nextValue) => setStatus(nextValue as ListingStatus | '')}
                />
              </div>
              {filtered.length ? (
                <div className="owner-listings">{filtered.map(listingCard)}</div>
              ) : (
                <div className="owner-empty">
                  <Search size={28} />
                  <h3>No matching listings</h3>
                  <p>Try a different search term or reset the status filter.</p>
                  <button
                    type="button"
                    className="owner-secondary"
                    onClick={() => {
                      setSearch('');
                      setStatus('');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
          )}

          {section === 'visits' && (
            <section className="owner-section">
              <p className="owner-explainer">
                Confirm preferred dates with students or parents directly by
                phone. Confirming here updates their student dashboard status immediately.
              </p>
              {visitCards()}
            </section>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title={removeTarget ? `Manage “${removeTarget.name}”` : 'Manage listing'}
      >
        <p className="owner-dialog-copy">
          You can unpublish this hostel to keep it as a private draft for later,
          or permanently delete it from your workspace.
        </p>
        <div className="owner-dialog-actions">
          <Button variant="outline" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          {removeTarget && removeTarget.status !== 'draft' && (
            <Button
              variant="secondary"
              onClick={() => {
                updateHostel({ ...removeTarget, status: 'draft' });
                setRemoveTarget(null);
                setNotice(`“${removeTarget.name}” moved to Draft.`);
              }}
            >
              Move to draft
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() => {
              if (removeTarget) {
                const deletedName = removeTarget.name;
                deleteHostel(removeTarget.id);
                setRemoveTarget(null);
                setNotice(`Deleted “${deletedName}”.`);
              }
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(requestId)}
        onClose={() => setRequestId(null)}
        title="Visit request details"
      >
        {(() => {
          const request = myVisits.find((item) => item.id === requestId);
          return request ? (
            <div className="owner-request-detail">
              <Badge
                variant={
                  request.status === 'cancelled'
                    ? 'default'
                    : request.status === 'confirmed'
                      ? 'success'
                      : 'warning'
                }
              >
                {request.status === 'cancelled'
                  ? 'Cancelled'
                  : request.status === 'confirmed'
                    ? 'Confirmed'
                    : 'Coordination pending'}
              </Badge>
              <h3>{request.studentName}</h3>
              <p>{request.hostelName}</p>
              <p>{request.roomTypeName || 'Room preference not specified'}</p>
              <p>
                <CalendarDays size={15} /> {dateLabel(request.visitDate)}
              </p>
              {request.studentPhone && (
                <p>
                  <Phone size={15} />{' '}
                  <a href={`tel:${request.studentPhone.replace(/[^+\d]/g, '')}`}>
                    {request.studentPhone}
                  </a>
                </p>
              )}
              {request.message && <blockquote>{request.message}</blockquote>}
              <div className="owner-dialog-actions">
                {request.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      cancelVisit(request.id);
                      setRequestId(null);
                      setNotice('Visit request cancelled.');
                    }}
                  >
                    Cancel request
                  </Button>
                )}
                {request.status === 'requested' && (
                  <Button
                    onClick={() => {
                      confirmVisit(request.id);
                      setRequestId(null);
                      setNotice(`Confirmed visit for ${request.studentName}.`);
                    }}
                  >
                    Confirm visit
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setRequestId(null)}>
                  Done
                </Button>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>
    </div>
  );
}
