import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { fetchFarmTasks, createFarmTask, updateTaskStatus, deleteFarmTask, getTaskTypeLabel, type FarmTask, type TaskType } from '@/services/farmTaskService';
import { Plus, Trash2, Check, Circle, Calendar, Clock, Repeat, AlertCircle } from 'lucide-react';

const TASK_TYPES: TaskType[] = ['irrigation', 'fertilizer', 'inspection', 'pest_monitoring', 'harvest', 'other'];
const REPEAT_TYPES = ['none', 'daily', 'weekly', 'monthly'];

const TASK_ICONS: Record<string, string> = {
  irrigation: '💧',
  fertilizer: '🌱',
  inspection: '🔍',
  pest_monitoring: '🐛',
  harvest: '🌾',
  other: '📋',
};

export function FarmTasksPage() {
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    task_type: 'irrigation' as TaskType,
    title: '',
    task_date: '',
    task_time: '',
    repeat_type: 'none',
    notes: '',
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFarmTasks();
      setTasks(data);
    } catch {
      setError('Unable to load tasks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.task_date) return;
    try {
      await createFarmTask({
        task_type: form.task_type,
        title: form.title.trim(),
        task_date: form.task_date,
        task_time: form.task_time || null,
        repeat_type: form.repeat_type,
        notes: form.notes || null,
      });
      setForm({ task_type: 'irrigation', title: '', task_date: '', task_time: '', repeat_type: 'none', notes: '' });
      setShowForm(false);
      await loadTasks();
    } catch {
      setError('Unable to save task. Please try again.');
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateTaskStatus(id, newStatus);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch {
      setError('Unable to update task. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFarmTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      setError('Unable to delete task. Please try again.');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = tasks.filter(t => t.status === 'pending' && t.task_date >= today);
  const overdue = tasks.filter(t => t.status === 'pending' && t.task_date < today);
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <PageWrapper title="📋 Farm Tasks">
      {error && (
        <div className="card mb-4 bg-red-50 border-red-200 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}<button onClick={() => setError(null)} className="ml-2 underline font-medium">Dismiss</button></div>
        </div>
      )}

      <button
        onClick={() => setShowForm(s => !s)}
        className="btn btn-primary w-full mb-4 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Create New Task
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Task Type</label>
            <select
              value={form.task_type}
              onChange={e => setForm({ ...form, task_type: e.target.value as TaskType })}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
            >
              {TASK_TYPES.map(tt => <option key={tt} value={tt}>{TASK_ICONS[tt]} {getTaskTypeLabel(tt)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Irrigate cotton field"
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
              <input
                type="date"
                value={form.task_date}
                onChange={e => setForm({ ...form, task_date: e.target.value })}
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Time (optional)</label>
              <input
                type="time"
                value={form.task_time}
                onChange={e => setForm({ ...form, task_time: e.target.value })}
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Repeat</label>
            <select
              value={form.repeat_type}
              onChange={e => setForm({ ...form, repeat_type: e.target.value })}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
            >
              {REPEAT_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional details..."
              rows={2}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">Save Task</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-stone-500">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-8 text-stone-500">
          <p className="text-sm">No tasks yet. Create a task to get reminders for irrigation, fertilizer, inspection, and more.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Overdue ({overdue.length})
              </h3>
              <div className="space-y-2">
                {overdue.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Upcoming ({upcoming.length})
              </h3>
              <div className="space-y-2">
                {upcoming.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Completed ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

function TaskItem({ task, onToggle, onDelete }: {
  task: FarmTask;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'pending' && task.task_date < new Date().toISOString().split('T')[0];

  return (
    <div className={`card flex items-start gap-3 ${isCompleted ? 'opacity-60' : ''} ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
      <button
        onClick={() => onToggle(task.id, task.status)}
        className="mt-0.5 flex-shrink-0"
        aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
      >
        {isCompleted ? <Check className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-stone-400" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-stone-500' : 'text-stone-800'}`}>
          {TASK_ICONS[task.task_type]} {task.title}
        </p>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-500">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.task_date}</span>
          {task.task_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.task_time}</span>}
          {task.repeat_type !== 'none' && <span className="flex items-center gap-1"><Repeat className="w-3 h-3" />{task.repeat_type}</span>}
        </div>
        {task.notes && <p className="text-xs text-stone-500 mt-1">{task.notes}</p>}
      </div>
      <button onClick={() => onDelete(task.id)} className="flex-shrink-0 text-stone-400 hover:text-red-600" aria-label="Delete task">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
