// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CustomSelect } from '../src/components/ui/CustomSelect';
import { AppProvider } from '../src/context/AppContext';
import { CompareProvider } from '../src/context/CompareContext';
import { HostelTransitionProvider } from '../src/context/HostelTransitionContext';
import { ExplorePage } from '../src/pages/ExplorePage';
import { HowItWorksPage } from '../src/pages/HowItWorksPage';

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

describe('StayKota Non-Homepage UI/UX, CustomSelect & 3D Interactions', () => {
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

    // Verify native <select> programmatic change (used by Playwright .selectOption()) also works seamlessly
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

  it('renders ExplorePage with custom dropdowns and interactive 3D pointer-tilt HostelCards', () => {
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

  it('renders 3D interactive isometric journey cards on HowItWorksPage', () => {
    mount(
      <MemoryRouter initialEntries={['/how-it-works']}>
        <HowItWorksPage />
      </MemoryRouter>,
    );

    const stepCards = document.querySelectorAll('.help-step.sk-tilt-3d');
    expect(stepCards).toHaveLength(3);
    expect(document.querySelectorAll('.help-step__stage')).toHaveLength(3);
  });
});
