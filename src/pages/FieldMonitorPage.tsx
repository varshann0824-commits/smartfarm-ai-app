import { useEffect, useMemo, useRef, useState } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  MapPinned,
  Radio,
  ScanLine,
  ShieldAlert,
  Thermometer,
  Upload,
  Wifi,
  WifiOff,
  Wind,
  X,
  Zap,
} from 'lucide-react';

type Sensor = { label: string; value: string; unit: string; status: 'good' | 'watch'; icon: typeof Droplets; color: string; track: string; fill: string };

const sensors: Sensor[] = [
  { label: 'Soil moisture', value: '34', unit: '%', status: 'watch', icon: Droplets, color: 'text-sky-700', track: 'bg-sky-100', fill: 'bg-sky-500' },
  { label: 'Soil temperature', value: '24.8', unit: '°C', status: 'good', icon: Thermometer, color: 'text-orange-700', track: 'bg-orange-100', fill: 'bg-orange-500' },
  { label: 'Air humidity', value: '68', unit: '%', status: 'good', icon: Wind, color: 'text-teal-700', track: 'bg-teal-100', fill: 'bg-teal-500' },
  { label: 'Leaf wetness', value: '12', unit: '%', status: 'good', icon: Leaf, color: 'text-brand-700', track: 'bg-brand-100', fill: 'bg-brand-600' },
];

const risks = [
  { tone: 'amber', icon: Droplets, title: 'Irrigation window opens soon', note: 'Moisture is below the 40% target in North Field.', time: 'Now' },
  { tone: 'red', icon: ShieldAlert, title: 'Early blight pattern detected', note: 'Review the tomato row near the east boundary.', time: '8m ago' },
  { tone: 'sky', icon: CloudRain, title: 'Rain probability rising', note: 'Postpone foliar spray if rain exceeds 45%.', time: '24m ago' },
];

function statusTone(tone: string) {
  return tone === 'red'
    ? { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-100 text-red-700', title: 'text-red-900' }
    : tone === 'sky'
      ? { bg: 'bg-sky-50', border: 'border-sky-100', icon: 'bg-sky-100 text-sky-700', title: 'text-sky-900' }
      : { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'bg-amber-100 text-amber-700', title: 'text-amber-900' };
}

function FieldMap() {
  return (
    <div className="relative min-h-[258px] overflow-hidden rounded-2xl border border-emerald-200/70 bg-[#dcebd7]" aria-label="Live field map">
      <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'linear-gradient(22deg, transparent 46%, rgba(57,114,62,.22) 47%, transparent 49%), linear-gradient(112deg, transparent 45%, rgba(57,114,62,.14) 46%, transparent 48%)', backgroundSize: '74px 58px' }} />
      <div className="absolute -left-8 top-12 h-40 w-40 rounded-full border-[18px] border-white/40" />
      <div className="absolute right-[-25px] bottom-[-30px] h-52 w-52 rounded-full border-[22px] border-white/35" />
      <div className="absolute left-[10%] top-[18%] h-[67%] w-[42%] rotate-[-8deg] rounded-[35%_8%_30%_12%] border-2 border-emerald-700/35 bg-emerald-500/20" />
      <div className="absolute right-[9%] top-[12%] h-[73%] w-[32%] rotate-[11deg] rounded-[12%_32%_10%_30%] border-2 border-lime-700/35 bg-lime-500/20" />
      <div className="absolute left-[30%] top-[47%] h-3 w-3 rounded-full bg-amber-500 ring-4 ring-white/80" />
      <div className="absolute left-[63%] top-[34%] h-3 w-3 rounded-full bg-red-500 ring-4 ring-white/80" />
      <div className="absolute right-[22%] bottom-[24%] h-3 w-3 rounded-full bg-sky-500 ring-4 ring-white/80" />
      <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 shadow-sm backdrop-blur-sm"><MapPinned className="mr-1 inline h-3.5 w-3.5 text-brand-700" />Nashik · North Field</div>
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] text-ink-500 shadow-sm backdrop-blur-sm"><span><Circle className="mr-1 inline h-2.5 w-2.5 fill-amber-500 text-amber-500" />Watch</span><span><Circle className="mr-1 inline h-2.5 w-2.5 fill-red-500 text-red-500" />Risk</span><span><Circle className="mr-1 inline h-2.5 w-2.5 fill-sky-500 text-sky-500" />Sensor</span></div>
      <div className="absolute right-3 bottom-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-ink-600 shadow-sm">Updated 2 min ago</div>
    </div>
  );
}

