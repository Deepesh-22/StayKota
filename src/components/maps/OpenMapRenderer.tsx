import { useEffect, useRef, useState } from 'react';
import { LngLat, Map, setWorkerUrl, type GeoJSONSource, type StyleSpecification } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSatelliteLayer } from '../../hooks/useSatelliteLayer';
import { SATELLITE_SOURCE_ID } from '../../lib/satellite-map';
import { inKotaMapArea, minimumKotaZoom, constrainKotaCamera } from '../../lib/map-area';
import { consumeMapCameraSnapshot } from '../../lib/marker-transition';
import { useHostelTransition } from '../../context/HostelTransitionContext';
import { CITY_TARGET } from '../../lib/maps';
import { OPEN_MAP_STYLE_URL, radiusPolygon, studentMapStyle } from '../../lib/open-map-style';
import { CityMapContext } from './MapContext';
import { StudentMapPins } from './StudentMapPins';
import { MapPinOverlay } from './MapPinOverlay';
import type { KotaMapProps } from './KotaMap';

setWorkerUrl(mapWorkerUrl);

export default function OpenMapRenderer({ target = CITY_TARGET, perspective = '2d', basemap = 'street', userLocation, radiusKm, on3DAvailabilityChange, ...props }: KotaMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const { setReturnedHostelId } = useHostelTransition();
  const [map, setMap] = useState<Map | null>(null);
  const [camera, setCamera] = useState({ lat: CITY_TARGET.lat, lng: CITY_TARGET.lng, zoom: CITY_TARGET.zoom, pitch: 0 });
  const [minZoom, setMinZoom] = useState(11);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const currentPerspective = useRef(perspective);
  currentPerspective.current = perspective;
  const latestTarget = useRef(target);
  latestTarget.current = target;
  const availability = useRef(on3DAvailabilityChange);
  availability.current = on3DAvailabilityChange;

  useEffect(() => {
    if (!container.current) return;
    let instance: Map | undefined;
    const controller = new AbortController();
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setError(''); setReady(false);
    availability.current?.(false);
    const start = async () => {
      try {
        const response = await fetch(OPEN_MAP_STYLE_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Map style unavailable');
        const style = studentMapStyle(await response.json() as StyleSpecification);
        if (cancelled || !container.current) return;
        const initialMinZoom = Math.max(0, minimumKotaZoom(container.current.clientWidth, container.current.clientHeight));
        setMinZoom(initialMinZoom);
        instance = new Map({
          container: container.current,
          style,
          center: [CITY_TARGET.lng, CITY_TARGET.lat],
          zoom: CITY_TARGET.zoom,
          minZoom: initialMinZoom,
          maxZoom: 19,
          renderWorldCopies: false,
          attributionControl: false,
          maxPitch: 65,
          transformConstrain: (lngLat, zoom) => {
            const width = container.current?.clientWidth || 1, height = container.current?.clientHeight || 1;
            const limited = constrainKotaCamera(lngLat.lat, lngLat.lng, zoom, width, height);
            return { center: new LngLat(limited.longitude, limited.latitude), zoom: limited.zoom };
          },
        });
        instance.scrollZoom.setWheelZoomRate(1 / 300);
        instance.on('load', () => {
          if (cancelled) return;
          clearTimeout(timer); setReady(true); availability.current?.(true);
        });
        instance.on('error', event => {
          if ('sourceId' in event && event.sourceId === SATELLITE_SOURCE_ID) return;
          if (!cancelled) setError('Some map data could not load. Check your connection or retry. Hostel and coaching pins remain available.');
        });
        timer = setTimeout(() => { if (!cancelled) setError('Map data is taking longer than expected. Check your connection or retry.'); }, 15000);
        resize = new ResizeObserver(() => {
          if (!instance || !container.current) return;
          const updatedMinZoom = Math.max(0, minimumKotaZoom(container.current.clientWidth, container.current.clientHeight));
          instance.setMinZoom(updatedMinZoom);
          setMinZoom(updatedMinZoom);
          instance.resize();
        });
        resize.observe(container.current);
        setMap(instance);
      } catch {
        if (!cancelled) setError('The map could not load. Check your connection and try again. Your hostel list is still available.');
      }
    };
    void start();
    return () => {
      cancelled = true; controller.abort(); clearTimeout(timer); resize?.disconnect();
      instance?.remove(); setMap(null); availability.current?.(false);
    };
  }, [revision]);

  useEffect(() => {
    if (!map) return;
    const update = () => {
      const centre = map.getCenter();
      setCamera({ lat: centre.lat, lng: centre.lng, zoom: map.getZoom(), pitch: map.getPitch() });
    };
    update();
    map.on('move', update); map.on('pitch', update); map.on('resize', update);
    return () => { map.off('move', update); map.off('pitch', update); map.off('resize', update); };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const restored = typeof window !== 'undefined' ? consumeMapCameraSnapshot(window.location.pathname) : null;
    if (restored && inKotaMapArea({ latitude: restored.lat, longitude: restored.lng })) {
      map.jumpTo({
        center: [restored.lng, restored.lat],
        zoom: restored.zoom,
        pitch: restored.pitch || (currentPerspective.current === '3d' ? 50 : 0),
        bearing: restored.bearing || 0,
      });
      if (restored.hostelId) {
        setReturnedHostelId(restored.hostelId);
        const timer = window.setTimeout(() => setReturnedHostelId(null), 1800);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    const current = latestTarget.current;
    if (!inKotaMapArea({ latitude: current.lat, longitude: current.lng })) {
      map.jumpTo({ center: [CITY_TARGET.lng, CITY_TARGET.lat], zoom: CITY_TARGET.zoom, pitch: currentPerspective.current === '3d' ? 50 : 0 });
      return;
    }
    if (current.bounds) map.fitBounds(current.bounds, { padding: 65, maxZoom: 16, duration: 0 });
    else map.jumpTo({ center: [current.lng, current.lat], zoom: current.zoom, pitch: currentPerspective.current === '3d' ? 50 : 0 });
  }, [map, setReturnedHostelId, target.id]);

  useEffect(() => {
    if (!map || !ready) return;
    const tilted = perspective === '3d';
    map.easeTo({ pitch: tilted ? 50 : 0, bearing: 0, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 });
    if (map.getLayer('staykota-buildings-3d')) map.setLayoutProperty('staykota-buildings-3d', 'visibility', tilted ? 'visible' : 'none');
    if (tilted) { map.dragRotate.enable(); map.touchZoomRotate.enableRotation(); map.touchPitch.enable(); }
    else { map.dragRotate.disable(); map.touchZoomRotate.disableRotation(); map.touchPitch.disable(); }
  }, [map, ready, perspective]);

  useEffect(() => {
    if (!map || !ready) return;
    const origin = userLocation || props.campus;
    const features: GeoJSON.Feature[] = [];
    if (radiusKm && inKotaMapArea(origin)) features.push({ ...radiusPolygon(origin.latitude, origin.longitude, radiusKm), properties: { color: '#0d7d70' } });
    if (userLocation && inKotaMapArea(userLocation) && Number.isFinite(userLocation.accuracy) && userLocation.accuracy > 0)
      features.push({ ...radiusPolygon(userLocation.latitude, userLocation.longitude, userLocation.accuracy / 1000), properties: { color: '#2563eb' } });
    const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
    const source = map.getSource('staykota-radii') as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else {
      map.addSource('staykota-radii', { type: 'geojson', data });
      map.addLayer({ id: 'staykota-radius-fill', type: 'fill', source: 'staykota-radii', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.1 } });
      map.addLayer({ id: 'staykota-radius-line', type: 'line', source: 'staykota-radii', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });
    }
  }, [map, ready, props.campus.latitude, props.campus.longitude, radiusKm, userLocation]);

  const satellite = useSatelliteLayer(map, ready, basemap);

  return (
    <div
      className="student-city-map"
      data-basemap={basemap}
      data-imagery-state={satellite.state}
      data-map-mode="maplibre"
      data-target={`${target.lat},${target.lng}`}
      data-perspective={perspective}
      data-zoom-tier={camera.zoom < 13.4 ? 'overview' : 'detail'}
      data-camera-centre={`${camera.lat.toFixed(6)},${camera.lng.toFixed(6)}`}
      data-camera-zoom={camera.zoom.toFixed(2)}
      data-camera-pitch={camera.pitch.toFixed(0)}
      data-min-zoom={minZoom.toFixed(4)}
    >
      <div className="student-city-map__canvas" ref={container} role="region" aria-label="Interactive OpenStreetMap of Kota" />
      {!ready && !error && <div className="student-city-map__loading" role="status">Loading Kota map…</div>}
      {error && <div className="student-city-map__error" role="alert">{error} <button type="button" onClick={() => setRevision(n => n + 1)}>Retry map</button></div>}
      {basemap === 'satellite' && satellite.state === 'loading' && <div className="student-satellite-notice" role="status">Loading satellite imagery…</div>}
      {basemap === 'satellite' && satellite.state === 'error' && (
        <div className="student-satellite-notice is-error" role="alert">
          Satellite imagery could not load. Showing the street map. <button type="button" onClick={satellite.retry}>Retry satellite</button>
        </div>
      )}
      {map && (
        <CityMapContext.Provider value={map}>
          <StudentMapPins {...props} perspective={perspective} />
          {userLocation && inKotaMapArea(userLocation) && (
            <MapPinOverlay lat={userLocation.latitude} lng={userLocation.longitude} zIndex={40}>
              <span className="student-location-pin" role="img" aria-label="Your current location" />
            </MapPinOverlay>
          )}
        </CityMapContext.Provider>
      )}
      {(!userLocation || inKotaMapArea(userLocation)) && (!inKotaMapArea({ latitude: target.lat, longitude: target.lng }) || target.bounds?.some(point => !inKotaMapArea({ latitude: point[1], longitude: point[0] }))) && (
        <div className="student-outside-area" role="status">The selected location is outside the Kota map area. The map stays in Kota; its original listing details remain available.</div>
      )}
      {userLocation && !inKotaMapArea(userLocation) && (
        <div className="student-outside-area" role="status">Your location is outside the Kota map area. The map stays in Kota; choose a coaching campus to explore nearby stays.</div>
      )}
      <div className="student-map-legend" aria-label="Map pin legend">
        <span><i className="legend-dot legend-dot--hostel" /> {props.items.length} {props.items.length === 1 ? 'Hostel' : 'Hostels'}</span>
        <span><i className="legend-dot legend-dot--coaching" /> Coaching campuses</span>
      </div>
    </div>
  );
}
