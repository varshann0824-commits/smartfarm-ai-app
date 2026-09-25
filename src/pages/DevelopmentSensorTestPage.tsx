import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Database, LoaderCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabaseClient';
import { DevelopmentSensorTestError, runDevelopmentSensorRoundTrip, type DevelopmentSensorRoundTripResult } from '@/services/sensorIngestionService';

interface SessionDiagnostic {
  status: 'checking' | 'available' | 'none' | 'error';
  userEmail: string | null;
  hasAccessToken: boolean;
  error: string | null;
}

export function DevelopmentSensorTestPage() {
  const { user, loading: authLoading } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DevelopmentSensorRoundTripResult | null>(null);
  const [error, setError] = useState<DevelopmentSensorTestError | null>(null);
  const [sessionDiagnostic, setSessionDiagnostic] = useState<SessionDiagnostic>({
    status: 'checking',
    userEmail: null,
    hasAccessToken: false,
    error: null,
  });

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setSessionDiagnostic({ status: 'error', userEmail: null, hasAccessToken: false, error: sessionError.message });
          return;
        }
        setSessionDiagnostic({
          status: data.session ? 'available' : 'none',
          userEmail: data.session?.user.email ?? null,
          hasAccessToken: Boolean(data.session?.access_token),
          error: null,
        });
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setSessionDiagnostic({
          status: 'error',
          userEmail: null,
          hasAccessToken: false,
          error: sessionError instanceof Error ? sessionError.message : 'Could not read Supabase session.',
        });
      });
    return () => { active = false; };
  }, [user]);

  async function runTest() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      setResult(await runDevelopmentSensorRoundTrip());
    } catch (testError) {
      setError(testError instanceof DevelopmentSensorTestError
        ? testError
        : new DevelopmentSensorTestError('unknown', testError));
    } finally {
      setRunning(false);
    }
  }

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <main className="min-h-screen bg-stone-100 px-5 py-8 pb-nav">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-950">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <section className="card-premium mt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800"><Database className="h-5 w-5" /></span>
            <div>
              <p className="text-eyebrow">Development only</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">Sensor database round trip</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">This manually invoked test uses the current authenticated session, finds an owned farm and device, inserts one marked reading, and reads that exact row back.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-ink-700">
            <p><strong>Session:</strong> {authLoading ? 'Checking...' : user ? `Authenticated as ${user.email ?? user.id}` : 'No authenticated user'}</p>
            <p className="mt-1"><strong>Database write:</strong> One row only, with <code>data_source = development_test</code></p>
          </div>
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
            <p className="font-semibold">Session diagnostic</p>
            <p className="mt-1"><strong>Browser origin:</strong> {window.location.origin}</p>
            <p className="mt-1"><strong>Supabase getSession():</strong> {sessionDiagnostic.status}</p>
            <p className="mt-1"><strong>getSession user:</strong> {sessionDiagnostic.userEmail ?? 'none'}</p>
            <p className="mt-1"><strong>Access token present:</strong> {sessionDiagnostic.hasAccessToken ? 'YES' : 'NO'}</p>
            <p className="mt-1"><strong>AuthContext user:</strong> {user?.email ?? 'none'}</p>
            {sessionDiagnostic.error && <p className="mt-1 text-red-800"><strong>Session error:</strong> {sessionDiagnostic.error}</p>}
          </div>

          <button type="button" onClick={() => void runTest()} disabled={authLoading || !user || running} className="btn btn-primary mt-6 w-full sm:w-auto">
            {running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            {running ? 'Running test...' : 'Run one database round trip'}
          </button>

          {error && <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" /><div><p className="font-semibold">Test stopped or failed</p><dl className="mt-2 space-y-1 font-mono text-xs"><div><dt className="inline font-semibold">operation: </dt><dd className="inline">{error.operation}</dd></div><div><dt className="inline font-semibold">message: </dt><dd className="inline break-words">{error.message}</dd></div><div><dt className="inline font-semibold">code: </dt><dd className="inline">{error.code ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">details: </dt><dd className="inline break-words">{error.details ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">hint: </dt><dd className="inline break-words">{error.hint ?? 'not provided'}</dd></div></dl></div></div>}
          {result && <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> Round trip verified</div><dl className="mt-3 space-y-1 font-mono text-xs"><div><dt className="inline font-semibold">farm_id: </dt><dd className="inline break-all">{result.farmId}</dd></div><div><dt className="inline font-semibold">device_id: </dt><dd className="inline break-all">{result.deviceId}</dd></div><div><dt className="inline font-semibold">reading_id: </dt><dd className="inline break-all">{result.verified.id}</dd></div><div><dt className="inline font-semibold">data_source: </dt><dd className="inline">{result.verified.data_source}</dd></div><div><dt className="inline font-semibold">verified_temperature: </dt><dd className="inline">{result.verified.temperature ?? 'null'}</dd></div></dl><p className="mt-3">The inserted row was read back successfully through the authenticated Supabase client.</p></div>}
        </section>
      </div>
    </main>
  );
}
