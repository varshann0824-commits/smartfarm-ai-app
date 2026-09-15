import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Minus, MapPin, CalendarDays, WifiOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { fetchMarketPrices, getDemoMarketPrices, type MarketResult } from '@/services/marketService';
import { generateForecast } from '@/services/marketForecastService';
import { getCropImage } from '@/services/cropImageService';
import { AnimatedNumber, Sparkline, StaggerItem } from '@/components/ui/motion';
import type { MarketPrice } from '@/types';

/**
 * Market card — agricultural produce photography band with animated live
 * mandi prices from the existing AGMARKNET edge-function service (demo
 * mode respected). Trend visualizations use the existing statistical
 * forecast helper; nothing is hardcoded.
 */
export function MarketCard({ index }: { index: number }) {
  const { location, demoMode } = useApp();
  const [result, setResult] = useState<MarketResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        if (demoMode) {
          const demo = getDemoMarketPrices();
          if (!cancelled) setResult(demo);
        } else {
          const r = await fetchMarketPrices(location.state || undefined);
          if (!cancelled) setResult(r);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [demoMode, location.state]);

    const rows = topRows(result?.prices || []);
  // Use the top commodity's dedicated agricultural photo for the card
  // header band. Falls back to the market produce image when no data yet.
  const topCommodity = rows[0]?.prices[0]?.commodity || '';
  const cropImage = topCommodity
    ? getCropImage(topCommodity)
    : { src: `${import.meta.env.BASE_URL}assets/cinematic/produce.jpg`, alt: 'Fresh produce market' };

  return (
    <StaggerItem index={index} className="h-full">
      <Link to="/market" className="card-premium group relative h-full flex flex-col overflow-hidden hover:-translate-y-0.5 transition-transform duration-300">
        {/* Sharp produce/market photography — thin band, list stays readable */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-20 overflow-hidden">
          <img
            src={cropImage.src}
            alt={cropImage.alt}
            aria-hidden="true"
            draggable={false}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-white/30 to-white" />
        </div>
        <div className="relative flex items-center justify-between">
          <p className="text-eyebrow">Mandi Prices</p>
          {demoMode ? <span className="badge badge-demo">SAMPLE</span>
            : result?.source.isLive ? <span className="badge badge-live">LIVE</span>
            : result ? <span className="badge badge-low">OFFLINE</span> : null}
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg skeleton" />
                <div className="flex-1"><div className="w-28 h-4 skeleton mb-1.5" /><div className="w-20 h-3 skeleton" /></div>
                <div className="w-16 h-5 skeleton" />
              </div>
            ))}
          </div>
        ) : error || !result || rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-start justify-center py-6 text-ink-400">
            <WifiOff className="w-6 h-6 mb-2" />
            <p className="text-sm">{error ? 'Market data is temporarily unavailable.' : 'No mandi prices found for your area right now.'}</p>
          </div>
        ) : (
          <>
            <div className="mt-3 divide-y divide-stone-100">
              {rows.map(row => (
                <div key={row.key} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-800 text-sm truncate">{row.prices[0].commodity}</p>
                    <p className="text-xs text-ink-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{row.prices[0].market}
                    </p>
                  </div>
                  {row.history.length >= 2 && (
                    <Sparkline values={row.history} width={56} height={24} stroke={row.trend === 'decreasing' ? '#dc2626' : '#16a34a'} />
                  )}
                  <div className="text-right">
                    <AnimatedNumber
                      value={row.prices[0].modalPrice}
                      prefix="₹"
                      className="font-display text-lg font-semibold text-ink-900"
                    />
                    <p className="text-[10px] text-ink-400">per quintal</p>
                  </div>
                  {row.trend && <TrendIcon trend={row.trend} />}
                </div>
              ))}
            </div>
            <div className="mt-auto pt-3 flex items-center justify-between text-xs text-ink-400 border-t border-stone-100">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />{result.prices[0]?.date}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
                All prices <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </>
        )}
      </Link>
    </StaggerItem>
  );
}

function TrendIcon({ trend }: { trend: 'increasing' | 'decreasing' | 'stable' }) {
  if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />;
  if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" />;
  return <Minus className="w-4 h-4 text-ink-300 flex-shrink-0" />;
}

interface Row {
  key: string;
  prices: MarketPrice[];
  history: number[];
  trend: 'increasing' | 'decreasing' | 'stable' | null;
}

/** Groups real records by commodity, newest first, with computed trend. */
function topRows(prices: MarketPrice[]): Row[] {
  const byCommodity = new Map<string, MarketPrice[]>();
  for (const p of prices) {
    if (!p.commodity) continue;
    const list = byCommodity.get(p.commodity) || [];
    list.push(p);
    byCommodity.set(p.commodity, list);
  }
  const rows: Row[] = [];
  for (const [commodity, list] of byCommodity) {
    list.sort((a, b) => b.date.localeCompare(a.date));
    const sortedByDate = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const forecast = generateForecast(sortedByDate);
    rows.push({
      key: commodity,
      prices: list,
      history: sortedByDate.map(p => p.modalPrice ?? 0).filter(v => v > 0),
      trend: forecast.hasEnoughData ? forecast.trend : null,
    });
  }
  return rows.slice(0, 3);
}
