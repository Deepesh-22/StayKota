import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, LoaderCircle, MapPin } from 'lucide-react';
import type { Campus } from '../../data/campuses';
import type { Hostel, RoomType } from '../../types';
import {
  CITY_TARGET,
  googleEmbedUrl,
  googleExternalUrl,
  type CityMapType,
  type MapTarget,
  type MapPerspective,
} from '../../lib/maps';
import '../../styles/google-map.css';

const GoogleMapSDK = lazy(() => import('./GoogleMapSDK'));
export interface MapHostel {
  hostel: Hostel;
  room: RoomType;
}
export interface GoogleCityMapProps {
  campus: Campus;
  items: MapHostel[];
  selectedHostelId?: string | null;
  onSelect: (id: string) => void;
  onCampusSelect?: (id: string) => void;
  target?: MapTarget;
  mapType?: CityMapType;
  search?: string;
  radiusKm?: number;
  activeCampusId?: string;
  perspective?: MapPerspective;
  on3DAvailabilityChange?: (available: boolean) => void;
}
export function GoogleCityMap(props: GoogleCityMapProps) {
  const { target = CITY_TARGET, mapType = 'roadmap', search = '' } = props;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [visible, setVisible] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const unavailable = useCallback(() => setFailed(true), []);
  const isSDK = !!apiKey && !failed && !search.trim();
  const source = googleEmbedUrl(target, mapType, search);
  const on3DAvailabilityChange = props.on3DAvailabilityChange;
  useEffect(() => {
    if (!isSDK) on3DAvailabilityChange?.(false);
  }, [isSDK, on3DAvailabilityChange]);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    if (!visible || isSDK) return;
    const timer = window.setTimeout(() => setSlow(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [source, target.id, visible, isSDK]);
  return (
    <div className="google-city-map" ref={container} data-map-mode={isSDK ? 'sdk' : 'embed'}>
      {!visible ? (
        <div className="google-city-map__loading">
          <MapPin size={24} />
          <span>Explore Kota on Google Maps</span>
        </div>
      ) : isSDK ? (
        <Suspense
          fallback={
            <div className="google-city-map__loading" role="status">
              <LoaderCircle size={22} className="animate-spin" />
              Loading Google Maps…
            </div>
          }
        >
          <GoogleMapSDK
            {...props}
            apiKey={apiKey}
            target={target}
            mapType={mapType}
            onUnavailable={unavailable}
          />
        </Suspense>
      ) : (
        <>
          <iframe
            key={`${source}:${target.id}`}
            className="google-city-map__frame"
            src={source}
            title="Google map of the whole city of Kota"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setLoaded(true)}
            onError={() => setSlow(true)}
          />
          {!loaded && !slow && (
            <div
              className="google-city-map__loading google-city-map__loading--overlay"
              role="status"
            >
              <LoaderCircle size={20} className="animate-spin" />
              Loading Google’s city map…
            </div>
          )}
          {slow && !loaded && (
            <div className="google-city-map__connection" role="status">
              Map taking longer than expected?{' '}
              <a href={googleExternalUrl(target, search)} target="_blank" rel="noreferrer">
                Open Google Maps <ExternalLink size={13} />
              </a>
            </div>
          )}
        </>
      )}
      {!isSDK && !failed && (
        <p className="google-city-map__fallback" role="status">
          {search.trim() ? 'Google place search view. Clear the search to return to StayKota pins.' : 'City map preview. Custom hostel and coaching pins are unavailable until Google Maps is configured.'}
        </p>
      )}
      {failed && (
        <div className="google-city-map__fallback" role="status">
          Interactive pins couldn’t load. Showing Google’s embedded map.{' '}
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
