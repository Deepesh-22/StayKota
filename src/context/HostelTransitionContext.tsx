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
  computeFallbackTargetGeometry,
  computeOriginAperture,
  preloadImageSafe,
  type ApertureGeometry,
} from '../lib/marker-transition';
import '../styles/marker-transition.css';

export type TransitionStage = 'pulse' | 'expand' | 'settle';

export interface StartHostelTransitionInput {
  hostelId: string;
  hostelName: string;
  coverImage?: string;
  targetHref: string;
  markerElement: HTMLElement | null;
  apertureElement?: HTMLElement | null;
}

interface ActivePortalState {
  token: number;
  hostelId: string;
  hostelName: string;
  coverImage?: string;
  imageBroken: boolean;
  stage: TransitionStage;
  reducedMotion: boolean;
  originCenterX: number;
  originCenterY: number;
  ringDiameter: number;
  frame: ApertureGeometry;
}

interface HostelTransitionContextValue {
  /** Currently open circular hover/tap preview ID so only one marker expands at a time */
  hoveredPinId: string | null;
  setHoveredPinId: (id: string | null) => void;
  /** Active shared-element transition state */
  portal: ActivePortalState | null;
  /** Hostel ID that recently completed or started a cinematic entry */
  arrivedHostelId: string | null;
  /** Hostel ID that the user just returned to on the map */
  returnedHostelId: string | null;
  setReturnedHostelId: (id: string | null) => void;
  /** Launch cinematic marker-to-preview expansion */
  startHostelTransition: (input: StartHostelTransitionInput) => void;
  /** Called by `HostelPreviewPage` when its `.hostel-preview-visual` hero container mounts */
  registerPreviewVisualTarget: (hostelId: string, element: HTMLElement | null) => void;
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

  // Clear hover state whenever route path changes; abort mid-flight portal if user navigates away unexpectedly
  useEffect(() => {
    setHoveredPinId(null);
    if (arrivedHostelId && !location.pathname.includes(`/hostel/${encodeURIComponent(arrivedHostelId)}`)) {
      setArrivedHostelId(null);
    }
  }, [location.pathname, arrivedHostelId]);

  // Clean up safely if browser Back/Forward interrupts an active animation
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
      coverImage,
      targetHref,
      markerElement,
      apertureElement,
    }: StartHostelTransitionInput) => {
      // Prevent accidental double/rapid clicks from spawning overlapping animations
      if (inFlightRef.current) return;

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Fallback immediately to clean router navigation if no DOM rect can be measured
      if (!markerElement || typeof window === 'undefined') {
        navigate(targetHref);
        return;
      }

      clearScheduledWork();
      inFlightRef.current = true;
      const currentToken = ++tokenRef.current;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const markerRect = markerElement.getBoundingClientRect();
      const apertureRect = apertureElement?.getBoundingClientRect() ?? null;

      // Reduced-motion mode: short, respectful 150ms cross-dissolve directly into destination
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

      const origin = computeOriginAperture({
        markerRect,
        apertureRect,
        viewportWidth: vw,
        viewportHeight: vh,
      });

      setHoveredPinId(null);
      setArrivedHostelId(hostelId);
      setPortal({
        token: currentToken,
        hostelId,
        hostelName,
        coverImage,
        imageBroken: !coverImage,
        stage: 'pulse',
        reducedMotion: false,
        originCenterX: origin.left + origin.width / 2,
        originCenterY: origin.top + origin.height / 2,
        ringDiameter: Math.max(152, origin.width + 62),
        frame: origin,
      });

      // Stage A (0 -> 115ms): Selection ring bloom + chunk & cover image warm-up in parallel
      const stageAPromise = new Promise<void>((resolve) => {
        scheduleTimeout(resolve, 115);
      });

      void Promise.all([
        stageAPromise,
        import('../pages/HostelPreviewPage').catch(() => undefined),
        preloadImageSafe(coverImage, 85),
      ]).then(([, , imageReady]) => {
        if (tokenRef.current !== currentToken) return;

        // Commit route navigation cleanly once Stage A completes
        try {
          navigate(targetHref);
        } catch {
          cancelPortalImmediately();
          return;
        }

        // Begin Stage B expansion immediately toward predicted hero bounds;
        // `registerPreviewVisualTarget` will refine to exact measured DOM pixel bounds on mount!
        scheduleRaf(() => {
          if (tokenRef.current !== currentToken) return;
          const fallbackTarget = computeFallbackTargetGeometry(
            window.innerWidth,
            window.innerHeight,
          );
          setPortal((prev) =>
            prev && prev.token === currentToken
              ? {
                  ...prev,
                  imageBroken: prev.imageBroken || !imageReady,
                  stage: 'expand',
                  frame: fallbackTarget,
                }
              : prev,
          );
        });

        // Stage D completion: fade out portal cleanly & release lock after morph settles (530ms + 130ms dissolve)
        scheduleTimeout(() => {
          if (tokenRef.current !== currentToken) return;
          setPortal((prev) =>
            prev && prev.token === currentToken ? { ...prev, stage: 'settle' } : prev,
          );
          inFlightRef.current = false;

          scheduleTimeout(() => {
            if (tokenRef.current !== currentToken) return;
            setPortal(null);
            // Move keyboard focus politely to the destination heading without jumping scroll
            const heading = document.getElementById('hostel-preview-title');
            heading?.focus({ preventScroll: true });
          }, 155);
        }, 530);
      });
    },
    [cancelPortalImmediately, clearScheduledWork, navigate, scheduleRaf, scheduleTimeout],
  );

  const registerPreviewVisualTarget = useCallback(
    (hostelId: string, element: HTMLElement | null) => {
      if (!element) return;
      // Measure live destination container on next frame so CSS layout is 100% resolved
      scheduleRaf(() => {
        setPortal((prev) => {
          if (!prev || prev.hostelId !== hostelId) return prev;
          const rect = element.getBoundingClientRect();
          if (rect.width < 40 || rect.height < 40) return prev;
          const computedRadius = Number.parseFloat(
            window.getComputedStyle(element).borderTopLeftRadius || '20',
          );
          return {
            ...prev,
            stage: prev.stage === 'pulse' ? 'expand' : prev.stage,
            frame: {
              left: Math.round(rect.left),
              top: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              borderRadius: Number.isFinite(computedRadius) ? computedRadius : 20,
            },
          };
        });
      });
    },
    [scheduleRaf],
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
            className={`sk-marker-portal${portal.stage === 'pulse' ? ' is-capturing' : ''}`}
            data-stage={portal.stage}
            data-transition-hostel={portal.hostelId}
            aria-hidden="true"
          >
            <div className="sk-marker-portal__backdrop" />
            <div
              className="sk-marker-portal__ring-halo"
              style={{
                left: `${portal.originCenterX}px`,
                top: `${portal.originCenterY}px`,
                width: `${portal.ringDiameter}px`,
                height: `${portal.ringDiameter}px`,
              }}
            />
            <div
              className="sk-marker-portal__aperture"
              style={{
                left: `${portal.frame.left}px`,
                top: `${portal.frame.top}px`,
                width: `${portal.frame.width}px`,
                height: `${portal.frame.height}px`,
                borderRadius: `${portal.frame.borderRadius}px`,
              }}
            >
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
                <div className="sk-marker-portal__fallback">
                  <MapPin size={42} strokeWidth={1.6} />
                </div>
              )}
              <div className="sk-marker-portal__scrim" />
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
