// Supabase Edge Function: market-prices
// Proxies data.gov.in AGMARKNET API calls server-side so the API key
// is never exposed in the frontend.
//
// Environment variables (set in Supabase dashboard):
//   DATAGOV_API_KEY - the data.gov.in API key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DATA_GOV_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
const REQUEST_TIMEOUT_MS = 15_000;

interface MarketQuery {
  state?: string;
  crop?: string;
  market?: string;
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

  try {
    const apiKey = Deno.env.get('DATAGOV_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'DATAGOV_API_KEY is not configured on the server.',
          status: 'unavailable',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = new URL(req.url);
    const query: MarketQuery = {
      state: url.searchParams.get('state') || undefined,
      crop: url.searchParams.get('crop') || undefined,
      market: url.searchParams.get('market') || undefined,
    };

    const fields = 'commodity,market,state,district,min_price,max_price,modal_price,arrivals,arrival_date';
    const params = new URLSearchParams({
      'api-key': apiKey,
      'format': 'json',
      'limit': '1000',
      'fields': fields,
    });

    if (query.state?.trim()) params.append('filters[state]', query.state.trim());
    if (query.crop?.trim()) params.append('filters[commodity]', query.crop.trim());
    if (query.market?.trim()) params.append('filters[market]', query.market.trim());

    const apiUrl = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE}?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(apiUrl, { signal: controller.signal });
      if (!res.ok) {
        return new Response(
          JSON.stringify({
            error: `The market service responded with ${res.status}.`,
            status: 'unavailable',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const data = await res.json();
      return new Response(
        JSON.stringify({ ...data, status: 'available' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      const message = error instanceof Error && error.name === 'AbortError'
        ? 'The market request timed out. Please try again.'
        : 'Live market data is temporarily unavailable.';
      return new Response(
        JSON.stringify({ error: message, status: 'unavailable' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Unexpected server error.', status: 'unavailable' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});