import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getFarmSetupErrorDetails, type FarmSetupErrorDetails } from '@/services/farmSetupService';
import { createDevelopmentField, DEVELOPMENT_FARM_ID, type FieldRecord } from '@/services/fieldSetupService';

function optionalArea(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const area = Number(trimmed);
  if (!Number.isFinite(area) || area < 0) throw new Error('Area in acres must be a valid non-negative number.');
  return area;
}

export function DevelopmentFieldSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [expectedHarvest, setExpectedHarvest] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [field, setField] = useState<FieldRecord | null>(null);
  const [created, setCreated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FarmSetupErrorDetails | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setField(null);
    setCreated(false);
    try {
      const result = await createDevelopmentField({
        name,
        crop_name: cropName,
        crop_variety: cropVariety,
        area_acres: optionalArea(areaAcres),
        sowing_date: sowingDate,
        expected_harvest: expectedHarvest,
        growth_stage: growthStage,
      });
      setField(result.field);
      setCreated(result.created);
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
        <Link to="/dev/farm-setup" className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-950">
          <ArrowLeft className="h-4 w-4" /> Back to Farm Setup
        </Link>
        <section className="card-premium mt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800"><Sprout className="h-5 w-5" /></span>
            <div>
              <p className="text-eyebrow">Development setup</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">Create One Field</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">The authenticated account and farm are verified first. An existing field is reused; devices, sensors, and readings are not created here.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-ink-700">
            <p><strong>Authenticated account:</strong> {authLoading ? 'Checking...' : user?.email ?? 'Not signed in'}</p>
            <p className="mt-1 break-all"><strong>Farm ID:</strong> {DEVELOPMENT_FARM_ID}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-ink-800">Field name
              <input className="input-field mt-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter the real field name" required disabled={!user || busy} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Crop name
              <input className="input-field mt-1" value={cropName} onChange={(event) => setCropName(event.target.value)} placeholder="Enter the crop actually planted" required disabled={!user || busy} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Crop variety <span className="font-normal text-ink-500">(optional)</span>
              <input className="input-field mt-1" value={cropVariety} onChange={(event) => setCropVariety(event.target.value)} placeholder="Enter only if known" disabled={!user || busy} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-800">Area in acres <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" type="number" min="0" step="any" value={areaAcres} onChange={(event) => setAreaAcres(event.target.value)} placeholder="Enter the real area" disabled={!user || busy} />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Growth stage <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" value={growthStage} onChange={(event) => setGrowthStage(event.target.value)} placeholder="Enter only if known" disabled={!user || busy} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-800">Sowing date <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" type="date" value={sowingDate} onChange={(event) => setSowingDate(event.target.value)} disabled={!user || busy} />
              </label>
              <label className="block text-sm font-semibold text-ink-800">Expected harvest date <span className="font-normal text-ink-500">(optional)</span>
                <input className="input-field mt-1" type="date" value={expectedHarvest} onChange={(event) => setExpectedHarvest(event.target.value)} disabled={!user || busy} />
              </label>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"><p className="font-semibold">Field setup failed</p><dl className="mt-2 space-y-1 font-mono text-xs"><div><dt className="inline font-semibold">message: </dt><dd className="inline break-words">{error.message}</dd></div><div><dt className="inline font-semibold">code: </dt><dd className="inline">{error.code ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">details: </dt><dd className="inline break-words">{error.details ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">hint: </dt><dd className="inline break-words">{error.hint ?? 'not provided'}</dd></div></dl></div>}
            <button type="submit" disabled={!user || authLoading || busy} className="btn btn-primary w-full sm:w-auto">{busy ? 'Saving field...' : 'Create One Field'}</button>
          </form>

          {field && <div role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> {created ? 'Field created' : 'Existing field reused'}</div><p className="mt-2 break-all font-mono text-xs"><strong>field_id:</strong> {field.id}</p><p className="mt-3">No device, sensor, or sensor reading was created.</p></div>}
        </section>
      </div>
    </main>
  );
}
