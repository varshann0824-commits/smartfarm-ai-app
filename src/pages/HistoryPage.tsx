import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { fetchCropAnalyses, deleteCropAnalysis, type CropAnalysisRecord } from '@/services/analysisHistoryService';
import { Trash2, History, AlertCircle, Sprout } from 'lucide-react';

export function HistoryPage() {
  const [analyses, setAnalyses] = useState<CropAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCropAnalyses();
      setAnalyses(data);
    } catch {
      setError('Unable to load analysis history. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCropAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch {
      setError('Unable to delete analysis record. Please try again.');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <PageWrapper title="📜 Analysis History">
      {error && (
        <div className="card mb-4 bg-red-50 border-red-200 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}<button onClick={() => setError(null)} className="ml-2 underline font-medium">Dismiss</button></div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-stone-500">Loading analysis history...</div>
      ) : analyses.length === 0 ? (
        <div className="card text-center py-8">
          <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-500">
            No previous analyses found. When you analyze a crop problem, the results will be saved here for future reference.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((record) => (
            <div key={record.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Sprout className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800">{record.crop}</p>
                    <p className="text-sm text-stone-600 truncate">{record.problem}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-400">{formatDate(record.created_at)}</span>
                      {record.confidence && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                          {record.confidence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    className="text-sm text-green-700 font-medium hover:text-green-800"
                  >
                    {expandedId === record.id ? 'Hide' : 'Details'}
                  </button>
                  <button onClick={() => handleDelete(record.id)} className="text-stone-400 hover:text-red-600" aria-label="Delete record">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedId === record.id && (
                <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
                  {record.symptoms && (
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-0.5">Symptoms</p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{record.symptoms}</p>
                    </div>
                  )}
                  {record.causes && (
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-0.5">Possible Causes</p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{record.causes}</p>
                    </div>
                  )}
                  {record.recommendations && (
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-0.5">Recommendations</p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{record.recommendations}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
