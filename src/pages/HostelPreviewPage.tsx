import { useCallback, useEffect, useState } from 'react';
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
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHostelTransition } from '../context/HostelTransitionContext';
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
  const [params] = useSearchParams();
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
        <MapPin size={36} />
        <h1>This stay isn’t on the map.</h1>
        <p>This listing may be unavailable or awaiting review.</p>
        <Link to={returnTo}>
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

  return (
    <div className={pageClassName}>
      <div className="hostel-preview-shell">
        <nav className="hostel-preview-nav" aria-label="Preview navigation">
          <Link to={returnTo}>
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
          <div className="hostel-preview-nav-right">
            <span>
              A first look <span aria-hidden="true">/</span> Hostel preview
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
          <span className="hostel-preview-eyebrow">A LITTLE CLOSER TO CLASS</span>
          <p>Found on the map. Worth a closer look.</p>
        </header>

        <div className="hostel-preview-layout">
          <section
            ref={visualRef}
            className="hostel-preview-visual"
            aria-label="Hostel cover photo"
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
                <ImageOff size={36} />
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

          <section className="hostel-preview-summary" aria-labelledby="hostel-preview-title">
            <div className="hostel-preview-tags">
              <span>{category}</span>
              <span>
                <BedDouble size={13} />
                {room?.name || 'Ask about rooms'}
              </span>
            </div>

            <h1 id="hostel-preview-title" tabIndex={-1}>
              {hostel.name}
            </h1>

            <p className="hostel-preview-address">
              <MapPin size={17} />
              {hostel.address || `${hostel.locality}, Kota`}
            </p>

            <div className="hostel-preview-price">
              {room ? (
                <>
                  <strong>₹{monthlyTotal(room).toLocaleString('en-IN')}</strong>
                  <span>
                    fixed / student / month
                    <small>Security deposit and variable charges separate</small>
                  </span>
                </>
              ) : (
                <strong>Ask about availability</strong>
              )}
            </div>

            <div className="hostel-preview-campus">
              <span>
                <BookOpen size={19} />
              </span>
              <div>
                <strong>
                  {campus.institute} · {campus.name}
                </strong>
                <p>
                  {formatDistance(distance)}
                  {distance !== null
                    ? ` · ${demo || campus.location.status === 'demo' ? 'demo ' : ''}straight-line estimate`
                    : ''}
                </p>
              </div>
            </div>

            <div className="hostel-preview-unlock">
              <div className="hostel-preview-unlock-heading">
                <span>
                  <LockKeyhole size={17} />
                </span>
                <div>
                  <strong>
                    {authenticated
                      ? 'Your next step, all in one place.'
                      : 'Get the complete picture.'}
                  </strong>
                  <p>
                    {authenticated
                      ? 'Explore this hostel’s rooms, photos and visit options.'
                      : 'Log in or create an account to see full hostel details.'}
                  </p>
                </div>
              </div>
              <ul>
                <li>
                  <Check size={14} />
                  Room options &amp; full cost breakdown
                </li>
                <li>
                  <Check size={14} />
                  Photo gallery, facilities &amp; house rules
                </li>
                <li>
                  <Check size={14} />
                  Contact information &amp; visit enquiries
                </li>
              </ul>
              <Link className="hostel-preview-primary" to={detailsAction}>
                See full details <ArrowRight size={18} />
              </Link>
              {!authenticated && (
                <p className="hostel-preview-signup">
                  New to StayKota?{' '}
                  <Link to={hostelLoginHref(detailsHref, true)}>
                    Create an account <ArrowUpRight size={12} />
                  </Link>
                </p>
              )}
            </div>

            <p className="hostel-preview-note">
              <ShieldCheck size={15} />
              {demo
                ? 'Demo listing · confirm the address, room and price with the owner before visiting.'
                : 'Confirm the entrance, availability and total costs with the owner before visiting.'}
            </p>
          </section>
        </div>

        <div className="hostel-preview-bottom">
          <span>
            <MapPin size={15} />
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
