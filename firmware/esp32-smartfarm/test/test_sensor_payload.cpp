#include <array>
#include <string>

#include "unity.h"

#include "sensor_payload.h"

void test_payload_has_required_fields(void) {
  const smartfarm::SensorSample sample{42.5f, 28.4f, 67.0f};
  const std::string payload = smartfarm::buildSensorPayloadJson("ESP32-SF001", sample);

  TEST_ASSERT_TRUE(payload.find("\"device_uid\":\"ESP32-SF001\"") != std::string::npos);
  TEST_ASSERT_TRUE(payload.find("\"recorded_at\":\"") != std::string::npos);
  TEST_ASSERT_TRUE(payload.find("\"soil_moisture\":42.5") != std::string::npos);
  TEST_ASSERT_TRUE(payload.find("\"temperature\":28.4") != std::string::npos);
  TEST_ASSERT_TRUE(payload.find("\"humidity\":67.0") != std::string::npos);
  TEST_ASSERT_TRUE(smartfarm::payloadContainsRequiredFields(payload));
}

int main(int argc, char** argv) {
  UNITY_BEGIN();
  RUN_TEST(test_payload_has_required_fields);
  return UNITY_END();
}
