import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Heart, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Brand } from './Brand';
export function Navbar() {
  const { user, logout } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  const dashboard = user?.role === 'owner' ? '/owner' : user?.role === 'admin' ? '/admin' : '/dashboard';
  return <header className="sk-header"><div className="sk-header__inner"><Brand />
    <nav className="sk-desktop-nav" aria-label="Main navigation"><NavLink to="/explore">Explore hostels</NavLink><NavLink to="/map">Explore Kota</NavLink><NavLink to="/how-it-works">How it works</NavLink><Link to="/explore?category=girls">For her</Link></nav>
    <div className="sk-header__actions"><span className="sk-location-dot">Kota, Rajasthan</span>{user ? <><Link to={dashboard} className="sk-account-link"><UserRound size={17} /><span>{user.name.split(' ')[0]}</span></Link><button type="button" className="sk-icon-button" onClick={logout} aria-label="Log out"><LogOut size={17}/></button></> : <Link to="/login" className="sk-login-link">Log in</Link>}<Link to="/login?role=owner" className="sk-owner-link">List your hostel <ArrowUpRight size={15}/></Link></div>
    <button type="button" className="sk-mobile-menu sk-icon-button" onClick={() => setOpen(x => !x)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={23}/> : <Menu size={23}/>}</button>
    {open && <nav id="mobile-navigation" className="sk-mobile-nav" aria-label="Mobile navigation"><NavLink to="/explore">Explore hostels</NavLink><NavLink to="/map">Explore Kota</NavLink><NavLink to="/how-it-works">How it works</NavLink><Link to="/dashboard?tab=saved"><Heart size={17}/> Saved hostels</Link>{user ? <><Link to={dashboard}>Your workspace</Link><button type="button" onClick={() => { logout(); setOpen(false); }}>Log out</button></> : <Link to="/login">Log in</Link>}<Link to="/login?role=owner">List your hostel <ArrowUpRight size={16}/></Link></nav>}
  </div></header>;
}
