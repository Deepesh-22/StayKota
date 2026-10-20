import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Campus } from '../../data/campuses';
import { CoachingMap, type MappedHostel } from '../maps/CoachingMap';
import { campusDistance } from '../../lib/maps';
import { formatDistance, monthlyTotal } from '../../lib/discovery';
export type { MappedHostel } from '../maps/CoachingMap';
interface Props { campus: Campus; items: MappedHostel[]; activeHostelId?: string | null; onActivate: (id: string) => void }
export function NeighbourhoodMap({ campus, items, activeHostelId, onActivate }: Props) {
  const selected = items.find(({hostel}) => hostel.id === activeHostelId && (campusDistance(hostel, campus) ?? Infinity) <= 1);
  return <section className="neighbourhood-panel" aria-label="Hostels near your coaching">
    <div className="neighbourhood-panel-heading"><span>A little closer to {campus.institute}</span><Link to={`/map?campus=${campus.id}`}>Explore nearby <ArrowUpRight size={13}/></Link></div>
    <div className="neighbourhood-panel-viewport"><CoachingMap campus={campus} items={items} selectedHostelId={activeHostelId} onSelect={onActivate}/></div>
    {selected && <Link className="neighbourhood-panel-summary" to={`/hostel/${selected.hostel.id}?campus=${campus.id}&room=${selected.room.id}`}><img src={selected.hostel.coverImage} alt=""/><span><strong>{selected.hostel.name}</strong><small>{formatDistance(campusDistance(selected.hostel, campus))} from coaching</small></span><b>₹{monthlyTotal(selected.room).toLocaleString('en-IN')}</b><ArrowUpRight size={15}/></Link>}
    <p className="neighbourhood-panel-note">Showing matching stays within 1 km of your coaching. Open Explore nearby to widen the radius. Illustrated layout and sample locations; connections are not walking routes.</p>
  </section>;
}
