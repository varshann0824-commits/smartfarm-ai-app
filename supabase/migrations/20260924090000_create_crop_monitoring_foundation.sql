-- Crop Monitoring database foundation for SIH260180.
--
-- This migration is intentionally additive. It does not modify the existing
-- farms, fields, devices, sensors, and sensor_readings already exist in the
-- public schema and are intentionally not created or altered here. Monitoring
-- data is authenticated and owned through farms.user_id.
--
-- Image bytes belong in Supabase Storage. crop_images stores the bucket and
-- object path only; this migration does not create or delete a storage bucket.

CREATE TABLE IF NOT EXISTS edge_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  last_seen_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id, external_id)
);

CREATE TABLE IF NOT EXISTS crop_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  edge_device_id uuid REFERENCES edge_devices(id) ON DELETE SET NULL,
  storage_bucket text NOT NULL DEFAULT 'crop-images',
  storage_path text NOT NULL,
  captured_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  client_event_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (farm_id, client_event_id)
);

CREATE TABLE IF NOT EXISTS ai_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_image_id uuid NOT NULL REFERENCES crop_images(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  detection_type text NOT NULL,
  label text NOT NULL,
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  severity text,
  bounding_box jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crop_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  crop_image_id uuid REFERENCES crop_images(id) ON DELETE SET NULL,
  observed_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  crop text,
  growth_stage text,
  status text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environmental_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  severity text,
  source text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE IF NOT EXISTS farm_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  triggered_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (resolved_at IS NULL OR resolved_at >= triggered_at)
);

CREATE TABLE IF NOT EXISTS irrigation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  volume_liters numeric,
  method text,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR ended_at >= started_at),
  CHECK (volume_liters IS NULL OR volume_liters >= 0)
);

CREATE TABLE IF NOT EXISTS monitoring_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  source text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS device_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  field_id uuid REFERENCES fields(id) ON DELETE SET NULL,
  device_id uuid,
  edge_device_id uuid REFERENCES edge_devices(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  client_event_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (client_event_id),
  CHECK ((device_id IS NOT NULL AND edge_device_id IS NULL) OR (device_id IS NULL AND edge_device_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS edge_devices_field_id_idx ON edge_devices (field_id);
CREATE INDEX IF NOT EXISTS crop_images_field_captured_at_idx
  ON crop_images (field_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS ai_detections_image_detected_at_idx
  ON ai_detections (crop_image_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS crop_observations_field_observed_at_idx
  ON crop_observations (field_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS environmental_events_field_started_at_idx
  ON environmental_events (field_id, started_at DESC);
CREATE INDEX IF NOT EXISTS farm_alerts_field_triggered_at_idx
  ON farm_alerts (field_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS irrigation_events_field_started_at_idx
  ON irrigation_events (field_id, started_at DESC);
CREATE INDEX IF NOT EXISTS monitoring_recommendations_field_generated_at_idx
  ON monitoring_recommendations (field_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS device_events_occurred_at_idx
  ON device_events (occurred_at DESC);

ALTER TABLE edge_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY edge_devices_owner_access ON edge_devices
  FOR ALL TO authenticated
  USING (edge_devices.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = edge_devices.field_id AND fields.farm_id = edge_devices.farm_id))
  WITH CHECK (edge_devices.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = edge_devices.field_id AND fields.farm_id = edge_devices.farm_id));

CREATE POLICY crop_images_owner_access ON crop_images
  FOR ALL TO authenticated
  USING (crop_images.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = crop_images.field_id AND fields.farm_id = crop_images.farm_id)
    AND (crop_images.edge_device_id IS NULL OR EXISTS (SELECT 1 FROM edge_devices WHERE edge_devices.id = crop_images.edge_device_id AND edge_devices.farm_id = crop_images.farm_id)))
  WITH CHECK (crop_images.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = crop_images.field_id AND fields.farm_id = crop_images.farm_id)
    AND (crop_images.edge_device_id IS NULL OR EXISTS (SELECT 1 FROM edge_devices WHERE edge_devices.id = crop_images.edge_device_id AND edge_devices.farm_id = crop_images.farm_id)));

CREATE POLICY ai_detections_owner_access ON ai_detections
  FOR ALL TO authenticated
  USING (ai_detections.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM crop_images WHERE crop_images.id = ai_detections.crop_image_id AND crop_images.farm_id = ai_detections.farm_id))
  WITH CHECK (ai_detections.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM crop_images WHERE crop_images.id = ai_detections.crop_image_id AND crop_images.farm_id = ai_detections.farm_id));

CREATE POLICY crop_observations_owner_access ON crop_observations
  FOR ALL TO authenticated
  USING (crop_observations.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = crop_observations.field_id AND fields.farm_id = crop_observations.farm_id)
    AND (crop_observations.crop_image_id IS NULL OR EXISTS (SELECT 1 FROM crop_images WHERE crop_images.id = crop_observations.crop_image_id AND crop_images.farm_id = crop_observations.farm_id)))
  WITH CHECK (crop_observations.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = crop_observations.field_id AND fields.farm_id = crop_observations.farm_id)
    AND (crop_observations.crop_image_id IS NULL OR EXISTS (SELECT 1 FROM crop_images WHERE crop_images.id = crop_observations.crop_image_id AND crop_images.farm_id = crop_observations.farm_id)));

