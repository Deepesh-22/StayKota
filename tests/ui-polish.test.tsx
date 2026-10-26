// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CustomSelect } from '../src/components/ui/CustomSelect';
import { KotaShortlist3DCanvas } from '../src/components/three/KotaShortlist3DCanvas';
import { detectGpuProfile } from '../src/lib/gpu-budget';
import { AppProvider } from '../src/context/AppContext';
import { CompareProvider } from '../src/context/CompareContext';
import { HostelTransitionProvider } from '../src/context/HostelTransitionContext';
import { Layout } from '../src/components/layout/Layout';
import { ComparePage } from '../src/pages/ComparePage';
import { ExplorePage } from '../src/pages/ExplorePage';
import { HomePage } from '../src/pages/HomePage';
import { HostelDetailPage } from '../src/pages/HostelDetailPage';
import { HostelPreviewPage } from '../src/pages/HostelPreviewPage';
import { HowItWorksPage } from '../src/pages/HowItWorksPage';
import { LoginPage } from '../src/pages/LoginPage';
import { NotFoundPage } from '../src/pages/NotFoundPage';
import { StudentDashboard } from '../src/pages/StudentDashboard';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute('open');
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(ui: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(ui);
  });
  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  document.body.innerHTML = '';
});

describe('StayKota Non-Homepage UI/UX, CustomSelect & Compare 3D Skyline', () => {
  it('opens custom animated popover menu, selects an option, and stays synced with native select for accessibility/Playwright', () => {
    const onChange = vi.fn();
    mount(
      <CustomSelect
        id="budget-filter"
        ariaLabel="Monthly fixed budget"
        value=""
        options={[
          { value: '', label: 'Any budget' },
          { value: '8000', label: 'Up to ₹8,000' },
          { value: '12000', label: 'Up to ₹12,000' },
        ]}
        onChange={onChange}
      />,
    );

    const trigger = document.querySelector('.sk-select__trigger') as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    expect(document.querySelector('.sk-select__menu')).toBeNull();

    act(() => {
      trigger.click();
    });

    const menu = document.querySelector('.sk-select__menu');
    expect(menu).not.toBeNull();
    const options = Array.from(document.querySelectorAll('.sk-select__option'));
    expect(options).toHaveLength(3);

    act(() => {
      options[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });

    expect(onChange).toHaveBeenCalledWith('8000');
    expect(document.querySelector('.sk-select__menu')).toBeNull();

    const nativeSelect = document.getElementById('budget-filter') as HTMLSelectElement;
    expect(nativeSelect).not.toBeNull();
    act(() => {
      nativeSelect.value = '12000';
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('12000');
  });

  it('enables instant search automatically for large option sets (>= 8 options) and closes on Escape', () => {
    const onChange = vi.fn();
    const manyOptions = Array.from({ length: 10 }, (_, idx) => ({
      value: `campus-${idx}`,
      label: `Institute ${idx} · Campus Zone ${idx}`,
    }));

    mount(
      <CustomSelect
        ariaLabel="Your coaching campus"
        value="campus-0"
        searchPlaceholder="Search coaching campus…"
        options={manyOptions}
        onChange={onChange}
      />,
    );

    const trigger = document.querySelector('.sk-select__trigger') as HTMLButtonElement;
    act(() => {
      trigger.click();
    });

    const searchInput = document.querySelector('.sk-select__search') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(searchInput, 'Zone 7');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const filtered = document.querySelectorAll('.sk-select__option');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].textContent).toContain('Institute 7');

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(document.querySelector('.sk-select__menu')).toBeNull();
  });

  it('renders ExplorePage cleanly without 3D micro-city box while preserving custom dropdowns and interactive pointer-tilt HostelCards', () => {
    mount(
      <AppProvider>
        <CompareProvider>
          <MemoryRouter initialEntries={['/explore']}>
            <HostelTransitionProvider>
              <ExplorePage />
            </HostelTransitionProvider>
          </MemoryRouter>
        </CompareProvider>
      </AppProvider>,
    );

    // Explicitly verify 3D Kota Coaching Micro-City & horizon 3D canvas are completely removed
    expect(document.querySelector('.sk-district3d')).toBeNull();
    expect(document.querySelector('.sk-horizon3d')).toBeNull();
    expect(document.body.textContent).not.toContain('3D KOTA COACHING MICRO-CITY');

    // Verify HostelCards show ONLY the 1st photo with NO Room toggle and NO Left/Right photo buttons
    expect(document.querySelector('.room-card-model')).toBeNull();
    expect(document.querySelector('.room-card-views')).toBeNull();
    expect(document.querySelector('.room-card-photo-controls')).toBeNull();
    const cardPhotos = document.querySelectorAll('.discovery-card .room-card-photo');
    expect(cardPhotos.length).toBeGreaterThan(0);

    const customSelects = document.querySelectorAll('.discovery-page .sk-select');
    expect(customSelects.length).toBe(4);

    const firstCard = document.querySelector('.discovery-card') as HTMLElement;
    expect(firstCard).not.toBeNull();
    vi.spyOn(firstCard, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 320,
      bottom: 420,
      width: 320,
      height: 420,
      toJSON: () => ({}),
    });

    act(() => {
      firstCard.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          pointerType: 'mouse',
          clientX: 260,
          clientY: 80,
        }),
      );
    });
    expect(firstCard.style.getPropertyValue('--sheen-o')).toBe('1');
    expect(firstCard.style.getPropertyValue('--card-rx')).not.toBe('0deg');
    expect(firstCard.style.getPropertyValue('--card-ry')).not.toBe('0deg');

    act(() => {
      firstCard.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(firstCard.style.getPropertyValue('--sheen-o')).toBe('0');
    expect(firstCard.style.getPropertyValue('--card-rx')).toBe('0deg');
  });

  it('renders HowItWorksPage and LoginPage cleanly without any 3D beacon or horizon models', () => {
    mount(
      <MemoryRouter initialEntries={['/how-it-works']}>
        <HowItWorksPage />
      </MemoryRouter>,
    );

    const stepCards = document.querySelectorAll('.help-step.sk-tilt-3d');
    expect(stepCards).toHaveLength(3);
    expect(document.querySelectorAll('.help-step__stage')).toHaveLength(3);
    expect(document.querySelector('.sk-beacon3d')).toBeNull();
    expect(document.querySelector('.sk-horizon3d')).toBeNull();
    expect(document.body.textContent).not.toContain('INTERACTIVE 3D KOTA GUIDE');

    act(() => {
      root?.unmount();
    });
    container?.remove();

    mount(
      <AppProvider>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </AppProvider>,
    );

    expect(document.body.textContent).toContain('Your next chapter');
    expect(document.body.textContent).toContain('starts close by.');
    expect(document.querySelector('.sk-beacon3d')).toBeNull();
    expect(document.querySelector('.sk-horizon3d')).toBeNull();
  });

  it('renders redesigned HostelDetailPage below untouched CurvedPhotoGallery without the 3D cutaway box', () => {
    localStorage.setItem(
      'staykota_user',
      JSON.stringify({ id: 'u-student', name: 'Aarav Sharma', email: 'student@demo.local', role: 'student' }),
    );

    mount(
      <AppProvider>
        <CompareProvider>
          <MemoryRouter initialEntries={['/hostel/h1?campus=allen-talwandi&room=rt2']}>
            <HostelTransitionProvider>
              <Routes>
                <Route path="/hostel/:id" element={<HostelDetailPage />} />
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </CompareProvider>
      </AppProvider>,
    );

    // Untouched CurvedPhotoGallery showroom remains mounted at top
    expect(document.querySelector('.curved-gallery')).not.toBeNull();

    // Redesigned overview card + 4 metric tiles + section anchor bar
    expect(document.querySelector('.detail-overview-card')).not.toBeNull();
    expect(document.querySelectorAll('.detail-metric-tile')).toHaveLength(4);
    expect(document.querySelectorAll('.detail-anchor-nav a')).toHaveLength(5);

    // Verify 3D room cutaway is completely removed while rooms, amenities, costs & sidebar remain clean
    expect(document.querySelector('.detail-room-scene')).toBeNull();
    expect(document.body.textContent).not.toContain('THREE.JS 3D CUTAWAY');
    expect(document.querySelectorAll('.detail-amenity-card').length).toBeGreaterThan(0);
    expect(document.querySelector('.detail-sidebar .detail-enquiry')).not.toBeNull();
    expect(document.querySelector('#detail-costs .detail-price')).not.toBeNull();
    expect(document.querySelector('#detail-location .detail-proximity')).not.toBeNull();

    localStorage.clear();
  });

  it('renders clean HostelPreviewPage with only the 1st cover photo, no room switcher, no photo arrows, and full-detail privacy boundary', () => {
    localStorage.removeItem('staykota_user');

    mount(
      <AppProvider>
        <CompareProvider>
          <MemoryRouter initialEntries={['/hostel/h1/preview?campus=allen-samyak&room=rt2&returnTo=%2Fexplore']}>
            <HostelTransitionProvider>
              <Routes>
                <Route path="/hostel/:id/preview" element={<HostelPreviewPage />} />
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </CompareProvider>
      </AppProvider>,
    );

    expect(document.querySelector('#hostel-preview-title')?.textContent).toContain('Comfort Stay Hostel');
    expect(document.querySelector('.hostel-preview-price')?.textContent).toContain('₹5,500');
    expect(document.querySelectorAll('.hostel-preview-visual img')).toHaveLength(1);

    // Verify 3D room card, room option pills, and photo navigation buttons are all absent
    expect(document.querySelector('.hostel-preview-3d-card')).toBeNull();
    expect(document.querySelector('.hostel-preview-room-picker')).toBeNull();
    expect(document.querySelector('.hostel-preview-room-pills')).toBeNull();
    expect(document.body.textContent).not.toContain('Explore room scale in 3D');

    // Strictly preserves full-detail privacy gate boundaries on /preview
    expect(document.querySelector('.detail-page')).toBeNull();
    expect(document.querySelector('.curved-gallery')).toBeNull();
    expect(document.querySelector('.detail-price')).toBeNull();
  });

  it('retains the full Compare 3D Cost & Commute Skyline + winner callout strip on /compare while keeping Homepage & dashboards clean', async () => {
    const profile = detectGpuProfile();
    expect(['high', 'balanced', 'lite']).toContain(profile.tier);
    expect(profile.dpr).toBeGreaterThan(0);

    localStorage.setItem(
      'staykota_user',
      JSON.stringify({ id: 'u-student', name: 'Aarav Sharma', email: 'student@demo.local', role: 'student' }),
    );

    mount(
      <AppProvider>
        <CompareProvider>
          <MemoryRouter initialEntries={['/compare?ids=h1,h4&sharing=double&campus=allen-talwandi']}>
            <HostelTransitionProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/compare" element={<ComparePage />} />
                </Route>
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </CompareProvider>
      </AppProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    // Compare 3D Skyline + Winner Insights + Comparison Matrix remain fully functional
    expect(document.querySelector('.sk-scroll-progress')).not.toBeNull();
    expect(document.querySelector('.sk-shortlist3d')).not.toBeNull();
    expect(document.body.textContent).toContain('3D COST & COMMUTE SKYLINE');
    expect(document.querySelector('.compare-insights')).not.toBeNull();
    expect(document.querySelectorAll('.compare-table thead th')).toHaveLength(3);

    // Unmount and verify Homepage (`/`) renders ZERO non-home scroll progress bar
    act(() => {
      root?.unmount();
    });
    container?.remove();

    mount(
      <AppProvider>
        <CompareProvider>
          <MemoryRouter initialEntries={['/']}>
            <HostelTransitionProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                </Route>
              </Routes>
            </HostelTransitionProvider>
          </MemoryRouter>
        </CompareProvider>
      </AppProvider>,
    );
    expect(document.querySelector('.sk-scroll-progress')).toBeNull();

    // Unmount and verify StudentDashboard + NotFoundPage + standalone KotaShortlist3DCanvas render cleanly with zero non-Compare 3D scenes
    act(() => {
      root?.unmount();
    });
    container?.remove();

    mount(
      <AppProvider>
        <CompareProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <HostelTransitionProvider>
              <div>
                <StudentDashboard />
                <NotFoundPage />
                <KotaShortlist3DCanvas
                  items={[
                    { id: 'h1', name: 'Comfort Stay Hostel', monthlyRent: 5500, distanceKm: 0.8 },
                    { id: 'h4', name: 'Vigyan Nagar Residency', monthlyRent: 6800, distanceKm: 1.4 },
                  ]}
                  campusName="ALLEN · Talwandi"
                />
              </div>
            </HostelTransitionProvider>
          </MemoryRouter>
        </CompareProvider>
      </AppProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    expect(document.querySelector('.sk-beacon3d')).toBeNull();
    expect(document.querySelector('.sk-horizon3d')).toBeNull();
    expect(document.querySelector('.workspace-kpis')).not.toBeNull();
    expect(document.querySelector('.sk-shortlist3d')).not.toBeNull();

    localStorage.clear();
  });
});
