import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { HostelCard } from '../hostel/HostelCard';
import { useFeaturedDeckMotion } from './useFeaturedDeckMotion';
import '../../styles/featured-reveal.css';

export function FeaturedHostelDeck({ items, campus, onActiveChange }: {
  items: { hostel: Hostel; rooms: RoomType[] }[]; campus: Campus; onActiveChange?: (index: number) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ atStart: true, atEnd: false });
  const deckRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef(0);
  const currentExpandedId = items.some(item => item.hostel.id === expandedId) ? expandedId : null;

  const stopScrollAnimation = () => cancelAnimationFrame(animationRef.current);
  const motion = useFeaturedDeckMotion({ deckRef, paused: Boolean(currentExpandedId), onManualInteraction: stopScrollAnimation });

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const update = () => {
      const atStart = deck.scrollLeft <= 2;
      const atEnd = deck.scrollLeft + deck.clientWidth >= deck.scrollWidth - 3;
      setPosition(current => current.atStart === atStart && current.atEnd === atEnd ? current : { atStart, atEnd });
      const cards = [...deck.children] as HTMLElement[];
      const nearest = currentExpandedId ? items.findIndex(item => item.hostel.id === currentExpandedId) : cards.reduce((best, card, index) => Math.abs(card.offsetLeft - deck.scrollLeft) < Math.abs(cards[best].offsetLeft - deck.scrollLeft) ? index : best, 0);
      setActiveIndex(nearest);
      onActiveChange?.(nearest);
    };
    update();
    deck.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(deck);
    for (const child of deck.children) observer.observe(child);
    return () => { deck.removeEventListener('scroll', update); observer.disconnect(); };
  }, [items, onActiveChange, currentExpandedId]);

  // Follow the selected card as its width changes. Pointer/wheel input cancels this movement.
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || !currentExpandedId) return;
    const selected = [...deck.children].find(item => (item as HTMLElement).dataset.hostel === currentExpandedId) as HTMLElement | undefined;
    if (!selected) return;
    const focused = document.activeElement;
    if (!focused || focused === document.body || focused.closest('.featured-card-summary')) selected.querySelector<HTMLButtonElement>('.featured-stage-toggle')?.focus({ preventScroll: true });
    const from = deck.scrollLeft;
    const start = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const follow = (now: number) => {
      const progress = reduced ? 1 : Math.min((now - start) / 620, 1);
      deck.scrollLeft = from + (selected.offsetLeft - from) * (1 - (1 - progress) ** 3);
      if (progress < 1) animationRef.current = requestAnimationFrame(follow);
    };
    animationRef.current = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(animationRef.current);
  }, [currentExpandedId]);

  const scrollDeck = (direction: number) => {
    const deck = deckRef.current;
    if (!deck) return;
    stopScrollAnimation();
    motion.stopMotion();
    const nextIndex = Math.max(0, Math.min(items.length - 1, activeIndex + direction));
    if (currentExpandedId) {
      setExpandedId(items[nextIndex].hostel.id);
      if (window.matchMedia('(max-width: 700px)').matches) deck.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    else {
      const next = deck.children[nextIndex] as HTMLElement | undefined;
      deck.scrollTo({ left: next?.offsetLeft || 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  };

  return <div className="featured-reveal-carousel" onKeyDown={event => {
    if (event.key === 'Escape' && currentExpandedId && !event.defaultPrevented) {
      const toggle = deckRef.current?.querySelector<HTMLButtonElement>('.is-revealed .featured-stage-toggle');
      setExpandedId(null);
      toggle?.focus({ preventScroll: true });
      event.stopPropagation();
    }
  }}>
    <div className="featured-reveal-intro"><span>Find a space that feels like you.</span><p>Drag to explore. Click a room to unfold its story.</p></div>
    <div className={`home-featured-deck home-featured-deck--reveal${currentExpandedId ? ' has-reveal' : ''}${motion.isDragging ? ' is-dragging' : ''}${motion.isEdgeScrolling ? ' is-edge-scrolling' : ''}`} ref={deckRef} role="region" aria-roledescription="carousel" aria-label="Featured demo hostels"
      onPointerDown={event => { stopScrollAnimation(); motion.onPointerDown(event); }} onPointerMove={motion.onPointerMove} onPointerUp={motion.onPointerUp} onPointerCancel={motion.onPointerCancel} onPointerLeave={motion.onPointerLeave} onLostPointerCapture={motion.onPointerCancel} onClickCapture={motion.onClickCapture}
      onDragStart={event => event.preventDefault()} onWheel={() => { stopScrollAnimation(); motion.stopMotion(); }}>
      {items.map(({ hostel, rooms }, index) => <div key={hostel.id} data-hostel={hostel.id} className={`home-deck-item${currentExpandedId === hostel.id ? ' is-expanded' : ''}`} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}`}>
        <HostelCard hostel={hostel} room={rooms[0]} campus={campus} reveal={{ expanded: currentExpandedId === hostel.id, onToggle: () => setExpandedId(current => current === hostel.id ? null : hostel.id) }} />
      </div>)}
    </div>
    <div className="home-deck-footer"><div className="home-deck-progress" aria-hidden="true">{items.map((item, index) => <span key={item.hostel.id} className={index === activeIndex ? 'is-active' : ''} />)}</div><p aria-live="polite"><span>{String(activeIndex + 1).padStart(2, '0')}</span> / {String(items.length).padStart(2, '0')}</p><div className="home-deck-controls"><button type="button" aria-label="Previous featured hostel" onClick={() => scrollDeck(-1)} disabled={currentExpandedId ? activeIndex === 0 : position.atStart}><ArrowLeft size={18} /></button><button type="button" aria-label="Next featured hostel" onClick={() => scrollDeck(1)} disabled={items.length <= 1 || (currentExpandedId ? activeIndex === items.length - 1 : position.atEnd)}><ArrowRight size={18} /></button></div></div>
  </div>;
}
