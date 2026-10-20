import { useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Cuboid, Images } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import { RoomShowcase } from './RoomShowcase';
import '../../styles/room-card.css';

function showFallback(image: HTMLImageElement) {
  if (!image.src.endsWith('/images/room-shared.webp')) image.src = '/images/room-shared.webp';
}

/** A concept cutaway paired with the listing's sample photos, never a measured property tour. */
export function RoomCardStage({ hostel, room, href }: { hostel: Hostel; room?: RoomType; href: string }) {
  const [view, setView] = useState<'room' | 'photos'>('room');
  const [index, setIndex] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const images = [...new Set([hostel.coverImage, ...hostel.images].filter(Boolean))];
  if (!images.length) images.push('/images/room-shared.webp');
  const photo = index % images.length;
  const reset = () => { stage.current?.style.setProperty('--room-tilt-x', '0deg'); stage.current?.style.setProperty('--room-tilt-y', '0deg'); };
  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--room-tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 5}deg`);
    event.currentTarget.style.setProperty('--room-tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 7}deg`);
  };
  return <div ref={stage} className="room-card-stage" data-preview={view} onPointerMove={tilt} onPointerLeave={reset}>
    <div className="room-card-display">
      {view === 'room' ? <Link to={href} className="room-card-cutaway" aria-label={`Explore illustrated room at ${hostel.name}`}>
        <div className="room-card-echo room-card-echo--left" aria-hidden="true"><img src={images[0]} alt="" loading="lazy" onError={event => showFallback(event.currentTarget)}/></div>
        <div className="room-card-echo room-card-echo--right" aria-hidden="true"><img src={images.at(-1)} alt="" loading="lazy" onError={event => showFallback(event.currentTarget)}/></div>
        <span className="room-card-platform" aria-hidden="true"/>
        <div className="room-card-model"><RoomShowcase capacity={room?.capacity || 1}/></div>
        <span className="room-card-sharing">{room ? `${room.capacity} ${room.capacity === 1 ? 'student' : 'students'} / room` : 'Concept room'}</span>
      </Link> : <Link to={href} className="room-card-photo-link" aria-label={`View rooms at ${hostel.name}`}>
        <img key={images[photo]} className="room-card-photo" src={images[photo]} alt={`Sample property photo ${photo + 1} at ${hostel.name}`} loading="lazy" decoding="async" onError={event => showFallback(event.currentTarget)}/>
      </Link>}
    </div>
    <div className="room-card-stage-tools">
      <div className="room-card-views" role="group" aria-label={`Preview view for ${hostel.name}`}>
        <button type="button" aria-pressed={view === 'room'} onClick={() => { setView('room'); reset(); }}><Cuboid size={13}/>Room</button>
        <button type="button" aria-pressed={view === 'photos'} onClick={() => { setView('photos'); reset(); }}><Images size={13}/>Photos</button>
      </div>
      {view === 'photos' ? <div className="room-card-photo-controls">
        <button type="button" disabled={images.length < 2} aria-label={`Previous photo of ${hostel.name}`} onClick={() => setIndex(i => (i - 1 + images.length) % images.length)}><ChevronLeft size={15}/></button>
        <span aria-live="polite">{String(photo + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        <button type="button" disabled={images.length < 2} aria-label={`Next photo of ${hostel.name}`} onClick={() => setIndex(i => (i + 1) % images.length)}><ChevronRight size={15}/></button>
      </div> : <span className="room-card-stage-kicker">ROOM PREVIEW ↗</span>}
    </div>
    <p className="room-card-disclaimer">{view === 'room' ? 'Concept illustration · not a measured floor plan' : 'Sample imagery · confirm the room during your visit'}</p>
  </div>;
}
