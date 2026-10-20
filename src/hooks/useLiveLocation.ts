import { useCallback, useEffect, useRef, useState } from 'react';
export interface LiveLocation { latitude: number; longitude: number; accuracy: number }
export function useLiveLocation() {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [tracking, setTracking] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const watch = useRef<number | null>(null);
  const generation = useRef(0);
  const clear = useCallback(() => {
    generation.current++;
    if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current);
    watch.current = null;
  }, []);
  const stop = useCallback(() => {
    clear(); setLocation(null); setTracking(false); setPending(false); setError('');
  }, [clear]);
  const start = useCallback(() => {
    clear(); setError(''); setLocation(null);
    if (!window.isSecureContext || !navigator.geolocation) {
      setTracking(false); setPending(false);
      setError('Location needs HTTPS and a browser that supports location. You can still choose a coaching campus.');
      return;
    }
    const current = generation.current;
    setPending(true); setTracking(true);
    const fail = (message: string) => {
      clear(); setLocation(null); setTracking(false); setPending(false); setError(message);
    };
    try {
      watch.current = navigator.geolocation.watchPosition(position => {
        if (generation.current !== current) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          fail('Your location could not be read. Try again or choose a coaching campus.'); return;
        }
        setLocation({ latitude, longitude, accuracy }); setPending(false);
      }, error => {
        if (generation.current !== current) return;
        fail(error.code === 1 ? 'Location permission was denied. Allow location in your browser settings or choose a coaching campus.'
          : error.code === 3 ? 'Location timed out. Try again outdoors or choose a coaching campus.'
          : 'Your location is unavailable. Try again or choose a coaching campus.');
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
    } catch {
      fail('Location could not start. Check browser permissions or choose a coaching campus.');
    }
  }, [clear]);
  useEffect(() => clear, [clear]);
  return { location, tracking, pending, error, start, stop };
}
