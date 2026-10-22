import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  BookOpen,
  Check,
  ImageOff,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHostelTransition } from '../context/HostelTransitionContext';
import { HostelRoom3DCanvas } from '../components/three/HostelRoom3DCanvas';
import { KotaHorizon3DCanvas } from '../components/three/KotaHorizon3DCanvas';
import {
  distanceKm,
  formatDistance,
  getCampus,
  getMatchingRooms,
  monthlyTotal,
} from '../lib/discovery';
import { hostelLoginHref, safeAppPath } from '../lib/hostel-navigation';
import { locationLabel } from '../lib/location-status';
import '../styles/hostel-preview.css';

export function HostelPreviewPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { hostels, user } = useApp();
  const { portal, arrivedHostelId, registerPreviewVisualTarget } = useHostelTransition();
  const [imageFailed, setImageFailed] = useState(false);

  const hostel = hostels.find((value) => value.id === id && value.status === 'approved');
  const campus = getCampus(params.get('campus'));
  const returnTo = safeAppPath(params.get('returnTo'), `/explore?campus=${campus.id}`);
  const backLabel = returnTo.startsWith('/map')
    ? 'Back to Kota map'
    : returnTo === '/'
      ? 'Back to home'
      : 'Back to nearby stays';

  useEffect(() => {
    setImageFailed(false);
  }, [hostel?.id, hostel?.coverImage]);

  const visualRef = useCallback(
    (node: HTMLElement | null) => {
      if (hostel?.id) {
        registerPreviewVisualTarget(hostel.id, node);
      }
    },
    [hostel?.id, registerPreviewVisualTarget],
  );

  if (!hostel) {
    return (
      <section className="hostel-preview-empty">
        <span className="hostel-preview-empty__icon">
          <MapPin size={34} />
        </span>
        <span className="hostel-preview-eyebrow">A DIFFERENT TURN</span>
        <h1>This stay isn’t on the map.</h1>
        <p>This listing may be unavailable or awaiting moderation review.</p>
        <Link to={returnTo} className="hostel-preview-empty__cta">
          <ArrowLeft size={16} />
          {backLabel}
        </Link>
      </section>
    );
  }

  const rooms = getMatchingRooms(hostel);
  const room = rooms.find((value) => value.id === params.get('room')) || rooms[0];
  const detailParams = new URLSearchParams({ campus: campus.id, returnTo });
  if (room) detailParams.set('room', room.id);
  const detailsHref = `/hostel/${encodeURIComponent(hostel.id)}?${detailParams}`;
  const authenticated = Boolean(user && user.role !== 'visitor');
  const detailsAction = authenticated ? detailsHref : hostelLoginHref(detailsHref);
  const category =
    hostel.category === 'girls'
      ? 'Girls hostel'
      : hostel.category === 'boys'
        ? 'Boys hostel'
        : 'Co-ed hostel';
  const demo = hostel.location?.status === 'demo';
  const distance = distanceKm(hostel, campus);

  const isCinematicEntry = arrivedHostelId === hostel.id;
  const isPortalFlying = Boolean(
    portal && portal.hostelId === hostel.id && portal.stage !== 'settle',
  );
  const isPortalArrived = isCinematicEntry && !isPortalFlying;

  const pageClassName = [
    'hostel-preview-page',
    isCinematicEntry ? 'is-cinematic-entry' : '',
    isPortalFlying ? 'is-portal-flying' : '',
    isPortalArrived ? 'is-portal-arrived' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectPreviewRoom = (nextRoomId: string) => {
    const next = new URLSearchParams(params);
    next.set('room', nextRoomId);
    setParams(next, { replace: true });
  };

  const handleVisualMove = (event: React.PointerEvent<HTMLElement>) => {
    if (
      isPortalFlying ||
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty('--sk-tilt-rx', `${((0.5 - py) * 5.5).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--sk-tilt-ry', `${((px - 0.5) * 7).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--sk-glare-x', `${(px * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--sk-glare-y', `${(py * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--sk-glare-opacity', '1');
  };

  const handleVisualLeave = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--sk-tilt-rx', '0deg');
    event.currentTarget.style.setProperty('--sk-tilt-ry', '0deg');
    event.currentTarget.style.setProperty('--sk-glare-opacity', '0');
  };

  return (
    <div className={pageClassName}>
      <div className="hostel-preview-hero-band sk-horizon-wrap">
        <KotaHorizon3DCanvas />
        <div className="hostel-preview-shell sk-horizon-content">
          <nav className="hostel-preview-nav" aria-label="Preview navigation">
            <Link to={returnTo} className="hostel-preview-back">
              <ArrowLeft size={16} />
              {backLabel}
            </Link>
            <div className="hostel-preview-nav-right">
              <span className="hostel-preview-nav-pill">
                A first look <span aria-hidden="true">·</span> Hostel preview
              </span>
              <Link
                to={returnTo}
                className="hostel-preview-close-btn"
                aria-label="Close preview and return"
                title={backLabel}
              >
                <X size={16} />
              </Link>
            </div>
          </nav>

          <header className="hostel-preview-intro">
            <span className="hostel-preview-eyebrow">
              <Sparkles size={13} /> A LITTLE CLOSER TO CLASS
            </span>
            <p className="hostel-preview-subtitle">
              Found on the map. <em>Worth a closer look.</em>
            </p>
          </header>
        </div>
      </div>

      <div className="hostel-preview-shell">
        <div className="hostel-preview-layout">
          {/* Left Column: Hero Photo Frame (La Phase 5 Iris Target) + Live Three.js 3D Room Diorama */}
          <div className="hostel-preview-media-stack">
            <section
              ref={visualRef}
              className={`hostel-preview-visual${!isPortalFlying ? ' sk-tilt-3d' : ''}`}
              aria-label="Hostel cover photo"
              onPointerMove={handleVisualMove}
              onPointerLeave={handleVisualLeave}
              onMouseLeave={handleVisualLeave}
            >
              {hostel.coverImage && !imageFailed ? (
                <img
                  src={hostel.coverImage}
                  alt={`${hostel.photography === 'property' ? 'Cover photo' : 'Illustrative cover photo'} of ${hostel.name}`}
                  fetchPriority="high"
                  decoding="async"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="hostel-preview-image-fallback">
                  <ImageOff size={38} />
                  <strong>Cover photo unavailable</strong>
                  <span>Ask the owner for current room photos before visiting.</span>
                </div>
              )}
              <span className="hostel-preview-photo-note">
                {hostel.photography === 'property' ? 'Property cover photo' : 'Illustrative sample photo'}
              </span>
              <div className="hostel-preview-photo-caption">
                <MapPin size={18} />
                <div>
                  <strong>{hostel.locality}, Kota</strong>
                  <span>{locationLabel(hostel)}</span>
                </div>
                <span className="hostel-preview-photo-number">01 / FIRST LOOK</span>
              </div>
            </section>

            <section className="hostel-preview-3d-card" aria-label="3D architectural room preview">
              <div className="hostel-preview-3d-head">
                <div>
                  <span className="hostel-preview-eyebrow">INTERACTIVE 3D DIORAMA</span>
                  <h2>Explore room scale in 3D</h2>
                </div>
                <span className="hostel-preview-3d-tag">{room?.name || 'Concept room'}</span>
              </div>
              <HostelRoom3DCanvas
                capacity={room?.capacity || 2}
                roomName={room?.name}
                features={room?.features}
                included={room?.included}
                height={272}
              />
            </section>
          </div>

          {/* Right Column: Redesigned Architectural Residence Card + Forest Concierge Unlock Card */}
          <section className="hostel-preview-summary" aria-labelledby="hostel-preview-title">
            <div className="hostel-preview-card">
              <div className="hostel-preview-tags">
                <span className="hostel-preview-tag--primary">{category}</span>
                <span>
                  <BedDouble size={13} />
                  {room?.name || 'Ask about rooms'}
                </span>
                <span>{locationLabel(hostel)}</span>
              </div>

              <h1 id="hostel-preview-title" tabIndex={-1}>
                {hostel.name}
              </h1>

              <p className="hostel-preview-address">
                <MapPin size={17} />
                <span>{hostel.address || `${hostel.locality}, Kota`}</span>
              </p>

              {rooms.length > 1 && (
                <div className="hostel-preview-room-picker" role="group" aria-label="Preview room options">
                  <span className="hostel-preview-picker-label">Preview room type</span>
                  <div className="hostel-preview-room-pills">
                    {rooms.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        aria-pressed={room?.id === candidate.id}
                        className={room?.id === candidate.id ? 'is-active' : ''}
                        onClick={() => selectPreviewRoom(candidate.id)}
                      >
                        <span>{candidate.name}</span>
                        <small>₹{monthlyTotal(candidate).toLocaleString('en-IN')}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="hostel-preview-price">
                {room ? (
                  <>
                    <div className="hostel-preview-price__amount">
                      <span className="hostel-preview-price__eyebrow">FIXED MONTHLY TOTAL</span>
                      <strong>₹{monthlyTotal(room).toLocaleString('en-IN')}</strong>
                    </div>
                    <span className="hostel-preview-price__note">
                      per student / month
                      <small>Security deposit &amp; metered electricity separate</small>
                    </span>
                  </>
                ) : (
                  <strong>Ask about availability</strong>
                )}
              </div>

              <div className="hostel-preview-stats">
                <div className="hostel-preview-campus">
                  <span>
                    <BookOpen size={19} />
                  </span>
                  <div>
                    <small className="hostel-preview-stat-kicker">COACHING COMMUTE</small>
                    <strong>
                      {campus.institute} · {campus.name}
                    </strong>
                    <p>
                      {formatDistance(distance)}
                      {distance !== null
                        ? ` · ${demo || campus.location.status === 'demo' ? 'demo ' : ''}straight-line`
                        : ''}
                    </p>
                  </div>
                </div>

                {room && (
                  <div className="hostel-preview-deposit-tile">
                    <span>
                      <Wallet size={18} />
                    </span>
                    <div>
                      <small className="hostel-preview-stat-kicker">REFUNDABLE DEPOSIT</small>
                      <strong>₹{room.deposit.toLocaleString('en-IN')}</strong>
                      <p>One-time · confirm refund terms</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="hostel-preview-unlock">
              <div className="hostel-preview-unlock-heading">
                <span>
                  <LockKeyhole size={18} />
                </span>
                <div>
                  <strong>
                    {authenticated
                      ? 'Your next step, all in one place.'
                      : 'Get the complete picture.'}
                  </strong>
                  <p>
                    {authenticated
                      ? 'Open the full property showroom, cost breakdown and visit scheduler.'
                      : 'Sign in or create a student account to unlock full stay details.'}
                  </p>
                </div>
              </div>
              <ul>
                <li>
                  <Check size={15} />
                  Room options &amp; full monthly ledger breakdown
                </li>
                <li>
                  <Check size={15} />
                  Curved 3D photo showroom, facilities &amp; house rules
                </li>
                <li>
                  <Check size={15} />
                  Owner contact details &amp; visit date coordination
                </li>
              </ul>
              <Link className="hostel-preview-primary" to={detailsAction}>
                See full details <ArrowRight size={18} />
              </Link>
              {!authenticated && (
                <p className="hostel-preview-signup">
                  New to StayKota?{' '}
                  <Link to={hostelLoginHref(detailsHref, true)}>
                    Create an account <ArrowUpRight size={13} />
                  </Link>
                </p>
              )}
            </div>

            <p className="hostel-preview-note">
              <ShieldCheck size={16} />
              <span>
                {demo
                  ? 'Demo listing · confirm the exact street entrance, room condition and pricing with the owner before visiting.'
                  : 'Confirm the entrance, availability and final terms directly with the owner before visiting.'}
              </span>
            </p>
          </section>
        </div>

        <div className="hostel-preview-bottom">
          <span>
            <MapPin size={16} />
            Your campus. Your corner of Kota.
          </span>
          <Link to={returnTo}>
            Keep exploring nearby stays <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
