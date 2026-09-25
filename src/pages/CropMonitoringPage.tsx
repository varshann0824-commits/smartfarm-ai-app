import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BarChart3, Bug, Camera, CloudRain, Droplets, Leaf, RefreshCw,
  ShieldAlert, Sprout, ThermometerSun, WifiOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, LoadingSpinner } from '@/components/DataBadges';
import { StaggerItem } from '@/components/ui/motion';
import { useApp } from '@/context/AppContext';
import {
  loadCropMonitoringSnapshot, RISK_LABEL, type CropMonitoringSnapshot,
  type MonitoringAssessment, type RiskLevel,
} from '@/services/cropMonitoringService';
import { subscribeToLiveSensorChanges } from '@/services/sensorIngestionService';

const riskClasses: Record<RiskLevel, string> = {
  unknown: 'bg-stone-100 text-stone-700 border-stone-200',
  low: 'bg-green-50 text-green-800 border-green-200',
  moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  severe: 'bg-red-50 text-red-800 border-red-200',
};

function RiskPill({ level }: { level: RiskLevel }) {
  return <span className={`badge border ${riskClasses[level]}`}>{RISK_LABEL[level]}</span>;
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Leaf; title: string; description: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800"><Icon className="h-5 w-5" /></span>
      <div><h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2><p className="text-sm text-ink-500">{description}</p></div>
    </div>
  );
}

