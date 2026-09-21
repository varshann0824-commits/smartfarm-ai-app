import { Component, type ReactNode } from 'react';

/**
 * RouteErrorBoundary — guarantees the user NEVER sees a completely blank
 * screen because a route component threw during render / lazy-load.
 * Logs the real error in dev so the root cause can still be fixed.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    if (import.meta.env.DEV) {
      console.error('[smartfarm] Route render failure:', error, info);
    }
  }

  private handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="relative z-10 min-h-screen bg-stone-100 px-6 py-10">
          <div className="max-w-md mx-auto card text-center animate-fade-in">
            <div className="text-4xl mb-3" aria-hidden="true">🌾</div>
            <h1 className="text-lg font-bold text-stone-800">Something didn&apos;t load</h1>
            <p className="text-sm text-stone-600 mt-1 mb-5">
              This screen ran into a problem. Your data and settings are safe.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={this.handleRetry} className="btn btn-primary touch-target w-full">
                Reload this screen
              </button>
              <a href="/dashboard" className="btn btn-outline touch-target w-full">
                Go to Dashboard
              </a>
            </div>
            {import.meta.env.DEV && (
              <pre className="mt-4 text-left text-[11px] text-red-700 bg-red-50 rounded-lg p-2 overflow-auto max-h-40">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
