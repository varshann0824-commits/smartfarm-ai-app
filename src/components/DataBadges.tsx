import type { DataStatus, SourceMetadata } from '@/types';

export function DataBadge({ status, className = '' }: { status: DataStatus; className?: string }) {
  const labels: Record<DataStatus, { text: string; emoji: string; classes: string }> = {
    live: { text: 'LIVE DATA', emoji: '🟢', classes: 'bg-green-100 text-green-800' },
    verified: { text: 'VERIFIED', emoji: '✓', classes: 'bg-blue-100 text-blue-800' },
    ai: { text: 'AI ANALYSIS', emoji: '🤖', classes: 'bg-purple-100 text-purple-800' },
    estimate: { text: 'ESTIMATE', emoji: '📊', classes: 'bg-amber-100 text-amber-800' },
    demo: { text: 'DEMO', emoji: '🎯', classes: 'bg-orange-100 text-orange-800' },
    low: { text: 'LOW CONFIDENCE', emoji: '⚠', classes: 'bg-red-100 text-red-700' },
    unavailable: { text: 'UNAVAILABLE', emoji: '⚠', classes: 'bg-stone-100 text-stone-600' },
  };
  const { text, classes } = labels[status];
  return (
    <span className={`badge ${classes} ${className}`}>
      {text}
    </span>
  );
}

export function SourceInfo({ source, showLastUpdated = true }: { source: SourceMetadata; showLastUpdated?: boolean }) {
  return (
    <div className="text-xs text-stone-500 mt-2 border-t border-stone-100 pt-2">
      <p>Source: <span className="font-medium text-stone-600">{source.sourceName}</span></p>
      {showLastUpdated && <p>Last updated: <span className="font-medium text-stone-600">{source.lastUpdated}</span></p>}
      {source.sourceUrl && (
        <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline mt-1 inline-block">
          Open official source →
        </a>
      )}
    </div>
  );
}

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-8 h-8 border-3 border-green-200 border-t-green-700 rounded-full animate-spin-slow" />
      <p className="text-sm text-stone-500">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  officialLink,
  officialLabel = 'Open Official Source',
}: {
  message: string;
  onRetry?: () => void;
  officialLink?: string;
  officialLabel?: string;
}) {
  return (
    <div className="card text-center py-8 animate-fade-in">
      <div className="text-4xl mb-3">⚠️</div>
      <p className="text-stone-700 mb-4">{message}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary touch-target">
            🔄 Retry
          </button>
        )}
        {officialLink && (
          <a href={officialLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline touch-target">
            🌐 {officialLabel}
          </a>
        )}
      </div>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="bg-orange-100 border border-orange-300 text-orange-900 text-center py-2 px-4 text-sm font-semibold rounded-lg">
      🎯 DEMO MODE — SAMPLE DATA
    </div>
  );
}
