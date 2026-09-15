import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useState, Component, type ReactNode } from 'react';
import { hasIntroPlayed } from '@/services/introSession';

/**
 * IntroGate — mounts the cinematic intro once per session and never tampers
 * with the existing application. The app (routes, dashboard, nav) always
 * renders underneath; the intro is a fixed overlay on top that fades away.
 *
 * Errors inside the 3D intro are trapped by the guard, logged, and the
 * overlay disappears so the application always opens normally.
 */

const IntroExperience = lazy(
  () => import('./IntroExperience').then((m) => ({ default: m.IntroExperience })),
);

type IntroGateProps = {
  children: ReactNode;
};

export function IntroGate({ children }: IntroGateProps) {
  const [showIntro, setShowIntro] = useState(() => !hasIntroPlayed());

  return (
    <main data-intro-gate className="w-full">
      {children}
      <AnimatePresence>
        {showIntro && (
          <IntroGuard onFailure={() => setShowIntro(false)}>
            <Suspense fallback={<SkipIntroOverlay onSkip={() => setShowIntro(false)} />}>
              <IntroExperience onComplete={() => setShowIntro(false)} />
            </Suspense>
          </IntroGuard>
        )}
      </AnimatePresence>
    </main>
  );
}

/**
 * Error boundary so a failure in the intro can never break the app.
 * On failure it logs, then tells the gate to unmount the overlay.
 */
class IntroGuard extends Component<{ onFailure: () => void; children: ReactNode }> {
  state = { failed: false };
  private notified = false;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate() {
    if (this.state.failed && !this.notified) {
      this.notified = true;
      console.log('[smartfarm-intro] Intro failed gracefully — showing the app instead.');
      this.props.onFailure();
    }
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/** Lightweight standalone skip affordance while the intro chunk loads. */
function SkipIntroOverlay({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#5b3d8f] via-[#c05a45] to-[#ffc966]">
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 rounded-full bg-black/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:bg-black/45 active:scale-95 touch-target"
        aria-label="Skip Intro"
      >
        Skip Intro
      </button>
    </div>
  );
}