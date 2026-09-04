import type { MarketForecastPoint, MarketPrice, SourceMetadata } from '@/types';
import { formatLastUpdated } from './sourceMetadata';

export interface ForecastResult {
  points: MarketForecastPoint[];
  source: SourceMetadata;
  trend: 'increasing' | 'decreasing' | 'stable';
  hasEnoughData: boolean;
}

export function generateForecast(historicalPrices: MarketPrice[]): ForecastResult {
  const now = new Date();

  if (historicalPrices.length < 3) {
    return {
      points: [],
      source: {
        sourceName: 'AI Market Forecast',
        sourceType: 'AI',
        isLive: false,
        isVerified: false,
        lastUpdated: formatLastUpdated(now),
        status: 'unavailable',
      },
      trend: 'stable',
      hasEnoughData: false,
    };
  }

  const sorted = [...historicalPrices].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(p => p.modalPrice).filter((v): v is number => v !== null);

  if (values.length < 3) {
    return {
      points: [],
      source: {
        sourceName: 'AI Market Forecast',
        sourceType: 'AI',
        isLive: false,
        isVerified: false,
        lastUpdated: formatLastUpdated(now),
        status: 'unavailable',
      },
      trend: 'stable',
      hasEnoughData: false,
    };
  }

  // Simple trend calculation using linear regression
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((a, b, i) => a + b * i, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = sumY / n - slope * sumX / n;

  const trend = slope > 5 ? 'increasing' : slope < -5 ? 'decreasing' : 'stable';
  const lastValue = values[values.length - 1];
  const volatility = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - sumY / n, 2), 0) / n);
  const confidence: MarketForecastPoint['confidence'] = volatility < lastValue * 0.05 ? 'High' : volatility < lastValue * 0.1 ? 'Moderate' : 'Lower';

  const forecastDays = [0, 3, 7, 10, 14];
  const points: MarketForecastPoint[] = forecastDays.map(day => {
    const futureIdx = n - 1 + day;
    const predicted = Math.max(0, Math.round(intercept + slope * futureIdx));
    const range = Math.round(volatility * (1 + day * 0.05));
    return {
      day,
      date: new Date(now.getTime() + day * 86400000).toLocaleDateString('en-IN'),
      value: predicted,
      rangeLow: Math.max(0, predicted - range),
      rangeHigh: predicted + range,
      confidence,
    };
  });

  return {
    points,
    source: {
      sourceName: 'AI Market Forecast (Statistical Estimate)',
      sourceType: 'AI',
      isLive: false,
      isVerified: false,
      lastUpdated: formatLastUpdated(now),
      status: 'available',
    },
    trend,
    hasEnoughData: true,
  };
}
