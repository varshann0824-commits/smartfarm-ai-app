import { supabase } from './supabaseClient';

export const DEVELOPMENT_FARM_ID = '1fd499ab-0acc-469e-aaec-6c6e09b868f1';

export interface FieldRecord {
  id: string;
  farm_id: string;
  name: string;
  crop_name: string | null;
  crop_variety: string | null;
  area_acres: number | null;
  sowing_date: string | null;
  expected_harvest: string | null;
  growth_stage: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldCreateInput {
  name: string;
  crop_name: string;
  crop_variety?: string | null;
  area_acres?: number | null;
  sowing_date?: string | null;
  expected_harvest?: string | null;
  growth_stage?: string | null;
}

export interface FieldSetupResult {
  field: FieldRecord;
  created: boolean;
}

export async function createDevelopmentField(input: FieldCreateInput): Promise<FieldSetupResult> {
  const name = input.name.trim();
  const cropName = input.crop_name.trim();
  if (!name) throw new Error('Field name is required.');
  if (!cropName) throw new Error('Crop name is required.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Please sign in before creating a field.');

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id')
    .eq('id', DEVELOPMENT_FARM_ID)
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (farmError) throw farmError;
  if (!farm) throw new Error(`The authenticated user does not own farm ${DEVELOPMENT_FARM_ID}.`);

  const { data: existingField, error: fieldLookupError } = await supabase
    .from('fields')
    .select('*')
    .eq('farm_id', farm.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fieldLookupError) throw fieldLookupError;
  if (existingField) return { field: existingField as FieldRecord, created: false };

  const { data, error } = await supabase
    .from('fields')
    .insert({
      farm_id: farm.id,
      name,
      crop_name: cropName,
      crop_variety: input.crop_variety?.trim() || null,
      area_acres: input.area_acres ?? null,
      sowing_date: input.sowing_date || null,
      expected_harvest: input.expected_harvest || null,
      growth_stage: input.growth_stage?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { field: data as FieldRecord, created: true };
}
