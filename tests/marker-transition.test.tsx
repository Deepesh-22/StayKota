// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../src/context/AppContext';
import {
  HostelTransitionProvider,
  useHostelTransition,
} from '../src/context/HostelTransitionContext';
import { HoverMapPin } from '../src/components/maps/HoverMapPin';
import { CityMapContext } from '../src/components/maps/MapContext';
import { HostelPreviewPage } from '../src/pages/HostelPreviewPage';
import { MOCK_HOSTELS } from '../src/data/mockData';
import { monthlyTotal } from '../src/lib/discovery';
import { hostelPreviewHref } from '../src/lib/hostel-navigation';
import {
  computeFallbackTargetGeometry,
  computeOriginAperture,
  consumeMapCameraSnapshot,
  saveMapCameraSnapshot,
} from '../src/lib/marker-transition';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="current-route">{loc.pathname + loc.search}</div>;
}

function TestMapStage({
  hostels = MOCK_HOSTELS.slice(0, 3),
}: {
  hostels?: typeof MOCK_HOSTELS;
}) {
  const { startHostelTransition } = useHostelTransition();
  const fakeMap = {
    getContainer: () => {
      const el = document.createElement('div');
      el.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          right: window.innerWidth,
          bottom: window.innerHeight,
          width: window.innerWidth,
          height: window.innerHeight,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      return el;
    },
    on: () => {},
    off: () => {},
  } as unknown as import('maplibre-gl').Map;

  return (
    <CityMapContext.Provider value={fakeMap}>
      <div data-testid="map-stage">
        {hostels.map((hostel, index) => {
          const room = hostel.roomTypes[0];
          const href = hostelPreviewHref(
            hostel.id,
            'allen-talwandi',
            room?.id,
            `/map?campus=allen-talwandi&sharing=double&hostel=${hostel.id}`,
          );
          return (
            <HoverMapPin
              key={hostel.id}
              id={hostel.id}
              name={hostel.name}
              subtitle={hostel.locality}
              image={hostel.coverImage}
              kind="hostel"
              onActivate={(origin) => {
                saveMapCameraSnapshot({
                  lat: 25.1482,
                  lng: 75.8524,
                  zoom: 15.6,
                  pitch: 50,
                  bearing: 0,
                  hostelId: hostel.id,
                  pathname: '/map',
                  search: '?campus=allen-talwandi&sharing=double',
                });
                startHostelTransition({
                  hostelId: hostel.id,
                  hostelName: hostel.name,
                  coverImage: hostel.coverImage,
                  targetHref: href,
                  markerElement: origin.markerElement,
                  apertureElement: origin.apertureElement,
                });
              }}
            >
              <button
                type="button"
                data-testid={`pin-${hostel.id}`}
                aria-label={`Select ${hostel.name} on map`}
                ref={(btn) => {
                  if (btn) {
                    btn.getBoundingClientRect = () =>
                      ({
                        left: 180 + index * 140,
                        top: 220,
                        right: 260 + index * 140,
                        bottom: 250,
                        width: 80,
                        height: 30,
                        x: 180 + index * 140,
                        y: 220,
                        toJSON: () => ({}),
                      }) as DOMRect;
                  }
                }}
              >
                ₹{room ? monthlyTotal(room).toLocaleString('en-IN') : '0'}
              </button>
            </HoverMapPin>
          );
        })}
      </div>
    </CityMapContext.Provider>
  );
}

