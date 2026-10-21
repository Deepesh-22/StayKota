import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { useCityMap } from './MapContext';
import { MapCirclePreview, type MapCirclePreviewProps } from './MapCirclePreview';

/** Preview-only hover/focus state; dragging across pins pans the map cleanly without triggering accidental clicks. */
export function HoverMapPin({ children, ...preview }: MapCirclePreviewProps & { children: ReactNode }) {
  const map = useCityMap();
  const wrapper = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!map) return;
    const onMoveStart = () => {
      dragged.current = true;
      setOpen(false);
    };
    map.on('movestart', onMoveStart);
    return () => { map.off('movestart', onMoveStart); };
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

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    if (event.buttons !== 0) return;
    show();
  };

  const handlePointerDown = (_event: PointerEvent<HTMLDivElement>) => {
    dragged.current = false;
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      dragged.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={wrapper}
      className={`student-marker-preview${open ? ' is-open' : ''}`}
      onPointerDownCapture={handlePointerDown}
      onClickCapture={handleClickCapture}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setOpen(false)}
      onFocus={show}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } }}
    >
      {children}
      {open && <span className="student-marker-preview__circle"><MapCirclePreview {...preview}/></span>}
    </div>
  );
}
