// Supabase Edge Function: crop-health-ai
// Optional server-side AI enhancement for the Crop Health analysis.
//
// The function calls the DeepSeek chat API using ONLY the server-side secret
// DEEPSEEK_API_KEY (set via `supabase secrets set DEEPSEEK_API_KEY=...` in the
// Supabase dashboard). The key is NEVER exposed to the browser, exactly like
// the existing market-prices (DATAGOV_API_KEY) and weather (IMD_API_KEY) edge
// functions.
//
// If DEEPSEEK_API_KEY is not configured (or the call fails), this function
// returns { ok: false } and the frontend KEEPS the existing local rule-based
// Crop Health analysis as the fallback — the page never becomes unusable.
//
// Optional environment variables:
//   DEEPSEEK_API_KEY  - required (server secret)
//   DEEPSEEK_MODEL    - optional, default "deepseek-chat"
//   DEEPSEEK_BASE_URL - optional, default "https://api.deepseek.com"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DEEPSEEK_API_URL = (Deno.env.get('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com')
  .replace(/\/+$/, '') + '/chat/completions';
const DEEPSEEK_MODEL = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 15_000;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  or: 'Odia',
  pa: 'Punjabi',
};

const SYSTEM_PROMPT = `You are a careful crop health advisor for Indian farmers.
Analyze ONLY the information the farmer provides. Do not invent details that were not supplied.
Give practical advice consistent with standard Indian agricultural practice (ICAR/KVK guidance).
Rules:
- Treat this as an advisory triage, never a guaranteed medical-grade diagnosis.
- If the information is ambiguous or the condition appears serious, set confidence to "Low" and clearly instruct the farmer to consult a KVK or agriculture officer.
- Never recommend specific pesticide/chemical doses; always say chemical treatments should only be applied after expert (KVK/agriculture officer) approval.
- Respond ONLY with a single JSON object using exactly these keys:
  "problem" (string, short likely problem name),
  "confidence" (one of "High", "Medium", "Low"),
  "severity" (short string such as "Mild", "Moderate", "Severe", or "Unknown"),
  "symptoms" (array of strings, the symptoms the farmer described),
  "causes" (array of strings, likely causes based on the given information),
  "actions" (array of strings, immediate recommended actions),
  "prevention" (array of strings, prevention/monitoring advice for the future),
  "monitoring" (array of strings, what to watch over the next days),
  "expertNote" (string, when to consult an agricultural expert).
Write the values in the language the farmer requested (English, Telugu, Hindi, Tamil, Kannada, Malayalam or Marathi). The JSON keys themselves must stay in English.`;

serve(async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, headers);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    if (!isRecord(body)) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400, headers);
    }

    const symptoms = str(body.symptoms);
    if (symptoms.trim().length < 3) {
      return jsonResponse(
        { ok: false, error: 'Please provide more details about the symptoms you are seeing on your crop.' },
        400,
        headers,
      );
    }

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      return jsonResponse(
        { ok: false, error: 'AI analysis is not configured on the server (DEEPSEEK_API_KEY missing).' },
        503,
        headers,
      );
    }

    const languageCode = str(body.language) || 'en';
    const languageName = LANGUAGE_NAMES[languageCode] || 'English';
const payload = {
      model: DEEPSEEK_MODEL,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            language: languageName,
            crop: str(body.crop),
            growthStage: str(body.growthStage),
            symptoms,
            rainfall: str(body.rainfall),
            irrigation: str(body.irrigation),
            visibleInsects: str(body.insects),
            recentFertilizer: str(body.fertilizer),
          }),
        },
      ],
    };

    const res = await fetchWithTimeout(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const resText = await res.text();
    if (!res.ok) {
      return jsonResponse({ ok: false, error: `The AI provider responded with ${res.status}.` }, 200, headers);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(resText);
    } catch {
      parsed = null;
    }
    const content = extractContent(parsed);
    const aiResult = content ? parseAiResult(content) : null;
    if (!aiResult) {
      return jsonResponse({ ok: false, error: 'The AI provider returned an unparseable response.' }, 200, headers);
    }

    return jsonResponse({ ok: true, ai: true, result: aiResult }, 200, headers);
  } catch {
    return jsonResponse({ ok: false, error: 'Unexpected server error.' }, 200, headers);
  }
});

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function extractContent(parsed: unknown): string | null {
  if (!isRecord(parsed)) return null;
  const choices = parsed.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const choice = choices[0];
  if (!isRecord(choice)) return null;
  const message = choice.message;
  if (!isRecord(message)) return null;
  const content = message.content;
  return typeof content === 'string' && content.trim() ? content.trim() : null;
}

function parseAiResult(content: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed)) return null;
    const result = parsed.result;
    return isRecord(result) ? result : parsed;
  } catch {
    // Very defensive: some providers wrap the JSON in markdown fences.
    const match = /```(?:json)?\s*([\s\S]*?)```/.exec(content);
    if (match) {
      try {
        const parsed: unknown = JSON.parse(match[1]);
        if (!isRecord(parsed)) return null;
        const result = parsed.result;
        return isRecord(result) ? result : parsed;
      } catch {
        return null;
      }
    }
    return null;
  }
}