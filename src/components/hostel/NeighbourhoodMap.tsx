import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, GraduationCap, LocateFixed, MapPin, Minus, Plus } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { distanceKm, formatDistance, monthlyTotal } from '../../lib/discovery';

export interface MappedHostel { hostel: Hostel; room: RoomType; }
interface Props { campus: Campus; items: MappedHostel[]; activeHostelId?: string | null; onActivate: (id: string) => void; }

export function NeighbourhoodMap({ campus, items, activeHostelId, onActivate }: Props) {
  const [zoom, setZoom] = useState(1);
  const located = items.filter(({ hostel }) => Number.isFinite(hostel.latitude) && Number.isFinite(hostel.longitude));
  const project = useMemo(() => {
    const points = [{ latitude: campus.latitude, longitude: campus.longitude }, ...items.filter(({ hostel }) => Number.isFinite(hostel.latitude) && Number.isFinite(hostel.longitude)).map(({ hostel }) => ({ latitude: hostel.latitude!, longitude: hostel.longitude! }))];
    const latitudes = points.map(point => point.latitude), longitudes = points.map(point => point.longitude);
    const latMin = Math.min(...latitudes), latMax = Math.max(...latitudes), lonMin = Math.min(...longitudes), lonMax = Math.max(...longitudes);
    const latSpan = Math.max(latMax - latMin, 0.012), lonSpan = Math.max(lonMax - lonMin, 0.012);
    const latCentre = (latMax + latMin) / 2, lonCentre = (lonMax + lonMin) / 2;
    return (latitude: number, longitude: number) => ({ x: 50 + ((longitude - lonCentre) / lonSpan) * 64, y: 44 - ((latitude - latCentre) / latSpan) * 55 });
  }, [campus.latitude, campus.longitude, items]);
  const campusPoint = project(campus.latitude, campus.longitude);
  const selected = located.find(({ hostel }) => hostel.id === activeHostelId) || located[0];

  return (
    <section className="discovery-map" aria-label={`Sample hostel map near ${campus.name}`}>
      <div className="discovery-map-caption"><span><i />Your campus neighbourhood</span><span>Schematic map</span></div>
      <div className="discovery-map-viewport">
        <div className="discovery-map-canvas" style={{ transform: `scale(${zoom})` }}>
          <svg className="discovery-map-illustration" viewBox="0 0 480 700" preserveAspectRatio="none" aria-hidden="true">
            <defs><pattern id="discovery-streets" width="62" height="68" patternTransform="rotate(-23)" patternUnits="userSpaceOnUse"><rect width="62" height="68" fill="#e8e9df" /><rect x="5" y="5" width="23" height="26" rx="3" fill="#dedfd6" /><rect x="34" y="5" width="23" height="26" rx="3" fill="#e0e2d9" /><rect x="5" y="37" width="52" height="26" rx="3" fill="#e2e4da" /><path d="M0 0H62M0 34H62M0 0V68M31 0V34" stroke="#fbfaf6" strokeWidth="5" /></pattern></defs>
            <rect width="480" height="700" fill="url(#discovery-streets)" />
            <path d="M-30 50Q80 15 120 80T250 110L215 200L115 180L85 140L-20 150Z" fill="#d2dfbb" />
            <path d="M350 390L490 350L510 540L395 590L330 510Z" fill="#d5dfc5" />
            <path d="M-30 550C90 490 150 600 250 595S390 650 510 720" stroke="#f5f2de" strokeWidth="62" fill="none" />
            <path d="M-30 550C90 490 150 600 250 595S390 650 510 720" stroke="#a9cfcc" strokeWidth="41" fill="none" />
            <path d="M-30 280L245 335L490 190M70-20L155 265L340 490L450 715" stroke="#d1cabb" strokeWidth="14" fill="none" />
            <path d="M-30 280L245 335L490 190M70-20L155 265L340 490L450 715" stroke="#fffdf7" strokeWidth="10" fill="none" />
            <path d="M-20 440L500 375M320-20L270 280L180 725" stroke="#fffdf7" strokeWidth="7" fill="none" />
            <text x="31" y="470" fill="#8e9b87" fontSize="12" letterSpacing="2">KOTA</text><text x="295" y="110" fill="#91a27e" fontSize="10" letterSpacing="1.5">STUDY. STAY. BELONG.</text>
          </svg>
          <div className="discovery-map-campus" style={{ left: `${campusPoint.x}%`, top: `${campusPoint.y}%` }}><span><GraduationCap size={21} aria-hidden="true" /></span><strong>{campus.institute} {campus.name}<small>Your coaching campus</small></strong></div>
          {located.map(({ hostel, room }) => { const point = project(hostel.latitude!, hostel.longitude!); const active = selected?.hostel.id === hostel.id; return <button type="button" key={hostel.id} className={`discovery-map-marker${active ? ' is-active' : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => onActivate(hostel.id)} aria-pressed={active} aria-label={`Show ${hostel.name}, ₹${monthlyTotal(room).toLocaleString('en-IN')} per month`}><MapPin size={18} fill="currentColor" stroke="white" aria-hidden="true" /><span>₹{monthlyTotal(room).toLocaleString('en-IN')}</span></button>; })}
        </div>
        <div className="discovery-map-controls" aria-label="Map controls"><button type="button" onClick={() => setZoom(value => Math.min(1.5, value + 0.15))} disabled={zoom >= 1.49} aria-label="Zoom map in"><Plus size={17} /></button><button type="button" onClick={() => setZoom(value => Math.max(1, value - 0.15))} disabled={zoom <= 1.01} aria-label="Zoom map out"><Minus size={17} /></button><button type="button" onClick={() => setZoom(1)} aria-label="Reset map view"><LocateFixed size={17} /></button></div>
        {selected ? <Link className="discovery-map-preview" to={`/hostel/${selected.hostel.id}?campus=${encodeURIComponent(campus.id)}&room=${encodeURIComponent(selected.room.id)}`}><img src={selected.hostel.coverImage || '/images/room-shared.webp'} alt="" /><span><strong>{selected.hostel.name}</strong><small>{formatDistance(distanceKm(selected.hostel, campus))} · straight-line</small><b>₹{monthlyTotal(selected.room).toLocaleString('en-IN')}<em> / month</em></b></span><ArrowUpRight size={18} aria-hidden="true" /></Link> : <div className="discovery-map-empty"><MapPin size={25} /><strong>No map pins to show</strong><p>Adjust your filters to discover more sample stays.</p></div>}
      </div>
      <p className="discovery-map-note">Sample coordinates. Distances are approximate straight-line distances, not walking routes. Illustration is not a navigation map.</p>
    </section>
  );
}
