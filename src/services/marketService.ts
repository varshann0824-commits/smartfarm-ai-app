import type { MarketPrice, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface MarketResult {
  prices: MarketPrice[];
  source: SourceMetadata;
  isDemo: boolean;
  message?: string;
}

const REQUEST_TIMEOUT_MS = 15_000;

// Common Indian crops including spices for manual search
export const COMMON_CROPS = [
  'Rice', 'Wheat', 'Cotton', 'Maize', 'Soybean', 'Groundnut',
  'Onion', 'Tomato', 'Potato', 'Chilli', 'Turmeric', 'Bengal Gram',
  'Pigeon Pea', 'Black Gram', 'Green Gram', 'Mustard', 'Sunflower',
  'Sugarcane', 'Banana', 'Mango', 'Grapes', 'Coconut', 'Castor Seed',
  'Coriander', 'Cumin', 'Fenugreek', 'Fennel', 'Black Pepper',
  'Cardamom', 'Ginger', 'Garlic', 'Clove', 'Sesame', 'Jowar', 'Bajra',
  'Ragi', 'Jute', 'Arecanut', 'Coffee', 'Tea',
];

export const COMMON_STATES = [
  'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
  'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Gujarat',
  'Rajasthan', 'West Bengal', 'Bihar', 'Odisha', 'Kerala',
  'Assam', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Goa', 'Tripura', 'Manipur', 'Meghalaya',
  'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim',
];

// The data.gov.in AGMARKNET API requires a registered API key.
// We proxy through a Supabase Edge Function so the key stays server-side.
// If the Edge Function is not deployed or the key is not configured,
// we show "unavailable" honestly.
export async function fetchMarketPrices(
  state?: string,
  crop?: string,
  market?: string,
): Promise<MarketResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase is not configured. The market service requires a Supabase Edge Function to keep the API key server-side.');
    }

    // Call the Supabase Edge Function
    const baseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
    const params = new URLSearchParams();
    if (state?.trim()) params.append('state', state.trim());
    if (crop?.trim()) params.append('crop', crop.trim());
    if (market?.trim()) params.append('market', market.trim());
    const queryString = params.toString();
    const url = `${baseUrl}/functions/v1/market-prices${queryString ? `?${queryString}` : ''}`;

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Supabase Edge Functions require the anon key even for public
        // functions when JWT verification is enabled (the default).
        ...(anonKey ? { apikey: anonKey } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`The market service responded with ${res.status}.`);
    }
    const data: unknown = await res.json();
    if (!isMarketResponse(data)) {
      throw new Error(getMarketApiError(data) || 'The market service returned an unexpected response.');
    }

    const prices: MarketPrice[] = data.records.filter(isRecord).map((record) => ({
      commodity: readText(record, 'commodity'),
      market: readText(record, 'market'),
      state: readText(record, 'state'),
      district: readText(record, 'district'),
      minPrice: parsePrice(readText(record, 'min_price')),
      maxPrice: parsePrice(readText(record, 'max_price')),
      modalPrice: parsePrice(readText(record, 'modal_price')),
      arrivals: readText(record, 'arrivals') || null,
      date: readText(record, 'arrival_date'),
    }));

    return {
      prices,
      source: {
        sourceName: OFFICIAL_SOURCES.AGMARKNET.name,
        sourceUrl: OFFICIAL_SOURCES.AGMARKNET.url,
        sourceType: 'OFFICIAL',
        isLive: true,
        isVerified: true,
        lastUpdated: formatLastUpdated(new Date()),
        status: 'available',
      },
      isDemo: false,
    };
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'The market request timed out. Please try again.'
      : error instanceof Error
        ? error.message
        : 'Live market data is temporarily unavailable.';
    return unavailableMarketResult(message);
  } finally {
    clearTimeout(timeoutId);
  }
}

function unavailableMarketResult(message: string): MarketResult {
  return {
    prices: [],
    source: {
      sourceName: OFFICIAL_SOURCES.AGMARKNET.name,
      sourceUrl: OFFICIAL_SOURCES.AGMARKNET.url,
      sourceType: 'OFFICIAL',
      isLive: false,
      isVerified: true,
      lastUpdated: formatLastUpdated(new Date()),
      status: 'unavailable',
    },
    isDemo: false,
    message,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMarketResponse(value: unknown): value is { records: unknown[] } {
  return isRecord(value) && Array.isArray(value.records);
}

function getMarketApiError(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const error = value.error ?? value.message;
  return typeof error === 'string' && error.trim() ? error.trim() : null;
}

function readText(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  return value === null || value === undefined ? '' : String(value).trim();
}

function parsePrice(val: string): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

// Demo market data - clearly labelled as SAMPLE DATA
export function getDemoMarketPrices(): MarketResult {
  const today = new Date().toISOString().slice(0, 10);
  const prices: MarketPrice[] = [
    { commodity: 'Rice', market: 'Sample Mandi A', state: 'Andhra Pradesh', district: 'Sample District', minPrice: 2200, maxPrice: 2800, modalPrice: 2500, arrivals: '120 qtl', date: today },
    { commodity: 'Cotton', market: 'Sample Mandi B', state: 'Maharashtra', district: 'Sample District', minPrice: 5800, maxPrice: 7200, modalPrice: 6500, arrivals: '340 qtl', date: today },
    { commodity: 'Onion', market: 'Sample Mandi C', state: 'Karnataka', district: 'Sample District', minPrice: 1200, maxPrice: 2200, modalPrice: 1700, arrivals: '500 qtl', date: today },
    { commodity: 'Wheat', market: 'Sample Mandi D', state: 'Punjab', district: 'Sample District', minPrice: 2000, maxPrice: 2400, modalPrice: 2200, arrivals: '800 qtl', date: today },
    { commodity: 'Maize', market: 'Sample Mandi E', state: 'Telangana', district: 'Sample District', minPrice: 1800, maxPrice: 2100, modalPrice: 1950, arrivals: '220 qtl', date: today },
    { commodity: 'Soybean', market: 'Sample Mandi F', state: 'Madhya Pradesh', district: 'Sample District', minPrice: 4000, maxPrice: 4800, modalPrice: 4400, arrivals: '150 qtl', date: today },
    { commodity: 'Chilli', market: 'Sample Mandi G', state: 'Andhra Pradesh', district: 'Sample District', minPrice: 12000, maxPrice: 18000, modalPrice: 15000, arrivals: '50 qtl', date: today },
    { commodity: 'Turmeric', market: 'Sample Mandi H', state: 'Telangana', district: 'Sample District', minPrice: 8000, maxPrice: 12000, modalPrice: 10000, arrivals: '80 qtl', date: today },
  ];
  return {
    prices,
    source: {
      sourceName: 'DEMO SAMPLE DATA',
      sourceType: 'DEMO',
      isLive: false,
      isVerified: false,
      lastUpdated: formatLastUpdated(new Date()),
      status: 'available',
    },
    isDemo: true,
  };
}