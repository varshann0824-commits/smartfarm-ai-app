import type { LocationInfo } from '@/types';

const STORAGE_KEY = 'smartfarm_location';

interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

interface ForwardGeocodeResult extends GPSCoordinates {
  state: string;
  district: string;
  city: string;
}

type GPSResult = GPSCoordinates | null;
type ForwardGeocodeReturn = ForwardGeocodeResult | null;

export async function getGPSLocation(): Promise<GPSResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        if (import.meta.env.DEV) {
          console.warn('Geolocation error:', err.message);
        }
        resolve(null);
      },
      { timeout: 15000, maximumAge: 60000, enableHighAccuracy: true },
    );
  });
}

export async function reverseGeocode(lat: number, lon: number, lang = 'en'): Promise<Partial<LocationInfo>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': lang } },
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};
    return {
      country: addr.country || 'India',
      state: addr.state || addr.state_district || '',
      district: addr.county || addr.state_district || addr.district || '',
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      village: addr.village || addr.hamlet || null,
      pincode: addr.postcode || null,
    };
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
    const addr = result.address || {};
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      state: addr.state || '',
      district: addr.county || addr.state_district || addr.district || '',
      city: addr.city || addr.town || addr.village || '',
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
