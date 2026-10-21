import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import {
  computeOriginAperture,
  preloadImageSafe,
} from '../lib/marker-transition';
import '../styles/marker-transition.css';

export type TransitionStage = 'sweep' | 'iris' | 'settle';

export interface StartHostelTransitionInput {
  hostelId: string;
  hostelName: string;
  locality?: string;
  coverImage?: string;
  targetHref: string;
  markerElement: HTMLElement | null;
  apertureElement?: HTMLElement | null;
}

interface ActivePortalState {
  token: number;
  hostelId: string;
  hostelName: string;
  locality: string;
  coverImage?: string;
  imageBroken: boolean;
  stage: TransitionStage;
  ringX: number;
  ringY: number;
}

interface HostelTransitionContextValue {
  /** Currently open circular hover/tap preview ID so only one marker expands at a time */
  hoveredPinId: string | null;
  setHoveredPinId: (id: string | null) => void;
  /** Active La Phase 5 inspired ring-sweep + circular iris transition portal */
  portal: ActivePortalState | null;
  /** Hostel ID that entered via marker animation */
  arrivedHostelId: string | null;
  /** Hostel ID that the student just returned to on the map */
  returnedHostelId: string | null;
  setReturnedHostelId: (id: string | null) => void;
  /** Launch full cinematic ring-sweep -> circular iris zoom-through -> HostelPreviewPage reveal */
  startHostelTransition: (input: StartHostelTransitionInput) => void;
  /** Registered destination visual ref hook on `HostelPreviewPage` */
  registerPreviewVisualTarget: (hostelId: string, element: HTMLElement | null) => void;
}

