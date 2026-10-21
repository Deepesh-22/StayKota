import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Cuboid, Images } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import { RoomShowcase } from '../hostel/RoomShowcase';

/** The landing-page reveal uses existing listing images; the cutaway remains illustrative. */
export function FeaturedHostelStage({ hostel, room, expanded, onToggle }: {
  hostel: Hostel; room?: RoomType; expanded: boolean; onToggle: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const images = [...new Set([hostel.coverImage, ...hostel.images].filter(Boolean))];
  const photo = images.length ? index % images.length : 0;
  const image = images[photo];
  const failed = !image || failedImages.includes(image);
  const panelId = `featured-photos-${hostel.id}`;
  const sample = hostel.photography !== 'property';

  return <div className={`featured-stage${expanded ? ' is-open' : ''}`}>
    <div className="featured-stage-concept" aria-hidden="true">
      {[images[0], images.at(-1)].map((src, i) => src && <div className={`featured-stage-echo featured-stage-echo--${i ? 'right' : 'left'}`} key={i}>
        <img src={src} alt="" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
      </div>)}
      <span className="featured-stage-shadow" />
      <div className="featured-stage-model"><RoomShowcase capacity={room?.capacity || 1} /></div>
      <span className="featured-stage-capacity">{room ? `${room.capacity} ${room.capacity === 1 ? 'student' : 'students'} / room` : 'Concept room'}</span>
    </div>

    <div className="featured-stage-photos" id={panelId} aria-hidden={!expanded} inert={!expanded}>
      {!failed ? <img className="featured-stage-image" src={image} alt={`${sample ? 'Sample' : 'Property'} photo ${photo + 1} at ${hostel.name}`} loading="lazy" decoding="async" onError={() => setFailedImages(current => [...current, image])} /> : <div className="featured-stage-image-error" role="status">
        <Images size={30} strokeWidth={1.3} /><strong>This photo couldn’t load.</strong><span>Try another photo or retry this one.</span>
        {image && <button type="button" onClick={() => setFailedImages(current => current.filter(value => value !== image))}>Retry photo</button>}
      </div>}
      <div className="featured-stage-photo-caption"><span>{sample ? 'SAMPLE PHOTO' : 'PROPERTY PHOTO'}</span><strong>A little room.<br />A fresh beginning.</strong><p>{sample ? 'Illustrative imagery. Confirm the room during your visit.' : 'Ask the owner to confirm the room shown.'}</p></div>
      <div className="featured-stage-photo-controls" role="group" aria-label={`Photos of ${hostel.name}`}>
        <button type="button" aria-label={`Previous photo of ${hostel.name}`} disabled={images.length < 2} onClick={() => setIndex(current => (current - 1 + images.length) % images.length)}><ChevronLeft size={18} /></button>
        <span aria-live="polite">{images.length ? String(photo + 1).padStart(2, '0') : '00'} / {String(images.length).padStart(2, '0')}</span>
        <button type="button" aria-label={`Next photo of ${hostel.name}`} disabled={images.length < 2} onClick={() => setIndex(current => (current + 1) % images.length)}><ChevronRight size={18} /></button>
      </div>
    </div>

    <div className="featured-stage-toolbar">
      <span className="featured-stage-mode">{expanded ? <Images size={14} /> : <Cuboid size={14} />}{expanded ? 'Photos' : 'Room concept'}</span>
      <button type="button" className="featured-stage-toggle" aria-expanded={expanded} aria-controls={panelId} aria-label={`${expanded ? 'Close' : 'Open'} a closer look at ${hostel.name}`} onClick={onToggle}>
        <span>{expanded ? 'Back to room' : 'Take a closer look'}</span>{expanded ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </button>
    </div>
    {!expanded && <p className="featured-stage-disclaimer">Concept illustration · not a measured floor plan</p>}
  </div>;
}
