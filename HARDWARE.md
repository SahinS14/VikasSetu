# 🛠️ HARDWARE.md — VikasSetu Physical Classroom Attendance Kiosk

## 1. Executive Summary
**VikasSetu** uses an **Offline Physical Classroom Attendance System** designed for NCCT institutes (VAMNICOM, RICMs, ICMs) and primary agricultural credit societies (PACS).

```
                      +------------------------------------------+
                      |         PHYSICAL CLASSROOM DOOR/DESK     |
                      |                                          |
                      |   +------------------+  +-------------+  |
                      |   | RFID / NFC Smart |  | Sony IMX219 |  |
                      |   | Contactless Pad  |  | Camera 8MP  |  |
                      |   +------------------+  +-------------+  |
                      +------------------------------------------+
                                           |
                                           v
                             +---------------------------+
                             |   Raspberry Pi 4 Model B  |
                             |   Classroom Edge Node     |
                             |   (CLASS-A101-01)         |
                             +---------------------------+
                                           |
                    +----------------------+---------------------+
                    |                                            |
                    v                                            v
     +------------------------------+             +-------------------------------+
     |  Python Face AI Service      |             |  Express Backend Authority    |
     |  ArcFace (buffalo_l on 8000) |             |  Port 5000                    |
     +------------------------------+             +-------------------------------+
                    |                                            |
                    +---------------------> <--------------------+
                                           |
                                           v
                             +---------------------------+
                             |  PostgreSQL / Supabase    |
                             |  AttendanceRecord         |
                             |  Unique(sessionId, userId)|
                             +---------------------------+
```

---

## 2. Real-World Classroom Physical Flow

1. **Student Registration & One-Time Enrollment**:
   - Student registers on VikasSetu and enrolls in a course (e.g. *PACS Operations*).
   - Student completes a **one-time face enrollment** via webcam or photo capture, generating a 512-dimensional ArcFace biometric template stored in `enrolled.pkl`.
   - Institute Admin assigns a physical contactless RFID/NFC smart card (e.g. `RFID-RAMESHWAR-01`) to the student.
2. **Faculty Starts Class**:
   - Faculty opens *Faculty Dashboard* → *Classroom Attendance* → selects today's class (e.g. *PACS ERP Operations, Room A101*).
   - Faculty clicks `[START ATTENDANCE]`. The session becomes `LIVE` with a 2-hour attendance window.
3. **Student Physical Check-In**:
   - Student enters the physical classroom and taps their RFID card on the reader.
   - Reader sends UID to Express backend. Backend checks: device registered, session LIVE, student enrolled in course, duplicate check.
   - Camera captures the student's face frame.
   - Python ArcFace AI extracts the facial embedding and matches against the database.
   - Express Backend compares the RFID identity against the facial identity:
     - **Match**: `AttendanceRecord` inserted in PostgreSQL (`method: "FACE_RFID"`, `status: "PRESENT"`). Green LED turns on, dual beep confirms check-in.
     - **Mismatch (Proxy Alert)**: Red LED turns on, buzzer buzzes, attendance is REJECTED.
4. **Faculty Dashboard Auto-Updates**:
   - Live roster table polls `GET /api/attendance/sessions/:id/summary` every 5 seconds, updating turnout in real-time.

---

## 3. Bill of Materials (BOM)

| Component | Specification / Part | Est. Cost (INR) | Role |
| :--- | :--- | :--- | :--- |
| **Edge Compute** | Raspberry Pi 4 Model B (4GB RAM) | ₹5,200 | Runs edge controller, GPIO feedback, and network synchronization |
| **RFID / NFC Reader** | RC522 (13.56 MHz SPI) or PN532 (NFC/I2C) | ₹350 | Contactless card detection & UID extraction |
| **Camera Sensor** | Raspberry Pi Camera Module v2 (8MP Sony IMX219) or USB 1080p UVC Webcam | ₹2,400 | High-definition facial frame capture |
| **Status Feedback** | Common Cathode RGB LED (Green/Red/Blue) + Active Buzzer (5V) | ₹120 | Instant visual/auditory confirmation for students |
| **Casing** | 3D-Printed / Sheet Metal Wall-Mount Kiosk Enclosure | ₹1,500 | Secure, tamper-resistant classroom entrance kiosk |
| **Total** | | **~₹9,570** | **Complete Low-Cost Classroom Node** |

---

## 4. Raspberry Pi 4 GPIO Pinout

| Peripheral | Component Pin | Raspberry Pi 4 Header Pin | BCM GPIO |
| :--- | :--- | :--- | :--- |
| **Green LED** | Anode (+) via 220Ω | Pin 11 | GPIO 17 |
| **Red LED** | Anode (+) via 220Ω | Pin 13 | GPIO 27 |
| **Blue LED** | Anode (+) via 220Ω | Pin 16 | GPIO 23 |
| **Buzzer** | Signal Pin | Pin 15 | GPIO 22 |
| **RC522 SDA (SS)** | CS | Pin 24 | GPIO 8 (SPI CE0) |
| **RC522 SCK** | Clock | Pin 23 | GPIO 11 (SPI SCLK) |
| **RC522 MOSI** | Master Out | Pin 19 | GPIO 10 (SPI MOSI) |
| **RC522 MISO** | Master In | Pin 21 | GPIO 9 (SPI MISO) |
| **Ground** | Cathodes / GND | Pin 6 / Pin 9 / Pin 20 | GND |
| **Power** | VCC (3.3V) | Pin 1 / Pin 17 | 3.3V |

---

## 5. Development Mode (No Physical Hardware Required)

If physical hardware (Raspberry Pi/RFID reader) is currently not wired:
- Launch the **Classroom Device Simulator** built into the web app at `/faculty/attendance` (click **Classroom Device Simulator** tab).
- Select registered device (e.g. `CLASS-A101-01`).
- Enter or select RFID UID (e.g. `RFID-RAMESHWAR-01`).
- The simulator turns on your laptop/PC webcam (or test camera feed) and invokes the exact same backend endpoints:
  ```
  POST /api/attendance/device/rfid
  POST /api/attendance/device/verify-face
  ```
- **Zero mock data**: Decision is executed by the actual backend and database.

---

## 6. How to Run the Services

### 1. Python Face AI Service (FastAPI + ArcFace InsightFace)
```bash
# In project root:
& 'C:\Users\KARTHIKEYAN\AppData\Local\Programs\Python\Python311\python.exe' FACE/service.py
# Running on http://127.0.0.1:8000
```

### 2. Express Backend (PostgreSQL + Prisma)
```bash
cd backend
npm run dev
# Running on http://127.0.0.1:5000
```

### 3. Frontend (Vite + React)
```bash
npm run dev
# Running on http://localhost:5173
```

### 4. Edge Hardware Controller (on Raspberry Pi or Dev Terminal)
```bash
python hardware/attendance_device.py
```
