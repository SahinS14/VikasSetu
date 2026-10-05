"""
hardware/attendance_device.py
Production Classroom Edge Device Controller for VikasSetu.
Target Hardware:
  - Raspberry Pi 4 Model B (4GB RAM) / Pi Zero 2W
  - RC522 (SPI) / PN532 (I2C/UART) Contactless RFID Reader
  - Sony IMX219 8MP CSI Camera / USB UVC 1080p Webcam
  - GPIO Status LEDs (Green: GPIO 17, Red: GPIO 27, Blue: GPIO 23)
  - Active Buzzer (GPIO 22)
  - Optional 16x2 I2C LCD / 7-inch Touch Display

Workflow:
  1. Background thread emits periodic heartbeat to Express Backend.
  2. Main loop waits for student RFID card tap.
  3. Edge controller submits UID to Express Backend (/api/attendance/device/rfid).
  4. If card valid and session LIVE: camera captures student's face frame.
  5. Controller submits image to Express Backend (/api/attendance/device/verify-face).
  6. Backend invokes ArcFace AI service & verifies:
       - RFID belongs to Student A
       - Face belongs to Student A (anti-proxy prevention)
       - Student enrolled in session course
  7. On success: Green LED illuminates + double beep + attendance confirmed.
  8. On failure: Red LED illuminates + warning buzzer + proxy alert displayed.
"""

import sys
import os
import time
import base64
import threading
import requests
import cv2

# Configuration
DEVICE_CODE = os.environ.get("DEVICE_CODE", "CLASS-A101-01")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")
CAMERA_INDEX = int(os.environ.get("CAMERA_INDEX", "0"))
HEARTBEAT_INTERVAL_SEC = 30

