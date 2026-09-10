// Google Maps integration for soil testing locations.
// This service is credential-aware: if no Google Maps API key is configured
// server-side, it shows a clear unavailable state instead of faking results.

export interface MapsAvailability {
  available: boolean;
  reason: 'configured' | 'no-api-key' | 'not-supported';
  message: string;
}

export interface SoilTestLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: string;
  verified: boolean;
}

// Check if Google Maps is available.
// The API key must be provided server-side (e.g., via Supabase Edge Function)
// and passed to the client. We never expose the key in VITE_ env vars.
export function checkMapsAvailability(): MapsAvailability {
  // Check if a server-provided key is available (injected at runtime, not in VITE_ env)
  const serverKey = (window as unknown as { __SMARTFARM_GOOGLE_MAPS_KEY__?: string }).__SMARTFARM_GOOGLE_MAPS_KEY__;
  if (!serverKey) {
    return {
      available: false,
      reason: 'no-api-key',
      message: 'Google Maps is not configured. A server-side API key is required to show soil testing locations on a map. Please contact the administrator to configure Google Maps API access.',
    };
  }
  return {
    available: true,
    reason: 'configured',
    message: 'Google Maps is available.',
  };
}

// Search for soil testing locations near a given location.
// This uses the Google Places API (server-side key required).
// We never invent locations - if the API returns no results, we show that.
export async function searchSoilTestingLocations(
  lat: number,
  lon: number,
  radiusMeters = 50000,
): Promise<{ locations: SoilTestLocation[]; available: boolean; message: string }> {
  const availability = checkMapsAvailability();
  if (!availability.available) {
    return { locations: [], available: false, message: availability.message };
  }

  try {
    const serverKey = (window as unknown as { __SMARTFARM_GOOGLE_MAPS_KEY__?: string }).__SMARTFARM_GOOGLE_MAPS_KEY__;
    // Use the Google Places API to search for soil testing labs
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&keyword=soil+testing+laboratory&key=${serverKey}`,
    );
    if (!res.ok) throw new Error('Google Maps API request failed');
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const locations: SoilTestLocation[] = (data.results || []).map((place: {
      name?: string;
      vicinity?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }) => ({
      name: place.name || 'Unknown location',
      address: place.vicinity || '',
      latitude: place.geometry?.location?.lat ?? 0,
      longitude: place.geometry?.location?.lng ?? 0,
      source: 'Google Maps Places API',
      verified: true,
    }));

    return {
      locations,
      available: true,
      message: locations.length > 0
        ? `Found ${locations.length} soil testing location(s) near you.`
        : 'No soil testing locations found within the search radius. Try increasing the radius or searching in a nearby town.',
    };
  } catch (error) {
    return {
      locations: [],
      available: false,
      message: error instanceof Error ? error.message : 'Google Maps search failed. Please try again.',
    };
  }
}

// Build a Google Maps embed URL for a location (no API key needed for basic embed)
export function getGoogleMapsEmbedUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}&z=14&output=embed`;
}

// Build a Google Maps directions URL (no API key needed)
export function getGoogleMapsDirectionsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

// Build a Google Maps search URL for soil testing labs near a location (no API key needed)
export function getGoogleMapsSearchUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/soil+testing+laboratory/@${lat},${lon},14z`;
}