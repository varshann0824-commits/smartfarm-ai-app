import { supabase } from './supabaseClient';

export interface CropAnalysisRecord {
  id: string;
  crop: string;
  problem: string;
  confidence: string | null;
  symptoms: string | null;
  causes: string | null;
  recommendations: string | null;
  created_at: string;
}

export async function saveCropAnalysis(analysis: {
  crop: string;
  problem: string;
  confidence?: string | null;
  symptoms?: string | null;
  causes?: string | null;
  recommendations?: string | null;
}): Promise<CropAnalysisRecord | null> {
  const { data, error } = await supabase
    .from('crop_analyses')
    .insert({
      crop: analysis.crop,
      problem: analysis.problem,
      confidence: analysis.confidence || null,
      symptoms: analysis.symptoms || null,
      causes: analysis.causes || null,
      recommendations: analysis.recommendations || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCropAnalyses(): Promise<CropAnalysisRecord[]> {
  const { data, error } = await supabase
    .from('crop_analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteCropAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('crop_analyses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
