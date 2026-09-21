import type { LocationInfo } from '@/types';

const STORAGE_KEY = 'smartfarm_location';

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy in meters, when provided by the browser. */
  accuracy: number | null;
  /** Which geolocation source produced this fix (gps / network / unknown). */
  source: 'gps' | 'network' | 'unknown';
}

interface ForwardGeocodeResult extends GPSCoordinates {
  state: string;
  district: string;
  city: string;
}

type GPSResult = GPSCoordinates | null;
type ForwardGeocodeReturn = ForwardGeocodeResult | null;

/** Distinct reasons GPS can fail — used for honest, actionable UI copy. */
export type GPSFailureReason = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export interface GPSFailure {
  reason: GPSFailureReason;
  message: string;
}

export async function getGPSLocation(): Promise<GPSResult> {
  const failure = await getGPSLocationDetailed();
  return failure.coords;
}

/**
 * Detailed GPS read that reports WHY automatic location failed so the UI can
 * explain it honestly and offer manual entry — never a silent fallback city.
 */
export async function getGPSLocationDetailed(): Promise<{ coords: GPSResult; failure: GPSFailure | null }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        coords: null,
        failure: {
          reason: 'unsupported',
          message: 'This browser or device does not support automatic location. Please enter your location manually.',
        },
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Coarse/inaccurate fixes are still honest GPS data; the UI labels
        // them as approximate instead of claiming false precision.
        const accuracy = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null;
        // Log the real values the browser returned so the displayed location
        // can always be traced back to actual device coordinates.
        logLocationDebug('GPS position', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: accuracy,
          timestamp: pos.timestamp,
        });
        resolve({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy,
            source: accuracy !== null && accuracy > 5000 ? 'network' : accuracy !== null ? 'gps' : 'unknown',
          },
          failure: null,
        });
      },
      (err) => {
        if (import.meta.env.DEV) {
          console.warn('Geolocation error:', err.message);
        }
        const reason: GPSFailureReason =
          err.code === 1 ? 'denied' : err.code === 2 ? 'unavailable' : err.code === 3 ? 'timeout' : 'unavailable';
        const message =
          reason === 'denied'
            ? 'Location permission was denied. Automatic location could not be obtained — please allow location access or enter your location manually.'
            : reason === 'timeout'
              ? 'Locating you timed out. Automatic location could not be obtained — please try again or enter your location manually.'
              : 'Your position is currently unavailable. Automatic location could not be obtained — please try again or enter your location manually.';
        resolve({ coords: null, failure: { reason, message } });
      },
      // maximumAge: 0 forces a FRESH fix every time — a cached fix is exactly
      // what produced "wrong auto location" reports. enableHighAccuracy with a
      // generous timeout so real GPS gets a chance before we report failure.
      { timeout: 20000, maximumAge: 0, enableHighAccuracy: true },
    );
  });
}

/** Nominatim address fields vary by place; read every plausible key. */
function pickAddressField(addr: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = addr[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * Field priority for the human-readable place name.
 *
 * Indian Nominatim responses DO NOT reliably contain `city`. Verified against
 * live responses:
 *   14.6819,77.6006 -> { city: 'Anantapur', county: 'Anantapur',
 *                        state_district: 'Anantapuram' }
 *   13.1500,77.6000 -> NO city/town at all. Only { city_district: 'Sughatta',
 *                        village: 'Suggatta', county: 'Yelahanka taluku',
 *                        state_district: 'Bengaluru Urban' }
 *   17.3850,78.4867 -> { city: 'Hyderabad', county: 'Nampally mandal',
 *                        city_district: 'Greater Hyderabad Municipal...' }
 *
 * Reading only `address.city` yields an empty or mismatched label, and
 * `county` is a taluk/tehsil (`Nampally mandal`, `Yelahanka taluku`) — not a
 * city. So the order is: real city-level names first, then the local area,
 * then taluk/district-level fields only as a last resort. `city_district` is
 * the local area/ward name and was previously ignored entirely.
 */
const CITY_KEYS = [
  'city', 'town', 'municipality',
  'city_district', 'village', 'hamlet', 'suburb', 'neighbourhood', 'locality',
  'county', 'state_district',
];
const DISTRICT_KEYS = ['state_district', 'district', 'county', 'city_district', 'region'];
const STATE_KEYS = ['state', 'district', 'region', 'state_district'];
const LOCALITY_KEYS = ['village', 'hamlet', 'suburb', 'neighbourhood', 'city_district', 'locality'];

/**
 * Development-only diagnostics: prints the exact coordinates the browser
 * returned and the raw reverse-geocoding response with the fields actually
 * chosen for city/district/state, so a wrong label can be traced to either
 * the fix itself or the field mapping instead of being guessed at.
 */
function logLocationDebug(label: string, payload: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[SmartFarm location] ${label}`, payload);
  }
}

export async function reverseGeocode(lat: number, lon: number, lang = 'en'): Promise<Partial<LocationInfo>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': lang } },
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = (data.address || {}) as Record<string, string>;
    const picked = {
      country: addr.country || 'India',
      state: pickAddressField(addr, STATE_KEYS),
      district: pickAddressField(addr, DISTRICT_KEYS),
      city: pickAddressField(addr, CITY_KEYS),
      village: pickAddressField(addr, LOCALITY_KEYS) || null,
      pincode: pickAddressField(addr, ['postcode']) || null,
    };
    logLocationDebug('reverse geocoding result', {
      requested: { lat, lon },
      // The coordinates Nominatim itself resolved, to prove the fix used was
      // the one we asked about.
      resolved: { lat: data.lat, lon: data.lon, displayName: data.display_name },
      rawAddressFields: Object.keys(addr).length ? addr : '(empty address object)',
      chosenForUI: {
        city: picked.city,
        district: picked.district,
        state: picked.state,
      },
    });
    return picked;
  } catch {
    return {};
  }
}

export async function forwardGeocode(query: string): Promise<ForwardGeocodeReturn> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const result = data[0];
    const addr = (result.address || {}) as Record<string, string>;
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      accuracy: null,
      source: 'unknown',
      state: pickAddressField(addr, STATE_KEYS),
      district: pickAddressField(addr, DISTRICT_KEYS),
      city: pickAddressField(addr, CITY_KEYS),
    };
  } catch {
    return null;
  }
}

export function saveLocation(loc: LocationInfo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // Storage may be unavailable in private browsing
  }
}

export function loadLocation(): LocationInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocationInfo;
  } catch {
    return null;
  }
}

export function clearLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function defaultLocation(): LocationInfo {
  return {
    latitude: null,
    longitude: null,
    country: 'India',
    state: '',
    district: '',
    city: '',
    village: null,
    pincode: null,
    source: 'fallback',
  };
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
