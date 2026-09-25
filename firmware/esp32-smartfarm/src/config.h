#pragma once

#include <Arduino.h>

#include "secrets.h"

namespace smartfarm {

constexpr char kDeviceUid[] = "ESP32-SF001";
constexpr uint32_t kMeasurementIntervalMs = 60000UL;
constexpr uint8_t kSoilMoisturePin = 35;
constexpr uint8_t kBme280Address = 0x76;
constexpr int kSoilDryRawValue = 3900;
constexpr int kSoilWetRawValue = 1800;
constexpr const char* kEndpoint =
    "https://cisllwmoitzydwukxeph.supabase.co/functions/v1/sensor-ingest";

inline float clampPercent(float value) {
  if (value < 0.0f) return 0.0f;
  if (value > 100.0f) return 100.0f;
  return value;
}

inline float convertSoilMoistureToPercent(int raw_adc) {
  if (raw_adc >= kSoilDryRawValue) {
    return 0.0f;
  }
  if (raw_adc <= kSoilWetRawValue) {
    return 100.0f;
  }

  const float range = static_cast<float>(kSoilDryRawValue - kSoilWetRawValue);
  const float percent = 100.0f * (static_cast<float>(kSoilDryRawValue - raw_adc) / range);
  return clampPercent(percent);
}

}  // namespace smartfarm
