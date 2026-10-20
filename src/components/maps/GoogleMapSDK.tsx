import { useEffect } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  APILoadingStatus,
  Map,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { GraduationCap } from 'lucide-react';
import { CAMPUSES } from '../../data/campuses';
import { monthlyTotal } from '../../lib/discovery';
import { CITY_TARGET, validCoordinates, type CityMapType, type MapTarget } from '../../lib/maps';
import type { GoogleCityMapProps } from './GoogleCityMap';

function Camera({ target }: { target: MapTarget }) {
  const map = useMap();
  useEffect(() => {
    if (map) map.moveCamera({ center: { lat: target.lat, lng: target.lng }, zoom: target.zoom });
  }, [map, target.id, target.lat, target.lng, target.zoom]);
  return null;
}
function LoadState({ onUnavailable }: { onUnavailable: () => void }) {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
      onUnavailable();
      return;
    }
    if (status === APILoadingStatus.LOADED) return;
    const timer = window.setTimeout(onUnavailable, 20_000);
    return () => window.clearTimeout(timer);
  }, [status, onUnavailable]);
  return status === APILoadingStatus.LOADED ? null : (
    <div className="google-city-map__loading" role="status">
      Loading Google Maps…
    </div>
  );
}
interface Props extends GoogleCityMapProps {
  apiKey: string;
  target: MapTarget;
  mapType: CityMapType;
  onUnavailable: () => void;
}
export default function GoogleMapSDK({
  apiKey,
  target,
  mapType,
  items,
  campus,
  selectedHostelId,
  onSelect,
  onCampusSelect,
  onUnavailable,
}: Props) {
  return (
    <APIProvider apiKey={apiKey} language="en" region="IN" onError={onUnavailable}>
      <LoadState onUnavailable={onUnavailable} />
      <Map
        defaultCenter={{ lat: CITY_TARGET.lat, lng: CITY_TARGET.lng }}
        defaultZoom={CITY_TARGET.zoom}
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'}
        mapTypeId={mapType}
        gestureHandling="greedy"
        fullscreenControl
        streetViewControl
        zoomControl
        mapTypeControl={false}
        clickableIcons
        reuseMaps
        style={{ width: '100%', height: '100%' }}
      >
        <Camera target={target} />
        {CAMPUSES.map((c) => (
          <AdvancedMarker
            key={c.id}
            position={{ lat: c.latitude, lng: c.longitude }}
            title={`${c.institute} ${c.name} — sample campus pin`}
            onClick={() => onCampusSelect?.(c.id)}
            zIndex={c.id === campus.id ? 10 : 5}
          >
            <span className={`google-campus-pin${c.id === campus.id ? ' is-selected' : ''}`}>
              <GraduationCap size={17} />
              <span>
                {c.institute}
                <small>{c.name}</small>
              </span>
            </span>
          </AdvancedMarker>
        ))}
        {items
          .filter(({ hostel }) => validCoordinates(hostel.latitude, hostel.longitude))
          .map(({ hostel, room }) => (
            <AdvancedMarker
              key={hostel.id}
              position={{ lat: hostel.latitude!, lng: hostel.longitude! }}
              title={`${hostel.name}, ₹${monthlyTotal(room).toLocaleString('en-IN')} fixed monthly — sample listing`}
              onClick={() => onSelect(hostel.id)}
              zIndex={selectedHostelId === hostel.id ? 20 : 1}
            >
              <span
                className={`google-hostel-pin${selectedHostelId === hostel.id ? ' is-selected' : ''}`}
              >
                ₹{monthlyTotal(room).toLocaleString('en-IN')}
              </span>
            </AdvancedMarker>
          ))}
      </Map>
    </APIProvider>
  );
}
