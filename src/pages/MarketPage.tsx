import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo, LoadingSpinner, ErrorState, DemoBanner } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { fetchMarketPrices, getDemoMarketPrices, CROP_OPTIONS, COMMON_STATES, matchesCropFilter, resolveCropValue, type MarketResult } from '@/services/marketService';
import { generateForecast, type ForecastResult } from '@/services/marketForecastService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { getCropImage } from '@/services/cropImageService';
import type { MarketPrice } from '@/types';
import { TrendingUp, TrendingDown, Minus, Filter, BarChart3, MapPin, CalendarDays, Package, RotateCcw, SearchX, Sprout } from 'lucide-react';

/* Per-crop photographic bands: each crop resolves to its own dedicated
 * agricultural photo via cropImageService. Images are realistic,
 * high-quality photos. A subtle dark gradient overlay keeps text readable. */

export function MarketPage() {
  const { t, demoMode } = useApp();
  const [result, setResult] = useState<MarketResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ state: '', crop: '', market: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<7 | 14 | 30>(7);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForecastResult(null);
    if (demoMode) {
      const demo = getDemoMarketPrices();
      setResult(demo);
      setForecastResult(generateForecast(demo.prices));
      setLoading(false);
      return;
    }
    try {
      const r = await fetchMarketPrices(filters.state, filters.crop, filters.market);
      setResult(r);
      if (r.prices.length > 0) {
        setForecastResult(generateForecast(r.prices));
      }
    } catch {
      setError('Live market data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [demoMode, filters.state, filters.crop, filters.market]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPrices = result?.prices.filter(p => {
    if (filters.state && !p.state.toLowerCase().includes(filters.state.toLowerCase())) return false;
    if (filters.crop && !matchesCropFilter(p.commodity, filters.crop)) return false;
    if (filters.market && !p.market.toLowerCase().includes(filters.market.toLowerCase())) return false;
    return true;
  }) || [];

  const hasActiveFilters = Boolean(filters.state || filters.crop || filters.market);
  const selectedCropLabel = filters.crop
    ? (CROP_OPTIONS.find(o => o.value === filters.crop)?.label ?? resolveCropValue(filters.crop))
    : '';

  const clearFilters = () => setFilters({ state: '', crop: '', market: '' });

  // Trend calculation from filtered prices
  const trendPrices = filteredPrices.length > 0 ? filteredPrices : (result?.prices || []);
  const trendData = generateTrendData(trendPrices, trendPeriod);

  return (
    <PageWrapper title={`\u{1F4C8} ${t('marketPrice')}`}>
      {demoMode && <div className="mb-4"><DemoBanner /></div>}

      {/* Filters Toggle */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowFilters(s => !s)}
            aria-expanded={showFilters}
            aria-controls="market-filters"
            className={`btn text-sm px-3 py-2 ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          >
            <Filter className="w-4 h-4" /> Filters
            {hasActiveFilters && (
              <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${showFilters ? 'bg-white/25 text-white' : 'bg-green-700 text-white'}`}>
                {[filters.state, filters.crop, filters.market].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-red-600 px-2 py-2 rounded-lg touch-target transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        {result && !demoMode && (
          <DataBadge status={result.source.status === 'available' ? 'live' : 'unavailable'} />
        )}
        {demoMode && result && <DataBadge status="demo" />}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div id="market-filters" className="card-premium mb-4 animate-fade-in">
          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5 mb-3" aria-live="polite">
              {filters.crop && (
                <span className="badge badge-live">
                  <Sprout className="w-3 h-3" />{selectedCropLabel}
                </span>
              )}
              {filters.state && <span className="badge badge-verified"><MapPin className="w-3 h-3" />{filters.state}</span>}
              {filters.market && <span className="badge badge-info">Mandi: {filters.market}</span>}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="market-state" className="text-sm font-medium text-stone-600 block mb-1">State</label>
            <select
              id="market-state"
              value={filters.state}
              onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
              className="input-field"
            >
              <option value="">All States</option>
              {COMMON_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="market-crop" className="text-sm font-medium text-stone-600 block mb-1">Crop / Product</label>
            <select
              id="market-crop"
              value={filters.crop}
              onChange={e => setFilters(f => ({ ...f, crop: e.target.value }))}
              className="input-field"
            >
              <option value="">All Crops</option>
              {CROP_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="market-mandi" className="text-sm font-medium text-stone-600 block mb-1">Market / Mandi</label>
            <input
              id="market-mandi"
              type="text"
              value={filters.market}
              onChange={e => setFilters(f => ({ ...f, market: e.target.value }))}
              placeholder="Search by mandi name..."
              className="input-field"
            />
          </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button onClick={loadData} className="btn btn-primary flex-1 touch-target text-sm">Apply Filters</button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-outline touch-target text-sm">
                <RotateCcw className="w-4 h-4" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Skeleton loading state — matches card proportions */}
      {loading && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2 text-sm text-stone-500 px-1">
            <LoadingSpinner label="Loading market prices..." />
          </div>
          {[0, 1, 2].map(i => (
            <div key={i} className="card-premium overflow-hidden" aria-hidden="true">
              <div className="h-16 skeleton mb-3" />
              <div className="w-2/3 h-4 skeleton mb-2" />
              <div className="w-1/2 h-3 skeleton mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-14 skeleton" />
                <div className="h-14 skeleton" />
                <div className="h-14 skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          message={error}
          onRetry={loadData}
          officialLink={OFFICIAL_SOURCES.AGMARKNET.url}
        />
      )}

      {!loading && !error && result && result.source.status === 'unavailable' && !demoMode && (
        <ErrorState
          message={result.message || 'Live market data is currently unavailable. The AGMARKNET/data.gov.in API requires a registered API key (VITE_DATAGOV_API_KEY) to fetch real mandi prices. You can still browse sample data by enabling Demo Mode in Settings.'}
          onRetry={loadData}
          officialLink={OFFICIAL_SOURCES.AGMARKNET.url}
        />
      )}

      {/* Price Cards */}
      {!loading && !error && filteredPrices.length > 0 && (
        <>
          {result && <SourceInfo source={result.source} />}

          <p className="text-xs text-stone-500 mt-3" aria-live="polite">
            Showing {filteredPrices.length} market {filteredPrices.length === 1 ? 'record' : 'records'}
            {selectedCropLabel ? ` for ${selectedCropLabel}` : ''}
            {filters.state ? ` in ${filters.state}` : ''} · prices per quintal (₹/qtl)
          </p>

          <div className="grid gap-3 sm:gap-4 mt-2 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPrices.map((p, i) => (
              <PriceCard key={`${p.market}-${p.commodity}-${p.date}-${i}`} price={p} isDemo={demoMode} />
            ))}
          </div>

          {/* Trend Section */}
          <TrendSection trendData={trendData} period={trendPeriod} setPeriod={setTrendPeriod} />

          {/* Nearby Mandi Comparison */}
          {filteredPrices.length > 1 && <NearbyMandiComparison prices={filteredPrices} />}

          {/* Forecast Section */}
          {forecastResult && forecastResult.hasEnoughData && (
            <ForecastSection result={forecastResult} />
          )}
          {forecastResult && !forecastResult.hasEnoughData && (
            <div className="card mt-4 text-center text-stone-500 text-sm">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              Not enough reliable data to produce a forecast. More historical price data is needed.
            </div>
          )}
        </>
      )}

      {!loading && !error && filteredPrices.length === 0 && result && result.source.status === 'available' && (
        <div className="card-premium text-center py-10 px-6 animate-fade-in">
          <SearchX className="w-10 h-10 mx-auto mb-3 text-stone-300" aria-hidden="true" />
          <h3 className="font-display font-semibold text-stone-800 mb-1">No current market data available{selectedCropLabel ? ` for ${selectedCropLabel}` : ''}</h3>
          <p className="text-sm text-stone-500 mb-1">
            {filters.crop
              ? 'The official AGMARKNET feed has no current records for this crop with the selected filters.'
              : 'No prices found for the selected filters. Try adjusting your filters.'}
          </p>
          <p className="text-xs text-stone-400 mb-4">Prices are reported per quintal (₹/qtl). New mandi arrivals appear as the feed updates.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-primary touch-target text-sm">
                <RotateCcw className="w-4 h-4" /> Clear filters
              </button>
            )}
            <button onClick={loadData} className="btn btn-outline touch-target text-sm">Retry</button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function PriceCard({ price, isDemo }: { price: MarketPrice; isDemo: boolean }) {
  const backdrop = getCropImage(price.commodity);
  return (
    <article className="card-premium overflow-hidden flex flex-col p-0 animate-fade-in">
      {/* Per-crop photographic band + dark gradient overlay for readability */}
      <div className="relative h-20 sm:h-24 overflow-hidden flex-shrink-0">
        <img
          src={backdrop.src}
          alt={backdrop.alt}
          aria-hidden="true"
          draggable={false}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12241a]/85 via-[#12241a]/35 to-[#12241a]/10" />
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-white text-base leading-tight truncate drop-shadow-sm">{price.commodity}</h3>
            <p className="text-[11px] text-white/85 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{price.market}{price.district ? `, ${price.district}` : ''}{price.state ? `, ${price.state}` : ''}</span>
            </p>
          </div>
          {isDemo && <DataBadge status="demo" />}
        </div>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Prices for ${price.commodity}`}>
        <div className="bg-stone-50 border border-stone-200/70 rounded-xl px-1 py-2 text-center min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Min</p>
          <p className="font-display font-semibold text-stone-800 text-sm truncate" title={price.minPrice != null ? `₹${price.minPrice}` : 'Not reported'}>₹{price.minPrice != null ? price.minPrice.toLocaleString('en-IN') : '–'}</p>
        </div>
        <div className="bg-green-700 rounded-xl px-1 py-2 text-center min-w-0 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-100">Modal</p>
          <p className="font-display font-bold text-white text-base leading-tight truncate" title={price.modalPrice != null ? `₹${price.modalPrice}` : 'Not reported'}>₹{price.modalPrice != null ? price.modalPrice.toLocaleString('en-IN') : '–'}</p>
        </div>
        <div className="bg-stone-50 border border-stone-200/70 rounded-xl px-1 py-2 text-center min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Max</p>
          <p className="font-display font-semibold text-stone-800 text-sm truncate" title={price.maxPrice != null ? `₹${price.maxPrice}` : 'Not reported'}>₹{price.maxPrice != null ? price.maxPrice.toLocaleString('en-IN') : '–'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1 min-w-0">
          <Package className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{price.arrivals ? `Arrivals: ${price.arrivals}` : 'Arrivals: –'}</span>
        </span>
        <span className="inline-flex items-center gap-1 flex-shrink-0">
          <CalendarDays className="w-3 h-3" aria-hidden="true" />{price.date || '–'}
        </span>
      </div>
      <p className="text-[10px] text-stone-400 mt-1.5 pt-1.5 border-t border-stone-100">Price per quintal (₹/qtl) · AGMARKNET</p>
      </div>
    </article>
  );
}

function generateTrendData(prices: MarketPrice[], period: number): { dates: string[]; values: number[]; trend: 'increasing' | 'decreasing' | 'stable' } {
  // Group by date and take average modal price per date
  const byDate = new Map<string, { sum: number; count: number }>();
  for (const p of prices) {
    if (!p.date || p.modalPrice == null || p.modalPrice <= 0) continue;
    const existing = byDate.get(p.date) || { sum: 0, count: 0 };
    existing.sum += p.modalPrice;
    existing.count += 1;
    byDate.set(p.date, existing);
  }
  const sortedDates = [...byDate.keys()].sort();
  const sliced = sortedDates.slice(-period);
  const dates: string[] = [];
  const values: number[] = [];
  for (const d of sliced) {
    const entry = byDate.get(d)!;
    dates.push(d);
    values.push(Math.round(entry.sum / entry.count));
  }
  if (values.length < 2) return { dates, values, trend: 'stable' };
  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  const pctChange = first > 0 ? (diff / first) * 100 : 0;
  const trend = pctChange > 2 ? 'increasing' : pctChange < -2 ? 'decreasing' : 'stable';
  return { dates, values, trend };
}

function TrendSection({ trendData, period, setPeriod }: { trendData: { dates: string[]; values: number[]; trend: string }; period: number; setPeriod: (p: 7 | 14 | 30) => void }) {
  if (trendData.values.length < 2) {
    return (
      <div className="card mt-4 text-center text-stone-500 text-sm">
        <p>Not enough historical data to show a trend chart.</p>
      </div>
    );
  }

  const max = Math.max(...trendData.values);
  const min = Math.min(...trendData.values);
  const range = max - min || 1;

  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-stone-800">Price Trend</h3>
        <div className="flex gap-1">
          {([7, 14, 30] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${period === p ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-600'}`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {trendData.trend === 'increasing' && <span className="badge badge-live"><TrendingUp className="w-3 h-3" /> Increasing</span>}
        {trendData.trend === 'decreasing' && <span className="badge badge-low"><TrendingDown className="w-3 h-3" /> Decreasing</span>}
        {trendData.trend === 'stable' && <span className="badge badge-info"><Minus className="w-3 h-3" /> Stable</span>}
      </div>

      {/* Simple Bar Chart */}
      <div className="flex items-end justify-between gap-1 h-32 bg-stone-50 rounded-lg p-2 overflow-x-auto">
        {trendData.values.map((v, i) => {
          const height = ((v - min) / range) * 100;
          return (
            <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full">
              <div
                className={`w-full rounded-t ${trendData.trend === 'increasing' ? 'bg-green-500' : trendData.trend === 'decreasing' ? 'bg-red-400' : 'bg-blue-400'}`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`₹${v}`}
              />
              <span className="text-[9px] text-stone-400 mt-1 whitespace-nowrap">{trendData.dates[i]?.slice(0, 5) || ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ForecastSection({ result }: { result: ForecastResult }) {
  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-stone-800">14-Day Price Forecast</h3>
        <DataBadge status="estimate" />
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 mb-3">
        📊 ESTIMATE — NOT GUARANTEED. Based on available historical data and trend analysis.
      </div>

      <div className="space-y-2">
        {result.points.map((pt, i) => (
          <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg p-2.5">
            <div>
              <p className="font-medium text-stone-800 text-sm">{pt.day === 0 ? 'Today' : `Day ${pt.day}`}</p>
              <p className="text-xs text-stone-400">{pt.date}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-stone-800 text-sm">₹{pt.value}</p>
              <p className="text-xs text-stone-500">₹{pt.rangeLow} - ₹{pt.rangeHigh}</p>
              <span className={`text-[10px] font-medium ${pt.confidence === 'High' ? 'text-green-600' : pt.confidence === 'Moderate' ? 'text-amber-600' : 'text-red-500'}`}>
                {pt.confidence} confidence
              </span>
            </div>
          </div>
        ))}
      </div>
      <SourceInfo source={result.source} showLastUpdated={false} />
    </div>
  );
}

function NearbyMandiComparison({ prices }: { prices: MarketPrice[] }) {
  // Group by market, find highest modal price and most recent date
  const byMarket = new Map<string, { market: string; district: string; state: string; modalPrice: number | null; date: string }>();
  for (const p of prices) {
    const existing = byMarket.get(p.market);
    if (!existing || (p.date > existing.date)) {
      byMarket.set(p.market, {
        market: p.market,
        district: p.district,
        state: p.state,
        modalPrice: p.modalPrice,
        date: p.date,
      });
    }
  }

  const mandis = [...byMarket.values()].filter(m => m.modalPrice != null);
  if (mandis.length < 2) return null;

  // Sort by modal price descending
  const sorted = mandis.sort((a, b) => (b.modalPrice ?? 0) - (a.modalPrice ?? 0));
  const nearest = mandis[0]; // first in original order

  return (
    <div className="card mt-4">
      <h3 className="font-bold text-stone-800 mb-1">📍 Nearby Mandi Comparison</h3>
      <p className="text-xs text-stone-500 mb-3">
        Highest reported modal price does not always mean the best place to sell. Consider distance, transport cost, and market reliability.
      </p>

      <div className="space-y-2">
        {sorted.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 border-2 ${i === 0 ? 'border-green-300 bg-green-50' : 'border-stone-200 bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-stone-800 text-sm">{m.market}</p>
                <p className="text-xs text-stone-500">{m.district}, {m.state}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-green-700 text-sm">₹{m.modalPrice}</p>
                <p className="text-[10px] text-stone-400">Modal price</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-stone-400">
              <span>{m.date}</span>
              {i === 0 && <span className="badge badge-live text-[10px]">⭐ Highest modal price</span>}
              {m.market === nearest.market && i !== 0 && <span className="text-blue-500">Nearest</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-stone-400 mt-2">
        Compare with distance and transport costs before deciding. This is not a recommendation to sell at a specific mandi.
      </p>
    </div>
  );
}
