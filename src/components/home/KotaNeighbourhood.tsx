import { ArrowUpRight, BedDouble, GraduationCap, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CAMPUSES } from '../../data/campuses';
import type { Campus } from '../../data/campuses';
import { monthlyTotal } from '../../lib/discovery';
import type { Hostel, RoomType } from '../../types';

interface Props {
  campus: Campus;
  onCampusChange: (id: string) => void;
  hostel?: Hostel;
  room?: RoomType;
}

const point = (u: number, v: number, z = 0) => `${430 + (u - v) * .88},${90 + (u + v) * .43 - z}`;
const plane = (u: number, v: number, w: number, d: number, z = 0) => [point(u, v, z), point(u + w, v, z), point(u + w, v + d, z), point(u, v + d, z)].join(' ');

function Building({ u, v, w = 60, d = 45, h = 42, roof = '#e3c49d', front = '#f2dfc4', side = '#d2b389', campus = false }: { u: number; v: number; w?: number; d?: number; h?: number; roof?: string; front?: string; side?: string; campus?: boolean }) {
  return <g>
    <polygon points={plane(u + 9, v + 7, w + 6, d + 4)} fill="#203b25" opacity=".07" />
    <polygon points={[point(u + w, v, h), point(u + w, v + d, h), point(u + w, v + d), point(u + w, v)].join(' ')} fill={side} />
    <polygon points={[point(u, v + d, h), point(u + w, v + d, h), point(u + w, v + d), point(u, v + d)].join(' ')} fill={front} />
    <polygon points={plane(u, v, w, d, h)} fill={roof} />
    <polyline points={[point(u, v, h), point(u + w, v, h), point(u + w, v + d, h)].join(' ')} fill="none" stroke="#fff" strokeWidth="1.3" opacity=".65" />
    {[.23, .6].map((factor, i) => <g key={i}>{[.35, .7].map((floor, j) => <polygon key={j} points={[point(u + w * factor, v + d + .2, h * floor + 7), point(u + w * factor + 10, v + d + .2, h * floor + 7), point(u + w * factor + 10, v + d + .2, h * floor - 2), point(u + w * factor, v + d + .2, h * floor - 2)].join(' ')} fill={campus ? '#4a8a7b' : '#6f8d86'} opacity=".72" />)}</g>)}
    {campus && <><polygon points={plane(u + 7, v + 8, w - 14, d - 16, h + 1)} fill="#c3d8be" /><polygon points={plane(u + 15, v + 15, w - 30, d - 30, h + 2)} fill="#afc6a8" /><path d={`M${point(u + w * .48, v + d, h * .34)}L${point(u + w * .48, v + d, 0)}`} stroke="#487969" strokeWidth="10" /></>}
  </g>;
}

function Tree({ u, v, scale = 1 }: { u: number; v: number; scale?: number }) {
  const [x, y] = point(u, v).split(',').map(Number);
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cx="4" cy="3" rx="15" ry="6" fill="#3b6748" opacity=".09" /><path d="M0 0V-20" stroke="#a58866" strokeWidth="3" /><path d="M-13-24C-18-38-5-47 1-43C12-48 22-32 12-24C8-17-8-17-13-24Z" fill="#91b38c" /><path d="M-13-24C-18-38-5-47 1-43C-2-34-2-27 3-20C-4-18-10-18-13-24Z" fill="#adc9a3" /><path d="M0-18V-33M0-27L8-32" stroke="#6b946b" strokeWidth="1" opacity=".65" /></g>;
}

