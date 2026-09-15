import { type ReactNode } from 'react';
import { X, ArrowLeft, RefreshCw } from 'lucide-react';

export type AnalysisState = 'idle' | 'analyzing' | 'success' | 'low-confidence' | 'error';

interface AnalysisSheetProps {
  open: boolean;
  onClose: () => void;
  state: AnalysisState;
  title: string;
  analyzingLabel?: string;
  errorLabel?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export function AnalysisSheet({
  open,
  onClose,
  state,
  title,
  analyzingLabel = 'Analyzing...',
  errorLabel = 'Unable to complete analysis.',
  onRetry,
  children,
}: AnalysisSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-overlay"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-sm font-medium touch-target"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h2 className="font-bold text-stone-800 text-lg truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 touch-target p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 flex-1">
          {state === 'analyzing' && (
            <AnalyzingState label={analyzingLabel} />
          )}

          {state === 'error' && (
            <div className="text-center py-12 animate-fade-in">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-stone-700 mb-4">{errorLabel}</p>
              {onRetry && (
                <button onClick={onRetry} className="btn btn-primary touch-target">
                  <RefreshCw className="w-5 h-5" /> Try Again
                </button>
              )}
            </div>
          )}

          {(state === 'success' || state === 'low-confidence') && children}
        </div>
      </div>
    </div>
  );
}

function AnalyzingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin-slow mb-4" />
      <p className="text-stone-600 font-medium">{label}</p>
      <div className="mt-6 space-y-2 w-full max-w-xs">
        <AnalyzingStep label="Reading input" delay={0} />
        <AnalyzingStep label="Identifying patterns" delay={200} />
        <AnalyzingStep label="Checking possible causes" delay={400} />
        <AnalyzingStep label="Verifying agricultural information" delay={600} />
        <AnalyzingStep label="Preparing recommendations" delay={800} />
      </div>
    </div>
  );
}

function AnalyzingStep({ label, delay }: { label: string; delay: number }) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-stone-400 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="w-2 h-2 rounded-full bg-stone-300" />
      {label}
    </div>
  );
}
