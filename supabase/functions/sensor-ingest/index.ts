// Supabase Edge Function: sensor-ingest
//
// ESP32 devices call this HTTPS endpoint with a device token. The token and
// Supabase service credential stay server-side; neither is sent to the browser
// or firmware. The device UID is used to derive farm_id, field_id, and
// device_id from public.devices. Client-supplied ownership IDs are rejected.
//
// Required server-side environment variables:
//   SENSOR_INGEST_TOKEN     - shared prototype token for the registered device
//   SUPABASE_URL             - Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - server-only key, never expose to a device/client

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SENSOR_FIELDS = [
  'soil_moisture',
  'temperature',
  'humidity',
  'rainfall_mm',
  'water_level',
  'battery_voltage',
  'signal_strength',
] as const;

type SensorField = typeof SENSOR_FIELDS[number];

type SensorPayload = {
  device_uid: string;
  recorded_at: string;
} & Partial<Record<SensorField, number | null>>;

interface RegisteredDevice {
  id: string;
  farm_id: string;
  field_id: string | null;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function validateNumericField(field: SensorField, value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number or null.`);
  }

  const ranges: Partial<Record<SensorField, [number, number]>> = {
    soil_moisture: [0, 100],
    temperature: [-100, 100],
    humidity: [0, 100],
    rainfall_mm: [0, Number.MAX_VALUE],
    water_level: [0, Number.MAX_VALUE],
    battery_voltage: [0, 100],
    signal_strength: [-200, 100],
  };
  const range = ranges[field];
  if (range && (value < range[0] || value > range[1])) {
    throw new Error(`${field} is outside the accepted range.`);
  }
  return value;
}

function parsePayload(body: unknown): SensorPayload {
  if (!isRecord(body)) throw new Error('Request body must be a JSON object.');

  for (const ownershipField of ['farm_id', 'field_id', 'device_id', 'sensor_id', 'data_source', 'is_valid']) {
    if (ownershipField in body) {
      throw new Error(`${ownershipField} is not accepted from the device; ownership is derived from device_uid.`);
    }
  }

  const deviceUid = text(body.device_uid);
  const recordedAt = text(body.recorded_at);
  if (!deviceUid) throw new Error('device_uid is required.');
  if (!recordedAt) throw new Error('recorded_at is required.');
  const recordedDate = new Date(recordedAt);
  if (Number.isNaN(recordedDate.getTime())) throw new Error('recorded_at must be a valid ISO-8601 timestamp.');

  const payload = { device_uid: deviceUid, recorded_at: recordedDate.toISOString() } as SensorPayload;
  let hasMeasurement = false;
  for (const field of SENSOR_FIELDS) {
    const value = validateNumericField(field, body[field]);
    payload[field] = value;
    if (value !== null) hasMeasurement = true;
  }
  if (!hasMeasurement) throw new Error('At least one sensor measurement is required.');
  return payload;
}

function getDatabaseClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('Server database configuration is missing.');
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

serve(async (request: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-device-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, headers);

  const expectedToken = Deno.env.get('SENSOR_INGEST_TOKEN');
  const providedToken = request.headers.get('x-device-token');
  if (!expectedToken) return jsonResponse({ ok: false, error: 'Device ingestion is not configured.' }, 503, headers);
  if (!providedToken || !constantTimeEqual(providedToken, expectedToken)) {
    return jsonResponse({ ok: false, error: 'Invalid device authentication.' }, 401, headers);
  }

  let payload: SensorPayload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : 'Invalid request payload.' }, 400, headers);
  }

  try {
    const supabase = getDatabaseClient();
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, farm_id, field_id')
      .eq('device_uid', payload.device_uid)
      .maybeSingle<RegisteredDevice>();
    if (deviceError) throw deviceError;
    if (!device) return jsonResponse({ ok: false, error: 'Unknown device_uid.' }, 404, headers);
    if (!device.field_id) return jsonResponse({ ok: false, error: 'Registered device has no field assignment.' }, 409, headers);

    const { data: reading, error: readingError } = await supabase
      .from('sensor_readings')
      .insert({
        device_id: device.id,
        farm_id: device.farm_id,
        field_id: device.field_id,
        recorded_at: payload.recorded_at,
        soil_moisture: payload.soil_moisture ?? null,
        temperature: payload.temperature ?? null,
        humidity: payload.humidity ?? null,
        rainfall_mm: payload.rainfall_mm ?? null,
        water_level: payload.water_level ?? null,
        battery_voltage: payload.battery_voltage ?? null,
        signal_strength: payload.signal_strength ?? null,
        data_source: 'sensor',
        is_valid: true,
      })
      .select('id, recorded_at, data_source, is_valid')
      .single();
    if (readingError) throw readingError;

    return jsonResponse({
      ok: true,
      reading_id: reading.id,
      device_uid: payload.device_uid,
      farm_id: device.farm_id,
      field_id: device.field_id,
      recorded_at: reading.recorded_at,
      data_source: reading.data_source,
      is_valid: reading.is_valid,
    }, 201, headers);
  } catch (error) {
    console.error('[sensor-ingest] database operation failed', error);
    return jsonResponse({ ok: false, error: 'Sensor reading could not be stored.' }, 500, headers);
  }
});
