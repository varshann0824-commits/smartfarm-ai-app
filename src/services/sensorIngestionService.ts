import { supabase } from './supabaseClient';

export interface SensorReading {
  id: string;
  sensor_id: string | null;
  device_id: string;
  farm_id: string;
  field_id: string | null;
  recorded_at: string;
  soil_moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  rainfall_mm: number | null;
  water_level: number | null;
  battery_voltage: number | null;
  signal_strength: number | null;
  data_source: string | null;
  is_valid: boolean;
  created_at: string;
}

export interface SensorReadingInsert {
  farm_id: string;
  device_id: string;
  sensor_id?: string | null;
  field_id?: string | null;
  recorded_at?: string;
  soil_moisture?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  rainfall_mm?: number | null;
  water_level?: number | null;
  battery_voltage?: number | null;
  signal_strength?: number | null;
  data_source: string;
  is_valid?: boolean;
}

export interface RecentSensorReadingsOptions {
  farmId: string;
  deviceId?: string;
  sensorId?: string;
  fieldId?: string;
  limit?: number;
}

export interface LiveSensorDevice {
  id: string;
  status: string | null;
  last_seen_at: string | null;
}

export interface LiveSensorData {
  farmId: string | null;
  fieldId: string | null;
  device: LiveSensorDevice | null;
  reading: SensorReading | null;
}

const SENSOR_VALUE_KEYS = [
  'soil_moisture',
  'temperature',
  'humidity',
  'rainfall_mm',
  'water_level',
  'battery_voltage',
  'signal_strength',
] as const;

function hasMeasuredValue(reading: SensorReadingInsert): boolean {
  return SENSOR_VALUE_KEYS.some((key) => reading[key] !== null && reading[key] !== undefined);
}

function validateReading(reading: SensorReadingInsert): void {
  if (!reading.farm_id.trim()) throw new Error('farm_id is required to insert a sensor reading.');
  if (!reading.device_id.trim()) throw new Error('device_id is required to insert a sensor reading.');
  if (!reading.data_source.trim()) throw new Error('data_source is required to insert a sensor reading.');
  if (!hasMeasuredValue(reading)) throw new Error('At least one measured sensor value is required.');
}