function AssessmentCard({ title, icon: Icon, assessment, to }: {
  title: string;
  icon: typeof Leaf;
  assessment: MonitoringAssessment;
  to?: string;
}) {
  return (
    <article className="card-premium flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-green-800" /><h3 className="font-semibold text-ink-900">{title}</h3></div>
        <RiskPill level={assessment.level} />
      </div>
      <p className="mt-3 font-display text-base font-semibold text-ink-900">{assessment.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">{assessment.summary}</p>
      <details className="mt-4 border-t border-stone-100 pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-green-800">Why this assessment?</summary>
        <ul className="mt-2 space-y-1.5 text-xs text-ink-600">{assessment.evidence.map((item) => <li key={item}>• {item}</li>)}</ul>
      </details>
      <div className="mt-4 border-t border-stone-100 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Recommended next steps</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-700">{assessment.recommendations.map((item) => <li key={item} className="flex gap-2"><span className="text-green-700">✓</span><span>{item}</span></li>)}</ul>
      </div>
      {to && <Link to={to} className="btn btn-outline mt-5 w-full">Open {title}</Link>}
    </article>
  );
}

function MetricTile({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof Activity }) {
  return (
    <div className="card-premium">
      <div className="flex items-center gap-2 text-green-800"><Icon className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{note}</p>
    </div>
  );
}

export function CropMonitoringPage() {
  const { location, farmerDetails } = useApp();
  const [snapshot, setSnapshot] = useState<CropMonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof subscribeToLiveSensorChanges> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadCropMonitoringSnapshot({
        latitude: location.latitude,
        longitude: location.longitude,
        farmerDetails,
      });
      setSnapshot(next);
    } catch {
      setError('Crop Monitoring could not build a field snapshot. Retry without leaving this page.');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, farmerDetails]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const farmId = snapshot?.liveSensorFarmId ?? null;
    const deviceId = snapshot?.liveSensorDeviceId ?? null;
    const fieldId = snapshot?.liveSensorFieldId ?? null;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (!farmId) {
      return undefined;
    }

    const handleUpdate = () => {
      void load();
    };

    try {
      subscriptionRef.current = subscribeToLiveSensorChanges({
        farmId,
        deviceId,
        fieldId,
        onChange: handleUpdate,
      });
    } catch {
      subscriptionRef.current = null;
    }

    const pollingId = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      window.clearInterval(pollingId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [snapshot?.liveSensorFarmId, snapshot?.liveSensorDeviceId, snapshot?.liveSensorFieldId, load]);

  const generatedLabel = useMemo(() => {
    if (!snapshot) return 'Preparing…';
    return new Date(snapshot.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }, [snapshot]);
  const hasLiveWeather = !snapshot?.unavailable.some((item) => item.toLowerCase().includes('weather') || item.toLowerCase().includes('location'));

  return (
    <PageWrapper>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a12] via-[#14532d] to-[#0f766e] p-5 text-white shadow-hero sm:p-7">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[45px] border-lime-200/10" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-lime-200/25 bg-lime-200/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-lime-100">Core SmartFarm field system</span><DataBadge status={hasLiveWeather ? 'live' : 'unavailable'} /></div>
              <h1 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Crop Monitoring</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-green-50/80 sm:text-base">AI-powered field monitoring for crop condition, pest warning, irrigation decisions, environmental risk, and farmer advisory. Crop Health image analysis remains a separate, dedicated feature.</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur-sm">
              <p className="font-semibold text-lime-100">Snapshot</p><p className="mt-1 text-white/75">{generatedLabel}</p>
              <button type="button" onClick={() => void load()} disabled={loading} className="btn mt-3 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
            </div>
          </div>
        </section>

        {error ? <div className="card border-red-200 bg-red-50 text-center text-red-800"><p className="font-semibold">Unable to build this monitoring snapshot</p><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => void load()} className="btn btn-outline mt-4"><RefreshCw className="h-4 w-4" /> Retry</button></div> : loading && !snapshot ? <LoadingSpinner label="Loading field-monitoring evidence…" /> : !snapshot ? null : (
          <>
            {snapshot.unavailable.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex items-center gap-2 font-semibold"><WifiOff className="h-4 w-4" />Some evidence is unavailable</div><ul className="mt-2 list-disc space-y-1 pl-5">{snapshot.unavailable.map((item) => <li key={item}>{item}</li>)}</ul></div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricTile label="Observations · 7d" value={snapshot.analytics.observations7d} note="Saved Crop Health records" icon={BarChart3} />
              <MetricTile label="Pest signals · 30d" value={snapshot.analytics.pestSignals30d} note="Records containing pest terms" icon={Bug} />
              <MetricTile label="Disease signals · 30d" value={snapshot.analytics.diseaseSignals30d} note="Records containing disease terms" icon={ShieldAlert} />
              <MetricTile label="Field tasks" value={snapshot.upcomingTasks.length} note="Upcoming saved tasks" icon={Sprout} />
            </div>

            <StaggerItem index={1}><section className="card-premium"><SectionHeading icon={Leaf} title="Crop Health Monitoring" description="Saved field observations, crop growth context, and early-stress decisions." /><AssessmentCard title="Crop Health" icon={Leaf} assessment={snapshot.cropStatus} to="/crop-health" /></section></StaggerItem>

            <section className="grid gap-5 md:grid-cols-2">
              <StaggerItem index={2}><AssessmentCard title="Pest detection & early warning" icon={Bug} assessment={snapshot.pestRisk} /></StaggerItem>
              <StaggerItem index={3}><AssessmentCard title="Smart irrigation management" icon={Droplets} assessment={snapshot.waterStress} /></StaggerItem>
            </section>

            <StaggerItem index={4}>
              <section className="card-premium">
                <SectionHeading icon={ThermometerSun} title="Environmental Risk Monitoring" description="Heat, drought, excess rain, flood, humidity, and official warning signals for the field area." />
                {snapshot.environment.risks.length ? <div className="grid gap-3 sm:grid-cols-2">{snapshot.environment.risks.map((risk) => <div key={`${risk.id}-${risk.label}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-ink-900">{risk.label}</p><RiskPill level={risk.level} /></div><p className="mt-1 text-sm text-ink-600">{risk.detail}</p><p className="mt-2 text-xs font-semibold text-green-800">{risk.recommendation}</p></div>)}</div> : <p className="text-sm text-ink-600">{snapshot.environment.headline}. No environmental signal is available from the current weather data.</p>}
              </section>
            </StaggerItem>

            <StaggerItem index={5}>
              <section className="card-premium">
                <SectionHeading icon={Activity} title="Farmer Advisory" description="Action-first messages grounded only in the evidence shown on this page." />
                <div className="grid gap-3 sm:grid-cols-2">{snapshot.advisories.map((advisory) => <article key={advisory.id} className="rounded-xl border border-green-100 bg-green-50/70 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-ink-900">{advisory.title}</h3><RiskPill level={advisory.level} /></div><p className="mt-2 text-sm font-bold text-green-800">{advisory.action}</p><p className="mt-1 text-sm text-ink-600">{advisory.detail}</p></article>)}</div>
              </section>
            </StaggerItem>

            <StaggerItem index={6}>
              <section className="card-premium">
                <SectionHeading icon={CloudRain} title="Connected Evidence & Future Edge AI" description="The current web app uses saved observations and weather services. No sensor or edge-hardware reading is fabricated." />
                <div className="grid gap-3 sm:grid-cols-2">{snapshot.measurements.map((measurement) => <div key={measurement.label} className={`rounded-xl border p-3 ${measurement.measured ? 'border-green-200 bg-green-50' : 'border-stone-200 bg-stone-50'}`}><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{measurement.label}</p><p className="mt-1 font-semibold text-ink-900">{measurement.value}</p><p className="mt-1 text-xs text-ink-500">{measurement.note}</p></div>)}</div>
                <div className="mt-4 rounded-xl border border-dashed border-teal-300 bg-teal-50 p-4"><div className="flex items-start gap-3"><Camera className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-800" /><div><h3 className="font-semibold text-teal-950">Edge-AI integration concept</h3><p className="mt-1 text-sm leading-relaxed text-teal-900">A future field camera plus on-device environmental sensors can provide continuous pest, disease, soil-moisture, temperature, and humidity observations. This web app does not claim those devices are installed or connected.</p></div></div></div>
                <p className="mt-3 text-xs text-ink-500">Evidence: {snapshot.sourceNote}</p>
              </section>
            </StaggerItem>

            <StaggerItem index={7}>
              <section className="card-premium">
                <SectionHeading icon={BarChart3} title="Farm Analytics" description="Historical decision support from observations and tasks that already exist in SmartFarm AI." />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricTile label="All observations" value={snapshot.analytics.totalObservations} note="Saved Crop Health history" icon={BarChart3} />
                  <MetricTile label="30d observations" value={snapshot.analytics.observations30d} note="Recent field evidence" icon={Activity} />
                  <MetricTile label="Healthy signals" value={snapshot.analytics.healthyObservations30d} note="Records reporting normal/healthy" icon={Leaf} />
                  <MetricTile label="Soil profile" value={snapshot.soil?.soilType || 'Not recorded'} note="Farmer-entered soil test, not moisture" icon={Sprout} />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div><h3 className="text-sm font-semibold text-ink-900">Recent observations</h3>{snapshot.recentObservations.length ? <div className="mt-2 space-y-2">{snapshot.recentObservations.map((record) => <div key={record.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-ink-900">{record.problem}</p><span className="text-xs text-ink-500">{record.crop}</span></div><p className="mt-1 text-xs text-ink-500">{new Date(record.created_at).toLocaleDateString('en-IN')}</p></div>)}</div> : <p className="mt-2 text-sm text-ink-500">No saved observations. Use Crop Health to analyze a current image.</p>}</div>
                  <div><h3 className="text-sm font-semibold text-ink-900">Upcoming field tasks</h3>{snapshot.upcomingTasks.length ? <div className="mt-2 space-y-2">{snapshot.upcomingTasks.map((task) => <div key={task.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3"><p className="font-semibold text-ink-900">{task.title}</p><p className="mt-1 text-xs text-ink-500">{new Date(`${task.task_date}T${task.task_time || '00:00'}:00`).toLocaleString('en-IN')}</p></div>)}</div> : <p className="mt-2 text-sm text-ink-500">No upcoming saved tasks.</p>}</div>
                </div>
                {(snapshot.commonPests.length > 0 || snapshot.commonDiseases.length > 0 || snapshot.calendar.length > 0) && <div className="mt-5 grid gap-4 border-t border-stone-100 pt-4 md:grid-cols-3"><div><h3 className="text-sm font-semibold text-ink-900">Pest watch-list</h3><p className="mt-1 text-sm text-ink-600">{snapshot.commonPests.join(', ') || 'No crop-specific watch-list available.'}</p></div><div><h3 className="text-sm font-semibold text-ink-900">Disease watch-list</h3><p className="mt-1 text-sm text-ink-600">{snapshot.commonDiseases.join(', ') || 'No crop-specific watch-list available.'}</p></div><div><h3 className="text-sm font-semibold text-ink-900">Crop calendar</h3><p className="mt-1 text-sm text-ink-600">{snapshot.calendar.map((entry) => entry.season).join(' · ') || 'No calendar reference for this crop.'}</p></div></div>}
              </section>
            </StaggerItem>


          </>
        )}
      </div>
    </PageWrapper>
  );
}

