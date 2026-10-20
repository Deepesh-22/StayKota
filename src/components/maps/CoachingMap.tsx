import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { GraduationCap, House, Minus, Plus, RotateCcw } from 'lucide-react';
import type { Campus } from '../../data/campuses';
import type { Hostel, RoomType } from '../../types';
import { formatDistance, monthlyTotal } from '../../lib/discovery';
import { campusDistance, neighbourhoodPositions, withinCampusRadius, type MapPerspective } from '../../lib/maps';
import '../../styles/coaching-map.css';

export interface MappedHostel { hostel: Hostel; room: RoomType }
interface Props {
  campus: Campus;
  items: MappedHostel[];
  radiusKm?: number;
  perspective?: MapPerspective;
  selectedHostelId?: string | null;
  onSelect: (id: string) => void;
  resetKey?: number;
}
function Building({ x, y, campus, raised }: { x: number; y: number; campus?: boolean; raised: boolean }) {
  const width = campus ? 75 : 46, depth = campus ? 25 : 17, height = raised ? (campus ? 66 : 40) : 5;
  const color = campus ? '#226652' : '#bd7955';
  return <g aria-hidden="true">
    <ellipse cx={x + 7} cy={y + 8} rx={width * .85} ry={depth} fill="#284d3420" />
    <path d={`M${x - width},${y - depth - height} l${width},${depth} v${height} l-${width},-${depth}Z`} fill={campus ? '#38856c' : '#dfb18c'} />
    <path d={`M${x},${y - height} l${width},-${depth} v${height} l-${width},${depth}Z`} fill={color} />
    <path d={`M${x - width},${y - depth - height} l${width},-${depth} ${width},${depth} -${width},${depth}Z`} fill={campus ? '#a6cdb3' : '#f1d9b6'} stroke="#ffffffa0" />
    {raised && [0, 1, 2].map(i => <path key={i} d={`M${x + 10 + i * 15},${y - height + 9 - i * 5} v12 l8,-3 v-12Z`} fill="#fff1ce" />)}
  </g>;
}
export function CoachingMap({ campus, items, radiusKm = 1, perspective = '2d', selectedHostelId, onSelect, resetKey = 0 }: Props) {
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => { setCamera({ x: 0, y: 0, zoom: 1 }); }, [campus.id, resetKey]);
  const nearby = items.filter(({ hostel }) => hostel.status === 'approved' && withinCampusRadius(hostel, campus, radiusKm));
  const positions = neighbourhoodPositions(nearby.map(item => item.hostel), campus);
  const project = (x: number, y: number) => perspective === '3d'
    ? { x: 450 + (x - 450) * .96 - (y - 320) * .24, y: 320 + (y - 320) * .78 + (x - 450) * .15 }
    : { x, y };
  const zoom = (delta: number) => setCamera(c => ({ ...c, zoom: Math.max(.75, Math.min(2.25, c.zoom + delta)) }));
  const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('[data-map-pin]') || event.button !== 0) return;
    event.currentTarget.focus();
    drag.current = { x: event.clientX, y: event.clientY, startX: camera.x, startY: camera.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  return <div className="coaching-map" data-perspective={perspective} data-campus={campus.id}>
    <div className="coaching-map-heading"><span>YOUR COACHING NEIGHBOURHOOD</span><strong>{campus.institute} · {campus.area}</strong><small>{nearby.length} nearby {nearby.length === 1 ? 'hostel' : 'hostels'} · within {radiusKm} km</small></div>
    <svg ref={svg} viewBox="0 0 900 640" className="coaching-map-scene" role="group" aria-label={`Custom neighbourhood map around ${campus.institute} ${campus.name}`} tabIndex={0}
      onPointerDown={pointerDown} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onPointerMove={event => {
        if (!drag.current || !svg.current) return;
        const rect = svg.current.getBoundingClientRect();
        const scale = Math.min(rect.width / 900, rect.height / 640);
        setCamera(c => ({ ...c, x: drag.current!.startX + (event.clientX - drag.current!.x) / scale, y: drag.current!.startY + (event.clientY - drag.current!.y) / scale }));
      }} onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.25); }
        else if (event.key === '-') { event.preventDefault(); zoom(-.25); }
        else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
          event.preventDefault(); setCamera(c => ({ ...c, x: c.x + (event.key === 'ArrowLeft' ? 30 : event.key === 'ArrowRight' ? -30 : 0), y: c.y + (event.key === 'ArrowUp' ? 30 : event.key === 'ArrowDown' ? -30 : 0) }));
        }
      }}>
      <g transform={`translate(${450 + camera.x} ${320 + camera.y}) scale(${camera.zoom}) translate(-450 -320)`}>
        <g transform={perspective === '3d' ? 'matrix(.96 .15 -.24 .78 94.8 2.9)' : undefined} aria-hidden="true">
          <rect x="70" y="105" width="760" height="460" rx="95" fill="#dce8ce" stroke="#c6d7b8" />
          <ellipse cx="450" cy="320" rx="310" ry="195" fill="#eaf0dc" stroke="#9ab493" strokeDasharray="5 8" />
          <path d="M80 355Q310 280 810 380M430 110Q480 310 410 560" fill="none" stroke="#fbf8e9" strokeWidth="34" />
          <path d="M80 355Q310 280 810 380M430 110Q480 310 410 560" fill="none" stroke="#dad7c4" strokeWidth="1" strokeDasharray="5 9" />
          {[ [160,180], [730,440], [210,475], [720,210], [330,155], [570,500] ].map(([x,y]) => <g key={x}><ellipse cx={x + 5} cy={y + 9} rx="19" ry="9" fill="#25482f12" /><circle cx={x} cy={y} r="16" fill="#a4bf90" /><circle cx={x-5} cy={y-5} r="10" fill="#bed1a6" /></g>)}
        </g>
        {positions.map(point => { const p = project(point.x, point.y); return <path key={point.id} data-connection={point.id} d={`M450 320 Q${(p.x+450)/2} ${p.y+25} ${p.x} ${p.y}`} fill="none" stroke={selectedHostelId === point.id ? '#a35d3e' : '#9aaf8b'} strokeWidth={selectedHostelId === point.id ? 3 : 1.5} strokeDasharray="5 6" />; })}
        <Building x={450} y={320} campus raised={perspective === '3d'} />
        <foreignObject x={340} y={perspective === '3d' ? 192 : 245} width={220} height={65}>
          <div className="coaching-map-campus"><GraduationCap size={17}/><span><strong>{campus.institute}</strong><small>{campus.name}</small></span></div>
        </foreignObject>
        {positions.map(point => {
          const item = nearby.find(({hostel}) => hostel.id === point.id)!;
          const p = project(point.x, point.y);
          return <g key={point.id} data-hostel-id={point.id}>
            <Building x={p.x} y={p.y} raised={perspective === '3d'} />
            <foreignObject className="coaching-map-hostel-label" x={p.x - 75} y={p.y - (perspective === '3d' ? 99 : 66)} width={150} height={65}>
              <button type="button" data-map-pin={point.id} className={`coaching-map-pin${selectedHostelId === point.id ? ' is-selected' : ''}`} aria-label={`Select ${item.hostel.name}, ${formatDistance(campusDistance(item.hostel, campus))} from coaching`} aria-pressed={selectedHostelId === point.id} onClick={() => onSelect(point.id)}>
                <span><House size={12}/> ₹{monthlyTotal(item.room).toLocaleString('en-IN')}</span><small>{item.hostel.name} · {formatDistance(campusDistance(item.hostel, campus))}</small>
              </button>
            </foreignObject>
          </g>;
        })}
      </g>
    </svg>
    {!nearby.length && <div className="coaching-map-empty" role="status">No matching hostels within {radiusKm} km. Try another campus or widen the distance.</div>}
    <div className="coaching-map-controls" aria-label="Map zoom controls"><button type="button" aria-label="Zoom in on neighbourhood" onClick={() => zoom(.25)} disabled={camera.zoom >= 2.25}><Plus size={17}/></button><span aria-live="polite">{Math.round(camera.zoom*100)}%</span><button type="button" aria-label="Zoom out of neighbourhood" onClick={() => zoom(-.25)} disabled={camera.zoom <= .75}><Minus size={17}/></button><button type="button" aria-label="Reset neighbourhood view" onClick={() => setCamera({ x:0,y:0,zoom:1 })}><RotateCcw size={16}/></button></div>
    <div className="coaching-map-legend"><span><GraduationCap size={14}/> Coaching</span><span><House size={14}/> Nearby hostel</span><span>··· Straight-line connection</span></div>
    <p className="coaching-map-disclaimer">Illustrated layout · sample locations · connections are not walking routes</p>
  </div>;
}
