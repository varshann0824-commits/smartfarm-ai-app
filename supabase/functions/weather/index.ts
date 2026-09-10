// Supabase Edge Function: weather
// Fetches OFFICIAL India Meteorological Department (IMD) API v1 data
// server-side (https://api.imd.gov.in — see the official reference at
// https://api.imd.gov.in/public/api_reference.html).
//
// Official IMD API v1 endpoints used:
//   - City/station mapping (resolve station for the user's location):
//       GET https://api.imd.gov.in/api/v1/cityforecast_mapping
//   - 7-day city forecast by station id:
//       GET https://api.imd.gov.in/api/v1/cityforecast?id={STATION_ID}
//   - 7-day city forecast (location variant):
//       GET https://api.imd.gov.in/api/v1/cityforecastloc?id={STATION_ID}
//   - Current weather by station id:
//       GET https://api.imd.gov.in/api/v1/current_wx?id={STATION_ID}
//   - District warnings:
//       GET https://api.imd.gov.in/api/v1/districtwarning
//
// AUTHENTICATION (verified by testing the live endpoint):
//   The v1 API returns {"error":"API key missing"} without a key and
//   {"error":"Authorization header missing or invalid"} with a bad key.
//   The key is read ONLY from the server-side environment variable
//   IMD_API_KEY (set via `supabase secrets set IMD_API_KEY=...`).
//   It is NEVER exposed to the browser and never added to VITE_ variables.
//
// LOCATION: the client passes lat/lon (plus optional district/state). The
// station is resolved dynamically from cityforecast_mapping (nearest station
// by coordinates when the mapping provides them). No station ID or town is
// hardcoded.
//
// DATA INTEGRITY: only real IMD fields are mapped. Missing fields stay null;
// nothing is calculated or invented (no feels-like, no precipitation
// probability, etc. unless IMD provides them).
//
// FALLBACK: if IMD is not configured or fails, Open-Meteo data is returned
// ONLY as a clearly-labelled fallback (source: "Open-Meteo", notice text),
// never presented as IMD.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const IMD_BASE = 'https://api.imd.gov.in/api/v1';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 15_000;
// Mapping data changes rarely; cache it in the isolate to avoid hammering IMD.
const MAPPING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface NormalizedCurrent {
  temperature: number | null;
  feelsLike: number | null; // always null for IMD (not provided)
  humidity: number | null;
  rainfall: number | null; // last 24-hour rainfall
  rainProbability: number | null; // null unless IMD provides it
  windSpeed: number | null;
  windDirection: string | null;
  condition: string | null; // from official IMD weather code / forecast text
  observationTime: string | null;
}

interface NormalizedForecastDay {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  rainfall: number | null;
  rainProbability: number | null;
  condition: string | null;
}

interface ImdWarning {
  level: string | null;
  title: string;
  area: string;
  issueTime: string;
  validUntil: string;
  rawText: string;
}

