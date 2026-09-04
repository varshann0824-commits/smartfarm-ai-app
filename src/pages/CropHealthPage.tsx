import { useState } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo } from '@/components/DataBadges';
import { AnalysisSheet, type AnalysisState } from '@/components/AnalysisSheet';
import { useApp } from '@/context/AppContext';
import { analyzeCropHealth, type CropHealthAnalysis } from '@/services/cropHealthService';
import { getAgricultureKnowledge } from '@/services/agricultureKnowledgeService';
import { voiceService } from '@/services/voiceService';
import { CROP_NAMES, getCropInfo } from '@/services/cropDatabase';
import { saveCropAnalysis } from '@/services/analysisHistoryService';
import { Camera, Upload, Mic, Type, Send, Volume2, Square, AlertTriangle, RotateCcw, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type InputMode = 'text' | 'voice' | 'image';

export function CropHealthPage() {
  const { t, language } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>('text');
  const [crop, setCrop] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [recentRainfall, setRecentRainfall] = useState('');
  const [irrigation, setIrrigation] = useState('');
  const [visibleInsects, setVisibleInsects] = useState('');
  const [recentFertilizer, setRecentFertilizer] = useState('');
  const [analysis, setAnalysis] = useState<CropHealthAnalysis | null>(null);
  const [sheetState, setSheetState] = useState<AnalysisState>('idle');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const langMap: Record<string, string> = {
    en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN',
  };

  const handleAnalyze = () => {
    if (!symptoms.trim()) return;
    setSheetOpen(true);
    setSheetState('analyzing');
    setAnalysis(null);
    setTimeout(() => {
      const result = analyzeCropHealth(
        crop, symptoms, growthStage, recentRainfall, irrigation, visibleInsects, recentFertilizer,
      );
      setAnalysis(result);
      setSheetState(result.result ? (result.result.confidence === 'Low' ? 'low-confidence' : 'success') : 'error');
    }, 1200);
  };

  const handleRetry = () => {
    setSheetState('analyzing');
    setAnalysis(null);
    setTimeout(() => {
      const result = analyzeCropHealth(
        crop, symptoms, growthStage, recentRainfall, irrigation, visibleInsects, recentFertilizer,
      );
      setAnalysis(result);
      setSheetState(result.result ? (result.result.confidence === 'Low' ? 'low-confidence' : 'success') : 'error');
    }, 1200);
  };

  const handleVoiceInput = () => {
    setVoiceError(null);
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }
    const started = voiceService.startListening(
      langMap[language] || 'en-IN',
      (text) => { setSymptoms(prev => prev + (prev ? ' ' : '') + text); setIsListening(false); },
      (err) => { setVoiceError(err); setIsListening(false); },
      () => setIsListening(false),
    );
    if (started) setIsListening(true);
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) { voiceService.stopSpeaking(); setIsSpeaking(false); return; }
    const ok = voiceService.speak(text, language);
    if (ok) { setIsSpeaking(true); setTimeout(() => setIsSpeaking(false), text.length * 80 + 1000); }
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetState('idle');
  };

  return (
    <PageWrapper title={`\u{1F4F7} ${t('cropHealth')}`}>
      {/* Input Mode Selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ModeButton active={mode === 'text'} onClick={() => setMode('text')} icon={<Type className="w-5 h-5" />} label="Describe" />
        <ModeButton active={mode === 'voice'} onClick={() => setMode('voice')} icon={<Mic className="w-5 h-5" />} label="Speak" />
        <ModeButton active={mode === 'image'} onClick={() => setMode('image')} icon={<Camera className="w-5 h-5" />} label="Photo" />
      </div>

      {/* Image Input */}
      {mode === 'image' && (
        <div className="card mb-4 text-center">
          <div className="border-2 border-dashed border-stone-300 rounded-xl p-6">
            <Upload className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium mb-2">Upload a photo of your crop</p>
            <p className="text-sm text-stone-400 mb-4">Take a clear photo of the affected leaves, stems, or plant</p>
            <label className="btn btn-primary touch-target cursor-pointer inline-flex">
              <Camera className="w-5 h-5" /> Choose Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => {}} />
            </label>
          </div>
          <p className="text-xs text-stone-400 mt-3">
            After uploading, please also describe the symptoms below for better analysis.
          </p>
        </div>
      )}

      {/* Symptom Description */}
      <div className="card mb-4">
        <label className="text-sm font-medium text-stone-600 block mb-2">
          Describe what you see on your crop <span className="text-red-500">*</span>
        </label>
        <textarea
          value={symptoms}
          onChange={e => setSymptoms(e.target.value)}
          placeholder="e.g., Yellow spots on leaves, leaves curling, brown edges..."
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
        />
        {mode === 'voice' && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              onClick={handleVoiceInput}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500' : 'bg-green-700'} text-white ${isListening ? 'pulse-ring' : ''}`}
              aria-label="Speak symptoms"
            >
              <Mic className="w-7 h-7" />
            </button>
            <p className="text-sm text-stone-600">{isListening ? 'Listening...' : 'Tap to describe symptoms'}</p>
            {voiceError && <p className="text-xs text-amber-700">{voiceError}</p>}
          </div>
        )}
      </div>

      {/* Optional Details */}
      <div className="card mb-4">
        <p className="text-sm font-medium text-stone-600 mb-3">Additional details (optional but helpful):</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Crop name</label>
            <select
              value={crop}
              onChange={e => setCrop(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            >
              <option value="">Select crop...</option>
              {CROP_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {crop && getCropInfo(crop) && (
              <p className="text-xs text-stone-400 mt-1">
                Common issues: {getCropInfo(crop)!.commonDiseases.join(', ') || 'N/A'}
              </p>
            )}
          </div>
          <SelectField label="Growth stage" value={growthStage} onChange={setGrowthStage} options={['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity']} />
          <SelectField label="Recent rainfall" value={recentRainfall} onChange={setRecentRainfall} options={['None', 'Low', 'Moderate', 'Heavy']} />
          <SelectField label="Irrigation" value={irrigation} onChange={setIrrigation} options={['None', 'Low', 'Moderate', 'High']} />
          <SelectField label="Visible insects?" value={visibleInsects} onChange={setVisibleInsects} options={['Yes', 'No', 'Not sure']} />
          <InputField label="Recent fertilizer/input applied" value={recentFertilizer} onChange={setRecentFertilizer} placeholder="e.g., Urea, DAP, none" />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!symptoms.trim() || sheetState === 'analyzing'}
        className="btn btn-primary touch-target w-full text-base mb-4"
      >
        <Send className="w-5 h-5" /> Analyze Crop Health
      </button>

      <AnalysisSheet
        open={sheetOpen}
        onClose={closeSheet}
        state={sheetState}
        title="Crop Analysis Result"
        analyzingLabel="Analyzing your crop symptoms..."
        onRetry={handleRetry}
      >
        {analysis?.result && (
          <CropHealthResultDisplay
            analysis={analysis}
            onSpeak={handleSpeak}
            isSpeaking={isSpeaking}
            onAnalyzeAnother={() => { setSymptoms(''); closeSheet(); }}
            onContactExpert={() => navigate('/support')}
          />
        )}
      </AnalysisSheet>
    </PageWrapper>
  );
}

