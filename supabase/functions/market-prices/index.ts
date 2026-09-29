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
// Verified live on 2026-09-28/29 (deployed function + direct api.data.gov.in
// probes): this resource's gateway is highly variable — it sometimes fails in
// under a second with a 5xx and sometimes needs far longer than 13s to serve
// a page, and even its trivial auth-rejection path has been measured at
// 0.5-9.6s. The ladder below therefore tops out at a 20s first attempt for a
// 200-row page, a 10s 50-row retry, and one final 25-row attempt that only
// runs after FAST failures (a timeout means the upstream is hanging, so
// repeating it would only delay the honest answer). Worst case: 20s + 10s +
// overhead ~ 30.5s, which stays inside the browser's 45s budget in
// src/services/marketService.ts so this function's structured response
// always reaches the UI instead of the browser aborting first.
const FIRST_ATTEMPT_TIMEOUT_MS = 20_000;
const RETRY_ATTEMPT_TIMEOUT_MS = 10_000;
const FINAL_ATTEMPT_TIMEOUT_MS = 8_000;
const PAGE_SIZE = 200;
const RETRY_PAGE_SIZE = 50;
const FINAL_PAGE_SIZE = 25;
// When an exact mandi-name filter finds nothing, the query is repeated
// without it (see the serve() handler) so the client can still narrow the
// page by name. Bounded like every other upstream call.
const RELAXED_MARKET_PAGE_SIZE = 150;
const RELAXED_MARKET_TIMEOUT_MS = 12_000;
// A third attempt is only worth the wait when the earlier failures came back
// quickly (5xx/network). Two slow failures already consumed the useful budget.
const FAST_FAILURE_BUDGET_MS = 15_000;

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

/** True when the upstream payload is a valid response that simply has no rows. */
function isEmptyRecordPage(data: unknown): boolean {
  return isRecord(data) && Array.isArray(data.records) && data.records.length === 0;
}

/** Failures that can clear by themselves on a retry. */
function isRetryable(result: UpstreamResult): boolean {
  return (
    result.kind === 'timeout' ||
    result.kind === 'network' ||
    (result.kind === 'http' && result.status >= 500)
  );
}

/** Failures that returned quickly, so one more small-page attempt is cheap. */
function isFastFailure(result: UpstreamResult): boolean {
  return result.kind === 'network' || (result.kind === 'http' && result.status >= 500);
}

/**
 * data.gov.in's `filters[market]` is an exact match and AGMARKNET market
 * names are Title Cased (e.g. "Guntur"), so a lower- or upper-case search
 * would otherwise fall through to an empty page for a mandi that exists.
 * Names that already mix case are sent exactly as typed; anything else is
 * Title Cased to match the published naming format.
 */
function normalizeMarketName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const allLower = trimmed === trimmed.toLowerCase();
  const allUpper = trimmed === trimmed.toUpperCase();
  if (!allLower && !allUpper) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/(^|[\s('/-])([a-z])/g, (_match: string, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
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
  // (state, district, market, commodity, variety, arrival_date, min_price,
  // max_price, modal_price). `arrivals` is not part of this resource's
  // schema, and the client already renders "Arrivals: –" when the value is
  // absent, so asking for an unverified field name would only risk an
  // upstream field error and a larger response for no UI benefit.
  const fields = 'commodity,variety,market,state,district,min_price,max_price,modal_price,arrival_date';
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
      market: normalizeMarketName(url.searchParams.get('market') || ''),
    };
    const startedAt = Date.now();

    let result = await requestDataGov(apiKey, query, PAGE_SIZE, FIRST_ATTEMPT_TIMEOUT_MS);

    // Retry only failures that can clear by themselves: a timeout, a network
    // error, or an upstream 5xx (data.gov.in produces transient nginx 502s).
    // A 4xx means the request itself was rejected (key/resource/filters), so
    // retrying would only burn the browser's budget. The retry drops to a
    // 50-row page, which the upstream serves faster.
    if (isRetryable(result)) {
      result = await requestDataGov(apiKey, query, RETRY_PAGE_SIZE, RETRY_ATTEMPT_TIMEOUT_MS);
    }

    // One last small-page attempt, but only after FAST failures: a timeout
    // means the upstream is hanging, and repeating it would only delay the
    // honest answer for the farmer.
    if (isFastFailure(result) && Date.now() - startedAt < FAST_FAILURE_BUDGET_MS) {
      result = await requestDataGov(apiKey, query, FINAL_PAGE_SIZE, FINAL_ATTEMPT_TIMEOUT_MS);
    }

    if (result.kind === 'ok') {
      // data.gov.in has no partial-match filter for mandi names, so a
      // partially typed or differently-cased search ("Guntu", "guntur") would
      // otherwise return nothing even when the mandi exists. When an exact
      // market filter finds no rows, re-ask without it and let the client's
      // case-insensitive name filter narrow the returned page; if that page
      // has no match either, the UI shows its honest empty state.
      if (query.market && isEmptyRecordPage(result.data)) {
        const relaxed = await requestDataGov(
          apiKey,
          { ...query, market: undefined },
          RELAXED_MARKET_PAGE_SIZE,
          RELAXED_MARKET_TIMEOUT_MS,
        );
        if (relaxed.kind === 'ok') result = relaxed;
      }
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