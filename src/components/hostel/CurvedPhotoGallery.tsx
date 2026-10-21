import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Expand, ImageOff, Images, RefreshCw } from 'lucide-react';
import '../../styles/curved-gallery.css';

export interface GalleryPhoto { src: string; label: string; alt: string }
interface Props { photos: GalleryPhoto[]; name: string; illustrative?: boolean; onOpen: (index: number) => void }

export function GalleryImage({ photo, eager, onFailure, errorHint = 'Browse other photos or use Reload photos below.' }: { photo: GalleryPhoto; eager: boolean; onFailure?: () => void; errorHint?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <>
    {!loaded && !failed && <span className="curved-gallery__loading" aria-hidden="true"/>}
    {failed ? <span className="curved-gallery__failed"><ImageOff size={26}/><span>Photo unavailable</span><small>{errorHint}</small></span>
      : <img src={photo.src} alt={photo.alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" draggable={false} onLoad={() => setLoaded(true)} onError={() => { setFailed(true); onFailure?.(); }}/>}
  </>;
}

/** Image planes in a CSS 3D showroom; no WebGL or auto-play needed. */
export function CurvedPhotoGallery({ photos, name, illustrative = false, onOpen }: Props) {
  const [active, setActive] = useState(0);
  const [hasFailures, setHasFailures] = useState(false);
  const [revision, setRevision] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; dx: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const wheel = useRef({ total: 0, last: 0, changed: 0 });
  const hintId = useId();
  const count = photos.length;
  const selected = count ? active % count : 0;
  const move = (direction: number) => { if (count > 1) setActive(value => (value + direction + count) % count); };
  useEffect(() => {
    const element = scene.current;
    if (!element || count < 2) return;
    const onWheel = (event: WheelEvent) => {
      // Ordinary vertical scrolling and browser pinch-to-zoom remain native.
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      const state = wheel.current;
      if (now - state.last > 180) state.total = 0;
      state.last = now;
      if (now - state.changed < 350) return;
      state.total += event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      if (Math.abs(state.total) >= 45) {
        const direction = Math.sign(state.total);
        setActive(value => (value + direction + count) % count);
        state.total = 0; state.changed = now;
      }
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [count]);
  const begin = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary || count < 2) return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dragging: false };
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    if (!current.dragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { gesture.current = null; return; }
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      current.dragging = true; suppressClick.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.dragging) {
      current.dx = dx;
      scene.current?.style.setProperty('--gallery-drag', `${Math.max(-90, Math.min(90, dx * .28))}px`);
    }
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    scene.current?.style.setProperty('--gallery-drag', '0px');
    if (!cancelled && current.dragging && Math.abs(current.dx) >= 40) move(current.dx < 0 ? 1 : -1);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <section className="curved-gallery" role="region" aria-roledescription="carousel" aria-label={`${name} photo showroom`} aria-describedby={hintId} tabIndex={0}
    onKeyDown={event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
      if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); setActive(event.key === 'Home' ? 0 : Math.max(0, count - 1)); }
    }}>
    <div className="curved-gallery__topline"><span><Images size={15}/> A closer look at your next chapter</span><span>{illustrative ? 'Illustrative sample photography' : 'Property photography'}</span></div>
    {count ? <div className="curved-gallery__scene" ref={scene} onPointerDown={begin} onPointerMove={drag} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => { if (event.target === event.currentTarget) finish(event, true); }} onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      <div className="curved-gallery__ground" aria-hidden="true"/>
      {photos.map((photo, index) => {
        let offset = (index - selected + count) % count;
        if (offset > count / 2) offset -= count;
        const visible = Math.abs(offset) <= 2;
        return <div key={`${photo.src}-${index}`} className={`curved-gallery__slide${offset === 0 ? ' is-centred' : ''}`} data-offset={offset} aria-hidden={!visible || undefined} style={{ '--slide-offset': offset, '--slide-depth': Math.abs(offset), zIndex: 10 - Math.abs(offset), visibility: visible ? 'visible' : 'hidden' } as CSSProperties}>
          <button type="button" tabIndex={visible ? 0 : -1} aria-label={offset === 0 ? 'Open hostel photo gallery' : `Select photo ${index + 1}: ${photo.label}`} onClick={() => offset === 0 ? onOpen(index) : setActive(index)}>
            <GalleryImage key={`${photo.src}-${revision}`} photo={photo} eager={index === 0} onFailure={() => setHasFailures(true)}/>
            <span className="curved-gallery__photo-label"><span>{photo.label}</span>{offset === 0 && <Expand size={17}/>}</span>
          </button>
        </div>;
      })}
    </div> : <div className="curved-gallery__empty"><ImageOff size={34}/><h2>Photos are on their way.</h2><p>No property photos have been provided. Ask the owner before arranging a visit.</p></div>}
    <div className="curved-gallery__controls"><button type="button" disabled={count < 2} aria-label="Previous showroom photo" onClick={() => move(-1)}><ArrowLeft size={19}/></button>
      <div className="curved-gallery__caption" aria-live="polite" aria-atomic="true"><strong>{count ? photos[selected].label : 'No photos yet'}</strong><span>{count ? `${String(selected + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}` : '0 / 0'}</span></div>
      <button type="button" disabled={count < 2} aria-label="Next showroom photo" onClick={() => move(1)}><ArrowRight size={19}/></button></div>
    {count > 1 && <div className="curved-gallery__indicators" aria-label="Choose a gallery photo">{photos.map((photo, index) => <button type="button" key={`${photo.src}-${index}`} aria-label={`Show photo ${index + 1}: ${photo.label}`} aria-pressed={selected === index} onClick={() => setActive(index)}><span/></button>)}</div>}
    {hasFailures && <button type="button" className="curved-gallery__retry" onClick={() => { setHasFailures(false); setRevision(value => value + 1); }}><RefreshCw size={13}/>Reload photos</button>}
    <p className="curved-gallery__hint" id={hintId}><span className="curved-gallery__hint-full">Drag or swipe to explore · Use arrow keys or scroll sideways · Select the centre photo to enlarge</span><span className="curved-gallery__hint-short">Swipe to explore · Tap the centre photo to enlarge</span></p>
  </section>;
}
