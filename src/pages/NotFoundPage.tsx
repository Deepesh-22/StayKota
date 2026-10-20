import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import '../styles/public-support.css';

export function NotFoundPage() {
  return <section className="public-support not-found-page public-container">
    <div className="not-found-art" aria-hidden="true"><svg viewBox="0 0 480 340"><ellipse cx="239" cy="285" rx="199" ry="33" fill="#e8ecdf"/><path d="M60 257c86-72 228 49 240-24S149 199 165 142" fill="none" stroke="#94a992" strokeWidth="3" strokeDasharray="7 9" strokeLinecap="round"/><g transform="translate(62 105)"><path d="m0 63 54-38 54 38v100H0z" fill="#dfc8a7"/><path d="m-9 63 63-45 63 45" fill="none" stroke="#bd9e7c" strokeWidth="10" strokeLinejoin="round"/><rect x="41" y="108" width="28" height="55" rx="3" fill="#7a9381"/><rect x="15" y="78" width="20" height="22" fill="#faf8f5"/><rect x="76" y="78" width="20" height="22" fill="#faf8f5"/></g><path d="M321 65c-45 0-70 30-70 66 0 49 70 106 70 106s70-57 70-106c0-36-25-66-70-66" fill="#0f766e"/><path d="M321 76c-34 0-58 23-58 55 0 36 58 89 58 89" fill="none" stroke="#319a8a" strokeWidth="3"/><circle cx="321" cy="128" r="23" fill="#f5f2e8"/><path d="M205 71q9-17 22-4t-3 24v8m0 12v3" fill="none" stroke="#c39671" strokeWidth="5" strokeLinecap="round"/><circle cx="423" cy="237" r="21" fill="#b6c6aa"/><path d="M423 254v28" stroke="#859774" strokeWidth="5"/><circle cx="218" cy="269" r="8" fill="#d9bda1"/></svg></div>
    <div className="not-found-copy"><p className="public-eyebrow"><MapPin size={14}/> 404 · A small detour</p><h1>This page took<br/>a different turn.</h1><p>The address might have changed, or the link could be out of date. Your next room is still out there.</p><div className="not-found-actions"><Link className="public-primary" to="/explore">Explore hostels <ArrowRight size={17}/></Link><Link className="public-secondary" to="/"><ArrowLeft size={16}/> Back home</Link></div></div>
  </section>;
}
