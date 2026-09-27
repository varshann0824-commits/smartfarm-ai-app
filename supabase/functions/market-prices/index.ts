// Supabase Edge Function: market-prices
// Proxies data.gov.in AGMARKNET API calls server-side so the API key
// is never exposed in the frontend.
//
// Environment variables (set in Supabase dashboard):
//   DATAGOV_API_KEY - the data.gov.in API key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DATA_GOV_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
// Budget ladder — keep in sync with src/services/marketService.ts.
//
// The previous single 1,000-row request was the heaviest query this dataset
// supports and was timing out / returning 502s from data.gov.in. A page's
// worth of rows (200) is all the Market UI renders at once, and the retry
// drops further to 50. Worst case: 2 attempts x 9s + overhead ~ 18s, which
// stays below the browser's 30s budget so this function's structured
// response always reaches the UI instead of the browser aborting first.
const ATTEMPT_TIMEOUT_MS = 9_000;
const PAGE_SIZE = 200;
const RETRY_PAGE_SIZE = 50;

interface MarketQuery {
  state?: string;
  crop?: string;
  market?: string;
}

type UpstreamResult =
  | { kind: 'ok'; data: unknown }
  | { kind: 'http'; status: number }
  | { kind: 'timeout' }
  | { kind: 'network' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * One bounded data.gov.in call. Never throws, never logs or echoes the API
 * key, and never returns upstream URLs to the client — the caller only
 * receives a classified result.
 */
async function requestDataGov(apiKey: string, query: MarketQuery, limit: number): Promise<UpstreamResult> {
  const fields = 'commodity,market,state,district,min_price,max_price,modal_price,arrivals,arrival_date';
  const params = new URLSearchParams({
    'api-key': apiKey,
    'format': 'json',
    'limit': String(limit),
    'fields': fields,
  });

  if (query.state?.trim()) params.append('filters[state]', query.state.trim());
  if (query.crop?.trim()) params.append('filters[commodity]', query.crop.trim());
  if (query.market?.trim()) params.append('filters[market]', query.market.trim());

  const apiUrl = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

  try {
    const res = await fetch(apiUrl, { signal: controller.signal });
    if (!res.ok) return { kind: 'http', status: res.status };
    return { kind: 'ok', data: await res.json() };
  } catch (error) {
    return error instanceof Error && error.name === 'AbortError'
      ? { kind: 'timeout' }
      : { kind: 'network' };
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Every outcome answers with HTTP 200 + JSON. The client normalises these
  // bodies and turns `status: "unavailable"` into its retryable UI state;
  // failure detail stays in `error`/`reason` and never names credentials,
  // secrets or environment variables.
  const json = (body: Record<string, unknown>): Response =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('DATAGOV_API_KEY');
    if (!apiKey) {
      // Server-side configuration is missing. The variable is never named in
      // the response, and the farmer-safe message never reaches the UI.
      return json({
        error: 'Live market data is temporarily unavailable.',
        reason: 'not_configured',
        status: 'unavailable',
      });
    }

    const url = new URL(req.url);
    const query: MarketQuery = {
      state: url.searchParams.get('state') || undefined,
      crop: url.searchParams.get('crop') || undefined,
      market: url.searchParams.get('market') || undefined,
    };

    const first = await requestDataGov(apiKey, query, PAGE_SIZE);

    // Retry only failures that can clear by themselves: a timeout, a network
    // error, or an upstream 5xx (data.gov.in produces transient nginx 502s).
    // A 4xx means the request itself was rejected (key/resource/filters), so
    // retrying would only burn the browser's budget.
    const worthRetrying =
      first.kind === 'timeout' ||
      first.kind === 'network' ||
      (first.kind === 'http' && first.status >= 500);
    const result = worthRetrying ? await requestDataGov(apiKey, query, RETRY_PAGE_SIZE) : first;

    if (result.kind === 'ok') {
      if (isRecord(result.data)) {
        return json({ ...result.data, status: 'available' });
      }
      return json({
        error: 'Live market data is temporarily unavailable.',
        reason: 'unexpected_response',
        status: 'unavailable',
      });
    }

    if (result.kind === 'http' && result.status < 500) {
      return json({
        error: 'Live market data is temporarily unavailable.',
        reason: 'upstream_rejected',
        status: 'unavailable',
      });
    }

    return json({
      error: 'Live market data is temporarily unavailable.',
      reason: result.kind === 'http'
        ? 'upstream_unavailable'
        : result.kind === 'timeout'
          ? 'upstream_timeout'
          : 'upstream_unreachable',
      status: 'unavailable',
    });
  } catch {
    return json({
      error: 'Live market data is temporarily unavailable.',
      reason: 'unexpected',
      status: 'unavailable',
    });
  }
});