CREATE POLICY environmental_events_owner_access ON environmental_events
  FOR ALL TO authenticated
  USING (environmental_events.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = environmental_events.field_id AND fields.farm_id = environmental_events.farm_id))
  WITH CHECK (environmental_events.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = environmental_events.field_id AND fields.farm_id = environmental_events.farm_id));

CREATE POLICY farm_alerts_owner_access ON farm_alerts
  FOR ALL TO authenticated
  USING (farm_alerts.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = farm_alerts.field_id AND fields.farm_id = farm_alerts.farm_id))
  WITH CHECK (farm_alerts.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = farm_alerts.field_id AND fields.farm_id = farm_alerts.farm_id));

CREATE POLICY irrigation_events_owner_access ON irrigation_events
  FOR ALL TO authenticated
  USING (irrigation_events.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = irrigation_events.field_id AND fields.farm_id = irrigation_events.farm_id))
  WITH CHECK (irrigation_events.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = irrigation_events.field_id AND fields.farm_id = irrigation_events.farm_id));

CREATE POLICY monitoring_recommendations_owner_access ON monitoring_recommendations
  FOR ALL TO authenticated
  USING (monitoring_recommendations.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = monitoring_recommendations.field_id AND fields.farm_id = monitoring_recommendations.farm_id))
  WITH CHECK (monitoring_recommendations.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM fields WHERE fields.id = monitoring_recommendations.field_id AND fields.farm_id = monitoring_recommendations.farm_id));

CREATE POLICY device_events_owner_access ON device_events
  FOR ALL TO authenticated
  USING (device_events.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND (device_events.field_id IS NULL OR EXISTS (SELECT 1 FROM fields WHERE fields.id = device_events.field_id AND fields.farm_id = device_events.farm_id))
    AND ((device_events.device_id IS NOT NULL AND EXISTS (SELECT 1 FROM devices WHERE devices.id = device_events.device_id AND devices.farm_id = device_events.farm_id))
      OR (device_events.edge_device_id IS NOT NULL AND EXISTS (SELECT 1 FROM edge_devices WHERE edge_devices.id = device_events.edge_device_id AND edge_devices.farm_id = device_events.farm_id))))
  WITH CHECK (device_events.farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
    AND (device_events.field_id IS NULL OR EXISTS (SELECT 1 FROM fields WHERE fields.id = device_events.field_id AND fields.farm_id = device_events.farm_id))
    AND ((device_events.device_id IS NOT NULL AND EXISTS (SELECT 1 FROM devices WHERE devices.id = device_events.device_id AND devices.farm_id = device_events.farm_id))
      OR (device_events.edge_device_id IS NOT NULL AND EXISTS (SELECT 1 FROM edge_devices WHERE edge_devices.id = device_events.edge_device_id AND edge_devices.farm_id = device_events.farm_id))));