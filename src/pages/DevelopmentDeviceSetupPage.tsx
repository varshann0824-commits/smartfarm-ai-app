import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getFarmSetupErrorDetails, type FarmSetupErrorDetails } from '@/services/farmSetupService';
import { createDevelopmentDevice, DEVELOPMENT_FIELD_ID, type DeviceRecord } from '@/services/deviceSetupService';

export function DevelopmentDeviceSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const [deviceUid, setDeviceUid] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [device, setDevice] = useState<DeviceRecord | null>(null);
  const [created, setCreated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FarmSetupErrorDetails | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDevice(null);
    setCreated(false);
    try {
      const result = await createDevelopmentDevice({
        device_uid: deviceUid,
        name: deviceName,
        device_type: deviceType,
        firmware_version: firmwareVersion,
      });
      setDevice(result.device);
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
        <Link to="/dev/field-setup" className="inline-flex items-center gap-2 text-sm font-semibold text-green-800 hover:text-green-950">
          <ArrowLeft className="h-4 w-4" /> Back to Field Setup
        </Link>
        <section className="card-premium mt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-800"><Cpu className="h-5 w-5" /></span>
            <div>
              <p className="text-eyebrow">Development setup</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">Register One Device</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">Register the real device that will belong to this field. Enter a prototype UID such as ESP32-SF001 only when you explicitly choose it; no UID is generated automatically.</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-ink-700">
            <p><strong>Authenticated account:</strong> {authLoading ? 'Checking...' : user?.email ?? 'Not signed in'}</p>
            <p className="mt-1 break-all"><strong>Field ID:</strong> {DEVELOPMENT_FIELD_ID}</p>
            <p className="mt-1"><strong>Sensor pipeline:</strong> sensors and readings are not created by this page.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-ink-800">Device UID
              <input className="input-field mt-1" value={deviceUid} onChange={(event) => setDeviceUid(event.target.value)} placeholder="Enter the real ESP32/device identifier" required disabled={!user || busy} />
              <span className="mt-1 block text-xs font-normal text-ink-500">A manually entered prototype UID is allowed. Do not use a guessed or generated UID.</span>
            </label>
            <label className="block text-sm font-semibold text-ink-800">Device name <span className="font-normal text-ink-500">(optional)</span>
              <input className="input-field mt-1" value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="e.g., North field node" disabled={!user || busy} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Device type
              <input className="input-field mt-1" value={deviceType} onChange={(event) => setDeviceType(event.target.value)} placeholder="e.g., ESP32 sensor node" required disabled={!user || busy} />
            </label>
            <label className="block text-sm font-semibold text-ink-800">Firmware version <span className="font-normal text-ink-500">(optional)</span>
              <input className="input-field mt-1" value={firmwareVersion} onChange={(event) => setFirmwareVersion(event.target.value)} placeholder="Enter only if known" disabled={!user || busy} />
            </label>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"><p className="font-semibold">Device setup failed</p><dl className="mt-2 space-y-1 font-mono text-xs"><div><dt className="inline font-semibold">message: </dt><dd className="inline break-words">{error.message}</dd></div><div><dt className="inline font-semibold">code: </dt><dd className="inline">{error.code ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">details: </dt><dd className="inline break-words">{error.details ?? 'not provided'}</dd></div><div><dt className="inline font-semibold">hint: </dt><dd className="inline break-words">{error.hint ?? 'not provided'}</dd></div></dl></div>}
            <button type="submit" disabled={!user || authLoading || busy} className="btn btn-primary w-full sm:w-auto">{busy ? 'Registering device...' : 'Register One Device'}</button>
          </form>

          {device && <div role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> {created ? 'Device registered' : 'Existing device reused'}</div><p className="mt-2 break-all font-mono text-xs"><strong>device_id:</strong> {device.id}</p><p className="mt-1 break-all font-mono text-xs"><strong>device_uid:</strong> {device.device_uid}</p><p className="mt-3">No sensor or sensor reading was created.</p></div>}
        </section>
      </div>
    </main>
  );
}
