# SmartFarm ESP32 Prototype Firmware

This project contains the first ESP32 prototype for SmartFarm AI. It reads a capacitive soil moisture sensor and a BME280 sensor, then posts the result to the Supabase Edge Function at the backend boundary.

Important constraints:

- This firmware does not modify the SmartFarm AI frontend.
- It does not change any database schema or migrations.
- It does not send any real request during development.
- The device token is not committed to git.
- The code logs only sensor values and network status; it never prints the token.

## Required device UID

```text
ESP32-SF001
```

## Backend endpoint

```text
https://cisllwmoitzydwukxeph.supabase.co/functions/v1/sensor-ingest
```

## Exact JSON payload sent to the edge function

```json
{
  "device_uid": "ESP32-SF001",
  "recorded_at": "2026-09-25T10:00:00.000Z",
  "soil_moisture": 42.5,
  "temperature": 28.4,
  "humidity": 67.0
}
```

This matches the server-side validation in the Edge Function. The firmware does not send `farm_id`, `field_id`, `device_id`, `sensor_id`, `data_source`, or `is_valid`; ownership is resolved server-side from `public.devices` using `device_uid`.

## Local secret configuration

The private token is kept in a local file that is ignored by git:

```text
firmware/esp32-smartfarm/src/secrets.h
```

Copy the tracked example before compiling:

```bash
cp firmware/esp32-smartfarm/src/secrets.example.h firmware/esp32-smartfarm/src/secrets.h
```

Then set the actual values in the local file:

```cpp
#define DEVICE_TOKEN "<real-token-from-supabase-secret>"
#define WIFI_SSID "your-wifi-name"
#define WIFI_PASSWORD "your-wifi-password"
```

Do not commit the local file. The repository .gitignore excludes it.

## Wiring

### ESP32 to BME280 (I2C)

| ESP32 pin | BME280 pin | Notes |
| --- | --- | --- |
| 3V3 | VIN | Power |
| GND | GND | Ground |
| GPIO 21 | SDA | I2C data |
| GPIO 22 | SCL | I2C clock |

### ESP32 to capacitive soil moisture sensor

| ESP32 pin | Capacitive sensor | Notes |
| --- | --- | --- |
| 3V3 | VCC | Sensor supply |
| GND | GND | Ground |
| GPIO 35 | AO / analog output | Use ADC input |

Notes:

- Use the ESP32 ADC input on GPIO 35.
- Keep the analog wire short and away from noisy power lines.
- The sensor output is read as a raw ADC value and converted to a percentage using configurable calibration constants in `src/config.h`.

## Soil sensor calibration

The capacitive soil moisture sensor is not perfectly linear across all soil types. Calibrate in two known states:

1. Place the sensor in dry air or very dry soil and record the raw ADC value.
2. Place the sensor in fully saturated soil or water and record the raw ADC value.
3. Update the constants in `src/config.h`:

```cpp
constexpr int kSoilDryRawValue = 3900;
constexpr int kSoilWetRawValue = 1800;
```

A higher raw number corresponds to drier soil in the example mapping used here. The conversion formula is:

```text
0% = raw_adc >= kSoilDryRawValue
100% = raw_adc <= kSoilWetRawValue
```

Then interpolate between the dry and wet calibration points. Adjust the constants until the displayed percentage matches the soil condition you observe.

## Compile and upload

From the project folder:

```bash
cd firmware/esp32-smartfarm
pio run -e esp32dev
pio run -e esp32dev -t upload
```

For serial monitoring:

```bash
pio device monitor -e esp32dev
```

## Firmware behavior

- Connects to Wi-Fi using the local secrets file.
- Reads BME280 temperature and humidity over I2C.
- Reads capacitive soil moisture via ADC on GPIO 35.
- Converts the raw reading to a percentage using calibration constants.
- Builds the exact JSON payload expected by `sensor-ingest`.
- Sends a POST with the `x-device-token` header over HTTPS.
- Logs only safe status values; the token is never printed.
- Uses a 60-second interval configurable in `src/config.h`.
- Does not retry infinitely; each failed send is logged once and the device waits for the next interval.
- If Wi-Fi is unavailable, it does not generate or send fake values.

## First real reading manually

1. Copy `src/secrets.example.h` to `src/secrets.h`.
2. Fill in the real device token, Wi-Fi SSID, and Wi-Fi password.
3. Compile and upload the firmware to the ESP32.
4. Power the board and confirm it connects to Wi-Fi.
5. Place the soil sensor in the target soil and leave it for a minute so the reading settles.
6. Watch the serial monitor for a message like:

```text
[sensor] soil_moisture=42.5% temperature=28.4C humidity=67.0%
```

7. The device will then send a POST to the Edge Function using the configured token.

Do not press the send button or run automatic telemetry during development in this workspace; this command sequence is for the first real device read once you are ready to test it physically.

## How to confirm the reading appears in Crop Monitoring

1. Log in to the SmartFarm AI app with the authenticated user that owns the farm/field for `ESP32-SF001`.
2. Open Crop Monitoring.
3. Check the live sensor summary and the latest sensor timestamps.
4. The latest reading should show the sensor values from the device and the recorded time.
5. Confirm the reading matches the values logged on the device monitor and the `recorded_at` field is recent.
6. The frontend reads the live `sensor_readings` data from the current database state; it does not directly connect to the ESP32.

The Edge Function remains the backend boundary and the web app should not be modified for this hardware prototype.
