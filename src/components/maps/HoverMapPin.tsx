import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useCityMap } from './MapContext';
import { useHostelTransition } from '../../context/HostelTransitionContext';
import { preloadImageSafe } from '../../lib/marker-transition';
import { MapCirclePreview, type MapCirclePreviewProps } from './MapCirclePreview';

export interface MarkerActivationOrigin {
  markerElement: HTMLElement | null;
  apertureElement: HTMLElement | null;
}

interface HoverMapPinProps extends MapCirclePreviewProps {
  children: ReactNode;
  onActivate?: (origin: MarkerActivationOrigin) => void;
}

/**
 * Coordinates single-pin circular cover-image hover/focus/touch previews and passes exact
 * live marker + circular photo aperture bounds when activated for cinematic expansion.
 */
export function HoverMapPin({ children, onActivate, ...preview }: HoverMapPinProps) {
  const map = useCityMap();
  const { hoveredPinId, setHoveredPinId } = useHostelTransition();
  const wrapper = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const lastPointerType = useRef<string>('mouse');
  const closeTimer = useRef<number | null>(null);
  const prewarmed = useRef(false);

  const pinKey = `${preview.kind}:${preview.id}`;
  const open = hoveredPinId === pinKey;

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!map) return;
    const onMoveStart = () => {
      dragged.current = true;
      if (hoveredPinId === pinKey) setHoveredPinId(null);
    };
    map.on('movestart', onMoveStart);
    return () => {
      map.off('movestart', onMoveStart);
    };
  }, [map, hoveredPinId, pinKey, setHoveredPinId]);

  useEffect(() => {
    if (!open) return;
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHoveredPinId(null);
    };
    const closeOnOutsideTouch = (event: Event) => {
      const target = event.target as Node | null;
      if (wrapper.current && target && !wrapper.current.contains(target)) {
        setHoveredPinId(null);
      }
    };
    window.addEventListener('keydown', closeOnKey);
    window.addEventListener('touchstart', closeOnOutsideTouch, { passive: true });
    return () => {
      window.removeEventListener('keydown', closeOnKey);
      window.removeEventListener('touchstart', closeOnOutsideTouch);
    };
  }, [open, setHoveredPinId]);

  const show = useCallback(() => {
    clearCloseTimer();
    const element = wrapper.current;
    if (element && map) {
      const marker = element.getBoundingClientRect();
      const canvas = map.getContainer().getBoundingClientRect();
      const x = marker.left + marker.width / 2;
      const y = marker.top + marker.height / 2;
      const shiftX = Math.min(Math.max(x, canvas.left + 86), canvas.right - 86) - x;
      const shiftY = Math.min(Math.max(y, canvas.top + 86), canvas.bottom - 86) - y;
      element.style.setProperty('--preview-shift-x', `${shiftX}px`);
      element.style.setProperty('--preview-shift-y', `${shiftY}px`);
    }
    if (preview.kind === 'hostel' && !prewarmed.current) {
      prewarmed.current = true;
      void import('../../pages/HostelPreviewPage').catch(() => undefined);
      void preloadImageSafe(preview.image, 120);
    }
    setHoveredPinId(pinKey);
  }, [clearCloseTimer, map, pinKey, preview.image, preview.kind, setHoveredPinId]);

  const scheduleHide = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setHoveredPinId(hoveredPinId === pinKey ? null : hoveredPinId);
    }, 55);
  }, [clearCloseTimer, hoveredPinId, pinKey, setHoveredPinId]);

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    if (event.buttons !== 0) return;
    show();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    lastPointerType.current = event.pointerType || 'mouse';
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // On coarse touch devices without hover, first tap reveals the circular cover preview cleanly;
    // tapping the opened circle immediately launches the full cinematic hostel transition.
    if (lastPointerType.current === 'touch' && !open) {
      event.preventDefault();
      event.stopPropagation();
      show();
      return;
    }
    if (onActivate) {
      event.preventDefault();
      event.stopPropagation();
      const root = wrapper.current;
      const button = root?.querySelector<HTMLElement>('button') ?? root;
      const aperture = root?.querySelector<HTMLElement>('[data-preview-aperture]') ?? null;
      onActivate({ markerElement: button ?? null, apertureElement: aperture });
    }
  };

  return (
    <div
      ref={wrapper}
      className={`student-marker-preview student-marker-preview--${preview.kind}${open ? ' is-open' : ''}`}
      onPointerDownCapture={handlePointerDown}
      onClickCapture={handleClickCapture}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleHide}
      onFocus={show}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          clearCloseTimer();
          setHoveredPinId(null);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          lastPointerType.current = 'keyboard';
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          clearCloseTimer();
          setHoveredPinId(null);
        }
      }}
    >
      {children}
      {open && (
        <span className="student-marker-preview__circle">
          <MapCirclePreview {...preview} />
        </span>
      )}
    </div>
  );
}
