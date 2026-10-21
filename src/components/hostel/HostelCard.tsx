import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, GraduationCap, BookOpen, Check, Heart, MapPin, Plus, Utensils, Wifi, Wind } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { useApp } from '../../context/AppContext';
import { useCompare } from '../../context/CompareContext';
import { distanceKm, formatDistance, getMatchingRooms, monthlyTotal } from '../../lib/discovery';
import '../../styles/discovery.css';
import { hostelPreviewHref } from '../../lib/hostel-navigation';
import { locationLabel } from '../../lib/location-status';
import { RoomCardStage } from './RoomCardStage';
import { FeaturedHostelStage } from '../home/FeaturedHostelStage';

export interface HostelCardProps {
  hostel: Hostel;
  room?: RoomType;
  campus?: Campus;
  onHover?: (id: string | null) => void;
  compact?: boolean;
  active?: boolean;
  onShowMap?: (id: string) => void;
  reveal?: { expanded: boolean; onToggle: () => void };
}

const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const sharingLabel = (sharing: string) => ({ single: 'Single room', double: 'Double sharing', triple: 'Triple sharing', four: 'Four sharing' } as Record<string, string>)[sharing] || sharing;

export function HostelCard({ hostel, room, campus, onHover, compact = false, active = false, onShowMap, reveal }: HostelCardProps) {
  const { user, toggleFavourite, isFavourite } = useApp();
  const { comparisonIds, toggleCompare, isCompared } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRoom = room?.available ? room : getMatchingRooms(hostel)[0];
  const saved = isFavourite(hostel.id);
  const compared = isCompared(hostel.id);
  const comparisonFull = !compared && comparisonIds.length >= 3;
  const params = new URLSearchParams();
  if (campus) params.set('campus', campus.id);
  if (selectedRoom) params.set('room', selectedRoom.id);
  const href = !user || user.role === 'visitor' ? hostelPreviewHref(hostel.id, campus?.id || 'allen-landmark', selectedRoom?.id, location.pathname + location.search) : `/hostel/${hostel.id}${params.size ? `?${params.toString()}` : ''}`;
  const total = selectedRoom ? monthlyTotal(selectedRoom) : null;
  const extras = selectedRoom && total != null ? total - selectedRoom.rent : 0;
  const distance = campus ? distanceKm(hostel, campus) : null;
  const studentOnly = Boolean(user && user.role !== 'student');
  const optionalAC = Boolean(selectedRoom?.extraCharges.some(charge => charge.optional && /\bac\b/i.test(charge.name)));
  const acIncluded = Boolean(selectedRoom?.included.some(value => /\bac\b/i.test(value))) || (!optionalAC && Boolean(selectedRoom?.features.some(value => /\bac\b/i.test(value))));
  const acOption = acIncluded || Boolean(selectedRoom?.features.some(value => /\bac\b/i.test(value))) || Boolean(selectedRoom?.extraCharges.some(charge => /\bac\b/i.test(charge.name)));
  const amenities = [
    { show: acOption, label: acIncluded ? 'AC included' : 'AC option', Icon: Wind },
    { show: hostel.amenities.includes('Meals'), label: 'Mess', Icon: Utensils },
    { show: hostel.amenities.includes('WiFi'), label: 'Wi-Fi', Icon: Wifi },
    { show: Boolean(selectedRoom?.features.some(value => /study|desk/i.test(value))), label: 'Study space', Icon: BookOpen },
  ].filter(item => item.show).slice(0, 3);

  const save = () => {
    if (user?.role === 'student') toggleFavourite(hostel.id);
    else navigate(`/login?role=student&redirect=${encodeURIComponent(location.pathname + location.search)}`);
  };

  return (
    <article
      data-hostel-id={hostel.id}
      className={`discovery-card${active ? ' discovery-card--active' : ''}${compact ? ' discovery-card--compact' : ''}${compared ? ' discovery-card--compared' : ''}${reveal ? ' discovery-card--reveal' : ''}${reveal?.expanded ? ' is-revealed' : ''}`}
      onMouseEnter={() => onHover?.(hostel.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(hostel.id)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHover?.(null); }}
    >
      <div className="discovery-card-photo">
        {reveal ? <FeaturedHostelStage hostel={hostel} room={selectedRoom} expanded={reveal.expanded} onToggle={reveal.onToggle} /> : <RoomCardStage hostel={hostel} room={selectedRoom} href={href}/>}
        <span className="discovery-card-category">{hostel.category === 'co-ed' ? 'Co-ed' : hostel.category === 'girls' ? 'For girls' : 'For boys'}</span>
        <button type="button" className={`discovery-save${saved ? ' is-saved' : ''}`} onClick={save} disabled={studentOnly} aria-pressed={saved}
          aria-label={studentOnly ? 'A student account is needed to save hostels' : `${saved ? 'Remove' : 'Save'} ${hostel.name}${saved ? ' from saved hostels' : ' to saved hostels'}`}
          title={studentOnly ? 'Save hostels with a student account' : saved ? 'Remove from saved hostels' : 'Save hostel'}>
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>
      <div className="discovery-card-content">
        <div className="discovery-card-heading">
          <div><h3><Link to={href}>{hostel.name}</Link></h3><p className="discovery-card-locality"><MapPin size={12} aria-hidden="true" />{hostel.locality}, Kota</p></div>
          {campus && <div className="discovery-card-distance"><strong>{formatDistance(distance)}</strong><span>{distance == null ? 'distance unavailable' : 'straight-line'}</span></div>}
        </div>
        {campus && <p className="discovery-card-campus"><GraduationCap size={14} aria-hidden="true" />{campus.institute} · {campus.name}</p>}
        {reveal?.expanded && <div className="featured-reveal-address"><span>A LITTLE CLOSER TO HOME</span><p>{hostel.address}</p></div>}
        {onShowMap && <button type="button" className="discovery-show-map" onClick={() => onShowMap(hostel.id)}><MapPin size={14} />Show on map</button>}
        <div className="discovery-card-roomline"><span className={`discovery-room-tag${selectedRoom ? '' : ' discovery-room-tag--full'}`}>{selectedRoom ? sharingLabel(selectedRoom.sharingType) : 'Currently full'}</span><span className="discovery-sample-tag">{locationLabel(hostel)}</span></div>
        <div className="discovery-card-pricing">
          <div>{total != null ? <p className="discovery-card-price">{money(total)}<span>total / month</span></p> : <p className="discovery-card-price discovery-card-price--unavailable">Check availability</p>}
            {selectedRoom && <p className="discovery-card-price-note">{money(selectedRoom.rent)} rent{extras > 0 ? ` + ${money(extras)} fixed extras` : ' · included services'}</p>}</div>
          {selectedRoom && <div className="discovery-card-deposit"><span>Deposit</span><strong>{money(selectedRoom.deposit)}</strong></div>}
        </div>
        <div className="discovery-card-features">{amenities.map(({ label, Icon }) => <span key={label}><Icon size={13} strokeWidth={1.5} aria-hidden="true" />{label}</span>)}</div>
        <div className="discovery-card-footer">
          <button type="button" className={`discovery-compare-control${compared ? ' is-compared' : ''}`} onClick={() => toggleCompare(hostel.id)} disabled={comparisonFull} aria-pressed={compared}
            aria-label={`${compared ? 'Remove' : 'Add'} ${hostel.name} ${compared ? 'from' : 'to'} comparison`} title={comparisonFull ? 'Compare up to 3 hostels. Remove one to add this hostel.' : undefined}>
            {compared ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}{compared ? 'Selected' : 'Compare'}
          </button>
          <Link to={href} className="discovery-card-cta">{!user || user.role === 'visitor' ? 'Preview stay' : selectedRoom ? 'View rooms' : 'View hostel'}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}