function shortArcLabel(value: string, maxLen = 22): string {
  const clean = value.trim().replace(/\s+/g, ' ').toUpperCase();
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1).trimEnd()}…` : clean;
}

const HostelTransitionContext = createContext<HostelTransitionContextValue | null>(null);

export function HostelTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [portal, setPortal] = useState<ActivePortalState | null>(null);
  const [arrivedHostelId, setArrivedHostelId] = useState<string | null>(null);
  const [returnedHostelId, setReturnedHostelId] = useState<string | null>(null);

  const tokenRef = useRef(0);
  const inFlightRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const rafsRef = useRef<number[]>([]);

  const clearScheduledWork = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    for (const id of rafsRef.current) window.cancelAnimationFrame(id);
    timersRef.current = [];
    rafsRef.current = [];
  }, []);

  const cancelPortalImmediately = useCallback(() => {
    tokenRef.current += 1;
    inFlightRef.current = false;
    clearScheduledWork();
    setPortal(null);
  }, [clearScheduledWork]);

  useEffect(() => {
    setHoveredPinId(null);
    if (arrivedHostelId && !location.pathname.includes(`/hostel/${encodeURIComponent(arrivedHostelId)}`)) {
      setArrivedHostelId(null);
    }
  }, [location.pathname, arrivedHostelId]);

  useEffect(() => {
    const onPopState = () => {
      if (inFlightRef.current) {
        cancelPortalImmediately();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      clearScheduledWork();
    };
  }, [cancelPortalImmediately, clearScheduledWork]);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const scheduleRaf = useCallback((fn: () => void) => {
    const id = window.requestAnimationFrame(fn);
    rafsRef.current.push(id);
    return id;
  }, []);

  const startHostelTransition = useCallback(
    ({
      hostelId,
      hostelName,
      locality = 'Kota',
      coverImage,
      targetHref,
      markerElement,
      apertureElement,
    }: StartHostelTransitionInput) => {
      if (inFlightRef.current) return;

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!markerElement || typeof window === 'undefined') {
        navigate(targetHref);
        return;
      }

      clearScheduledWork();
      inFlightRef.current = true;
      const currentToken = ++tokenRef.current;

      if (reducedMotion) {
        setArrivedHostelId(hostelId);
        void import('../pages/HostelPreviewPage')
          .catch(() => undefined)
          .finally(() => {
            if (tokenRef.current !== currentToken) return;
            inFlightRef.current = false;
            navigate(targetHref);
          });
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const markerRect = markerElement.getBoundingClientRect();
      const apertureRect = apertureElement?.getBoundingClientRect() ?? null;
      const origin = computeOriginAperture({
        markerRect,
        apertureRect,
        viewportWidth: vw,
        viewportHeight: vh,
      });

      const startX = origin.left + origin.width / 2;
      const startY = origin.top + origin.height / 2;
      const centerX = Math.round(vw / 2);
      const centerY = Math.round(vh / 2);

      setHoveredPinId(null);
      setArrivedHostelId(hostelId);

      // Mount ring right at the clicked marker position
      setPortal({
        token: currentToken,
        hostelId,
        hostelName,
        locality,
        coverImage,
        imageBroken: !coverImage,
        stage: 'sweep',
        ringX: startX,
        ringY: startY,
      });

      // Next animation frame: glide the 164px ring smoothly into exact screen center `(50vw, 50vh)`
      // in lockstep with the live MapLibre camera glide + bilateral 6->12 o'clock white arc fill!
      scheduleRaf(() => {
        scheduleRaf(() => {
          if (tokenRef.current !== currentToken) return;
          setPortal((prev) =>
            prev && prev.token === currentToken
              ? { ...prev, ringX: centerX, ringY: centerY }
              : prev,
          );
        });
      });

      // Stage 1 completes at 300ms just as the bilateral white arcs kiss at 12 o'clock top center!
      const sweepPromise = new Promise<void>((resolve) => {
        scheduleTimeout(resolve, 300);
      });

      void Promise.all([
        sweepPromise,
        import('../pages/HostelPreviewPage').catch(() => undefined),
        preloadImageSafe(coverImage, 220),
      ]).then(([, , imageReady]) => {
        if (tokenRef.current !== currentToken) return;

        // Commit route navigation cleanly underneath the full-bleed iris zoom-through
        try {
          navigate(targetHref);
        } catch {
          cancelPortalImmediately();
          return;
        }

        // Stage 2 (`300ms -> 720ms`): Expand circular iris portal across entire screen
        // with wide-to-tight letter-spaced title convergence over the interior photograph!
        scheduleRaf(() => {
          if (tokenRef.current !== currentToken) return;
          setPortal((prev) =>
            prev && prev.token === currentToken
              ? {
                  ...prev,
                  imageBroken: prev.imageBroken || !imageReady,
                  stage: 'iris',
                }
              : prev,
          );
        });

        // Release click guard & fade out iris stage seamlessly into interactive `HostelPreviewPage`
        scheduleTimeout(() => {
          if (tokenRef.current !== currentToken) return;
          setPortal((prev) =>
            prev && prev.token === currentToken ? { ...prev, stage: 'settle' } : prev,
          );
          inFlightRef.current = false;

          scheduleTimeout(() => {
            if (tokenRef.current !== currentToken) return;
            setPortal(null);
            const heading = document.getElementById('hostel-preview-title');
            heading?.focus({ preventScroll: true });
          }, 180);
        }, 420);
      });
    },
    [cancelPortalImmediately, clearScheduledWork, navigate, scheduleRaf, scheduleTimeout],
  );

  const registerPreviewVisualTarget = useCallback(
    (_hostelId: string, _element: HTMLElement | null) => {
      // Destination visual hook preserved for future layout telemetry
    },
    [],
  );

  const value = useMemo<HostelTransitionContextValue>(
    () => ({
      hoveredPinId,
      setHoveredPinId,
      portal,
      arrivedHostelId,
      returnedHostelId,
      setReturnedHostelId,
      startHostelTransition,
      registerPreviewVisualTarget,
    }),
    [
      hoveredPinId,
      portal,
      arrivedHostelId,
      returnedHostelId,
      startHostelTransition,
      registerPreviewVisualTarget,
    ],
  );

  return (
    <HostelTransitionContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        portal &&
        createPortal(
          <div
            className={`sk-marker-portal${portal.stage === 'sweep' ? ' is-capturing' : ''}`}
            data-stage={portal.stage}
            data-transition-hostel={portal.hostelId}
            aria-hidden="true"
          >
            {/* Stage 2: Full-bleed Circular Iris Reveal + Tracked Editorial Title Convergence */}
            <div className="sk-marker-portal__iris-stage">
              {portal.coverImage && !portal.imageBroken ? (
                <img
                  className="sk-marker-portal__iris-media"
                  src={portal.coverImage}
                  alt=""
                  decoding="sync"
                  draggable={false}
                  onError={() =>
                    setPortal((prev) =>
                      prev && prev.token === portal.token ? { ...prev, imageBroken: true } : prev,
                    )
                  }
                />
              ) : (
                <div className="sk-marker-portal__iris-fallback">
                  <MapPin size={54} strokeWidth={1.5} />
                </div>
              )}
              <div className="sk-marker-portal__iris-vignette" />
              <div className="sk-marker-portal__hero-type">
                <span className="sk-marker-portal__hero-eyebrow">
                  {portal.locality} · Kota
                </span>
                <strong className="sk-marker-portal__hero-title">
                  {portal.hostelName}
                </strong>
              </div>
            </div>

            {/* Stage 1: Gliding 164px Circular Badge with Symmetric 6-to-12 o'clock White Ring Sweep */}
            <div
              className="sk-marker-portal__ring-assembly"
              style={{
                left: `${portal.ringX}px`,
                top: `${portal.ringY}px`,
              }}
            >
              <svg className="sk-marker-portal__ring-svg" viewBox="0 0 164 164">
                <defs>
                  <path id="sk-portal-top-arc" d="M 17 82 A 65 65 0 0 1 147 82" />
                  <path id="sk-portal-bot-arc" d="M 10 82 A 72 72 0 0 0 154 82" />
                </defs>
                <circle cx="82" cy="82" r="68" className="sk-marker-portal__ring-base" />
                <text className="sk-marker-portal__ring-text" textAnchor="middle">
                  <textPath href="#sk-portal-top-arc" startOffset="50%">
                    {shortArcLabel(portal.hostelName)}
                  </textPath>
                </text>
                <text className="sk-marker-portal__ring-subtext" textAnchor="middle">
                  <textPath href="#sk-portal-bot-arc" startOffset="50%">
                    {shortArcLabel(portal.locality)}
                  </textPath>
                </text>
                <circle cx="14" cy="82" r="2.4" className="sk-marker-portal__ring-dot" />
                <circle cx="150" cy="82" r="2.4" className="sk-marker-portal__ring-dot" />
                {/* Bilateral symmetric white arcs climbing equally from 6 o'clock (82, 150) to 12 o'clock (82, 14) */}
                <path d="M 82 150 A 68 68 0 0 1 82 14" className="sk-marker-portal__arc-fill" />
                <path d="M 82 150 A 68 68 0 0 0 82 14" className="sk-marker-portal__arc-fill" />
              </svg>
              <span className="sk-marker-portal__ring-thumb">
                {portal.coverImage && !portal.imageBroken ? (
                  <img
                    src={portal.coverImage}
                    alt=""
                    decoding="sync"
                    draggable={false}
                    onError={() =>
                      setPortal((prev) =>
                        prev && prev.token === portal.token ? { ...prev, imageBroken: true } : prev,
                      )
                    }
                  />
                ) : (
                  <MapPin size={40} strokeWidth={1.6} />
                )}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </HostelTransitionContext.Provider>
  );
}

export function useHostelTransition() {
  const ctx = useContext(HostelTransitionContext);
  if (!ctx) {
    throw new Error('useHostelTransition must be used within HostelTransitionProvider');
  }
  return ctx;
}
