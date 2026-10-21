import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { KotaBeacon3DCanvas } from '../components/three/KotaBeacon3DCanvas';
import '../styles/public-support.css';

export function NotFoundPage() {
  return (
    <section className="public-support not-found-page public-container">
      <div className="not-found-art">
        <KotaBeacon3DCanvas mode="detour" height={340} label="404 · KOTA COMPASS 3D" />
      </div>
      <div className="not-found-copy">
        <p className="public-eyebrow">
          <MapPin size={14} /> 404 · A small detour
        </p>
        <h1>
          This page took
          <br />
          <em>a different turn.</em>
        </h1>
        <p>
          The address might have changed, or the link could be out of date. Drag the 3D Kota compass or head straight back to verified student stays.
        </p>
        <div className="not-found-actions">
          <Link className="public-primary" to="/explore">
            Explore hostels <ArrowRight size={17} />
          </Link>
          <Link className="public-secondary" to="/map">
            Open Kota map <MapPin size={16} />
          </Link>
          <Link className="public-secondary" to="/">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
