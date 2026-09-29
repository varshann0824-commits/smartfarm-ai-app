import type { MarketPrice, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface MarketResult {
  prices: MarketPrice[];
  source: SourceMetadata;
  isDemo: boolean;
  message?: string;
}

// The market-prices Edge Function time-boxes its own data.gov.in (AGMARKNET)
// calls and always answers with structured JSON (HTTP 200): either the real
// records, or an honest "unavailable" status the UI turns into a retryable
// state. Its ladder is a 20s first attempt, a 10s retry, and one final
// small-page try after fast failures — a worst case of ~30.5s. The browser
// budget must therefore be LARGER than the server's worst case — with both
// budgets at 15s the browser aborted marginally BEFORE the function could
// reply, which is what produced the production "request timed out" screen
// with no explanation. 45s keeps a >10s margin over the function while still
// cutting off a truly hung connection honestly (never an indefinite wait).
const REQUEST_TIMEOUT_MS = 45_000;

// AGMARKNET canonical commodity names (data.gov.in resource
// 9ef84268-d588-465a-a308-a864a43d0070, field `commodity`).
// The filter dropdown values must use these EXACT names, because the
// Supabase `market-prices` Edge Function forwards the selection as an
// exact server-side `filters[commodity]` match. A friendly label that
// differs even slightly (e.g. "Rice" vs AGMARKNET's "Paddy") returns
// zero rows from the API — the missing-results bug this prevents.
export interface CropOption {
  /** Exact AGMARKNET commodity name sent to the API. */
  value: string;
  /** Friendly label shown in the filter dropdown. */
  label: string;
}

export const CROP_OPTIONS: CropOption[] = [
  { value: 'Paddy', label: 'Paddy / Rice' },
  { value: 'Wheat', label: 'Wheat' },
  { value: 'Cotton', label: 'Cotton' },
  { value: 'Maize', label: 'Maize' },
  { value: 'Soyabean', label: 'Soybean (Soyabean)' },
  { value: 'Groundnut', label: 'Groundnut' },
  { value: 'Onion', label: 'Onion' },
  { value: 'Tomato', label: 'Tomato' },
  { value: 'Potato', label: 'Potato' },
  { value: 'Dry Chillies', label: 'Chilli (Dry Chillies)' },
  { value: 'Turmeric', label: 'Turmeric' },
  { value: 'Gram', label: 'Bengal Gram (Gram)' },
  { value: 'Arhar', label: 'Pigeon Pea (Arhar/Tur)' },
  { value: 'Urad', label: 'Black Gram (Urad)' },
  { value: 'Moong', label: 'Green Gram (Moong)' },
  { value: 'Mustard', label: 'Mustard' },
  { value: 'Sunflower', label: 'Sunflower' },
  { value: 'Sugarcane', label: 'Sugarcane' },
  { value: 'Banana', label: 'Banana' },
  { value: 'Mango', label: 'Mango' },
  { value: 'Grapes', label: 'Grapes' },
  { value: 'Coconut', label: 'Coconut' },
  { value: 'Castor Seed', label: 'Castor Seed' },
  { value: 'Coriander', label: 'Coriander (Dhania)' },
  { value: 'Cummin Seed', label: 'Cumin (Cummin Seed)' },
  { value: 'Methi', label: 'Fenugreek (Methi)' },
  { value: 'Saunf', label: 'Fennel (Saunf)' },
  { value: 'Black pepper', label: 'Black Pepper' },
  { value: 'Cardamom', label: 'Cardamom' },
  { value: 'Ginger(Dry)', label: 'Ginger' },
  { value: 'Garlic', label: 'Garlic' },
  { value: 'Cloves', label: 'Clove (Cloves)' },
  { value: 'Sesamum', label: 'Sesame (Sesamum/Til)' },
  { value: 'Jowar', label: 'Jowar (Sorghum)' },
  { value: 'Bajra', label: 'Bajra (Pearl Millet)' },
  { value: 'Ragi', label: 'Ragi (Finger Millet)' },
  { value: 'Jute', label: 'Jute' },
  { value: 'Arecanut', label: 'Arecanut' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Tea', label: 'Tea' },
];

// Backwards-compatible list of dropdown values for existing imports
// (FarmerDetailsPage). Kept in the same order as CROP_OPTIONS.
export const COMMON_CROPS: string[] = CROP_OPTIONS.map((c) => c.value);

export const COMMON_STATES = [
  'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
  'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Gujarat',
  'Rajasthan', 'West Bengal', 'Bihar', 'Odisha', 'Kerala',
  'Assam', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Goa', 'Tripura', 'Manipur', 'Meghalaya',
  'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim',
];

// Aliases map each AGMARKNET canonical value to spellings /
// singular-plural / regional variants farmers may type or that older
// saved filters / demo data may use. Matching is normalised
// (case-insensitive, punctuation-insensitive), so e.g. "Chilli",
// "chillies" and "green chilli" all resolve to "Dry Chillies".
const CROP_ALIASES: Record<string, string[]> = {
  paddy: ['rice', 'dhan', 'paddy rice', 'common paddy'],
  wheat: ['wheats'],
  cotton: ['kapas', 'cottons'],
  maize: ['corn', 'makka', 'makkai'],
  soyabean: ['soybean', 'soya', 'soya bean', 'soyabeans', 'soybeans'],
  groundnut: ['peanut', 'peanuts', 'groundnuts', 'mungfali'],
  onion: ['onions', 'pyaz', 'kanda'],
  tomato: ['tomatoes', 'tamatar'],
  potato: ['potatoes', 'aloo', 'alu'],
  'dry chillies': ['chilli', 'chillies', 'green chilli', 'red chilli', 'mirchi', 'dry chilli'],
  turmeric: ['haldi', 'pasupu'],
  gram: ['bengal gram', 'chana', 'chickpea', 'chick pea', 'gram dal'],
  arhar: ['pigeon pea', 'tur', 'toor', 'toor dal', 'red gram'],
  urad: ['black gram', 'blackgram', 'urad dal', 'minapalu'],
  moong: ['green gram', 'greengram', 'moong dal', 'pesara', 'mung'],
  mustard: ['mustard seed', 'sarson', 'rai', 'aavaalu'],
  sunflower: ['sunflower seed', 'sunflowers'],
  sugarcane: ['sugar cane', 'cane', 'cheruku'],
  banana: ['bananas', 'plantain', 'arati'],
  mango: ['mangoes', 'mangos', 'mamidi'],
  grapes: ['grape', 'draksha'],
  coconut: ['coconuts', 'copra', 'kobbari', 'nariyal'],
  'castor seed': ['castor', 'castorseed', 'aamudalu'],
  coriander: ['dhania', 'dhaniya', 'kottimira', 'coriander seed'],
  'cummin seed': ['cumin', 'jeera', 'zeera', 'cumin seed', 'cummin'],
  methi: ['fenugreek', 'methi seeds', 'menthulu'],
  saunf: ['fennel', 'sopu'],
  'black pepper': ['pepper', 'blackpepper', 'miriyalu', 'kali mirch'],
  cardamom: ['elaichi', 'elachi', 'yelakulu'],
  'ginger(dry)': ['ginger', 'dry ginger', 'adrak', 'allam', 'sonth'],
  garlic: ['lahsun', 'vellulli'],
  cloves: ['clove', 'laung', 'lavangalu'],
  sesamum: ['sesame', 'sesamum seed', 'til', 'gingelly', 'nuvvulu'],
  jowar: ['sorghum', 'jola', 'jonna', 'cholam'],
  bajra: ['pearl millet', 'bajri', 'sajja', 'kambu'],
  ragi: ['finger millet', 'nachni', 'ragulu'],
  jute: ['jutes'],
  arecanut: ['areca nut', 'betel nut', 'supari', 'vakkalu'],
  coffee: ['kaapi'],
  tea: ['chai'],
};

/** Normalise a crop/commodity string for tolerant comparison. */
function normalizeCropName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Canonical lookup: AGMARKNET value -> itself, alias -> AGMARKNET value. */
function canonicalCropKey(name: string): string | null {
  const norm = normalizeCropName(name);
  if (!norm) return null;
  const direct = CROP_OPTIONS.find((o) => normalizeCropName(o.value) === norm);
  if (direct) return normalizeCropName(direct.value);
  for (const [canonical, aliases] of Object.entries(CROP_ALIASES)) {
    if (canonical === norm) return canonical;
    if (aliases.some((a) => normalizeCropName(a) === norm)) return canonical;
  }
  return null;
}

/**
 * Resolve any user-typed / legacy / demo crop label to the exact
 * AGMARKNET canonical commodity value sent to the API.
 * Unknown values are returned unchanged (server decides).
 */
export function resolveCropValue(input: string): string {
  const key = canonicalCropKey(input);
  if (!key) return input.trim();
  return CROP_OPTIONS.find((o) => normalizeCropName(o.value) === key)?.value ?? input.trim();
}

/**
 * Client-side match used after records arrive: canonical comparison
 * first, then a whole-word singular/plural-tolerant substring fallback.
 */
export function matchesCropFilter(commodity: string, filterValue: string): boolean {
  const normCommodity = normalizeCropName(commodity);
  const normFilter = normalizeCropName(filterValue);
  if (!normFilter) return true;
  if (!normCommodity) return false;
  if (normCommodity === normFilter) return true;
  const commodityKey = canonicalCropKey(commodity);
  const filterKey = canonicalCropKey(filterValue);
  if (commodityKey && filterKey && commodityKey === filterKey) return true;
  const words = normCommodity.split(' ');
  if (words.includes(normFilter)) return true;
  const singular = normFilter.endsWith('s') ? normFilter.slice(0, -1) : `${normFilter}s`;
  if (words.includes(singular)) return true;
  return normCommodity.includes(normFilter) || normFilter.includes(normCommodity);
}

// The data.gov.in AGMARKNET API requires a registered API key.
// We proxy through a Supabase Edge Function so the key stays server-side.
// If the Edge Function is not deployed or the key is not configured,
// we show "unavailable" honestly.
export interface MarketFetchOptions {
  /**
   * Browser-side abort budget for this request. Defaults to
   * REQUEST_TIMEOUT_MS, which must stay comfortably above the Edge Function's
   * own ~30.5s worst case. The dashboard card passes a smaller budget so a
   * slow upstream resolves to its honest offline state quickly instead of
   * holding up the dashboard.
   */
  timeoutMs?: number;
}

// Successful live responses are kept in memory for a short window so moving
// between the dashboard card and the Market page — or re-applying the same
// filters — does not re-hit data.gov.in, whose gateway is the flakiest part
// of this feature (every repeated call is a fresh chance to fail). Only
// genuinely fetched, successful responses are stored: nothing is invented,
// the cached payload keeps the fetch time it arrived with, and any new
// filter combination always performs a fresh request.
const MARKET_CACHE_TTL_MS = 2 * 60 * 1000;
const marketCache = new Map<string, { result: MarketResult; at: number }>();

function readMarketCache(key: string): MarketResult | null {
  const hit = marketCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > MARKET_CACHE_TTL_MS) {
    marketCache.delete(key);
    return null;
  }
  return hit.result;
}

export async function fetchMarketPrices(
  state?: string,
  crop?: string,
  market?: string,
  options: MarketFetchOptions = {},
): Promise<MarketResult> {
  const timeoutMs = options.timeoutMs && options.timeoutMs > 0 ? options.timeoutMs : REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase is not configured. The market service requires a Supabase Edge Function to keep the API key server-side.');
    }

    // Call the Supabase Edge Function. Crop labels are resolved to the
    // exact AGMARKNET canonical commodity name first so the server-side
    // exact `filters[commodity]` match succeeds.
    const baseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
    const params = new URLSearchParams();
    if (state?.trim()) params.append('state', state.trim());
    if (crop?.trim()) params.append('crop', resolveCropValue(crop));
    if (market?.trim()) params.append('market', market.trim());
    const queryString = params.toString();
    const url = `${baseUrl}/functions/v1/market-prices${queryString ? `?${queryString}` : ''}`;

    // Serve an identical recent request from memory instead of asking the
    // flaky upstream again (see the cache comment above).
    const cacheKey = `${state?.trim().toLowerCase() ?? ''}|${crop?.trim().toLowerCase() ?? ''}|${market?.trim().toLowerCase() ?? ''}`;
    const cached = readMarketCache(cacheKey);
    if (cached) return cached;

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // The Supabase API gateway requires the project key on `apikey` —
        // without it market-prices is never reached (verified live: the
        // gateway answers 401 "No API key found in request"). Per Supabase's
        // Edge Function auth model a publishable key on `apikey` ALSO
        // satisfies the function's platform JWT check (verify_jwt), so no
        // Authorization header is sent here: `Authorization: Bearer` is
        // reserved for real user access tokens, and VITE_SUPABASE_ANON_KEY is
        // a publishable key, not a JWT. Verified against the deployed
        // function: `apikey` alone returns the function's JSON response.
        ...(anonKey ? { apikey: anonKey } : {}),
      },
    });
    if (!res.ok) {
      // 401/403 (auth), 404 (gateway/routing) and 5xx are infrastructure
      // failures. The HTTP status is developer detail — it never reaches the
      // farmer-facing UI, which shows its plain-language retryable state.
      return unavailableMarketResult(`The market service responded with ${res.status}.`);
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return unavailableMarketResult('The market service returned a malformed JSON response.');
    }
    if (!isMarketResponse(data)) {
      // The function reports machine-readable failure reasons (upstream
      // timeout / 5xx / configuration). They are developer diagnostics only:
      // the reason is logged and the farmer-facing message stays plain.
      const reason = getMarketApiReason(data);
      const detail = getMarketApiError(data) || 'The market service returned an unexpected response.';
      return unavailableMarketResult(reason ? `${reason} (${detail})` : detail);
    }

    const prices: MarketPrice[] = data.records.filter(isRecord).map((record) => ({
      commodity: readText(record, 'commodity'),
      market: readText(record, 'market'),
      state: readText(record, 'state'),
      district: readText(record, 'district'),
      minPrice: parsePrice(readText(record, 'min_price')),
      maxPrice: parsePrice(readText(record, 'max_price')),
      modalPrice: parsePrice(readText(record, 'modal_price')),
      variety: readText(record, 'variety') || null,
      arrivals: readText(record, 'arrivals') || null,
      date: normalizeArrivalDate(readText(record, 'arrival_date')),
    }));

    const result: MarketResult = {
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
    marketCache.set(cacheKey, { result, at: Date.now() });
    return result;
  } catch (error) {
    const detail = error instanceof Error && error.name === 'AbortError'
      ? `The market request timed out after ${timeoutMs / 1000}s.`
      : error instanceof Error
        ? error.message
        : 'The market request failed.';
    return unavailableMarketResult(detail);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Honest "unavailable" result for every failure path (no records, no fake
 * prices, real source metadata with an unavailable status).
 *
 * `detail` is DEVELOPER diagnostics only — HTTP statuses, gateway/routing
 * errors and the Edge Function's structured error text — and is written to
 * the console. It is deliberately NOT copied into `message`: MarketPage then
 * shows its existing plain-language, farmer-safe unavailable state (with
 * Retry and the Demo Mode hint), so no HTTP/status/credential detail can leak
 * into the UI.
 */
function unavailableMarketResult(detail?: string): MarketResult {
  if (detail) console.debug('[smartfarm] market-prices unavailable:', detail);
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

/** Machine-readable failure reason reported by the Edge Function, if any. */
function getMarketApiReason(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const reason = value.reason;
  return typeof reason === 'string' && reason.trim() ? reason.trim() : null;
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

// ---------------------------------------------------------------------------
// Date handling for AGMARKNET records
//
// `arrival_date` is not guaranteed to be ISO: the feed has returned
// "2026-09-23", "2026-09-23T00:00:00" and "23/09/2026". Normalising it to
// `YYYY-MM-DD` makes string sorting (newest-first lists, trend windows and the
// forecast order) chronological. A value that cannot be parsed safely is kept
// exactly as the source reported it — nothing is invented and the API payload
// itself is never modified.
// ---------------------------------------------------------------------------

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Normalise an AGMARKNET arrival date to `YYYY-MM-DD` when it can be parsed
 * (ISO, ISO-with-time, YYYY/MM/DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY).
 * Anything else is returned trimmed and unchanged.
 */
export function normalizeArrivalDate(raw: string): string {
  const value = (raw || '').trim();
  if (!value) return '';

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(value);
  if (iso) {
    const normalised = toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    if (normalised) return normalised;
  }

  const yearFirst = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(value);
  if (yearFirst) {
    const normalised = toIsoDate(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));
    if (normalised) return normalised;
  }

  // Indian feed format: day first.
  const dayFirst = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);
  if (dayFirst) {
    const normalised = toIsoDate(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1]));
    if (normalised) return normalised;
  }

  return value;
}

/**
 * Display a market date for farmers: normalised dates read "23 Sep 2026"
 * ("23 Sep" for compact chart labels); any value that could not be normalised
 * is shown exactly as the source reported it.
 */
export function formatMarketDate(value: string, style: 'short' | 'full' = 'full'): string {
  const trimmed = (value || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!iso) return trimmed;
  const day = Number(iso[3]);
  const month = MONTH_NAMES_SHORT[Number(iso[2]) - 1] || '';
  if (!month) return trimmed;
  return style === 'short' ? `${day} ${month}` : `${day} ${month} ${iso[1]}`;
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