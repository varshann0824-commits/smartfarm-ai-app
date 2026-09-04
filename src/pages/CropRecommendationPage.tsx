import { useState } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo } from '@/components/DataBadges';
import { AnalysisSheet, type AnalysisState } from '@/components/AnalysisSheet';
import { useApp } from '@/context/AppContext';
import { getCropRecommendations, type RecommendationResult } from '@/services/cropRecommendationService';
import { hasSoilTest } from '@/services/soilService';
import { Sprout, Droplets, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

export function CropRecommendationPage() {
  const { t, location } = useApp();
  const [season, setSeason] = useState('auto');
  const [water, setWater] = useState('moderate');
  const [budget, setBudget] = useState('medium');
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetState, setSheetState] = useState<AnalysisState>('idle');
  const soilData = hasSoilTest();

  const handleRecommend = () => {
    setSheetOpen(true);
    setSheetState('analyzing');
    setTimeout(() => {
      const r = getCropRecommendations(location.state, season, water, budget, soilData);
      setResult(r);
      setSheetState('success');
    }, 1200);
  };

  return (
    <PageWrapper title={`\u{1F33E} Crop Recommendation`}>
      {/* Soil data notice */}
      <div className="card mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{soilData ? '🧪' : '📍'}</span>
          <p className="text-sm text-stone-700">
            {soilData
              ? 'Recommendations include your saved soil test data for better accuracy.'
              : 'No soil test data found. Recommendations will be based on location, season, and climate (location-based guidance).'}
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-3">Your Farm Conditions</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1">Season</label>
            <select value={season} onChange={e => setSeason(e.target.value)} className="input-field">
              <option value="auto">Auto-detect (based on current month)</option>
              <option value="kharif">Kharif (Monsoon - Jun to Nov)</option>
              <option value="rabi">Rabi (Winter - Nov to Apr)</option>
              <option value="zaid">Zaid (Summer - Apr to Jun)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1">Water Availability</label>
            <select value={water} onChange={e => setWater(e.target.value)} className="input-field">
              <option value="low">Low (Rainfed / Limited irrigation)</option>
              <option value="moderate">Moderate (Some irrigation available)</option>
              <option value="high">High (Good irrigation / borewell)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1">Budget Level</label>
            <select value={budget} onChange={e => setBudget(e.target.value)} className="input-field">
              <option value="low">Low Budget</option>
              <option value="medium">Medium Budget</option>
              <option value="high">High Budget</option>
            </select>
          </div>
        </div>
        <button onClick={handleRecommend} className="btn btn-primary touch-target w-full text-base mt-4">
          <Sprout className="w-5 h-5" /> Get Recommendations
        </button>
      </div>

      <AnalysisSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSheetState('idle'); }}
        state={sheetState}
        title="Crop Recommendation Result"
        analyzingLabel="Analyzing best crops for your conditions..."
      >
        {result && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <DataBadge status="ai" />
              {result.hasSoilData && <DataBadge status="verified" />}
            </div>

            {result.recommendations.map((rec, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800">{i + 1}. {rec.crop}</h3>
                    <p className="text-sm text-stone-600 mt-1">{rec.why}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-green-700">{rec.suitability}%</div>
                    <p className="text-xs text-stone-500">suitability</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <InfoItem icon={<Calendar className="w-3.5 h-3.5" />} label="Season" value={rec.season} />
                  <InfoItem icon={<Calendar className="w-3.5 h-3.5" />} label="Duration" value={rec.duration} />
                  <InfoItem icon={<Droplets className="w-3.5 h-3.5" />} label="Water" value={rec.waterRequirement} />
                  <InfoItem icon={<TrendingUp className="w-3.5 h-3.5" />} label="Yield" value={rec.expectedYieldRange} />
                </div>

                <div className="mt-2">
                  <p className="text-xs font-medium text-stone-500">Estimated Cost: <span className="text-stone-700">{rec.estimatedCost}</span></p>
                </div>

                {rec.mainRisks.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-stone-500 mb-1">Main Risks:</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.mainRisks.map((r, ri) => (
                        <span key={ri} className="text-xs bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rec.commonDiseases.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-stone-500 mb-1">Common Diseases/Pests:</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.commonDiseases.map((d, di) => (
                        <span key={di} className="text-xs bg-red-50 text-red-700 rounded-full px-2 py-0.5">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="card bg-stone-50 text-center text-sm text-stone-500">
              <p className="mb-1">These are AI-based recommendations. Yield and profit are never guaranteed.</p>
              <p>Always consult your local KVK or agriculture officer before making final planting decisions.</p>
            </div>

            <SourceInfo source={result.source} showLastUpdated={false} />
          </div>
        )}
      </AnalysisSheet>
    </PageWrapper>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-stone-50 rounded-lg p-2">
      <span className="text-stone-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-stone-500">{label}</p>
        <p className="text-xs font-medium text-stone-700 truncate">{value}</p>
      </div>
    </div>
  );
}
