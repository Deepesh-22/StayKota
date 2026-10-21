import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Car, Footprints, MapPin, Navigation } from 'lucide-react';
import type { Hostel, RoomType } from '../../types';
import type { Campus } from '../../data/campuses';
import { KotaMap } from '../maps/KotaMap';
import { MapLayerToggle } from '../maps/MapLayerToggle';
import type { MapBasemap } from '../../lib/satellite-map';
import { validCoordinates } from '../../lib/coordinates';
import { distanceKm, formatDistance } from '../../lib/discovery';
import { locationLabel } from '../../lib/location-status';
import { canRouteBetween, directionsLink } from '../../lib/proximity';

export function HostelProximityMap({ hostel, campus, room }: { hostel: Hostel; campus: Campus; room?: RoomType }) {
  const [preview, setPreview] = useState(false);
  const [basemap, setBasemap] = useState<MapBasemap>('street');
  const complete = validCoordinates(hostel.latitude, hostel.longitude) && validCoordinates(campus.latitude, campus.longitude);
  const demo = hostel.location?.status === 'demo' || campus.location.status === 'demo';
  const showMap = complete && (!demo || preview);
  const route = canRouteBetween(hostel, campus);
  const distance = complete ? distanceKm(hostel, campus) : null;
  const params = new URLSearchParams({ campus: campus.id, hostel: hostel.id });
  const mappedRoom = room || hostel.roomTypes[0];
  return <div className="detail-proximity">
    <div className="detail-proximity__summary"><span><MapPin size={19}/><strong>{demo ? 'Demo neighbourhood preview' : 'Your campus connection'}</strong></span><p>{distance === null ? 'Distance unavailable until both locations are supplied.' : `${formatDistance(distance)} straight-line${demo ? ' · illustrative coordinates' : ' · not a walking route'}`}</p></div>
    {showMap ? <><div className="detail-proximity__toolbar"><MapLayerToggle basemap={basemap} onChange={setBasemap}/><span>{demo ? 'Demo pins · not for navigation' : 'Confirm the entrance before travelling'}</span></div><div className="detail-proximity__map"><KotaMap campus={campus} campusPins={[campus]} items={mappedRoom ? [{ hostel, room: mappedRoom }] : []} selectedHostelId={hostel.id} activeCampusId={campus.id} onSelect={() => {}} target={{ id: `${hostel.id}-${campus.id}`, lat: campus.latitude, lng: campus.longitude, zoom: 14, bounds: [[Math.min(hostel.longitude!, campus.longitude), Math.min(hostel.latitude!, campus.latitude)], [Math.max(hostel.longitude!, campus.longitude), Math.max(hostel.latitude!, campus.latitude)]] }} basemap={basemap}/></div></>
      : <div className="detail-proximity__fallback"><Navigation size={29}/><h3>{demo ? 'Exact locations are still being checked.' : 'The location hasn’t been provided yet.'}</h3><p>{demo ? 'These sample pins do not establish the hostel’s real address. Ask for an entrance pin before making travel plans.' : 'We need the hostel entrance and campus coordinates to show their positions. No location has been guessed.'}</p>{complete && demo && <button type="button" className="detail-outline" onClick={() => setPreview(true)}>Preview demo map</button>}</div>}
    <div className="detail-proximity__places"><div><span>YOUR HOSTEL</span><strong>{hostel.name}</strong><p>{hostel.address}</p><small>{locationLabel(hostel)}</small></div><div><span>YOUR COACHING CAMPUS</span><strong>{campus.institute} · {campus.name}</strong><p>{campus.area}, Kota</p><small>{locationLabel(campus)}</small></div></div>
    <div className="detail-proximity__actions">{route && <><a href={directionsLink(hostel, campus, 'walking')!} target="_blank" rel="noopener noreferrer"><Footprints size={16}/>Walking directions <ArrowUpRight size={14}/></a><a href={directionsLink(hostel, campus, 'driving')!} target="_blank" rel="noopener noreferrer"><Car size={16}/>Driving directions <ArrowUpRight size={14}/></a></>}{complete && <Link to={`/map?${params}`}><MapPin size={16}/>View larger map <ArrowUpRight size={14}/></Link>}</div>
    <p className="detail-proximity__note">{route ? 'Directions open in Google Maps, which calculates routes and travel times. Pin accuracy depends on the supplied coordinates.' : 'Directions are unavailable for demo or missing coordinates. No walking time or route distance is inferred.'}</p>
  </div>;
}