export async function readRecentSensorReadings(
  options: RecentSensorReadingsOptions,
): Promise<SensorReading[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  let query = supabase
    .from('sensor_readings')
    .select('*')
    .eq('farm_id', options.farmId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (options.deviceId) query = query.eq('device_id', options.deviceId);
  if (options.sensorId) query = query.eq('sensor_id', options.sensorId);
  if (options.fieldId) query = query.eq('field_id', options.fieldId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SensorReading[];
}

export async function readLatestLiveSensorData(): Promise<LiveSensorData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return { farmId: null, fieldId: null, device: null, reading: null };

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (farmError) throw farmError;
  if (!farm) return { farmId: null, fieldId: null, device: null, reading: null };

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('id, status, last_seen_at, field_id')
    .eq('farm_id', farm.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (deviceError) throw deviceError;
  if (!device) return { farmId: farm.id, fieldId: null, device: null, reading: null };

  const readings = await readRecentSensorReadings({
    farmId: farm.id,
    deviceId: device.id,
    fieldId: device.field_id ?? undefined,
    limit: 100,
  });
  const validReadings = readings.filter((reading) => reading.is_valid && reading.data_source !== 'development_test');
  const sensorReading = validReadings.find((reading) => reading.data_source === 'sensor') ?? validReadings[0] ?? null;

  return {
    farmId: farm.id,
    fieldId: device.field_id ?? sensorReading?.field_id ?? null,
    device: { id: device.id, status: device.status, last_seen_at: device.last_seen_at },
    reading: sensorReading,
  };
}

export async function insertSensorReading(reading: SensorReadingInsert): Promise<SensorReading> {
  validateReading(reading);

  const { data, error } = await supabase
    .from('sensor_readings')
    .insert({
      farm_id: reading.farm_id,
      device_id: reading.device_id,
      sensor_id: reading.sensor_id ?? null,
      field_id: reading.field_id ?? null,
      recorded_at: reading.recorded_at ?? new Date().toISOString(),
      soil_moisture: reading.soil_moisture ?? null,
      temperature: reading.temperature ?? null,
      humidity: reading.humidity ?? null,
      rainfall_mm: reading.rainfall_mm ?? null,
      water_level: reading.water_level ?? null,
      battery_voltage: reading.battery_voltage ?? null,
      signal_strength: reading.signal_strength ?? null,
      data_source: reading.data_source,
      is_valid: reading.is_valid ?? true,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as SensorReading;
}

export interface SensorSimulatorInput {
  farm_id: string;
  device_id: string;
  sensor_id?: string | null;
  field_id?: string | null;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  rainfall_mm?: number;
  water_level?: number;
  battery_voltage?: number;
  signal_strength?: number;
}

export async function simulateSensorReading(input: SensorSimulatorInput): Promise<SensorReading> {
  if (!import.meta.env.DEV) {
    throw new Error('Simulated sensor readings are available only in development mode.');
  }

  return insertSensorReading({
    farm_id: input.farm_id,
    device_id: input.device_id,
    sensor_id: input.sensor_id,
    field_id: input.field_id,
    soil_moisture: input.soil_moisture ?? 45,
    temperature: input.temperature ?? 28,
    humidity: input.humidity ?? 65,
    rainfall_mm: input.rainfall_mm ?? 0,
    water_level: input.water_level ?? 0,
    battery_voltage: input.battery_voltage ?? 3.7,
    signal_strength: input.signal_strength ?? -65,
    data_source: 'development-simulator',
  });
}

export interface DevelopmentSensorRoundTripResult {
  farmId: string;
  deviceId: string;
  inserted: SensorReading;
  verified: SensorReading;
}

export type DevelopmentSensorOperation =
  | 'unknown'
  | 'authenticated user lookup'
  | 'farm lookup'
  | 'device lookup'
  | 'insert sensor_reading'
  | 'read-back sensor_reading';

export class DevelopmentSensorTestError extends Error {
  readonly operation: DevelopmentSensorOperation;
  readonly code: string | null;
  readonly details: string | null;
  readonly hint: string | null;
  readonly originalError: unknown;

  constructor(operation: DevelopmentSensorOperation, originalError: unknown) {
    const errorRecord = typeof originalError === 'object' && originalError !== null
      ? originalError as Record<string, unknown>
      : null;
    const message = typeof errorRecord?.message === 'string'
      ? errorRecord.message
      : originalError instanceof Error
        ? originalError.message
        : 'The development sensor test failed.';
    super(message);
    this.name = 'DevelopmentSensorTestError';
    this.operation = operation;
    this.code = typeof errorRecord?.code === 'string' ? errorRecord.code : null;
    this.details = typeof errorRecord?.details === 'string' ? errorRecord.details : null;
    this.hint = typeof errorRecord?.hint === 'string' ? errorRecord.hint : null;
    this.originalError = originalError;
  }
}

export async function runDevelopmentSensorRoundTrip(): Promise<DevelopmentSensorRoundTripResult> {
  if (!import.meta.env.DEV) {
    throw new Error('The sensor database round-trip is available only in development mode.');
  }

  let userData;
  try {
    const response = await supabase.auth.getUser();
    if (response.error) throw response.error;
    userData = response.data;
    if (!userData.user) throw new Error('No authenticated Supabase user is available.');
  } catch (error) {
    throw new DevelopmentSensorTestError('authenticated user lookup', error);
  }

  let farm;
  try {
    const response = await supabase
      .from('farms')
      .select('id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle();
    if (response.error) throw response.error;
    farm = response.data;
    if (!farm) throw new Error('The authenticated user has no farm record.');
  } catch (error) {
    throw new DevelopmentSensorTestError('farm lookup', error);
  }

  let device;
  try {
    const response = await supabase
      .from('devices')
      .select('id, farm_id')
      .eq('farm_id', farm.id)
      .limit(1)
      .maybeSingle();
    if (response.error) throw response.error;
    device = response.data;
    if (!device) throw new Error(`Farm ${farm.id} has no device record.`);
  } catch (error) {
    throw new DevelopmentSensorTestError('device lookup', error);
  }

  let inserted: SensorReading;
  try {
    inserted = await insertSensorReading({
      farm_id: farm.id,
      device_id: device.id,
      soil_moisture: null,
      temperature: 25,
      humidity: null,
      rainfall_mm: null,
      water_level: null,
      battery_voltage: null,
      signal_strength: null,
      data_source: 'development_test',
      is_valid: false,
    });
  } catch (error) {
    throw new DevelopmentSensorTestError('insert sensor_reading', error);
  }

  let verified;
  try {
    const response = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('id', inserted.id)
      .eq('farm_id', farm.id)
      .eq('device_id', device.id)
      .eq('data_source', 'development_test')
      .single();
    if (response.error) throw response.error;
    verified = response.data;
  } catch (error) {
    throw new DevelopmentSensorTestError('read-back sensor_reading', error);
  }

  const result = { farmId: farm.id, deviceId: device.id, inserted, verified: verified as SensorReading };
  console.info('[smartfarm][development_test] Sensor reading round trip verified.', result);
  return result;
}
