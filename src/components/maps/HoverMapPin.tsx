import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCityMap } from './MapContext';
import { MapCirclePreview, type MapCirclePreviewProps } from './MapCirclePreview';

/** Preview-only hover/focus state; the original marker button owns selection. */
export function HoverMapPin({ children, ...preview }: MapCirclePreviewProps & { children: ReactNode }) {
  const map = useCityMap();
  const wrapper = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!map) return;
    const close = () => setOpen(false);
    map.on('movestart', close);
    return () => { map.off('movestart', close); };
  }, [map]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  const show = () => {
    const element = wrapper.current;
    if (element && map) {
      const marker = element.getBoundingClientRect(), canvas = map.getContainer().getBoundingClientRect();
      const x = marker.left + marker.width / 2, y = marker.top + marker.height / 2;
      const shiftX = Math.min(Math.max(x, canvas.left + 86), canvas.right - 86) - x;
      const shiftY = Math.min(Math.max(y, canvas.top + 86), canvas.bottom - 86) - y;
      element.style.setProperty('--preview-shift-x', `${shiftX}px`);
      element.style.setProperty('--preview-shift-y', `${shiftY}px`);
    }
    setOpen(true);
  };
  return <div ref={wrapper} className={`student-marker-preview${open ? ' is-open' : ''}`} onMouseEnter={show} onMouseLeave={() => setOpen(false)} onFocus={show} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } }}>
    {children}
    {open && <span className="student-marker-preview__circle"><MapCirclePreview {...preview}/></span>}
  </div>;
}