# GPIO Hardware Abstraction (falls back to console prints when not running on Raspberry Pi)
try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
    PIN_LED_GREEN = 17
    PIN_LED_RED = 27
    PIN_LED_BLUE = 23
    PIN_BUZZER = 22

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(PIN_LED_GREEN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(PIN_LED_RED, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(PIN_LED_BLUE, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(PIN_BUZZER, GPIO.OUT, initial=GPIO.LOW)
except Exception:
    HAS_GPIO = False
    print("[Hardware] Running in simulated GPIO mode (RPi.GPIO not found or non-ARM platform).")


def set_led_status(green=False, red=False, blue=False):
    if HAS_GPIO:
        GPIO.output(PIN_LED_GREEN, GPIO.HIGH if green else GPIO.LOW)
        GPIO.output(PIN_LED_RED, GPIO.HIGH if red else GPIO.LOW)
        GPIO.output(PIN_LED_BLUE, GPIO.HIGH if blue else GPIO.LOW)
    else:
        status = []
        if green: status.append("GREEN (OK)")
        if red: status.append("RED (ALERT)")
        if blue: status.append("BLUE (READING)")
        print(f"[LED Status] {' | '.join(status) if status else 'ALL OFF'}")


def trigger_buzzer(duration=0.1, count=1):
    if HAS_GPIO:
        for _ in range(count):
            GPIO.output(PIN_BUZZER, GPIO.HIGH)
            time.sleep(duration)
            GPIO.output(PIN_BUZZER, GPIO.LOW)
            if count > 1:
                time.sleep(0.08)
    else:
        print(f"[Buzzer] {'BEEP! ' * count}")


def heartbeat_worker():
    """Background worker sending periodic heartbeats to backend."""
    while True:
        try:
            url = f"{BACKEND_URL}/api/attendance/device/heartbeat"
            resp = requests.post(url, json={"deviceCode": DEVICE_CODE}, timeout=5)
            if resp.status_code == 200:
                pass  # Heartbeat successful
        except Exception as e:
            print(f"[Heartbeat] Warning: Could not connect to backend: {e}")
        time.sleep(HEARTBEAT_INTERVAL_SEC)


def capture_frame():
    """Capture a single frame from the connected camera."""
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print("[Camera] Error: Camera could not be opened.")
        return None

    # Warmup camera sensor
    for _ in range(5):
        cap.read()

    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        return None

    # Encode frame to JPEG Base64
    success, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not success:
        return None

    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_str}"


def process_attendance(rfid_uid: str):
    """Execute complete two-factor physical verification flow."""
    print(f"\n==========================================")
    print(f"[Classroom Kiosk] Card detected: {rfid_uid}")
    print(f"==========================================")

    set_led_status(blue=True)
    trigger_buzzer(0.05, 1)

    # STEP 1: Verify RFID card & check active session
    try:
        rfid_url = f"{BACKEND_URL}/api/attendance/device/rfid"
        rfid_res = requests.post(
            rfid_url,
            json={"deviceCode": DEVICE_CODE, "rfidUid": rfid_uid},
            timeout=8
        )

        if rfid_res.status_code != 200:
            err = rfid_res.json().get("error", "RFID validation failed.")
            print(f"❌ [RFID Rejection] {err}")
            set_led_status(red=True)
            trigger_buzzer(0.4, 2)
            time.sleep(2.5)
            set_led_status()
            return False

        context = rfid_res.json()
        trainee_name = context.get("traineeName", "Student")
        print(f"✓ Card recognized: {trainee_name} (Session: {context.get('courseTitle')})")
        print("Looking at camera for biometric face verification...")

        # STEP 2: Capture face frame
        image_data = capture_frame()
        if not image_data:
            print("❌ [Camera Error] Could not capture frame.")
            set_led_status(red=True)
            trigger_buzzer(0.3, 1)
            time.sleep(2)
            set_led_status()
            return False

        # STEP 3: Verify Face against ArcFace & compare against RFID identity
        face_url = f"{BACKEND_URL}/api/attendance/device/verify-face"
        face_res = requests.post(
            face_url,
            json={
                "deviceCode": DEVICE_CODE,
                "rfidUid": rfid_uid,
                "imageBase64": image_data,
                "verificationToken": context.get("verificationToken"),
            },
            timeout=15
        )

        if face_res.status_code == 201:
            att = face_res.json()
            print(f"\n🎉 ATTENDANCE MARKED SUCCESSFULLY!")
            print(f"Student     : {att['trainee']['name']}")
            print(f"Course      : {att['course']['title']}")
            print(f"Status      : {att['status']}")
            print(f"Confidence  : {att['confidence'] * 100:.1f}%")
            print(f"Timestamp   : {att['markedAt']}")

            # Green LED + Success double beep
            set_led_status(green=True)
            trigger_buzzer(0.1, 2)
            time.sleep(2.5)
            set_led_status()
            return True

        else:
            err_msg = face_res.json().get("error", "Face verification rejected.")
            print(f"\n❌ ATTENDANCE REJECTED: {err_msg}")

            # Red LED + Warning buzzer
            set_led_status(red=True)
            trigger_buzzer(0.5, 1)
            time.sleep(3.0)
            set_led_status()
            return False

    except Exception as e:
        print(f"❌ [Network/Server Error] {e}")
        set_led_status(red=True)
        trigger_buzzer(0.3, 1)
        time.sleep(2)
        set_led_status()
        return False


def main():
    print(f"Starting VikasSetu Classroom Attendance Device [{DEVICE_CODE}]...")
    print(f"Connected Backend: {BACKEND_URL}")

    # Launch background heartbeat
    t = threading.Thread(target=heartbeat_worker, daemon=True)
    t.start()

    set_led_status()
    print("Device READY. Waiting for contactless card tap...")
    print("(Press CTRL+C to exit, or type an RFID UID to simulate a tap)")

    while True:
        try:
            # Interactive simulator input or hardware reader loop
            sim_tap = input("\n[RFID Reader Tap] Enter Card UID (or press Enter for 'RFID-RAMESHWAR-01'): ").strip()
            if not sim_tap:
                sim_tap = "RFID-RAMESHWAR-01"
            process_attendance(sim_tap)
        except KeyboardInterrupt:
            print("\nShutting down attendance device.")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()