describe('cinematic hostel marker-to-detail transition suite', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    window.innerWidth = 1280;
    window.innerHeight = 800;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.querySelectorAll('.sk-marker-portal').forEach((n) => n.remove());
    vi.useRealTimers();
  });

  it('clamps edge marker origins inside viewport bounds and computes responsive desktop/tablet/mobile frames', () => {
    const topLeftEdge = computeOriginAperture({
      markerRect: { left: 2, top: 3, width: 64, height: 28 },
      apertureRect: null,
      viewportWidth: 1280,
      viewportHeight: 720,
    });
    expect(topLeftEdge.left).toBeGreaterThanOrEqual(8);
    expect(topLeftEdge.top).toBeGreaterThanOrEqual(8);
    expect(topLeftEdge.width).toBe(90);
    expect(topLeftEdge.borderRadius).toBe(45);

    const bottomRightEdge = computeOriginAperture({
      markerRect: { left: 1250, top: 700, width: 70, height: 30 },
      apertureRect: null,
      viewportWidth: 1280,
      viewportHeight: 720,
    });
    expect(bottomRightEdge.left + bottomRightEdge.width).toBeLessThanOrEqual(1272);
    expect(bottomRightEdge.top + bottomRightEdge.height).toBeLessThanOrEqual(712);

    const desktopTarget = computeFallbackTargetGeometry(1440, 900);
    const tabletTarget = computeFallbackTargetGeometry(900, 1024);
    const mobileTarget = computeFallbackTargetGeometry(390, 844);
    expect(desktopTarget.borderRadius).toBe(20);
    expect(tabletTarget.height).toBe(570);
    expect(mobileTarget.borderRadius).toBe(15);
    expect(mobileTarget.height).toBe(280);
  });

  it('shows unique hostel cover previews on hover without overlap, then morphs smoothly into HostelPreviewPage and cleans up portal', async () => {
    await act(async () => {
      root.render(
        <AppProvider>
          <MemoryRouter initialEntries={['/map?campus=allen-talwandi&sharing=double']}>
            <HostelTransitionProvider>
              <LocationProbe />
              <Routes>
                <Route path="/map" element={<TestMapStage />} />
                <Route path="/hostel/:id/preview" element={<HostelPreviewPage />} />
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </AppProvider>,
      );
    });

    const firstHostel = MOCK_HOSTELS[0];
    const secondHostel = MOCK_HOSTELS[1];
    const pin1 = container.querySelector(`[data-testid="pin-${firstHostel.id}"]`) as HTMLButtonElement;
    const pin2 = container.querySelector(`[data-testid="pin-${secondHostel.id}"]`) as HTMLButtonElement;

    // Hover first marker -> displays its circular cover image preview
    act(() => {
      pin1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    const preview1 = container.querySelector(`[data-preview-id="${firstHostel.id}"]`);
    expect(preview1).not.toBeNull();
    expect(preview1?.querySelector('img')?.getAttribute('src')).toBe(firstHostel.coverImage);

    // Hover second marker -> immediately swaps without two overlapping open circles
    act(() => {
      pin2.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(container.querySelectorAll('.map-circle-preview')).toHaveLength(1);
    const preview2 = container.querySelector(`[data-preview-id="${secondHostel.id}"]`);
    expect(preview2?.querySelector('img')?.getAttribute('src')).toBe(secondHostel.coverImage);

    // Click second marker (plus rapid duplicate clicks) -> only one portal launches in Stage A ("pulse")
    act(() => {
      pin2.click();
      pin2.click();
      pin2.click();
    });
    const portalPulse = document.body.querySelector('.sk-marker-portal');
    expect(portalPulse).not.toBeNull();
    expect(portalPulse?.getAttribute('data-stage')).toBe('pulse');
    expect(portalPulse?.getAttribute('data-transition-hostel')).toBe(secondHostel.id);

    // Advance past Stage A into Stage B ("expand") + route handoff to `/hostel/:id/preview`
    await act(async () => {
      await vi.advanceTimersByTimeAsync(160);
    });
    expect(container.querySelector('[data-testid="current-route"]')?.textContent).toContain(
      `/hostel/${secondHostel.id}/preview`,
    );
    expect(container.querySelector('#hostel-preview-title')?.textContent).toBe(secondHostel.name);
    expect(container.textContent).toContain(secondHostel.locality);

    // Advance past Stage D completion -> portal completely cleaned up from DOM and focus moved to title
    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(document.body.querySelector('.sk-marker-portal')).toBeNull();
    expect(document.activeElement?.id).toBe('hostel-preview-title');

    // Return camera snapshot was preserved accurately for map restoration
    const snapshot = consumeMapCameraSnapshot('/map');
    expect(snapshot).toMatchObject({
      lat: 25.1482,
      lng: 75.8524,
      zoom: 15.6,
      pitch: 50,
      hostelId: secondHostel.id,
    });
    expect(consumeMapCameraSnapshot('/map')).toBeNull();
  });

  it('supports direct URL access, missing cover images, touch two-tap preview, keyboard Escape, and prefers-reduced-motion', async () => {
    const missingPhotoHostel = {
      ...MOCK_HOSTELS[0],
      id: 'h1',
      coverImage: '',
    };

    // 1. Direct URL load without running marker animation first
    await act(async () => {
      root.render(
        <AppProvider>
          <MemoryRouter initialEntries={['/hostel/h1/preview?campus=allen-talwandi&room=rt2']}>
            <HostelTransitionProvider>
              <Routes>
                <Route path="/hostel/:id/preview" element={<HostelPreviewPage />} />
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </AppProvider>,
      );
    });
    expect(container.querySelector('#hostel-preview-title')?.textContent).toBe(MOCK_HOSTELS[0].name);
    expect(container.querySelector('.hostel-preview-page')?.classList.contains('is-portal-flying')).toBe(false);

    // 2. Touch device first tap previews, Escape dismisses, and missing coverImage degrades gracefully
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    act(() => {
      root.unmount();
    });
    root = createRoot(container);

    await act(async () => {
      root.render(
        <AppProvider>
          <MemoryRouter initialEntries={['/map']}>
            <HostelTransitionProvider>
              <LocationProbe />
              <Routes>
                <Route path="/map" element={<TestMapStage hostels={[missingPhotoHostel]} />} />
                <Route path="/hostel/:id/preview" element={<HostelPreviewPage />} />
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </AppProvider>,
      );
    });

    const touchPin = container.querySelector('[data-testid="pin-h1"]') as HTMLButtonElement;

    // First tap on touch opens circular preview with fallback pin icon without navigating yet
    act(() => {
      touchPin.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
      );
      touchPin.click();
    });
    expect(container.querySelector('[data-preview-id="h1"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="current-route"]')?.textContent).toBe('/map');

    // Escape closes preview cleanly
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(container.querySelector('[data-preview-id="h1"]')).toBeNull();

    // Keyboard focus + Enter with prefers-reduced-motion transitions cleanly to destination
    act(() => {
      touchPin.focus();
      touchPin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      touchPin.click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(container.querySelector('[data-testid="current-route"]')?.textContent).toContain(
      '/hostel/h1/preview',
    );
  });
});