function CropHealthResultDisplay({
  analysis,
  onSpeak,
  isSpeaking,
  onAnalyzeAnother,
  onContactExpert,
}: {
  analysis: CropHealthAnalysis;
  onSpeak: (t: string) => void;
  isSpeaking: boolean;
  onAnalyzeAnother: () => void;
  onContactExpert: () => void;
}) {
  const r = analysis.result!;
  const confidenceStatus = r.confidence === 'High' ? 'ai' : r.confidence === 'Medium' ? 'ai' : 'low';
  const knowledge = getAgricultureKnowledge(r.crop, r.possibleProblem);
  const speakText = `${r.crop}. ${r.possibleProblem}. Confidence: ${r.confidence}. Severity: ${r.severity}.`;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Main Result */}
      <div className="card">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs text-stone-500">Crop</p>
            <h3 className="font-bold text-stone-800">{r.crop}</h3>
          </div>
          <DataBadge status={confidenceStatus} />
        </div>
        <p className="text-xs text-stone-500 mt-2">Possible Problem</p>
        <p className="font-semibold text-stone-800">{r.possibleProblem}</p>
        <div className="flex gap-2 mt-2 text-sm">
          <span className="badge bg-stone-100 text-stone-700">Confidence: {r.confidence}</span>
          <span className="badge bg-stone-100 text-stone-700">Severity: {r.severity}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSpeak(speakText)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700"
          >
            {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSpeaking ? 'Stop' : '🔊 Listen'}
          </button>
        </div>
      </div>

      {r.confidence === 'Low' && (
        <div className="card bg-red-50 border-red-200 text-red-800 text-sm">
          ⚠ Please verify with a KVK/agriculture officer before taking major treatment decisions.
        </div>
      )}

      {/* Visible Symptoms */}
      <div className="card">
        <h4 className="font-semibold text-stone-800 mb-2">Visible Symptoms</h4>
        <ul className="space-y-1">
          {r.visibleSymptoms.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-green-600">•</span> {s}</li>)}
        </ul>
      </div>

      {/* Possible Causes */}
      <div className="card">
        <h4 className="font-semibold text-stone-800 mb-2">Possible Causes</h4>
        <ul className="space-y-1">
          {r.possibleCauses.map((c, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-orange-500">•</span> {c}</li>)}
        </ul>
      </div>

      {/* What To Do Now */}
      <div className="card bg-green-50 border-green-200">
        <h4 className="font-semibold text-stone-800 mb-2">What To Do Now</h4>
        <ul className="space-y-1.5">
          {r.whatToDoNow.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-green-600">✓</span> {s}</li>)}
        </ul>
      </div>

      {/* Prevention */}
      <div className="card">
        <h4 className="font-semibold text-stone-800 mb-2">Prevention</h4>
        <ul className="space-y-1">
          {r.prevention.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-blue-500">•</span> {s}</li>)}
        </ul>
      </div>

      {/* Monitor */}
      <div className="card">
        <h4 className="font-semibold text-stone-800 mb-2">What To Monitor</h4>
        <ul className="space-y-1">
          {r.monitor.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-amber-500">•</span> {s}</li>)}
        </ul>
      </div>

      {/* Verified Knowledge */}
      {knowledge && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <DataBadge status="verified" />
            <h4 className="font-semibold text-stone-800">{knowledge.title}</h4>
          </div>
          <p className="text-sm text-stone-600 mb-2">{knowledge.description}</p>
          <p className="text-xs font-medium text-stone-500 mt-2">Management Steps:</p>
          <ul className="space-y-1 mt-1">
            {knowledge.managementSteps.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-blue-500">•</span> {s}</li>)}
          </ul>
        </div>
      )}

      {/* Sources */}
      <div className="card">
        <h4 className="font-semibold text-stone-800 mb-2">Agricultural Sources</h4>
        <div className="space-y-1">
          {r.sources.map((s, i) => <p key={i} className="text-sm text-stone-600">✓ {s}</p>)}
        </div>
        <SourceInfo source={analysis.source} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button onClick={onAnalyzeAnother} className="btn btn-outline touch-target flex-1 text-sm">
          <RotateCcw className="w-4 h-4" /> Analyze Another
        </button>
        <button onClick={onContactExpert} className="btn btn-primary touch-target flex-1 text-sm">
          <Building className="w-4 h-4" /> Contact Expert
        </button>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all touch-target ${
        active ? 'border-green-600 bg-green-50 text-green-700' : 'border-stone-200 bg-white text-stone-500'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