function RoomCutaway() {
  const u = 263, v = 240, w = 116, d = 91, h = 55;
  return <g className="scene-cutaway">
    <polygon points={plane(u + 7, v + 12, w, d)} fill="#1f513d" opacity=".1" />
    <polygon points={plane(u, v, w, d, 3)} fill="#dbc7a8" />
    <polygon points={[point(u, v, h), point(u + w, v, h), point(u + w, v, 3), point(u, v, 3)].join(' ')} fill="#b3cdb4" />
    <polygon points={[point(u, v, h), point(u, v + d, h), point(u, v + d, 3), point(u, v, 3)].join(' ')} fill="#d0dfc8" />
    <polyline points={[point(u, v + d, h), point(u, v, h), point(u + w, v, h)].join(' ')} fill="none" stroke="#e8efde" strokeWidth="4" />
    {[16, 39, 62, 85].map(i => <path key={i} d={`M${point(u, v + i, 3)}L${point(u + w, v + i, 3)}`} stroke="#cab698" strokeWidth=".7" />)}
    <polygon points={plane(u + 47, v + 40, 22, 40, 4)} fill="#c78e77" opacity=".65" />
    <polygon points={[point(u + 74, v, 43), point(u + 102, v, 43), point(u + 102, v, 18), point(u + 74, v, 18)].join(' ')} fill="#f7f3df" stroke="#e8edd6" strokeWidth="3" />
    <path d={`M${point(u + 88, v, 43)}L${point(u + 88, v, 18)}`} stroke="#a4c0ad" strokeWidth="2" />
    <Building u={u + 9} v={v + 26} w={30} d={55} h={11} roof="#f5f0e3" front="#e9dcca" side="#cbbca7" />
    <polygon points={plane(u + 9, v + 48, 30, 31, 12)} fill="#99b8a0" />
    <polygon points={plane(u + 12, v + 29, 23, 12, 13)} fill="#fffaf0" />
    <Building u={u + 78} v={v + 26} w={29} d={55} h={11} roof="#f6efe2" front="#e9dcca" side="#cbbca7" />
    <polygon points={plane(u + 78, v + 48, 29, 31, 12)} fill="#ce9a80" />
    <polygon points={plane(u + 81, v + 29, 22, 12, 13)} fill="#fffaf0" />
    <Building u={u + 44} v={v + 3} w={25} d={15} h={22} roof="#e4d3b7" front="#c4ae8b" side="#b4a184" />
    <polygon points={plane(u + 49, v + 7, 14, 7, 23)} fill="#ede8d6" />
    <Building u={u + 46} v={v + 22} w={14} d={12} h={12} roof="#638a78" front="#789c83" side="#5b7b6b" />
    <Tree u={u + 112} v={v + 8} scale={.52} />
    <polygon points={[point(u, v + d, 3), point(u + w, v + d, 3), point(u + w, v + d, -4), point(u, v + d, -4)].join(' ')} fill="#c6ae8c" />
  </g>;
}

