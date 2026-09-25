import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createCurrentUserFarm, getFarmSetupErrorDetails, type FarmRecord, type FarmSetupErrorDetails } from '@/services/farmSetupService';

function optionalNumber(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid number.`);
  return parsed;
}

export function DevelopmentFarmSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [soilType, setSoilType] = useState('');
  const [farm, setFarm] = useState<FarmRecord | null>(null);
  const [created, setCreated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FarmSetupErrorDetails | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFarm(null);
    setCreated(false);
    try {
      const record = await createCurrentUserFarm({
        name,
        location_name: locationName,
        latitude: optionalNumber(latitude, 'Latitude'),
        longitude: optionalNumber(longitude, 'Longitude'),
        area_acres: optionalNumber(areaAcres, 'Area'),
        soil_type: soilType,
      });
      setFarm(record);
      setCreated(true);
    } catch (setupError) {
      setError(getFarmSetupErrorDetails(setupError));
    } finally {
      setBusy(false);
    }
  }

  if (!import.meta.env.DEV) return null;

  return (
    <main className="min-h-screen bg-stone-100 px-5 py-8 pb-nav">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-950">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <section className="card-premium mt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800"><Sprout className="h-5 w-5" /></span>
            <div>
              <p className="text-eyebrow">Development setup</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">Create My Farm</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">This creates one farm owned by your authenticated Supabase account. Existing farms are reused and never duplicated.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-ink-700">
            <p><strong>Authenticated account:</strong> {authLoading ? 'Checking...' : user?.email ?? 'Not signed in'}</p>
            <p className="mt-1"><strong>Next step:</strong> fields and devices are not created by this page.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-ink-800">Farm name
              <input className="input-field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g., My Family Farm" required disabled={!user || busy} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Location name <span className="font-normal text-ink-500">(optional)</span>
              <input className="input-field mt-1" value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Enter a place name" disabled={!user || busy} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-800">Latitude <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" type="number" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Do not guess" disabled={!user || busy} />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Longitude <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" type="number" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Do not guess" disabled={!user || busy} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-800">Area in acres <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" type="number" min="0" step="any" value={areaAcres} onChange={(event) => setAreaAcres(event.target.value)} placeholder="e.g., 2.5" disabled={!user || busy} />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Soil type <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" value={soilType} onChange={(event) => setSoilType(event.target.value)} placeholder="Enter only if known" disabled={!user || busy} />
              </label>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"><p className="font-semibold">Farm setup failed</p><dl className="mt-2 space-y-1 font-mono text-xs"><div><dt className="inline font-semibold">message: </dt><dd className="inline break-words">{error.message}</dd></div><div><dt className="inline font-semibold">code: </dt><dd className="inline">{error.code ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">details: </dt><dd className="inline break-words">{error.details ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">hint: </dt><dd className="inline break-words">{error.hint ?? 'not provided'}</dd></div></dl></div>}
            <button type="submit" disabled={!user || authLoading || busy} className="btn btn-primary w-full sm:w-auto">{busy ? 'Saving farm...' : 'Create My Farm'}</button>
          </form>

          {created && farm && <div role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> Farm is available for this account</div><p className="mt-2">{farm.created_at === farm.updated_at ? 'A farm record was created or found.' : 'An existing farm record was reused.'}</p><p className="mt-2 break-all font-mono text-xs"><strong>farm_id:</strong> {farm.id}</p><p className="mt-3">No field, device, sensor, or sensor reading was created.</p></div>}
        </section>
      </div>
    </main>
  );
}
