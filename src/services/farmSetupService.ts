import { supabase } from './supabaseClient';

export interface FarmRecord {
  id: string;
  user_id: string;
  name: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  area_acres: number | null;
  soil_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmCreateInput {
  name: string;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area_acres?: number | null;
  soil_type?: string | null;
}

export interface FarmSetupErrorDetails {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
}

export function getFarmSetupErrorDetails(error: unknown): FarmSetupErrorDetails {
  const record = typeof error === 'object' && error !== null ? error as Record<string, unknown> : null;
  const text = (value: unknown): string | null => typeof value === 'string' && value ? value : null;
  return {
    message: text(record?.message) ?? (error instanceof Error ? error.message : 'Farm setup failed.'),
    code: text(record?.code),
    details: text(record?.details),
    hint: text(record?.hint),
  };
}

export async function findCurrentUserFarm(): Promise<FarmRecord | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as FarmRecord | null;
}

export async function createCurrentUserFarm(input: FarmCreateInput): Promise<FarmRecord> {
  const name = input.name.trim();
  if (!name) throw new Error('Farm name is required.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Please sign in before creating a farm.');

  const existingFarm = await findCurrentUserFarm();
  if (existingFarm) return existingFarm;

  const { data, error } = await supabase
    .from('farms')
    .insert({
      user_id: userData.user.id,
      name,
      location_name: input.location_name?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      area_acres: input.area_acres ?? null,
      soil_type: input.soil_type?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as FarmRecord;
}
