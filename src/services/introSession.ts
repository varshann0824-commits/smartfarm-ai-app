/**
 * Session-level gate for the SmartFarm AI cinematic intro.
 *
 * The intro plays at most once per browser session. `sessionStorage` keeps the
 * flag for the current tab; a module-level flag guards against storage being
 * unavailable (private mode / storage blocked) without ever replaying the
 * intro on ordinary in-app route changes.
 */

const STORAGE_KEY = 'smartfarm-intro-played-session';

let memoryFlag = false;

export function hasIntroPlayed(): boolean {
  if (memoryFlag) return true;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Storage unavailable — fall back to the in-memory flag.
    return false;
  }
}

export function markIntroPlayed(): void {
  memoryFlag = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore — the in-memory flag still prevents replays.
  }
}