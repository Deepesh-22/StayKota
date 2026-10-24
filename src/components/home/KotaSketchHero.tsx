import { useId, useRef, useState } from 'react';
import { ArrowUpRight, BedDouble, GraduationCap, MoveUpRight, Palette, Pointer, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CAMPUSES, type Campus } from '../../data/campuses';
import { monthlyTotal } from '../../lib/discovery';
import { hostelPreviewHref } from '../../lib/hostel-navigation';
import type { Hostel, RoomType } from '../../types';
import { KotaSketchDrawing } from './KotaSketchDrawing';
import { useKotaSketchMotion } from './useKotaSketchMotion';

interface Props { campus: Campus; onCampusChange: (id: string) => void; hostel?: Hostel; room?: RoomType }
const markers = [
  { id: 'allen-landmark', x: 70, y: 24 },
  { id: 'allen-talwandi', x: 39, y: 65 },
  { id: 'resonance-vigyan', x: 63, y: 58 },
  { id: 'motion-rajiv', x: 56, y: 78 },
];

export function KotaSketchHero({ campus, onCampusChange, hostel, room }: Props) {
  const id = useId().replace(/:/g, '');
  const surface = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const reveal = useRef<SVGCircleElement>(null);
  const [fullColour, setFullColour] = useState(false);
  useKotaSketchMotion(surface, svg, reveal, fullColour);

  return <figure className={`kota-sketch ${fullColour ? 'is-colour' : ''}`} aria-label="Interactive illustrated Kota neighbourhood">
    <div className="ks-topline"><span><span className="ks-small-star">✳</span> A CITY OF POSSIBILITIES</span><span>KOTA / RAJASTHAN</span></div>
    <div ref={surface} className="ks-surface">
      <div className="ks-map-plane">
        <svg ref={svg} className="ks-svg" viewBox="0 0 820 560" aria-hidden="true">
          <defs>
            <radialGradient id={`${id}-reveal`}><stop offset="0" stopColor="white" /><stop offset=".65" stopColor="white" /><stop offset="1" stopColor="black" /></radialGradient>
            <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-100" y="-100" width="1020" height="760" style={{ maskType: 'luminance' }}><rect x="-100" y="-100" width="1020" height="760" fill="black" /><circle ref={reveal} className="ks-reveal" cx="410" cy="280" r="190" fill={`url(#${id}-reveal)`} /></mask>
            <radialGradient id={`${id}-shadow`}><stop stopColor="#193e33" stopOpacity=".12" /><stop offset="1" stopColor="#193e33" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="410" cy="349" rx="375" ry="182" fill={`url(#${id}-shadow)`} />
          <g className="ks-sketch-layer"><KotaSketchDrawing /></g>
          <g className="ks-colour-layer" mask={`url(#${id}-mask)`}><KotaSketchDrawing /></g>
          <g className="ks-compass" transform="translate(720 443)"><circle r="23" /><path d="M0-13L5 9L0 5L-5 9Z" /><text y="-32" textAnchor="middle">N</text><path d="M-31 0H-27M27 0H31M0 27V31" /></g>
        </svg>
        <div className="ks-hotspots">{markers.map(marker => {
          const item = CAMPUSES.find(candidate => candidate.id === marker.id)!;
          return <button type="button" key={item.id} className={`ks-pin ${campus.id === item.id ? 'is-selected' : ''}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} aria-label={`Choose ${item.institute} ${item.name}`} aria-pressed={campus.id === item.id} onClick={() => onCampusChange(item.id)}><span className="ks-pin-icon"><GraduationCap size={16} /></span><span className="ks-pin-label"><strong>{item.institute}</strong><small>{item.area}</small></span></button>;
        })}</div>
      </div>
      <div className="ks-river-note" aria-hidden="true">a city to make<br /><em>your own.</em><svg viewBox="0 0 85 45"><path d="M5 6Q68 0 70 35M61 29L71 37L78 27" /></svg></div>
      {hostel && room && <Link className="ks-stay" to={hostelPreviewHref(hostel.id, campus.id, room.id, '/')}>
        <span className="ks-stay-photo"><img key={hostel.coverImage} src={hostel.coverImage} width="48" height="52" alt="" onError={event => { event.currentTarget.hidden = true; }} /><BedDouble size={18} aria-hidden="true" /></span>
        <span className="ks-stay-copy"><small>YOUR LITTLE CORNER · DEMO</small><strong>{hostel.name}</strong><span>₹{monthlyTotal(room).toLocaleString('en-IN')} <span>/ month</span></span></span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>}
    </div>
    <div className="ks-tools"><p><Pointer size={15} aria-hidden="true" /><span className="ks-desktop-hint">Move across the sketch. Bring Kota to life.</span><span className="ks-touch-hint">A little colour. A whole new city.</span><span className="ks-reduced-hint">Your next chapter, in colour.</span></p><button type="button" className="ks-colour-toggle" aria-pressed={fullColour} onClick={() => setFullColour(value => !value)}><Palette size={15} aria-hidden="true" />{fullColour ? 'Back to sketch' : 'Bring it to life'}<Sparkles size={13} aria-hidden="true" /></button></div>
    <figcaption className="ks-caption"><span>Illustrative Kota sketch · not a location map</span><Link to={`/map?campus=${campus.id}`}>Explore the map <MoveUpRight size={12} aria-hidden="true" /></Link></figcaption>
  </figure>;
}
