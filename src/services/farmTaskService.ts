import { supabase } from './supabaseClient';

export interface FarmTask {
  id: string;
  task_type: string;
  title: string;
  task_date: string;
  task_time: string | null;
  repeat_type: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export type TaskType = 'irrigation' | 'fertilizer' | 'inspection' | 'pest_monitoring' | 'harvest' | 'other';

const TASK_TYPE_LABELS: Record<string, string> = {
  irrigation: 'Irrigation',
  fertilizer: 'Fertilizer',
  inspection: 'Field Inspection',
  pest_monitoring: 'Pest Monitoring',
  harvest: 'Harvest',
  other: 'Other',
};

export function getTaskTypeLabel(type: string): string {
  return TASK_TYPE_LABELS[type] || type;
}

export async function fetchFarmTasks(): Promise<FarmTask[]> {
  const { data, error } = await supabase
    .from('farm_tasks')
    .select('*')
    .order('task_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createFarmTask(task: {
  task_type: string;
  title: string;
  task_date: string;
  task_time?: string | null;
  repeat_type?: string;
  notes?: string | null;
}): Promise<FarmTask | null> {
  const { data, error } = await supabase
    .from('farm_tasks')
    .insert({
      task_type: task.task_type,
      title: task.title,
      task_date: task.task_date,
      task_time: task.task_time || null,
      repeat_type: task.repeat_type || 'none',
      notes: task.notes || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('farm_tasks')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteFarmTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('farm_tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
