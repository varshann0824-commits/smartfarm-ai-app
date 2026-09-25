import { supabase } from './supabaseClient';
import { DEVELOPMENT_FARM_ID } from './fieldSetupService';

export const DEVELOPMENT_FIELD_ID = '23ef72cf-eafd-4c84-b985-1b20e89f0048';

export interface DeviceRecord {
  id: string;
  device_uid: string;
  farm_id: string;
  field_id: string | null;
  device_type: string;
  name: string | null;
  firmware_version: string | null;
  status: string | null;
  last_seen_at: string | null;
  battery_percent: number | null;
  signal_strength: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreateInput {
  device_uid: string;
  name?: string | null;
  device_type: string;
  firmware_version?: string | null;
}

export interface DeviceSetupResult {
  device: DeviceRecord;
  created: boolean;
}

export async function createDevelopmentDevice(input: DeviceCreateInput): Promise<DeviceSetupResult> {
  const deviceUid = input.device_uid.trim();
  const deviceType = input.device_type.trim();
  if (!deviceUid) throw new Error('Device UID is required. Enter the real hardware UID.');
  if (!deviceType) throw new Error('Device type is required.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Please sign in before creating a device.');

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id')
    .eq('id', DEVELOPMENT_FARM_ID)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (farmError) throw farmError;
  if (!farm) throw new Error(`The authenticated user does not own farm ${DEVELOPMENT_FARM_ID}.`);

  const { data: field, error: fieldError } = await supabase
    .from('fields')
    .select('id, farm_id')
    .eq('id', DEVELOPMENT_FIELD_ID)
    .eq('farm_id', farm.id)
    .maybeSingle();
  if (fieldError) throw fieldError;
  if (!field) throw new Error(`Field ${DEVELOPMENT_FIELD_ID} does not belong to farm ${farm.id}.`);

  const { data: existingDevice, error: deviceLookupError } = await supabase
    .from('devices')
    .select('*')
    .eq('device_uid', deviceUid)
    .maybeSingle();
  if (deviceLookupError) throw deviceLookupError;
  if (existingDevice) {
    const existing = existingDevice as DeviceRecord;
    if (existing.farm_id !== farm.id || existing.field_id !== field.id) {
      throw new Error(`Device UID ${deviceUid} is already registered to another farm or field.`);
    }
    return { device: existing, created: false };
  }

  const { data, error } = await supabase
    .from('devices')
    .insert({
      device_uid: deviceUid,
      farm_id: farm.id,
      field_id: field.id,
      device_type: deviceType,
      name: input.name?.trim() || null,
      firmware_version: input.firmware_version?.trim() || null,
      status: 'offline',
    })
    .select('*')
    .single();
  if (error) throw error;
  return { device: data as DeviceRecord, created: true };
}
