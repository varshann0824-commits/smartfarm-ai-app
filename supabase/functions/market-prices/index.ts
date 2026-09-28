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
// Verified live on 2026-09-28 (deployed function + direct api.data.gov.in
// probes): the upstream serves this resource slower than the previous 9s
// per-attempt cap — four consecutive live calls spent both 9s attempts and
// returned upstream_timeout, and data.gov.in's gateway was measured taking
// 0.5-9.6s even on its trivial auth-rejection path (highly variable), with
// occasional >=500 responses. First attempt: 13s for a 200-row page (all the
// Market UI renders at once); the single retry drops to a 50-row page and
// gets 9s. Worst case: 13s + 9s + overhead ~ 22.5s, which stays below the
// browser's 30s budget in src/services/marketService.ts so this function's
// structured response always reaches the UI instead of the browser aborting
// first.
const FIRST_ATTEMPT_TIMEOUT_MS = 13_000;
const RETRY_ATTEMPT_TIMEOUT_MS = 9_000;
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
async function requestDataGov(
  apiKey: string,
  query: MarketQuery,
  limit: number,
  timeoutMs: number,
): Promise<UpstreamResult> {
  // Projection limited to the fields this resource actually publishes
  // (state, district, market, commodity, arrival_date, min_price, max_price,
  // modal_price). `arrivals` is not part of this resource's schema, and the
  // client already renders "Arrivals: –" when the value is absent, so asking
  // for an unverified field name would only risk an upstream field error and
  // a larger response for no UI benefit.
  const fields = 'commodity,market,state,district,min_price,max_price,modal_price,arrival_date';
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
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        // data.gov.in sits behind a WAF that fingerprints client headers and
        // silently stalls blocked automation fingerprints (reproduced live on
        // 2026-09-28: requests carrying default python-requests / urllib3
        // user agents received no response at all within 25s, while curl,
        // browser and custom user agents were served normally). Identify this
        // service explicitly instead of relying on the runtime's default
        // user agent, so the one upstream dependency always sees a normal,
        // honest client signature.
        'User-Agent': 'SmartFarmAI-MarketPrices/1.0 (+https://github.com/varshann0824-commits/smartfarm-ai-app)',
        'Accept': 'application/json',
      },
    });
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

    const first = await requestDataGov(apiKey, query, PAGE_SIZE, FIRST_ATTEMPT_TIMEOUT_MS);

    // Retry only failures that can clear by themselves: a timeout, a network
    // error, or an upstream 5xx (data.gov.in produces transient nginx 502s).
    // A 4xx means the request itself was rejected (key/resource/filters), so
    // retrying would only burn the browser's budget. The retry itself stays
    // bounded (9s, 50-row page): 13s + 9s + overhead ~ 22.5s worst case, still
    // inside the browser's 30s budget.
    const worthRetrying =
      first.kind === 'timeout' ||
      first.kind === 'network' ||
      (first.kind === 'http' && first.status >= 500);
    const result = worthRetrying
      ? await requestDataGov(apiKey, query, RETRY_PAGE_SIZE, RETRY_ATTEMPT_TIMEOUT_MS)
      : first;

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