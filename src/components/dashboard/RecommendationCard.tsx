import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Droplets, FlaskConical, IndianRupee, CloudSun, BrainCircuit, CircleCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCropRecommendations } from '@/services/cropRecommendationService';
import { loadSoilTest } from '@/services/soilService';
import { ProgressRing, StaggerItem } from '@/components/ui/motion';
import type { ScoreFactor } from '@/types';

function factorIcon(factor: string) {
  const f = factor.toLowerCase();
  if (/soil|ph/.test(f)) return <FlaskConical className="w-3 h-3" />;
  if (/water|rain|irrigat/.test(f)) return <Droplets className="w-3 h-3" />;
  if (/market|price|profit/.test(f)) return <IndianRupee className="w-3 h-3" />;
  if (/season|climate|weather|temperature/.test(f)) return <CloudSun className="w-3 h-3" />;
  return <MapPin className="w-3 h-3" />;
}

/**
 * Crop recommendation card — runs the existing recommendation engine with the
 * exact same inputs as the Crop Recommendation page. No new scoring logic.
 */
export function RecommendationCard({ index }: { index: number }) {
  const { location, farmerDetails } = useApp();

  const result = useMemo(() => {
    const soilData = loadSoilTest();
    const water = (['rainfed', 'irrigated', 'limited'] as const).includes(
      (farmerDetails?.waterAvailability || '') as 'rainfed' | 'irrigated' | 'limited',
    )
      ? (farmerDetails!.waterAvailability as 'rainfed' | 'irrigated' | 'limited')
      : 'moderate';
    const budgetRaw = (farmerDetails?.budget || '').toLowerCase();
    const budget = /high/.test(budgetRaw) ? 'high' : /low/.test(budgetRaw) ? 'low' : 'medium';
    try {
      return getCropRecommendations({
        state: location.state,
        district: location.district,
        season: 'auto',
        waterAvailability: water,
        budget,
        soilType: soilData?.soilType || null,
        soilPh: soilData?.ph ?? null,
        cropPreference: null,
        previousCrop: farmerDetails?.crop || null,
        hasSoilData: !!soilData,
      });
    } catch {
      return null;
    }
  }, [location.state, location.district, farmerDetails]);

  const top = result?.recommendations?.[0];
  const second = result?.recommendations?.[1];

  return (
    <StaggerItem index={index} className="h-full">
      <Link to="/crop-recommendation" className="card-premium group h-full flex flex-col hover:-translate-y-0.5 transition-transform duration-300 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">AI Crop Advisor</p>
          <span className="badge badge-ai">AI</span>
        </div>

        {!top ? (
          <div className="flex-1 flex items-center py-8">
            <p className="text-sm text-ink-400">Add your farm details to unlock personalized crop recommendations.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mt-4">
              <ProgressRing value={top.suitability} size={84} strokeWidth={8}>
                <span className="font-display text-xl font-semibold text-ink-900">{top.suitability}%</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">match</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-ink-900 leading-tight truncate">{top.crop}</p>
                <p className="text-xs text-ink-400 mt-0.5">{top.season} · {top.duration} days</p>
                <p className="text-xs text-ink-500 mt-2 line-clamp-2 leading-relaxed">{top.why}</p>
              </div>
            </div>

            {/* Meaningful decision factors from the real score breakdown */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {(top.scoreBreakdown || []).filter((f: ScoreFactor) => f.maxScore > 0).slice(0, 4).map((f: ScoreFactor) => (
                <span
                  key={f.factor}
                  className="inline-flex items-center gap-1 rounded-md bg-stone-50 border border-stone-200/70 px-1.5 py-1 text-[10px] font-medium text-ink-600"
                  title={f.reason}
                >
                  {factorIcon(f.factor)}
                  {f.factor}
                  <span className={f.score >= f.maxScore * 0.6 ? 'text-brand-700 font-semibold' : 'text-amber-600 font-semibold'}>
                    {f.score}/{f.maxScore}
                  </span>
                </span>
              ))}
            </div>

            {second && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-stone-50 border border-stone-200/70 px-3 py-2">
                <BrainCircuit className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <p className="text-xs text-ink-500 truncate">
                  Also strong: <span className="font-semibold text-ink-800">{second.crop}</span> ({second.suitability}%)
                </p>
              </div>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-ink-400">
                <CircleCheck className="w-3.5 h-3.5 text-brand-600" />
                {result?.hasSoilData ? 'Includes your soil data' : 'Location-based analysis'}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
                Full analysis <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </>
        )}
      </Link>
    </StaggerItem>
  );
}
