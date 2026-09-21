import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Safe Supabase client — module import must NEVER throw, otherwise every
 * route that (transitively) imports this module renders blank.
 *
 * The checked-in `.env.local` historically contained a URL ending in
 * `/rest/v1/`; the JS client expects the project base URL, so we normalize
 * it here instead of touching env configuration.
 */
function normalizeUrl(raw: string | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Strip a trailing /rest/v1( /) suffix if present.
  return trimmed.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const supabaseUrl = normalizeUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || null;

function createSafeClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (import.meta.env.DEV) {
    console.warn(
      '[smartfarm] Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
        'Database-backed features will report errors instead of crashing the UI.',
    );
  }
  // Proxy that throws a clear, catchable error only when actually used —
  // never at import time — so pages can show empty/error states.
  const usageError = () =>
    new Error('Supabase is not configured. Please check your connection and try again.');
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined;
        // `supabase.from(...)` is the only entry point used in the app.
        return () => {
          throw usageError();
        };
      },
    },
  ) as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = createSafeClient();