interface NormalizedWeather {
  source: 'IMD' | 'Open-Meteo';
  fallback: boolean;
  notice: string | null;
  imd: { status: 'available' | 'unavailable'; error: string | null };
  stationName: string | null;
  stationDistanceKm: number | null;
  current: NormalizedCurrent;
  forecast: NormalizedForecastDay[];
  warnings: ImdWarning[];
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

/** Case-insensitive key lookup (IMD field names vary in casing). */
function findKey(record: Record<string, unknown>, candidates: string[]): string | null {
  const lowerMap = new Map<string, string>();
  for (const k of Object.keys(record)) lowerMap.set(k.toLowerCase(), k);
  for (const c of candidates) {
    const actual = lowerMap.get(c.toLowerCase());
    if (actual !== undefined) return actual;
  }
  return null;
}

function pickNumCi(record: Record<string, unknown>, keys: string[]): number | null {
  for (const c of keys) {
    const k = findKey(record, [c]);
    if (k !== null) {
      const v = num(record[k]);
      if (v !== null) return v;
    }
  }
  return null;
}

function pickStrCi(record: Record<string, unknown>, keys: string[]): string | null {
  for (const c of keys) {
    const k = findKey(record, [c]);
    if (k !== null) {
      const v = str(record[k]);
      if (v !== null) return v;
    }
  }
  return null;
}

/** Recursively collect every object in a decoded JSON structure. */
function collectRecords(value: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (depth > 6) return;
  if (Array.isArray(value)) {
    for (const v of value) collectRecords(v, out, depth + 1);
  } else if (isRecord(value)) {
    out.push(value);
    for (const v of Object.values(value)) collectRecords(v, out, depth + 1);
  }
}

/** Great-circle distance in km (haversine approximation). */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

// ---------------------------------------------------------------------------
// IMD authenticated request helper
// ---------------------------------------------------------------------------

let mappingCache: { at: number; data: Record<string, unknown>[] } | null = null;

function imdHeaders(apiKey: string): Record<string, string> {
  // Verified against the live API: it validates both the `x-api-key` header
  // and the `Authorization` header. Both are sent with the same server-side key.
  return {
    'x-api-key': apiKey,
    'Authorization': apiKey,
    'Accept': 'application/json',
  };
}

async function imdGet(apiKey: string, path: string): Promise<unknown> {
  const res = await fetchWithTimeout(`${IMD_BASE}${path}`, { headers: imdHeaders(apiKey) });
  const text = await res.text();
  if (!res.ok) throw new Error(`IMD ${path} responded with ${res.status}`);
  if (/whitelisted/i.test(text)) {
    throw new Error('IMD API rejected the request: server IP is not whitelisted with IMD.');
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`IMD ${path} returned a malformed response.`);
  }
  // Surface IMD's own error payloads (e.g. invalid/missing key, bad station id).
  if (isRecord(data) && typeof data.error === 'string' && data.error) {
    throw new Error(`IMD API error: ${data.error}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Station mapping (dynamic — no hardcoded station IDs)
// ---------------------------------------------------------------------------

interface ImdStation {
  id: string;
  name: string;
  lat: number | null;
  lon: number | null;
  district: string | null;
  state: string | null;
}

async function getStationMapping(apiKey: string): Promise<Record<string, unknown>[]> {
  if (mappingCache && Date.now() - mappingCache.at < MAPPING_CACHE_TTL_MS) {
    return mappingCache.data;
  }
  const data = await imdGet(apiKey, '/cityforecast_mapping');
  const records: Record<string, unknown>[] = [];
  collectRecords(data, records);
  const stationRecords = records.filter((r) => {
    const id = pickStrCi(r, ['id', 'station_id', 'stationid', 'city_id', 'cityid', 'station code', 'station_code']);
    return id !== null;
  });
  if (stationRecords.length === 0) {
    throw new Error('IMD cityforecast_mapping returned no usable station records.');
  }
  mappingCache = { at: Date.now(), data: stationRecords };
  return stationRecords;
}

function toStation(r: Record<string, unknown>): ImdStation | null {
  const id = pickStrCi(r, ['id', 'station_id', 'stationid', 'city_id', 'cityid', 'station code', 'station_code']);
  if (!id) return null;
  const name =
    pickStrCi(r, ['station_name', 'stationname', 'name', 'city', 'city_name', 'place', 'location']) ?? id;
  return {
    id,
    name,
    lat: pickNumCi(r, ['lat', 'latitude', 'station_lat', 'station_latitude']),
    lon: pickNumCi(r, ['lon', 'lng', 'longitude', 'station_lon', 'station_longitude']),
    district: pickStrCi(r, ['district']),
    state: pickStrCi(r, ['state']),
  };
}

/**
 * Resolve the IMD station for the user's location.
 * Strategy: nearest station by coordinates from the official mapping.
 * Falls back to district-name matching only when the mapping has no
 * coordinates. The chosen station name (+distance) is always reported so the
 * UI can show which IMD station actually provided the data.
 */
async function resolveStation(
  apiKey: string,
  lat: number,
  lon: number,
  district: string | null,
): Promise<{ station: ImdStation; distanceKm: number | null }> {
  const records = await getStationMapping(apiKey);
  const stations = records.map(toStation).filter((s): s is ImdStation => s !== null);
  if (stations.length === 0) throw new Error('IMD station mapping could not be parsed.');

  const withCoords = stations.filter((s) => s.lat !== null && s.lon !== null);
  if (withCoords.length > 0) {
    let best = withCoords[0];
    let bestDist = Infinity;
    for (const s of withCoords) {
      const d = distanceKm(lat, lon, s.lat!, s.lon!);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return { station: best, distanceKm: Math.round(bestDist * 10) / 10 };
  }

  // No coordinates in the mapping: match by district name when available.
  if (district) {
    const wanted = district.trim().toLowerCase();
    const byDistrict = stations.find(
      (s) => s.district && s.district.toLowerCase() === wanted,
    );
    if (byDistrict) return { station: byDistrict, distanceKm: null };
  }
  throw new Error('IMD station mapping has no coordinates and no matching district.');
}

// ---------------------------------------------------------------------------
// IMD current weather + 7-day forecast + district warnings
// ---------------------------------------------------------------------------

async function fetchImdCurrent(apiKey: string, stationId: string): Promise<NormalizedCurrent> {
  const data = await imdGet(apiKey, `/current_wx?id=${encodeURIComponent(stationId)}`);
  const records: Record<string, unknown>[] = [];
  collectRecords(data, records);
  const obs = records.find((r) => pickNumCi(r, ['temp', 'temperature', 'temp_c']) !== null) ?? records[0];
  if (!obs) throw new Error('IMD current_wx returned an empty response.');

  const windDirDeg = pickNumCi(obs, ['wind_dir_deg', 'wind_direction_deg', 'winddirdegree']);
  const windDirRaw = pickStrCi(obs, ['wind_dir', 'wind_direction', 'winddir']);

  return {
    temperature: pickNumCi(obs, ['temp', 'temperature', 'temp_c', 'temperature_c']),
    feelsLike: null, // IMD v1 current weather does not provide feels-like
    humidity: pickNumCi(obs, ['humidity', 'rh', 'relative_humidity']),
    rainfall: pickNumCi(obs, ['rainfall', 'rainfall_24hrs', 'rainfall_last_24hrs', 'rainfall_last24hours', 'rain_24hr', 'precipitation']),
    rainProbability: null,
    windSpeed: pickNumCi(obs, ['wind_speed', 'windspeed', 'wind_speed_kmph']),
    windDirection: windDirDeg !== null ? degreesToCompass(windDirDeg) : windDirRaw,
    condition: pickStrCi(obs, ['weather_code', 'weathercode', 'wx_code', 'weather_description', 'weather'])
      ? (pickStrCi(obs, ['weather_description', 'weather']) ??
        `IMD weather code ${String(pickNumCi(obs, ['weather_code', 'weathercode', 'wx_code']) ?? '')}`)
      : null,
    observationTime: pickStrCi(obs, ['datetime', 'date_time', 'observation_time', 'obs_time', 'date', 'time']),
  };
}

async function fetchImdForecast(apiKey: string, stationId: string): Promise<NormalizedForecastDay[]> {
  const data = await imdGet(apiKey, `/cityforecast?id=${encodeURIComponent(stationId)}`);
  const records: Record<string, unknown>[] = [];
  collectRecords(data, records);
  const src = records.find((r) => pickNumCi(r, ['todays_forecast_max_temp', 'day_2_max_temp']) !== null);
  if (!src) throw new Error('IMD cityforecast returned no forecast fields.');

  const days: NormalizedForecastDay[] = [];
  const today = new Date();

  for (let day = 1; day <= 7; day++) {
    const prefix = day === 1 ? ['todays_forecast', 'today'] : [`day_${day}`, `day${day}`];
    const tempMax = pickNumCi(src, prefix.map((p) => `${p}_max_temp`).concat(day === 1 ? ['todays_forecast_max_temp'] : []));
    const tempMin = pickNumCi(src, prefix.map((p) => `${p}_min_temp`).concat(day === 1 ? ['todays_forecast_min_temp'] : []));
    const condition = pickStrCi(src, day === 1 ? ['todays_forecast', 'today_forecast'] : prefix.map((p) => `${p}_forecast`));
    const rainfall = pickNumCi(src, day === 1 ? ['todays_forecast_rainfall', 'rainfall'] : prefix.map((p) => `${p}_rainfall`));
    const rainProb = pickNumCi(src, prefix.map((p) => `${p}_rain_probability`));
    if (tempMax === null && tempMin === null && condition === null) continue;
    const date = new Date(today);
    date.setDate(today.getDate() + (day - 1));
    days.push({
      date: date.toISOString().slice(0, 10),
      tempMax,
      tempMin,
      rainfall,
      rainProbability: rainProb,
      condition,
    });
  }

  if (days.length === 0) throw new Error('IMD cityforecast response could not be parsed.');
  return days;
}

async function fetchImdWarnings(apiKey: string, district: string | null): Promise<ImdWarning[]> {
  if (!district) return [];
  const data = await imdGet(apiKey, '/districtwarning');
  const records: Record<string, unknown>[] = [];
  collectRecords(data, records);
  const wanted = district.trim().toLowerCase();
  const warnings: ImdWarning[] = [];
  for (const r of records) {
    const area = pickStrCi(r, ['district', 'district_name']) ?? '';
    if (!area || area.toLowerCase() !== wanted) continue;
    const rawText =
      pickStrCi(r, ['warning_text', 'warning', 'text', 'message', 'alert']) ?? '';
    if (!rawText) continue;
    warnings.push({
      level: pickStrCi(r, ['warning_level', 'level', 'colour', 'color', 'alert_type']),
      title: rawText.slice(0, 120),
      area,
      issueTime: pickStrCi(r, ['issue_time', 'issued_at', 'datetime', 'date']) ?? '',
      validUntil: pickStrCi(r, ['valid_until', 'validity', 'valid_upto']) ?? '',
      rawText,
    });
  }
  return warnings;
}

async function fetchFromImd(
  apiKey: string,
  lat: number,
  lon: number,
  district: string | null,
): Promise<NormalizedWeather> {
  const { station, distanceKm: dist } = await resolveStation(apiKey, lat, lon, district);

  // 7-day forecast by station id (primary official source)
  const forecast = await fetchImdForecast(apiKey, station.id);

  // Current weather by station id — if it fails, forecast-only IMD data is
  // still returned; missing current fields stay null (nothing invented).
  let current: NormalizedCurrent | null = null;
  try {
    current = await fetchImdCurrent(apiKey, station.id);
  } catch {
    current = null;
  }

  // Official district warnings (best effort — never fabricated)
  let warnings: ImdWarning[] = [];
  try {
    warnings = await fetchImdWarnings(apiKey, district);
  } catch {
    warnings = [];
  }

  return {
    source: 'IMD',
    fallback: false,
    notice: null,
    imd: { status: 'available', error: null },
    stationName: station.name,
    stationDistanceKm: dist,
    current: current ?? {
      temperature: null,
      feelsLike: null,
      humidity: null,
      rainfall: null,
      rainProbability: null,
      windSpeed: null,
      windDirection: null,
      condition: null,
      observationTime: null,
    },
    forecast,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Open-Meteo (clearly-labelled fallback only)
// ---------------------------------------------------------------------------

async function fetchFromOpenMeteo(lat: number, lon: number, notice: string, imdError: string): Promise<NormalizedWeather> {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&timezone=auto&forecast_days=7`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Open-Meteo responded with ${res.status}`);
  const data: unknown = await res.json();
  if (!isRecord(data)) throw new Error('Open-Meteo returned an unexpected response');

  const currentRec = isRecord(data.current) ? data.current : {};
  const dailyRec = isRecord(data.daily) ? data.daily : {};
  const dailyTimes = Array.isArray(dailyRec.time) ? (dailyRec.time as unknown[]) : [];
  const arr = (key: string): unknown[] => (Array.isArray(dailyRec[key]) ? (dailyRec[key] as unknown[]) : []);
  const windDirDeg = num(currentRec.wind_direction_10m);

  const current: NormalizedCurrent = {
    temperature: num(currentRec.temperature_2m),
    feelsLike: num(currentRec.apparent_temperature),
    humidity: num(currentRec.relative_humidity_2m),
    rainfall: num(currentRec.precipitation),
    rainProbability: num(arr('precipitation_probability_max')[0]),
    windSpeed: num(currentRec.wind_speed_10m),
    windDirection: windDirDeg !== null ? degreesToCompass(windDirDeg) : null,
    condition: openMeteoCodeToText(num(currentRec.weather_code) ?? -1),
    observationTime: null,
  };

  const forecast: NormalizedForecastDay[] = dailyTimes.map((time, i) => ({
    date: String(time),
    tempMax: num(arr('temperature_2m_max')[i]),
    tempMin: num(arr('temperature_2m_min')[i]),
    rainfall: null,
    rainProbability: num(arr('precipitation_probability_max')[i]),
    condition: openMeteoCodeToText(num(arr('weather_code')[i]) ?? -1),
  }));

  return {
    source: 'Open-Meteo',
    fallback: true,
    notice,
    imd: { status: 'unavailable', error: imdError },
    stationName: null,
    stationDistanceKm: null,
    current,
    forecast,
    warnings: [],
  };
}

function openMeteoCodeToText(code: number): string | null {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail',
  };
  return map[code] ?? null;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') ?? '');
    const lon = parseFloat(url.searchParams.get('lon') ?? '');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return jsonResponse({ error: 'Valid lat and lon query parameters are required.', status: 'unavailable' }, 400, headers);
    }
    const district = url.searchParams.get('district');

    // 1) Official IMD API v1 (server-side; requires IMD_API_KEY server secret).
    const apiKey = Deno.env.get('IMD_API_KEY');
    if (!apiKey) {
      // No key configured — do not invent one. Report and use labelled fallback.
      try {
        const fallback = await fetchFromOpenMeteo(
          lat,
          lon,
          'Official IMD API access is not configured on the server (IMD_API_KEY server secret missing). Showing Open-Meteo (fallback) data — not official IMD data.',
          'IMD_API_KEY server secret is not configured.',
        );
        return jsonResponse(fallback, 200, headers);
      } catch (fallbackError) {
        const detail = fallbackError instanceof Error && fallbackError.name === 'AbortError'
          ? 'The weather request timed out.'
          : 'Weather data is unavailable (IMD not configured and fallback failed).';
        return jsonResponse({ error: detail, status: 'unavailable' }, 200, headers);
      }
    }

    try {
      const imd = await fetchFromImd(apiKey, lat, lon, district);
      return jsonResponse(imd, 200, headers);
    } catch (error) {
      const imdError = error instanceof Error && error.name === 'AbortError'
        ? 'IMD weather service request timed out.'
        : error instanceof Error
          ? error.message
          : 'IMD weather service is unavailable.';
      // 2) Clearly-labelled fallback — NEVER presented as IMD.
      try {
        const fallback = await fetchFromOpenMeteo(
          lat,
          lon,
          'IMD weather service is temporarily unavailable. Showing Open-Meteo (fallback) data — not official IMD data.',
          imdError,
        );
        return jsonResponse(fallback, 200, headers);
      } catch (fallbackError) {
        const detail = fallbackError instanceof Error && fallbackError.name === 'AbortError'
          ? 'The weather request timed out.'
          : 'Both IMD and fallback weather sources are unavailable.';
        return jsonResponse({ error: detail, status: 'unavailable' }, 200, headers);
      }
    }
  } catch {
    return jsonResponse({ error: 'Unexpected server error.', status: 'unavailable' }, 200, headers);
  }
});