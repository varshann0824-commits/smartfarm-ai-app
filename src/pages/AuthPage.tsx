import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, LogIn, Mail, Sprout } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate('/dashboard', { replace: true });
  }, [loading, navigate, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password);
        navigate(typeof location.state?.from === 'string' ? location.state.from : '/dashboard', { replace: true });
      } else {
        const result = await signUp(email.trim(), password);
        setMessage(result.needsEmailConfirmation ? 'Check your email to confirm your account, then sign in.' : 'Account created.');
        if (!result.needsEmailConfirmation) navigate('/dashboard', { replace: true });
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101a12] px-6 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-[#14532d] to-[#0f766e]" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-6 shadow-hero sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-950">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-700 text-white"><Sprout className="h-7 w-7" /></div>
          <div><p className="font-display text-xl font-bold text-ink-900">SmartFarm AI</p><p className="text-sm text-ink-500">Secure farm data access</p></div>
        </div>
        <h1 className="mt-8 font-display text-2xl font-bold text-ink-900">{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">Use your Supabase Auth account to access farm-owned sensor data.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-ink-800">Email
            <span className="mt-1 flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 focus-within:border-green-600">
              <Mail className="h-4 w-4 text-ink-400" />
              <input className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </span>
          </label>
          <label className="block text-sm font-semibold text-ink-800">Password
            <input className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm outline-none focus:border-green-600" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full"><LogIn className="h-4 w-4" />{busy ? 'Please wait...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
        </form>

        <button type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null); setMessage(null); }} className="mt-5 w-full text-center text-sm font-semibold text-green-800 hover:text-green-950">
          {mode === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>
    </main>
  );
}
