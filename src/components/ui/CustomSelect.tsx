import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import '../../styles/custom-select.css';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'compact';
  className?: string;
  hasError?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  minMenuWidth?: number;
}

function splitOptionLabel(opt: CustomSelectOption): { primary: string; sub?: string } {
  if (opt.sublabel) return { primary: opt.label, sub: opt.sublabel };
  if (opt.label.includes(' · ')) {
    const [primary, ...rest] = opt.label.split(' · ');
    return { primary, sub: rest.join(' · ') };
  }
  return { primary: opt.label };
}

export function CustomSelect({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = 'Select an option',
  disabled = false,
  icon,
  variant = 'default',
  className = '',
  hasError = false,
  searchable,
  searchPlaceholder = 'Quick search…',
  minMenuWidth = 230,
}: CustomSelectProps) {
  const autoId = useId();
  const selectId = id || `sk-select-${autoId}`;
  const listboxId = `sk-listbox-${autoId}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const enableSearch = searchable ?? options.length >= 8;

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(trimmed) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(trimmed)),
    );
  }, [options, query]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom - 14;
    const spaceAbove = rect.top - 14;
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
    const width = Math.min(Math.max(rect.width, minMenuWidth), viewportW - 24);
    const left = Math.max(12, Math.min(rect.left, viewportW - width - 12));
    const maxHeight = Math.max(150, Math.min(310, (openUpward ? spaceAbove : spaceBelow) - (enableSearch ? 54 : 12)));

    setMenuStyle({
      width: `${width}px`,
      left: `${left}px`,
      ...(openUpward
        ? { bottom: `${viewportH - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
      ['--sk-menu-max-h' as string]: `${maxHeight}px`,
      ['--sk-menu-origin' as string]: openUpward ? 'bottom center' : 'top center',
      ['--sk-menu-rx' as string]: openUpward ? '9deg' : '-9deg',
      ['--sk-menu-ty' as string]: openUpward ? '6px' : '-6px',
    });
  }, [enableSearch, minMenuWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const idx = filteredOptions.findIndex((o) => o.value === value);
    setHighlightIndex(idx >= 0 ? idx : 0);
  }, [open, updatePosition, filteredOptions, value]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    if (enableSearch) {
      requestAnimationFrame(() => searchInputRef.current?.focus({ preventScroll: true }));
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };

    const handleViewport = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewport);
    window.addEventListener('scroll', handleViewport, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('scroll', handleViewport, true);
    };
  }, [open, enableSearch, updatePosition]);

  const commitValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  };

  const handleKeyNavigation = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!filteredOptions.length) return;
      setHighlightIndex((i) => (i + 1) % filteredOptions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!filteredOptions.length) return;
      setHighlightIndex((i) => (i - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setHighlightIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setHighlightIndex(Math.max(0, filteredOptions.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = filteredOptions[highlightIndex];
      if (target && !target.disabled) commitValue(target.value);
    }
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className="sk-select__menu"
          style={menuStyle}
          onKeyDown={handleKeyNavigation}
        >
          {enableSearch && (
            <div className="sk-select__search-wrap">
              <Search size={14} aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                className="sk-select__search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel || placeholder}
            className="sk-select__list"
          >
            {filteredOptions.length === 0 ? (
              <li className="sk-select__empty">No matching options</li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightIndex;
                const { primary, sub } = splitOptionLabel(opt);
                return (
                  <li
                    key={opt.value || `__empty_${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    className={[
                      'sk-select__option',
                      isSelected ? 'is-selected' : '',
                      isHighlighted ? 'is-highlighted' : '',
                      opt.disabled ? 'is-disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!opt.disabled) commitValue(opt.value);
                    }}
                  >
                    <span className="sk-select__option-copy">
                      <span className="sk-select__option-primary">{primary}</span>
                      {sub && <span className="sk-select__option-sub">{sub}</span>}
                    </span>
                    {isSelected && (
                      <span className="sk-select__check" aria-hidden="true">
                        <Check size={12} strokeWidth={2.75} />
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      ref={rootRef}
      className={[
        'sk-select',
        `sk-select--${variant}`,
        open ? 'sk-select--open' : '',
        hasError ? 'sk-select--error' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className="sk-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyNavigation}
      >
        <span className="sk-select__value">
          {icon && <span className="sk-select__icon" aria-hidden="true">{icon}</span>}
          <span className="sk-select__text">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown size={15} className="sk-select__chevron" aria-hidden="true" />
      </button>

      {/* Synchronized native select for assistive queries and Playwright .selectOption() */}
      <select
        id={selectId}
        tabIndex={-1}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        className="sk-select__native"
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) setOpen((prev) => !prev);
        }}
      >
        {options.map((opt, idx) => (
          <option key={opt.value || `__native_${idx}`} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {menu}
    </div>
  );
}
