import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, User, LogOut, Heart, Calendar, LayoutDashboard, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMobileOpen(false); };
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">S</div>
            <div className="leading-tight">
              <span className="text-lg font-bold text-slate-900">StayKota</span>
              <span className="hidden sm:block text-[11px] text-slate-500">Student stays in Kota</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {[ ['/', 'Home'], ['/explore', 'Explore'], ['/how-it-works', 'Help'] ].map(([p, l]) => (
              <Link key={p} to={p} className={`px-3 py-2 text-sm font-medium ${isActive(p) ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'}`}>{l}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="w-3.5 h-3.5" /><span>Kota, Rajasthan</span></div>
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'student' && (<><Link to="/favourites" className="p-2 text-slate-500 hover:text-teal-700"><Heart className="w-4 h-4" /></Link><Link to="/visits" className="p-2 text-slate-500 hover:text-teal-700"><Calendar className="w-4 h-4" /></Link></>)}
                {user.role === 'owner' && <Link to="/owner"><Button variant="ghost" size="sm"><LayoutDashboard className="w-4 h-4" /> Dashboard</Button></Link>}
                {user.role === 'admin' && <Link to="/admin"><Button variant="ghost" size="sm"><Shield className="w-4 h-4" /> Admin</Button></Link>}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center"><User className="w-4 h-4 text-teal-700" /></div>
                  <span className="text-sm font-medium text-slate-800">{user.name}</span>
                  <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500" aria-label="Logout"><LogOut className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <><Link to="/login"><Button variant="outline" size="sm" className="rounded-full px-4">Log in</Button></Link>
              <Link to="/login?role=owner"><Button size="sm" className="rounded-full px-4">List your hostel</Button></Link></>
            )}
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 font-medium">Home</Link>
          <Link to="/explore" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 font-medium">Explore</Link>
          {user ? <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-red-600 font-medium">Logout</button>
            : <><Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full rounded-full">Log in</Button></Link></>}
        </div>
      )}
    </header>
  );
}
