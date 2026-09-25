#include <Arduino.h>
#include <Adafruit_BME280.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "config.h"
#include "sensor_payload.h"

namespace {

Adafruit_BME280 bme;
int lastSuccessfulConnectionMs = 0;

bool initializeBme280() {
  if (!bme.begin(smartfarm::kBme280Address)) {
    Serial.println("[sensor] BME280 not found. Check wiring and I2C address.");
    return false;
  }

  bme.setSampling(Adafruit_BME280::MODE_NORMAL,
                  Adafruit_BME280::SAMPLING_X2,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::SAMPLING_X2,
                  Adafruit_BME280::FILTER_OFF);

  Serial.println("[sensor] BME280 initialized.");
  return true;
}

bool connectToWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.println("[wifi] Connecting to Wi-Fi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  for (int attempt = 0; attempt < 30 && WiFi.status() != WL_CONNECTED; ++attempt) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[wifi] Wi-Fi unavailable; skipping send to avoid fake sensor values.");
    return false;
  }

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  for (int attempt = 0; attempt < 30 && time(nullptr) < 1700000000L; ++attempt) {
    delay(1000);
    Serial.print("*");
  }
  Serial.println();

  Serial.printf("[wifi] Connected: %s\n", WiFi.localIP().toString().c_str());
  lastSuccessfulConnectionMs = millis();
  return true;
}

smartfarm::SensorSample readSensors() {
  const int soilRaw = analogRead(smartfarm::kSoilMoisturePin);
  const float soilMoisture = smartfarm::convertSoilMoistureToPercent(soilRaw);
  const float temperature = bme.readTemperature();
  const float humidity = bme.readHumidity();

  return smartfarm::SensorSample{soilMoisture, temperature, humidity};
}

bool postSensorReading(const std::string& payload) {
  Serial.println("[http] Sending sensor payload over HTTPS...");

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (!http.begin(client, smartfarm::kEndpoint)) {
    Serial.println("[http] Failed to initialize HTTPS client.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);

  const String requestBody(payload.c_str());
  const int httpCode = http.POST(requestBody);
  const String responseBody = http.getString();
  http.end();

  Serial.printf("[http] HTTP status: %d\n", httpCode);
  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    Serial.println("[http] Success. Reading accepted by sensor-ingest.");
    return true;
  }

  Serial.printf("[http] Error response: %s\n", responseBody.c_str());
  return false;
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=== SmartFarm ESP32 Sensor Prototype ===");
  Serial.printf("Device UID: %s\n", smartfarm::kDeviceUid);
  Serial.printf("Send interval: %lu ms\n", static_cast<unsigned long>(smartfarm::kMeasurementIntervalMs));

  pinMode(smartfarm::kSoilMoisturePin, INPUT);
  Wire.begin();

  if (!initializeBme280()) {
    Serial.println("[startup] BME280 init failed; device will continue checking connectivity.");
  }
}

void loop() {
  static uint32_t lastAttemptMs = 0;
  static bool hasLoggedFuse = false;

  if (millis() - lastAttemptMs < smartfarm::kMeasurementIntervalMs) {
    return;
  }

  lastAttemptMs = millis();

  if (!connectToWifi()) {
    hasLoggedFuse = false;
    return;
  }

  if (!bme.begin(smartfarm::kBme280Address)) {
    Serial.println("[sensor] BME280 unavailable; skip sending this cycle.");
    return;
  }

  const smartfarm::SensorSample sample = readSensors();
  const std::string payload = smartfarm::buildSensorPayloadJson(smartfarm::kDeviceUid, sample);

  Serial.printf("[sensor] soil_moisture=%.1f%% temperature=%.1fC humidity=%.1f%%\n",
                sample.soil_moisture, sample.temperature, sample.humidity);
  Serial.printf("[payload] %s\n", payload.c_str());

  const bool ok = postSensorReading(payload);
  if (!ok) {
    Serial.println("[http] No retry loop. This sample is not resent automatically.");
  }

  if (!hasLoggedFuse) {
    Serial.println("[status] Sensor cycle complete. Waiting for the next configured interval.");
    hasLoggedFuse = true;
  }
}
