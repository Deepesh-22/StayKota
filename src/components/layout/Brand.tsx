import { Link } from 'react-router-dom';
export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`sk-brand ${light ? 'sk-brand--light' : ''}`} to="/" aria-label="StayKota home"><svg viewBox="0 0 36 42" width="31" height="36" fill="none" aria-hidden="true"><path d="M18 1C8.6 1 1 8.2 1 17.2 1 28 18 41 18 41s17-13 17-23.8C35 8.2 27.4 1 18 1Z" fill="currentColor"/><path d="M24.5 11.8c-2.7-2.9-10.4-3.2-11.4 1.3-1.1 5.1 12.3 3 10.4 9.7-1.3 4.6-9.1 4.9-12.1 1.4" stroke="#fffdf7" strokeWidth="3" strokeLinecap="round"/></svg><span>Stay<span className="sk-brand__suffix">Kota</span><small>Find your place. Find your pace.</small></span></Link>;
}
