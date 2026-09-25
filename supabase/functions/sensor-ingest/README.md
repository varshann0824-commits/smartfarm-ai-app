# Sensor Ingestion Edge Function

Endpoint:

```text
POST https://<project-ref>.supabase.co/functions/v1/sensor-ingest
```

The ESP32 authenticates with the `x-device-token` header. The token is a server-configured prototype secret and must not be placed in browser code or committed to firmware repositories.

## Required server configuration

Set the shared prototype token as a Supabase secret:

```powershell
supabase secrets set SENSOR_INGEST_TOKEN=<long-random-device-ingest-token>
```

The function also requires the Supabase runtime values `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Supabase provides these to the Edge Function runtime; they must never be copied into firmware, browser code, or request payloads.

The current prototype token is shared by the registered device. A later hardening step can move to per-device credentials without changing the request body or database schema.

## Request

Headers:

```http
Content-Type: application/json
x-device-token: <SENSOR_INGEST_TOKEN>
```

JSON body:

```json
{
  "device_uid": "ESP32-SF001",
  "recorded_at": "2026-09-24T12:00:00.000Z",
  "soil_moisture": 42.5,
  "temperature": 28.4,
  "humidity": 67.0,
  "rainfall_mm": 0.0,
  "water_level": 18.2,
  "battery_voltage": 3.78,
  "signal_strength": -65
}
```

Replace every measurement and timestamp with values actually measured by the device. The example is documentation only and has not been sent.

`device_uid` is the only ownership identifier accepted from the ESP32. Do not send `farm_id`, `field_id`, `device_id`, `sensor_id`, `data_source`, or `is_valid`; the function rejects those fields and derives ownership from `public.devices`.

The function writes:

```text
data_source = 'sensor'
is_valid = true
```

## Success response

```json
{
  "ok": true,
  "reading_id": "<new-reading-uuid>",
  "device_uid": "ESP32-SF001",
  "farm_id": "<derived-farm-uuid>",
  "field_id": "<derived-field-uuid>",
  "recorded_at": "2026-09-24T12:00:00.000Z",
  "data_source": "sensor",
  "is_valid": true
}
```

## Error responses

- `400`: malformed JSON, missing `device_uid`, invalid timestamp, missing measurements, or non-numeric/out-of-range values.
- `401`: missing or invalid `x-device-token`.
- `404`: `device_uid` is not registered in `public.devices`.
- `409`: registered device has no field assignment.
- `503`: `SENSOR_INGEST_TOKEN` is not configured.
- `500`: database insertion failed; the response does not expose database internals.

## ESP32 request shape

Use an HTTPS POST with the same JSON body and header. Do not send the Supabase anon key or service-role key as a replacement for `x-device-token`. Do not retry continuously without a device-side backoff policy. This repository does not execute hardware requests.
