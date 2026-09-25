#pragma once

#include <array>
#include <chrono>
#include <cmath>
#include <iomanip>
#include <sstream>
#include <string>

namespace smartfarm {

struct SensorSample {
  float soil_moisture;
  float temperature;
  float humidity;
};

inline std::string iso8601UtcNow() {
  using namespace std::chrono;
  const auto now = system_clock::now();
  const auto tt = system_clock::to_time_t(now);
  std::tm utc{};
#if defined(_WIN32)
  gmtime_s(&utc, &tt);
#else
  gmtime_r(&tt, &utc);
#endif
  std::ostringstream oss;
  oss << std::put_time(&utc, "%Y-%m-%dT%H:%M:%S.000Z");
  return oss.str();
}

inline std::string buildSensorPayloadJson(const std::string& device_uid, const SensorSample& sample) {
  std::ostringstream oss;
  oss << std::fixed << std::setprecision(1)
      << "{"
      << "\"device_uid\":\"" << device_uid << "\","
      << "\"recorded_at\":\"" << iso8601UtcNow() << "\","
      << "\"soil_moisture\":" << sample.soil_moisture << ","
      << "\"temperature\":" << sample.temperature << ","
      << "\"humidity\":" << sample.humidity
      << "}";
  return oss.str();
}

inline bool payloadContainsRequiredFields(const std::string& payload) {
  const std::array<std::string, 5> required = {
      "\"device_uid\":",
      "\"recorded_at\":",
      "\"soil_moisture\":",
      "\"temperature\":",
      "\"humidity\":",
  };

  for (const auto& field : required) {
    if (payload.find(field) == std::string::npos) {
      return false;
    }
  }
  return true;
}

}  // namespace smartfarm