export function KotaNeighbourhood({ campus, onCampusChange, hostel, room }: Props) {
  return <div className="kota-scene" role="group" aria-label="Illustrative Kota neighbourhood. Select a campus to explore nearby stays.">
    <div className="scene-orbit scene-orbit-one" aria-hidden="true" /><div className="scene-orbit scene-orbit-two" aria-hidden="true" />
    <div className="scene-kicker"><span className="scene-kicker-icon"><MapPin size={15} /></span> A little closer to your everyday.</div>
    <svg viewBox="0 0 860 650" className="kota-scene-svg" aria-hidden="true">
      <defs><linearGradient id="scene-ground" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef0df" /><stop offset="1" stopColor="#e0e8d5" /></linearGradient><radialGradient id="scene-glow"><stop stopColor="#f1e5cf" stopOpacity=".6" /><stop offset="1" stopColor="#f1e5cf" stopOpacity="0" /></radialGradient><filter id="scene-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="17" stdDeviation="20" floodColor="#526841" floodOpacity=".1" /></filter></defs>
      <ellipse cx="450" cy="370" rx="360" ry="235" fill="url(#scene-glow)" />
      <g className="scene-island" filter="url(#scene-shadow)">
        <polygon points={[point(0, 0), point(430, 0), point(430, 430), point(0, 430)].join(' ')} fill="url(#scene-ground)" stroke="#dbe3d0" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={[point(0, 430), point(430, 430), point(430, 430, -9), point(0, 430, -9)].join(' ')} fill="#cddbc1" />
        <polygon points={[point(430, 0), point(430, 430), point(430, 430, -9), point(430, 0, -9)].join(' ')} fill="#bfcfb4" />
        <path d={`M${point(0, 145)}L${point(430, 145)}M${point(0, 350)}L${point(430, 350)}M${point(145, 0)}L${point(145, 430)}M${point(240, 0)}L${point(240, 430)}`} fill="none" stroke="#faf9ef" strokeWidth="24" />
        <path d={`M${point(0, 145)}L${point(430, 145)}M${point(0, 350)}L${point(430, 350)}M${point(145, 0)}L${point(145, 430)}M${point(240, 0)}L${point(240, 430)}`} fill="none" stroke="#d7dac8" strokeWidth="1" strokeDasharray="6 7" />
        <polygon points={plane(20, 20, 105, 102)} fill="#dae3c8" />
        <path d={`M${point(33, 40)}Q${point(80, 90)} ${point(113, 28)}M${point(30, 92)}L${point(112, 92)}`} stroke="#eaf0de" strokeWidth="7" fill="none" />
        <Building u={171} v={29} w={44} d={50} h={39} roof="#d4c3a5" front="#eee1c8" side="#c8b598" />
        <Building u={283} v={26} w={94} d={77} h={62} roof="#9fb999" front="#d3dfc7" side="#91ad90" campus />
        <Building u={24} v={183} w={73} d={47} h={46} roof="#e0c09f" front="#efddc3" side="#c6a684" />
        <Building u={25} v={254} w={69} d={55} h={32} roof="#cc9b85" front="#ebc9b4" side="#be8b75" />
        <Building u={175} v={183} w={39} d={45} h={46} roof="#c9d2b4" front="#e0e6ce" side="#b3bea0" />
        <Building u={285} v={178} w={62} d={36} h={32} roof="#ddc7a7" front="#f1e1c6" side="#cbb292" />
        <Building u={27} v={376} w={60} d={30} h={33} roof="#c9cbb4" front="#e2e5d1" side="#b4baa1" />
        <Building u={171} v={375} w={44} d={31} h={40} roof="#d4b29a" front="#ead2bb" side="#bd9d84" />
        <Building u={281} v={379} w={68} d={29} h={31} roof="#d2d8be" front="#e9ebd8" side="#b9c3a6" />
        <RoomCutaway />
        {[[24,34,.9], [74,43,1.1], [111,107,.9], [183,104,.75], [393,35,1], [411,92,.85], [106,190,.8], [112,296,1], [186,288,1.05], [208,316,.75], [26,331,.8], [380,189,.8], [410,279,.95], [407,324,.8], [106,398,.7], [392,401,.85]].map(([u,v,scale], index) => <Tree key={index} u={u} v={v} scale={scale} />)}
        <g transform="translate(338 243)"><ellipse rx="11" ry="5" fill="#314c37" opacity=".1" /><circle cy="-14" r="3.3" fill="#d0a388" /><path d="M0-10V1M-4 8L0 0L5 7M-4-3L0-7L6-1" stroke="#5c7b67" strokeWidth="3" strokeLinecap="round" /></g>
        <g transform="translate(504 372)"><ellipse rx="11" ry="5" fill="#314c37" opacity=".1" /><circle cy="-14" r="3.3" fill="#c99678" /><path d="M0-10V1M-4 8L0 0L5 7M-5-4L0-7L5-2" stroke="#c3866e" strokeWidth="3" strokeLinecap="round" /></g>
        <path className="scene-route" d="M581 216C598 228 579 246 554 263L469 303" fill="none" stroke="#5b9e86" strokeWidth="2" strokeDasharray="4 5" opacity=".8" />
      </g>
      <g className="scene-compass" transform="translate(713 507)"><circle r="24" fill="#faf8f5" stroke="#e1e5d7" /><path d="M0-12L5 8L0 5L-5 8Z" fill="#477763" /><text x="0" y="-31" textAnchor="middle" fill="#7d8e7d" fontSize="10" fontFamily="inherit">N</text></g>
    </svg>
    <div className="scene-campus-hotspots">{CAMPUSES.map(item => <button key={item.id} type="button" aria-label={`Choose ${item.institute} ${item.name}`} aria-pressed={item.id === campus.id} onClick={() => onCampusChange(item.id)} className={`scene-campus-pin ${item.id === campus.id ? 'is-selected' : ''}`} style={{ left: `${item.sceneX}%`, top: `${item.sceneY}%` }}><span className="scene-pin-dot"><GraduationCap size={16} strokeWidth={1.7} /></span><span className="scene-pin-label">{item.institute}<small>{item.area}</small></span></button>)}</div>
    <div className="scene-little-note"><span className="scene-note-doodle" aria-hidden="true">↘</span>study. settle. repeat.</div>
    {hostel && room && <Link to={`/hostel/${hostel.id}?campus=${campus.id}&room=${room.id}`} className="scene-hostel-preview" key={hostel.id}><span className="scene-preview-photo"><img src={hostel.coverImage} alt="" width="60" height="62" /><span><BedDouble size={13} /></span></span><span className="scene-preview-copy"><small>A LITTLE SPACE FOR YOU</small><strong>{hostel.name}</strong><span>₹{monthlyTotal(room).toLocaleString('en-IN')}<em> / month*</em></span></span><ArrowUpRight size={17} className="scene-preview-arrow" /><span className="scene-preview-footnote">*Known recurring costs · demo room</span></Link>}
    <div className="scene-map-caption"><span /> Illustrative map · demo locations</div>
  </div>;
}
