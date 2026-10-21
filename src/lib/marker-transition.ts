export interface ApertureGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface MarkerOriginInput {
  markerRect: DOMRect | { left: number; top: number; width: number; height: number };
  apertureRect?: DOMRect | { left: number; top: number; width: number; height: number } | null;
  viewportWidth: number;
  viewportHeight: number;
}

export interface SavedMapCameraState {
  lat: number;
  lng: number;
  zoom: number;
  pitch: number;
  bearing: number;
  hostelId?: string;
  pathname: string;
  search: string;
  savedAt: number;
}

const CAMERA_STORAGE_KEY = 'staykota_map_return_camera';
const CAMERA_MAX_AGE_MS = 15 * 60 * 1000;

/**
 * Computes the starting circular aperture rectangle in viewport coordinates.
 * Uses the open hover preview's circular photo center if available, or builds a
 * centered 90px circular origin directly over the clicked marker — safely clamped inside viewport edges.
 */
export function computeOriginAperture({
  markerRect,
  apertureRect,
  viewportWidth,
  viewportHeight,
}: MarkerOriginInput): ApertureGeometry {
  const safeWidth = Math.max(320, viewportWidth || 1280);
  const safeHeight = Math.max(320, viewportHeight || 720);
  const diameter = apertureRect && apertureRect.width >= 48 ? Math.round(apertureRect.width) : 90;
  const radius = diameter / 2;

  const rawCenterX = apertureRect && apertureRect.width >= 48
    ? apertureRect.left + apertureRect.width / 2
    : markerRect.left + markerRect.width / 2;
  const rawCenterY = apertureRect && apertureRect.height >= 48
    ? apertureRect.top + apertureRect.height / 2
    : markerRect.top + markerRect.height / 2;

  // Clamp center so markers right against any screen edge still expand cleanly inside the viewport
  const margin = 8;
  const clampedCenterX = Math.min(
    Math.max(rawCenterX, radius + margin),
    Math.max(radius + margin, safeWidth - radius - margin),
  );
  const clampedCenterY = Math.min(
    Math.max(rawCenterY, radius + margin),
    Math.max(radius + margin, safeHeight - radius - margin),
  );

  return {
    left: Math.round(clampedCenterX - radius),
    top: Math.round(clampedCenterY - radius),
    width: diameter,
    height: diameter,
    borderRadius: Math.ceil(diameter / 2),
  };
}

/**
 * Predicts the exact `.hostel-preview-visual` hero frame geometry matching `hostel-preview.css`
 * for the brief millisecond before the live DOM node reports its exact measured bounding box.
 */
export function computeFallbackTargetGeometry(
  viewportWidth: number,
  viewportHeight: number,
): ApertureGeometry {
  const vw = Math.max(320, viewportWidth || 1280);
  const vh = Math.max(480, viewportHeight || 800);

  if (vw <= 700) {
    const shellWidth = vw - 32;
    const left = Math.round((vw - shellWidth) / 2);
    return {
      left,
      top: Math.min(188, Math.round(vh * 0.2)),
      width: shellWidth,
      height: 280,
      borderRadius: 15,
    };
  }

  const shellMax = vw <= 1000 ? vw - 48 : Math.min(1240, vw - 80);
  const gap = vw <= 1000 ? 28 : 48;
  const colWidth = Math.round(((shellMax - gap) * 1.17) / 2.17);
  const left = Math.round((vw - shellMax) / 2);
  const height = vw <= 1000 ? 570 : 590;

  return {
    left,
    top: Math.min(238, Math.max(110, Math.round(vh * 0.24))),
    width: Math.max(260, colWidth),
    height: Math.min(height, Math.max(300, vh - 140)),
    borderRadius: 20,
  };
}

/** Persist map camera state right before transitioning into a hostel preview page. */
export function saveMapCameraSnapshot(snapshot: Omit<SavedMapCameraState, 'savedAt'>): void {
  try {
    sessionStorage.setItem(
      CAMERA_STORAGE_KEY,
      JSON.stringify({ ...snapshot, savedAt: Date.now() } satisfies SavedMapCameraState),
    );
  } catch {
    // Private-browsing storage restrictions gracefully fall back to URL target parameters.
  }
}

/** Read and clear a recent map camera snapshot when returning back to the map. */
export function consumeMapCameraSnapshot(currentPathname: string): SavedMapCameraState | null {
  try {
    const raw = sessionStorage.getItem(CAMERA_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CAMERA_STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<SavedMapCameraState>;
    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lng !== 'number' ||
      typeof parsed.zoom !== 'number' ||
      typeof parsed.savedAt !== 'number' ||
      parsed.pathname !== currentPathname
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > CAMERA_MAX_AGE_MS) {
      return null;
    }
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      zoom: parsed.zoom,
      pitch: typeof parsed.pitch === 'number' ? parsed.pitch : 0,
      bearing: typeof parsed.bearing === 'number' ? parsed.bearing : 0,
      hostelId: typeof parsed.hostelId === 'string' ? parsed.hostelId : undefined,
      pathname: parsed.pathname,
      search: typeof parsed.search === 'string' ? parsed.search : '',
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

/** Pre-decodes a cover photo softly without throwing or stalling if missing/broken. */
export function preloadImageSafe(src?: string, maxWaitMs = 90): Promise<boolean> {
  if (!src || typeof Image === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    const timer = setTimeout(() => finish(true), maxWaitMs);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      if (typeof img.decode === 'function') {
        img.decode().then(() => finish(true)).catch(() => finish(true));
      } else {
        finish(true);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };
    img.src = src;
  });
}