export function FieldMonitorPage() {
  const [edgeOnline, setEdgeOnline] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setScanResult(false);
  };

  const runScan = () => {
    setScanning(true);
    window.setTimeout(() => { setScanning(false); setScanResult(true); }, 1100);
  };

  const onlineLabel = useMemo(() => edgeOnline ? 'Edge AI online' : 'Offline mode', [edgeOnline]);

  return (
    <PageWrapper title="Field Monitor">
      <div className="space-y-4 pb-4">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123b28] via-[#17613c] to-[#0f766e] p-5 text-white shadow-card sm:p-6">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime-300/10 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200"><Activity className="h-4 w-4" />SIH field intelligence</div>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Your field, watched in real time.</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">A local-first command center for crop health, irrigation decisions, and early risk signals.</p>
            </div>
            <button onClick={() => setEdgeOnline((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20" aria-pressed={edgeOnline}>
              {edgeOnline ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-amber-300" />}{onlineLabel}<span className={`h-2 w-2 rounded-full ${edgeOnline ? 'bg-emerald-300' : 'bg-amber-300'}`} />
            </button>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[['4', 'sensors active'], ['82%', 'field health'], ['2.4k L', 'water saved'], ['Low', 'crop risk']].map(([value, label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/10 p-3"><p className="font-display text-xl font-semibold">{value}</p><p className="mt-0.5 text-[11px] text-white/60">{label}</p></div>)}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <section className="card-premium">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-eyebrow">Live overview</p><h2 className="section-title mt-1 text-lg">Field health map</h2></div><span className="badge badge-live"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-600" />LIVE</span></div>
            <FieldMap />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500"><span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-brand-700" />3 edge nodes reporting</span><span className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-amber-600" />Health score <strong className="text-ink-800">82 / 100</strong></span></div>
          </section>

          <section className="card-premium">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-eyebrow">Camera intelligence</p><h2 className="section-title mt-1 text-lg">Scan a crop</h2></div><ScanLine className="h-5 w-5 text-brand-700" /></div>
            <div className="relative flex min-h-[168px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-center">
              {preview ? <img src={preview} alt="Selected crop for analysis" className="absolute inset-0 h-full w-full object-cover" /> : <><div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm"><Camera className="h-5 w-5" /></div><p className="text-sm font-semibold text-ink-800">Capture or upload a crop image</p><p className="mt-1 text-xs text-ink-500">Analysis runs locally on your device</p></>}
              {preview && <button onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(null); setScanResult(false); }} className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white" aria-label="Remove image"><X className="h-4 w-4" /></button>}
              <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => inputRef.current?.click()} className="btn btn-secondary !py-2.5 text-xs"><Upload className="h-4 w-4" />{preview ? 'Change image' : 'Upload / camera'}</button><button onClick={runScan} disabled={scanning || !preview} className="btn btn-primary !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"><Zap className="h-4 w-4" />{scanning ? 'Analyzing…' : 'Run edge scan'}</button></div>
            {scanResult && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs"><p className="flex items-center gap-1.5 font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" />Possible early blight pattern</p><p className="mt-1 text-amber-800/80">Confidence 78% · Isolate affected leaves and rescan in 24 hours.</p></div>}
          </section>
        </div>

        <section className="card-premium"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-eyebrow">Edge telemetry</p><h2 className="section-title mt-1 text-lg">Sensor monitoring</h2></div><span className="text-xs text-ink-400">Last sync 2 min ago</span></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{sensors.map((sensor) => { const Icon = sensor.icon; const percent = sensor.label === 'Soil moisture' ? 34 : sensor.label === 'Soil temperature' ? 62 : sensor.label === 'Air humidity' ? 68 : 12; return <div key={sensor.label} className="rounded-2xl border border-stone-200/70 bg-stone-50/60 p-3.5"><div className="flex items-start justify-between"><span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white ${sensor.color} shadow-sm`}><Icon className="h-4 w-4" /></span><span className={`h-2 w-2 rounded-full ${sensor.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div><p className="mt-3 text-xs text-ink-500">{sensor.label}</p><p className="mt-0.5 font-display text-xl font-semibold text-ink-900">{sensor.value}<span className="ml-0.5 text-sm font-medium text-ink-400">{sensor.unit}</span></p><div className={`mt-2 h-1.5 overflow-hidden rounded-full ${sensor.track}`}><div className={`h-full rounded-full ${sensor.fill}`} style={{ width: `${percent}%` }} /></div><p className={`mt-1.5 text-[10px] font-semibold ${sensor.status === 'good' ? 'text-emerald-700' : 'text-amber-700'}`}>{sensor.status === 'good' ? 'Within range' : 'Needs attention'}</p></div>; })}</div></section>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <section className="card-premium"><div className="mb-3 flex items-center justify-between"><div><p className="text-eyebrow">Recommended action</p><h2 className="section-title mt-1 text-lg">Smart irrigation</h2></div><Droplets className="h-5 w-5 text-sky-600" /></div><div className="rounded-2xl bg-sky-50 p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Droplets className="h-5 w-5" /></div><div><p className="font-semibold text-sky-950">Irrigate North Field for 18 minutes</p><p className="mt-1 text-xs leading-relaxed text-sky-800/75">Moisture is trending down and no significant rain is expected in the next 6 hours.</p></div></div><div className="mt-4 flex items-center justify-between border-t border-sky-200/70 pt-3 text-xs"><span className="font-medium text-sky-800">Estimated water use: 420 L</span><button className="inline-flex items-center gap-1 font-semibold text-sky-800 hover:text-sky-950">Review plan <ArrowUpRight className="h-3.5 w-3.5" /></button></div></div><div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" /> Smart schedule can save approximately 18% water this week.</div></section>
          <section className="card-premium"><div className="mb-3 flex items-center justify-between"><div><p className="text-eyebrow">Connected hardware</p><h2 className="section-title mt-1 text-lg">Irrigation controller</h2></div><span className="badge badge-live">READY</span></div><div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Gauge className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-ink-800">Pump controller A1</p><p className="mt-0.5 text-xs text-ink-500">Battery 86% · Signal strong</p></div><span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Online</span></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] uppercase tracking-wider text-ink-400">Next cycle</p><p className="mt-1 font-semibold text-ink-800">06:30 AM</p></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-[10px] uppercase tracking-wider text-ink-400">Valve state</p><p className="mt-1 font-semibold text-ink-800">Closed</p></div></div></section>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <section className="card-premium"><div className="mb-3 flex items-center justify-between"><div><p className="text-eyebrow">Priority queue</p><h2 className="section-title mt-1 text-lg">Environmental & crop risks</h2></div><button className="text-xs font-semibold text-brand-700 hover:text-brand-900">View all</button></div><div className="space-y-2">{risks.map((risk) => { const tone = statusTone(risk.tone); const Icon = risk.icon; return <div key={risk.title} className={`flex items-start gap-3 rounded-xl border ${tone.border} ${tone.bg} p-3`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className={`text-sm font-semibold ${tone.title}`}>{risk.title}</p><span className="shrink-0 text-[10px] text-ink-400">{risk.time}</span></div><p className="mt-0.5 text-xs text-ink-600/80">{risk.note}</p></div><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300" /></div>; })}</div></section>
          <section className="card-premium"><div className="mb-3 flex items-center justify-between"><div><p className="text-eyebrow">Last 7 days</p><h2 className="section-title mt-1 text-lg">Field health analytics</h2></div><span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowUpRight className="h-3.5 w-3.5" />6.4%</span></div><div className="flex h-28 items-end gap-2 rounded-2xl bg-stone-50/70 px-4 pb-3 pt-4">{[53, 61, 58, 70, 67, 78, 82].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-1.5"><div className={`w-full max-w-8 rounded-t-lg ${index === 6 ? 'bg-brand-600' : 'bg-brand-200'}`} style={{ height: `${height}%` }} /><span className="text-[9px] text-ink-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-[10px] text-emerald-700">Water efficiency</p><p className="mt-1 font-display text-xl font-semibold text-emerald-900">+18%</p></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-[10px] text-amber-700">Yield risk</p><p className="mt-1 font-display text-xl font-semibold text-amber-900">Low</p></div></div></section>
        </div>
      </div>
    </PageWrapper>
  );
}
