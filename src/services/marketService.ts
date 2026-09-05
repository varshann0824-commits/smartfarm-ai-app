import type { MarketPrice, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface MarketResult {
  prices: MarketPrice[];
  source: SourceMetadata;
  isDemo: boolean;
}

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

// The data.gov.in AGMARKNET API requires a registered API key stored in env.
// Without a valid key we cannot fetch live data and show "unavailable" honestly.
export async function fetchMarketPrices(
  state?: string,
  crop?: string,
  market?: string,
): Promise<MarketResult> {
  try {
    const apiKey = import.meta.env.VITE_DATAGOV_API_KEY;
    if (!apiKey) {
      throw new Error('No API key configured');
    }

    const resource = '9ef84268-d588-465a-a308-a864a43d0070';
    const fields = 'commodity,market,state,district,min_price,max_price,modal_price,arrivals,arrival_date';

    // Build filter query params — data.gov.in supports filters[field]=value
    const params = new URLSearchParams({
      'api-key': apiKey,
      'format': 'json',
      'limit': '1000',
      'fields': fields,
    });

    if (state) params.append('filters[state]', state);
    if (crop) params.append('filters[commodity]', crop);
    if (market) params.append('filters[market]', market);

    const url = `https://api.data.gov.in/resource/${resource}?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Market API failed');
    const data = await res.json();

    const prices: MarketPrice[] = (data.records || []).map((r: Record<string, string>) => ({
      commodity: r.commodity,
      market: r.market,
      state: r.state,
      district: r.district,
      minPrice: parsePrice(r.min_price),
      maxPrice: parsePrice(r.max_price),
      modalPrice: parsePrice(r.modal_price),
      arrivals: r.arrivals || null,
      date: r.arrival_date || '',
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
  } catch {
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
    };
  }
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
