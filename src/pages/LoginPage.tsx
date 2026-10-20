import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Check, Calendar, Heart, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import type { UserRole } from '../types';
import '../styles/public-support.css';

type AuthStep = 'phone' | 'otp' | 'loading' | 'success';

const DEMO_OTP = '4242'; // clearly labelled demo code

export function LoginPage() {
  const { login, user } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredRole = (searchParams.get('role') as UserRole) || 'student';
  const requestedRedirect = searchParams.get('redirect') || '/';
  const redirect = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\') ? requestedRedirect : '/';
  const showAdmin = searchParams.get('admin') === '1' || preferredRole === 'admin';

  const [role, setRole] = useState<UserRole>(
    preferredRole === 'admin' && showAdmin ? 'admin' : preferredRole === 'owner' ? 'owner' : 'student'
  );
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<AuthStep>('phone');
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (user) {
      const dest =
        user.role === 'owner' ? '/owner' :
        user.role === 'admin' ? '/admin' :
        redirect;
      navigate(dest, { replace: true });
    }
  }, [user, navigate, redirect]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const roleTabs: { id: UserRole; label: string }[] = [
    { id: 'student', label: 'Student' },
    { id: 'owner', label: 'Owner' },
    ...(showAdmin ? [{ id: 'admin' as UserRole, label: 'Admin' }] : []),
  ];

  const validatePhone = (p: string) => p.replace(/\D/g, '').length === 10;

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!validatePhone(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setStep('loading');
    setTimeout(() => {
      setStep('otp');
      setResendIn(24);
      setOtp(['', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }, 700);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const next = ['', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  const completeLogin = (identifier: string) => {
    setStep('loading');
    setTimeout(() => {
      const emailLike =
        identifier.includes('@')
          ? identifier
          : `${identifier.replace(/\D/g, '')}@demo.staykota.local`;
      login(emailLike, role);
      setStep('success');
      setTimeout(() => {
        if (role === 'owner') navigate('/owner');
        else if (role === 'admin') navigate('/admin');
        else navigate(redirect || '/');
      }, 600);
    }, 500);
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== 4) {
      setError('Enter the 4-digit OTP');
      return;
    }
    completeLogin(phone);
  };

  const handleGoogleDemo = () => {
    setError('');
    setStep('loading');
    setTimeout(() => {
      login(`google-${role}@demo.staykota.local`, role);
      setStep('success');
      setTimeout(() => {
        if (role === 'owner') navigate('/owner');
        else if (role === 'admin') navigate('/admin');
        else navigate(redirect || '/');
      }, 500);
    }, 600);
  };

  const subtitle =
    role === 'owner'
      ? 'Log in to manage listings and visit requests.'
      : role === 'admin'
        ? 'Admin access is restricted. Demo login only.'
        : 'Log in to save hostels and track visit requests.';

  return (
    <div className="login-page min-h-[calc(100vh-4rem)] bg-[#faf8f5] flex items-center justify-center px-4 py-10 animate-fade-in">
      <div className="login-shell w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-white">
        <div className="login-art-panel relative hidden lg:flex flex-col justify-between">
          <Link to="/" className="login-brand inline-flex items-center gap-2.5 self-start"><div className="w-9 h-9 flex items-center justify-center font-bold text-white">S</div><span className="font-semibold text-lg">StayKota</span></Link>
          <div>
            <p className="public-eyebrow mb-4">Same city. Bigger dreams.</p>
            <h2>Your next chapter<br/>starts close by.</h2>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">A room near your coaching. A little space to make your own. Find your starting point in Kota.</p>
            <svg className="login-scene" viewBox="0 0 420 230" aria-hidden="true"><ellipse cx="208" cy="191" rx="174" ry="25" fill="#dce4d2"/><path d="M32 168 147 120 251 171 379 106" fill="none" stroke="#fffdf5" strokeWidth="24"/><path d="M32 168 147 120 251 171 379 106" fill="none" stroke="#b8c4ac" strokeWidth="2" strokeDasharray="6 8"/><g><path d="m85 92 59-28 61 28v82l-61 28-59-28z" fill="#e4cfaf"/><path d="m144 120 61-28v82l-61 28z" fill="#c9b38f"/><path d="m85 92 59-28 61 28-61 28z" fill="#fff7e7"/><path d="m102 109 12 6v14l-12-6m24-2 12 6v14l-12-6m-24 5 12 6v14l-12-6m24-2 12 6v14l-12-6" fill="#9eac99"/><path d="m159 130 13-6v15l-13 6m15-23 13-6v15l-13 6m-28 16 13-6v15l-13 6m15-23 13-6v15l-13 6" fill="#8d9e85"/></g><path d="M289 39c-25 0-42 18-42 40 0 29 42 64 42 64s42-35 42-64c0-22-17-40-42-40" fill="#0f766e"/><circle cx="289" cy="78" r="13" fill="#fffdf5"/><path d="m262 145 25-12 27 12v41l-27 12-25-12z" fill="#d3bea1"/><path d="m287 157 27-12v41l-27 12z" fill="#bda480"/><circle cx="61" cy="124" r="17" fill="#b4c5a1"/><path d="M61 137v24" stroke="#8b9d78" strokeWidth="5"/><circle cx="356" cy="148" r="22" fill="#acbd98"/><path d="M356 167v26" stroke="#8b9d78" strokeWidth="5"/><path d="m218 56 4 7 7 2-7 3-4 7-3-7-7-3 7-2z" fill="#c9986f"/></svg>
            <div className="login-benefits"><span><Check size={12}/> Clear room costs</span><span><Heart size={12}/> Your shortlist</span><span><Calendar size={12}/> Plan a visit</span></div>
          </div>
          <p className="login-reassurance">Frontend preview · all listings are sample content.<br/>Demo login saves your session on this device. No real SMS is sent.</p>
        </div>

        {/* Right panel */}
        <div className="login-form-panel p-8 sm:p-10 flex flex-col justify-center">
          <div className="login-mobile-brand lg:hidden mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className="font-semibold text-slate-900">StayKota</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'signup' ? 'Create a demo account' : 'Make yourself at home.'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

          <div className="login-role-tabs mt-6 inline-flex p-1 rounded-full bg-slate-100 self-start" role="group" aria-label="Choose your role">
            {roleTabs.map(r => (
              <button
                key={r.id}
                type="button"
                disabled={step === 'loading'}
                aria-pressed={role === r.id}
                onClick={() => {
                  setRole(r.id);
                  setError('');
                  setStep('phone');
                  setOtp(['', '', '', '']);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  role === r.id ? 'selected bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {role === 'admin' && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Admin has no public signup. This is a demo-only entry for the prototype.</span>
            </div>
          )}

          <p className="login-demo-note mt-4 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            Demo auth: enter any 10-digit number, then OTP <strong className="text-slate-600">{DEMO_OTP}</strong> (or any 4 digits).
            No real SMS is sent.
          </p>

          {step === 'success' ? (
            <div className="mt-10 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-900">You're in</p>
              <p className="text-sm text-slate-500 mt-1">Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={step === 'otp' ? handleVerifyOtp : handleSendOtp} className="mt-6 space-y-5">
              <div>
                <label htmlFor="login-phone" className="block text-sm font-medium text-slate-700 mb-1.5">Mobile number</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-shadow">
                  <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-slate-200 select-none">+91</span>
                  <input
                    id="login-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98290 12345"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                      if (step === 'otp') setStep('phone');
                    }}
                    disabled={step === 'loading'}
                    className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50"
                    autoComplete="tel-national"
                    aria-invalid={Boolean(error)}
                    aria-describedby="login-error"
                  />
                </div>
              </div>

              {(step === 'otp' || (step === 'loading' && otp.some(Boolean))) && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">OTP</label>
                  <div className="flex gap-2.5" onPaste={handleOtpPaste}>
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        disabled={step === 'loading'}
                        className={`w-12 h-12 text-center text-lg font-semibold rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                          d ? 'border-teal-500 text-slate-900' : 'border-slate-200 text-slate-400'
                        }`}
                        aria-label={`OTP digit ${i + 1}`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {resendIn > 0 ? (
                      <>Demo code ready · Try again in {resendIn}s</>
                    ) : (
                      <button type="button" onClick={() => handleSendOtp()} className="text-teal-700 font-medium hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </p>
                </div>
              )}

              <p id="login-error" className="text-sm text-red-600" role="alert">{error}</p>

              <Button type="submit" className="w-full rounded-xl" size="lg" loading={step === 'loading'} disabled={step === 'loading'}>
                {step === 'otp' || (step === 'loading' && otp.some(Boolean)) ? 'Verify & log in' : 'Send OTP'}
              </Button>

              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleDemo}
                disabled={step === 'loading'}
                className="login-google w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Try Google demo
              </button>
              <button
                type="button"
                disabled={step === 'loading'}
                onClick={() => completeLogin(role === 'student' ? 'aarav@student.com' : role === 'owner' ? 'priya@owner.com' : 'admin@staykota.com')}
                className="w-full py-2 text-xs font-semibold text-teal-700 hover:underline disabled:opacity-50"
              >
                Use sample {role} account
              </button>
            </form>
          )}

          <p className="login-legal mt-6 text-center leading-relaxed">
            This preview uses browser storage. Please use sample details.<br/>
            <Link to="/how-it-works">Learn how this demo works</Link>
          </p>

          <p className="mt-4 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                Need an owner listing account?{' '}
                <button type="button" onClick={() => { setRole('owner'); setMode('signup'); setStep('phone'); }} className="text-teal-700 font-medium hover:underline">
                  Sign up as owner
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setStep('phone'); }} className="text-teal-700 font-medium hover:underline">
                  Log in
                </button>
              </>
            )}
          </p>

          <p className="mt-3 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-teal-700">← Back to hostels</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
