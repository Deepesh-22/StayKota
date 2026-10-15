import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Building2, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { UserRole } from '../types';

export function LoginPage() {
  const { login, user } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredRole = (searchParams.get('role') as UserRole) || 'student';
  const redirect = searchParams.get('redirect') || '/';
  const [role, setRole] = useState<UserRole>(preferredRole === 'admin' ? 'admin' : preferredRole);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (user) {
    navigate(user.role === 'owner' ? '/owner' : user.role === 'admin' ? '/admin' : redirect);
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter an email'); return; }
    login(email.trim(), role);
    if (role === 'owner') navigate('/owner');
    else if (role === 'admin') navigate('/admin');
    else navigate(redirect);
  };

  const roles: { id: UserRole; label: string; icon: React.ReactNode }[] = [
    { id: 'student', label: 'Student', icon: <User className="w-5 h-5" /> },
    { id: 'owner', label: 'Hostel Owner', icon: <Building2 className="w-5 h-5" /> },
    { id: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">S</div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to StayKota</h1>
          <p className="text-sm text-slate-500 mt-2">Frontend prototype — simulated login only</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {roles.map(r => (
            <button key={r.id} type="button" onClick={() => setRole(r.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                role === r.id ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-100 hover:border-slate-200 text-slate-600'
              }`}>
              {r.icon}
              <span className="text-xs font-medium">{r.label}</span>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} helper="Use any email — this is a demo login" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" size="lg">Continue as {role}</Button>
        </form>
        <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
          <p className="font-medium text-slate-700 mb-1">Quick demo accounts:</p>
          <p>Student: aarav@student.com</p>
          <p>Owner: priya@owner.com</p>
          <p>Admin: admin@staykota.com</p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="text-teal-600 hover:underline">← Back to hostels</Link>
        </p>
      </Card>
    </div>
  );
}
