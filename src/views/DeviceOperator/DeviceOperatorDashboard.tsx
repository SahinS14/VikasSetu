/**
 * src/views/DeviceOperator/DeviceOperatorDashboard.tsx
 *
 * Comprehensive Device Operator Portal for VikasSetu (Role 6):
 *  1. Dashboard: Fleet health metrics, alert indicators, connection summary
 *  2. Devices: Hardware kiosk roster (ESP32-S3, ESP32-CAM, Raspberry Pi 4)
 *  3. Live Monitoring: Real-time telemetry (Camera, NFC, OLED, RTC, Servo, Temp, Power, Tamper)
 *  4. Hardware Test: Interactive diagnostic console for individual sensors and actuators
 *  5. Sync Queue: Offline attendance/registration events queue with retry & conflict resolution
 *  6. Incidents & Maintenance: Hardware incident reporting, replacement logging, resolution records
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Radio,
  Camera,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Zap,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Play,
  RotateCw,
  Clock,
  Battery,
  Wrench,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Wifi,
  WifiOff,
  Check,
  Lock,
  Unlock,
  Volume2,
  Layers,
  Send,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageContainer } from '../../components/layout/PageContainer';

export type DeviceTab = 'dashboard' | 'monitoring' | 'devices' | 'test' | 'sync' | 'incidents';

interface KioskDevice {
  id: string;
  deviceCode: string;
  name: string;
  room: string;
  institution: string;
  ipAddress: string;
  macAddress: string;
  firmware: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'FALLBACK_NFC';
  mode: 'Normal' | 'NFC Fallback' | 'Camera Offline' | 'Offline Sync' | 'Maintenance';
  lastSeen: string;
  esp32S3Status: 'HEALTHY' | 'WARNING' | 'ERROR';
  esp32CamStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  pn532Status: 'HEALTHY' | 'WARNING' | 'ERROR';
  oledStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  servoStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  temperature: number; // °C
  powerVoltage: number; // V
  batteryPercent: number; // %
  tamperSwitch: boolean; // false = intact, true = tripped
  pendingSyncCount: number;
}

interface SyncItem {
  id: string;
  eventId: string;
  deviceId: string;
  deviceCode: string;
  eventType: 'ATTENDANCE_CREATED' | 'OFFLINE_CHECKIN' | 'NFC_TAP' | 'PROVISIONAL_VERIFY';
  traineeName: string;
  traineeId: string;
  clientCreatedAt: string;
  serverReceivedAt?: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT' | 'MANUAL_REVIEW';
  idempotencyKey: string;
  errorMessage?: string;
}

interface IncidentItem {
  id: string;
  deviceId: string;
  deviceCode: string;
  room: string;
  incidentType: 'CAMERA_FAIL' | 'SERVO_JAM' | 'NFC_TIMEOUT' | 'OVERHEATING' | 'TAMPER_ALERT' | 'POWER_FLUCTUATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'REPAIRED' | 'CLOSED';
  description: string;
  reportedAt: string;
  assignedOperator: string;
  resolutionNotes?: string;
}

export const DeviceOperatorDashboard: React.FC<{ initialTab?: DeviceTab }> = ({ initialTab = 'dashboard' }) => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<DeviceTab>(initialTab);

  // Kiosk Devices State
  const [devices, setDevices] = useState<KioskDevice[]>([
    {
      id: 'kiosk-01',
      deviceCode: 'NCCT-KIOSK-MH-VAM-01',
      name: 'Classroom A101 Main Attendance Kiosk',
      room: 'Room A101 (Lecture Hall 1)',
      institution: 'VAMNICOM, Pune',
      ipAddress: '192.168.1.140',
      macAddress: 'C8:2E:18:4A:91:2C',
      firmware: 'v2.4.1-esp32s3',
      status: 'ONLINE',
      mode: 'Normal',
      lastSeen: 'Just now (12s ago)',
      esp32S3Status: 'HEALTHY',
      esp32CamStatus: 'HEALTHY',
      pn532Status: 'HEALTHY',
      oledStatus: 'HEALTHY',
      servoStatus: 'HEALTHY',
      temperature: 28.4,
      powerVoltage: 5.08,
      batteryPercent: 98,
      tamperSwitch: false,
      pendingSyncCount: 0,
    },
    {
      id: 'kiosk-02',
      deviceCode: 'NCCT-KIOSK-MH-VAM-02',
      name: 'Computer Lab 2 Dual Gate Kiosk',
      room: 'Computer Lab 2 (PACS ERP Lab)',
      institution: 'VAMNICOM, Pune',
      ipAddress: '192.168.1.142',
      macAddress: 'C8:2E:18:5B:72:E4',
      firmware: 'v2.4.1-esp32s3',
      status: 'ONLINE',
      mode: 'Normal',
      lastSeen: '35s ago',
      esp32S3Status: 'HEALTHY',
      esp32CamStatus: 'HEALTHY',
      pn532Status: 'HEALTHY',
      oledStatus: 'HEALTHY',
      servoStatus: 'HEALTHY',
      temperature: 31.2,
      powerVoltage: 5.02,
      batteryPercent: 94,
      tamperSwitch: false,
      pendingSyncCount: 2,
    },
    {
      id: 'kiosk-03',
      deviceCode: 'NCCT-KIOSK-MH-VAM-03',
      name: 'Seminar Hall Standalone Kiosk',
      room: 'Dr. Kurien Seminar Hall',
      institution: 'VAMNICOM, Pune',
      ipAddress: '192.168.1.149',
      macAddress: 'C8:2E:18:9F:33:10',
      firmware: 'v2.3.8-esp32s3',
      status: 'FALLBACK_NFC',
      mode: 'NFC Fallback',
      lastSeen: '2m ago',
      esp32S3Status: 'HEALTHY',
      esp32CamStatus: 'WARNING',
      pn532Status: 'HEALTHY',
      oledStatus: 'HEALTHY',
      servoStatus: 'HEALTHY',
      temperature: 36.8,
      powerVoltage: 4.96,
      batteryPercent: 88,
      tamperSwitch: false,
      pendingSyncCount: 4,
    },
    {
      id: 'kiosk-04',
      deviceCode: 'NCCT-KIOSK-MH-VAM-04',
      name: 'Hostel Entry Kiosk (Demonstration)',
      room: 'Block A Entry Foyer',
      institution: 'VAMNICOM, Pune',
      ipAddress: '192.168.1.155',
      macAddress: 'C8:2E:18:11:80:CC',
      firmware: 'v2.4.0-esp32s3',
      status: 'OFFLINE',
      mode: 'Offline Sync',
      lastSeen: '14m ago',
      esp32S3Status: 'WARNING',
      esp32CamStatus: 'ERROR',
      pn532Status: 'HEALTHY',
      oledStatus: 'WARNING',
      servoStatus: 'WARNING',
      temperature: 34.1,
      powerVoltage: 4.88,
      batteryPercent: 72,
      tamperSwitch: false,
      pendingSyncCount: 6,
    },
  ]);

  // Sync Queue State
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([
    {
      id: 'sync-01',
      eventId: 'EVT-2026-0913-001',
      deviceId: 'kiosk-02',
      deviceCode: 'NCCT-KIOSK-MH-VAM-02',
      eventType: 'ATTENDANCE_CREATED',
      traineeName: 'Rameshwar Patil',
      traineeId: 'NCCT-TRN-2026-MH-44091',
      clientCreatedAt: '2026-09-13T10:15:22Z',
      retryCount: 0,
      status: 'PENDING',
      idempotencyKey: 'idemp-k2-0913-44091-sess1',
    },
    {
      id: 'sync-02',
      eventId: 'EVT-2026-0913-002',
      deviceId: 'kiosk-03',
      deviceCode: 'NCCT-KIOSK-MH-VAM-03',
      eventType: 'NFC_TAP',
      traineeName: 'Sunita Devi',
      traineeId: 'NCCT-TRN-2026-UP-71234',
      clientCreatedAt: '2026-09-13T10:18:04Z',
      retryCount: 1,
      status: 'PENDING',
      idempotencyKey: 'idemp-k3-0913-71234-sess1',
    },
    {
      id: 'sync-03',
      eventId: 'EVT-2026-0913-003',
      deviceId: 'kiosk-04',
      deviceCode: 'NCCT-KIOSK-MH-VAM-04',
      eventType: 'OFFLINE_CHECKIN',
      traineeName: 'Ganesh Shinde',
      traineeId: 'NCCT-TRN-2026-MH-99012',
      clientCreatedAt: '2026-09-13T09:42:15Z',
      retryCount: 3,
      status: 'FAILED',
      idempotencyKey: 'idemp-k4-0913-99012-sess2',
      errorMessage: 'Network timeout to Supabase endpoint during field outage',
    },
    {
      id: 'sync-04',
      eventId: 'EVT-2026-0913-004',
      deviceId: 'kiosk-04',
      deviceCode: 'NCCT-KIOSK-MH-VAM-04',
      eventType: 'PROVISIONAL_VERIFY',
      traineeName: 'Anjali Sharma',
      traineeId: 'NCCT-TRN-2026-RJ-33441',
      clientCreatedAt: '2026-09-13T09:50:33Z',
      retryCount: 2,
      status: 'CONFLICT',
      idempotencyKey: 'idemp-k4-0913-33441-sess2',
      errorMessage: 'Duplicate record already marked by Faculty manual register',
    },
  ]);

  // Incidents State
  const [incidents, setIncidents] = useState<IncidentItem[]>([
    {
      id: 'inc-01',
      deviceId: 'kiosk-03',
      deviceCode: 'NCCT-KIOSK-MH-VAM-03',
      room: 'Dr. Kurien Seminar Hall',
      incidentType: 'CAMERA_FAIL',
      severity: 'HIGH',
      status: 'OPEN',
      description: 'ESP32-CAM optical sensor intermittent frame drops under direct sunlight. Switched automatically to NFC Fallback Mode.',
      reportedAt: 'Today at 09:30 AM',
      assignedOperator: 'Karthik Hardware Operator',
    },
    {
      id: 'inc-02',
      deviceId: 'kiosk-04',
      deviceCode: 'NCCT-KIOSK-MH-VAM-04',
      room: 'Block A Entry Foyer',
      incidentType: 'POWER_FLUCTUATION',
      severity: 'MEDIUM',
      status: 'IN_PROGRESS',
      description: 'Hostel power inverter tripped; device operating on internal Li-Ion backup pack (72% remaining).',
      reportedAt: 'Today at 08:45 AM',
      assignedOperator: 'Karthik Hardware Operator',
    },
    {
      id: 'inc-03',
      deviceId: 'kiosk-01',
      deviceCode: 'NCCT-KIOSK-MH-VAM-01',
      room: 'Room A101 (Lecture Hall 1)',
      incidentType: 'SERVO_JAM',
      severity: 'LOW',
      status: 'CLOSED',
      description: 'Mechanical barrier hinge required dry PTFE lubricant spray; re-calibrated PWM zero-offset.',
      reportedAt: 'Yesterday at 04:15 PM',
      assignedOperator: 'Karthik Hardware Operator',
      resolutionNotes: 'Hinge cleaned and re-calibrated. 50 open/close test cycles passed without stall.',
    },
  ]);

  // Selected device for telemetry / testing
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('kiosk-01');
  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  // Hardware Diagnostics State
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [testConsoleLogs, setTestConsoleLogs] = useState<Array<{ time: string; text: string; status: 'info' | 'success' | 'warn' | 'error' }>>([
    { time: '10:00:01', text: 'Hardware Diagnostic Console initialized for NCCT-KIOSK-MH-VAM-01', status: 'info' },
    { time: '10:00:03', text: 'ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz responding on UART0', status: 'success' },
    { time: '10:00:04', text: 'I2C Bus scan: 0x24 (PN532), 0x3C (SSD1306 OLED), 0x68 (DS3231 RTC) ACK', status: 'success' },
  ]);

  // Interactive Servo Gate State
  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);
  const [isGateMoving, setIsGateMoving] = useState<boolean>(false);

  // New Incident Modal State
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState<boolean>(false);
  const [newIncidentType, setNewIncidentType] = useState<IncidentItem['incidentType']>('CAMERA_FAIL');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<IncidentItem['severity']>('MEDIUM');
  const [newIncidentDevice, setNewIncidentDevice] = useState<string>(devices[0].deviceCode);
  const [newIncidentDesc, setNewIncidentDesc] = useState<string>('');

  const appendLog = (text: string, status: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setTestConsoleLogs(prev => [...prev.slice(-40), { time: timeStr, text, status }]);
  };

  // Run hardware diagnostic test
  const executeHardwareTest = async (testName: string, testCode: string) => {
    if (runningTest) return;
    setRunningTest(testCode);
    appendLog(`>>> Initiating diagnostic routine: ${testName}...`, 'info');

    setTimeout(() => {
      if (testCode === 'SERVO') {
        appendLog(`[PWM CH0] Sending 90° duty cycle pulse (2000µs)...`, 'info');
        setIsGateMoving(true);
        setIsGateOpen(true);
        setTimeout(() => {
          appendLog(`[PWM CH0] Servo reached 90° limit switch. Gate OPEN.`, 'success');
          setTimeout(() => {
            appendLog(`[PWM CH0] Returning servo to 0° resting gate (1000µs)...`, 'info');
            setIsGateOpen(false);
            setTimeout(() => {
              setIsGateMoving(false);
              appendLog(`[PWM CH0] Gate securely closed. Stall current nominal 45mA.`, 'success');
              setRunningTest(null);
            }, 800);
          }, 1500);
        }, 600);
      } else if (testCode === 'CAM') {
        appendLog(`[ESP32-CAM] Waking OV2640 sensor on DVP bus...`, 'info');
        setTimeout(() => {
          appendLog(`[ESP32-CAM] Captured JPEG frame (1600x1200, 48.2 KB, QF=12).`, 'success');
          appendLog(`[ArcFace] buffalo_sc face detector latency: 32ms. Det score: 0.98.`, 'success');
          setRunningTest(null);
        }, 1000);
      } else if (testCode === 'NFC') {
        appendLog(`[PN532] Polling 13.56MHz RF field for ISO14443A cards...`, 'info');
        setTimeout(() => {
          appendLog(`[PN532] Card detected! UID: 04:A7:2B:9F:C1 (Mifare Classic 1K).`, 'success');
          appendLog(`[SHA-256] Computed card UID hash: 7f83b1657ff1... matched trainee Rameshwar Patil.`, 'success');
          setRunningTest(null);
        }, 900);
      } else if (testCode === 'OLED') {
        appendLog(`[SSD1306] Writing 1024-byte framebuffer over 400kHz I2C...`, 'info');
        setTimeout(() => {
          appendLog(`[SSD1306] Display refresh successful (128x64 px). OLED current 12mA.`, 'success');
          setRunningTest(null);
        }, 700);
      } else if (testCode === 'BUZZER') {
        appendLog(`[GPIO 14] Pulsing piezo buzzer 2.4kHz tone for 150ms...`, 'info');
        setTimeout(() => {
          appendLog(`[BUZZER] Audio feedback tone completed successfully.`, 'success');
          setRunningTest(null);
        }, 500);
      } else if (testCode === 'RTC') {
        appendLog(`[DS3231] Querying real-time clock register 0x00...`, 'info');
        setTimeout(() => {
          const nowStr = new Date().toISOString();
          appendLog(`[DS3231] RTC Timestamp: ${nowStr}. Clock drift vs NTP: -4ms (Accurate).`, 'success');
          setRunningTest(null);
        }, 600);
      } else if (testCode === 'TEMP') {
        appendLog(`[NTC Sensor] ADC reading on GPIO 34...`, 'info');
        setTimeout(() => {
          appendLog(`[TEMP] Current enclosure temp: ${selectedDevice.temperature}°C (Threshold < 55°C - OK).`, 'success');
          setRunningTest(null);
        }, 500);
      } else if (testCode === 'POWER') {
        appendLog(`[INA219] Sampling bus voltage & current draw...`, 'info');
        setTimeout(() => {
          appendLog(`[POWER] Bus: ${selectedDevice.powerVoltage}V DC | Draw: 340mA | Battery: ${selectedDevice.batteryPercent}% (Normal).`, 'success');
          setRunningTest(null);
        }, 500);
      } else if (testCode === 'TAMPER') {
        appendLog(`[GPIO 13] Reading physical tamper microswitch...`, 'info');
        setTimeout(() => {
          appendLog(`[TAMPER] Switch State: CLOSED (No physical enclosure breach detected).`, 'success');
          setRunningTest(null);
        }, 400);
      } else {
        appendLog(`[ESP32-S3] Ping response 8ms. Free Heap: 284 KB. PSRAM: 6.8 MB available.`, 'success');
        setRunningTest(null);
      }
    }, 400);
  };

  // Sync Retry handler
  const handleRetrySync = (item: SyncItem) => {
    appendLog(`[SyncQueue] Retrying upload for event ${item.eventId} (${item.traineeName})...`, 'info');
    setSyncQueue(prev =>
      prev.map(s => (s.id === item.id ? { ...s, status: 'SYNCING', retryCount: s.retryCount + 1 } : s))
    );

    setTimeout(() => {
      setSyncQueue(prev =>
        prev.map(s => (s.id === item.id ? { ...s, status: 'SYNCED', errorMessage: undefined } : s))
      );
      appendLog(`[SyncQueue] ✓ Event ${item.eventId} successfully committed to PostgreSQL database!`, 'success');
    }, 1200);
  };

  // Create new incident
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentDesc.trim()) return;

    const newInc: IncidentItem = {
      id: `inc-0${incidents.length + 1}`,
      deviceId: devices.find(d => d.deviceCode === newIncidentDevice)?.id || 'kiosk-01',
      deviceCode: newIncidentDevice,
      room: devices.find(d => d.deviceCode === newIncidentDevice)?.room || 'Room A101',
      incidentType: newIncidentType,
      severity: newIncidentSeverity,
      status: 'OPEN',
      description: newIncidentDesc.trim(),
      reportedAt: 'Just now',
      assignedOperator: 'Karthik Hardware Operator',
    };

    setIncidents(prev => [newInc, ...prev]);
    appendLog(`[Incident Manager] New incident #${newInc.id} logged for ${newInc.deviceCode} (${newInc.incidentType})`, 'warn');
    setIsNewIncidentOpen(false);
    setNewIncidentDesc('');
  };

  const handleResolveIncident = (id: string) => {
    setIncidents(prev =>
      prev.map(inc =>
        inc.id === id
          ? {
              ...inc,
              status: 'CLOSED',
              resolutionNotes: 'Inspected and certified operational by Karthik Hardware Operator.',
            }
          : inc
      )
    );
    appendLog(`[Incident Manager] Incident #${id} marked as RESOLVED & CLOSED.`, 'success');
  };

  // Summary Metrics
  const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
  const offlineCount = devices.filter(d => d.status === 'OFFLINE').length;
  const fallbackCount = devices.filter(d => d.status === 'FALLBACK_NFC').length;
  const openIncidentsCount = incidents.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  const pendingSyncTotal = syncQueue.filter(s => s.status === 'PENDING' || s.status === 'FAILED' || s.status === 'CONFLICT').length;

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        {/* =========================================================================
            1. TOP OPERATOR BANNER
           ========================================================================= */}
        <div className="rounded-2xl bg-gradient-to-r from-[#073D32] via-[#005B46] to-[#0A644D] text-white p-5 sm:p-6 shadow-md border border-[#004D3A] relative overflow-hidden">
          {/* Subtle Background Circuit Trace Art */}
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none w-96 flex items-center justify-end pr-6">
            <Cpu className="w-56 h-56 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold text-emerald-200 mb-2.5">
                <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>ROLE 6: DEVICE & HARDWARE OPERATIONS CONSOLE</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                Classroom Kiosk Fleet & Hardware Control
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
                Real-time edge supervision for ESP32-S3, ESP32-CAM (ArcFace buffalo_sc), PN532 Contactless NFC, OLED,
                and physical servo demonstration gates across NCCT institutions.
              </p>
            </div>

            {/* Operator Badge & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              <div className="px-3.5 py-2 rounded-xl bg-black/20 backdrop-blur-xs border border-white/15 text-left">
                <p className="text-[10px] text-emerald-200 font-medium uppercase tracking-wider">Assigned Operator</p>
                <p className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Karthik Hardware Operator</span>
                </p>
                <p className="text-[10px] text-gray-300 font-mono">ID: NCCT-DEV-2026-MH-001</p>
              </div>

              <button
                onClick={() => {
                  appendLog('[System] Polling all 4 edge kiosks for fresh telemetry...', 'info');
                  setTimeout(() => appendLog('[System] All heartbeats updated. 3 responding, 1 offline.', 'success'), 400);
                }}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-xs"
                title="Refresh Live Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh Kiosks</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. KEY METRICS CARDS (PDF 9.1 Dashboard Requirements)
           ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1.5">
              <span className="text-xs font-semibold uppercase">Total Kiosks</span>
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{devices.length}</p>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">Registered Fleet</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-1.5">
              <span className="text-xs font-semibold uppercase">Online (Active)</span>
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 leading-none">{onlineCount}</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">100% Operational</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700 mb-1.5">
              <span className="text-xs font-semibold uppercase">NFC Fallback</span>
              <Radio className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 leading-none">{fallbackCount}</p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Camera Offline Mode</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-red-200 bg-red-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-red-700 mb-1.5">
              <span className="text-xs font-semibold uppercase">Offline Kiosks</span>
              <WifiOff className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-black text-red-700 leading-none">{offlineCount}</p>
            <p className="text-[11px] text-red-600 mt-1 font-medium">Requires Inspection</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 mb-1.5">
              <span className="text-xs font-semibold uppercase">Pending Sync</span>
              <RotateCw className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700 leading-none">{pendingSyncTotal}</p>
            <p className="text-[11px] text-blue-600 mt-1 font-medium">Offline Queue Events</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-purple-200 bg-purple-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-purple-700 mb-1.5">
              <span className="text-xs font-semibold uppercase">Active Incidents</span>
              <AlertTriangle className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700 leading-none">{openIncidentsCount}</p>
            <p className="text-[11px] text-purple-600 mt-1 font-medium">Hardware Tickets</p>
          </div>
        </div>

        {/* =========================================================================
            3. TAB NAVIGATION (6 Dedicated Sections from PDF Section 9)
           ========================================================================= */}
        <div className="border-b border-gray-200 bg-white rounded-xl px-2 py-1 shadow-2xs flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Fleet Overview', icon: Cpu },
            { id: 'monitoring', label: 'Live Telemetry', icon: Activity, badge: 'Realtime' },
            { id: 'devices', label: 'Kiosk Devices', icon: Layers },
            { id: 'test', label: 'Hardware Diagnostics', icon: Wrench, badge: 'Interactive' },
            { id: 'sync', label: 'Offline Sync Queue', icon: RotateCw, count: pendingSyncTotal },
            { id: 'incidents', label: 'Incidents & Maintenance', icon: AlertTriangle, count: openIncidentsCount },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DeviceTab)}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#005B46] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      isActive ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TAB 1: FLEET OVERVIEW DASHBOARD
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Status Notice */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-emerald-900">Hardware Fleet Normal Operational State</h2>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Classrooms A101 and Lab 2 are actively accepting contactless NFC smart cards and facial recognition attendance.
                  Kiosk-03 is running smoothly in <strong>NFC Fallback Mode</strong> due to light glare on the camera lens.
                </p>
              </div>
            </div>

            {/* Component Health Matrix Grid */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Kiosk Component Health Matrix</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Automated sensor verification across all classroom edge devices</p>
                </div>
                <button
                  onClick={() => setActiveTab('monitoring')}
                  className="text-xs font-semibold text-[#005B46] hover:underline flex items-center gap-1"
                >
                  <span>Open Detailed Telemetry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-bold">Kiosk Device</th>
                      <th className="py-3 px-3 font-bold">Location</th>
                      <th className="py-3 px-3 font-bold text-center">ESP32-S3 Core</th>
                      <th className="py-3 px-3 font-bold text-center">ESP32-CAM</th>
                      <th className="py-3 px-3 font-bold text-center">PN532 NFC</th>
                      <th className="py-3 px-3 font-bold text-center">OLED 128x64</th>
                      <th className="py-3 px-3 font-bold text-center">Servo Gate</th>
                      <th className="py-3 px-3 font-bold text-center">Temp / Volts</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {devices.map(device => (
                      <tr key={device.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          <div>{device.name}</div>
                          <span className="font-mono text-[10px] text-gray-500">{device.deviceCode}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{device.room}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> OK
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {device.esp32CamStatus === 'HEALTHY' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" /> 1080p
                            </span>
                          )}
                          {device.esp32CamStatus === 'WARNING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Fallback
                            </span>
                          )}
                          {device.esp32CamStatus === 'ERROR' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            13.56 MHz
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Ready
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            PWM Ready
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-gray-700">
                          {device.temperature}°C | {device.powerVoltage}V
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDeviceId(device.id);
                              setActiveTab('test');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#005B46] hover:text-white text-gray-700 text-xs font-semibold transition-colors"
                          >
                            Test Device
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions & Recent Incidents Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: Quick Diagnostic Launcher */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Rapid Hardware Diagnostics</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">Select an automated diagnostic test to run remotely on Classroom Kiosk 1:</p>

                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <button
                    onClick={() => executeHardwareTest('Servo Gate Test', 'SERVO')}
                    disabled={Boolean(runningTest)}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#005B46] hover:bg-emerald-50/50 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 group-hover:text-[#005B46]">
                      <span>Servo Gate Pulse</span>
                      <Sliders className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#005B46]" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Actuate 0° → 90° → 0° barrier</p>
                  </button>

                  <button
                    onClick={() => executeHardwareTest('ESP32-CAM Test', 'CAM')}
                    disabled={Boolean(runningTest)}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#005B46] hover:bg-emerald-50/50 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 group-hover:text-[#005B46]">
                      <span>Camera Optical Stream</span>
                      <Camera className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#005B46]" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Capture frame & test ArcFace</p>
                  </button>

                  <button
                    onClick={() => executeHardwareTest('PN532 NFC Test', 'NFC')}
                    disabled={Boolean(runningTest)}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#005B46] hover:bg-emerald-50/50 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 group-hover:text-[#005B46]">
                      <span>PN532 NFC Field</span>
                      <Radio className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#005B46]" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">RF field & card read test</p>
                  </button>

                  <button
                    onClick={() => executeHardwareTest('OLED Display Test', 'OLED')}
                    disabled={Boolean(runningTest)}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#005B46] hover:bg-emerald-50/50 text-left transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-gray-900 group-hover:text-[#005B46]">
                      <span>OLED Framebuffer</span>
                      <Terminal className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#005B46]" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">128x64 display test pattern</p>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Live Status: {runningTest ? `Running ${runningTest}...` : 'Ready'}</span>
                  <button
                    onClick={() => setActiveTab('test')}
                    className="text-xs font-bold text-[#005B46] hover:underline"
                  >
                    Open Diagnostic Console →
                  </button>
                </div>
              </div>

              {/* Right: Urgent Incidents */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>Active Hardware Incidents</span>
                    </h2>
                    <button
                      onClick={() => setIsNewIncidentOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Incident</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {incidents.slice(0, 2).map(inc => (
                      <div key={inc.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <span className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-800">
                              {inc.severity}
                            </span>
                            <span>{inc.incidentType}</span>
                          </span>
                          <span className="font-mono text-[10px] text-gray-500">{inc.deviceCode}</span>
                        </div>
                        <p className="text-gray-600 mt-1 line-clamp-2">{inc.description}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-200">
                          <span>{inc.room}</span>
                          <button
                            onClick={() => handleResolveIncident(inc.id)}
                            className="font-bold text-emerald-700 hover:underline"
                          >
                            Mark Repaired
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">{openIncidentsCount} tickets currently open</span>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-xs font-bold text-[#005B46] hover:underline"
                  >
                    View All Maintenance Logs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: LIVE TELEMETRY (PDF 9.3 Live Monitoring Requirements)
           ========================================================================= */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Device Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Select Kiosk:</span>
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#005B46]/30"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.deviceCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Operating Mode:</span>
                <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {selectedDevice.mode}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 font-mono">IP: {selectedDevice.ipAddress}</span>
              </div>
            </div>

            {/* Live Telemetry Sensor Cards (PDF 9.3 exact metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Camera Optical State */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between text-gray-700 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Camera Sensor</span>
                  <Camera className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-lg font-bold text-gray-900">
                    {selectedDevice.esp32CamStatus === 'HEALTHY' ? 'Healthy (1080p)' : 'NFC Fallback Active'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1 font-mono">
                  <p>Backbone: ArcFace buffalo_sc</p>
                  <p>Inference Latency: 34ms</p>
                  <p>Lighting: 420 Lux (Adequate)</p>
                </div>
              </div>

              {/* Card 2: PN532 Contactless NFC */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between text-gray-700 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">PN532 NFC Field</span>
                  <Radio className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-lg font-bold text-gray-900">Healthy (Ready)</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1 font-mono">
                  <p>Carrier: 13.56 MHz RF</p>
                  <p>Standard: ISO/IEC 14443 Type A</p>
                  <p>Supported: Mifare & NTAG213</p>
                </div>
              </div>

              {/* Card 3: OLED Screen & RTC */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between text-gray-700 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">OLED & Clock (RTC)</span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-lg font-bold text-gray-900">SSD1306 + DS3231</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1 font-mono">
                  <p>OLED Buffer: "TAP CARD / STAND"</p>
                  <p>RTC Drift: &lt; 20ms vs NTP</p>
                  <p>I2C Bus Clock: 400 kHz Fast</p>
                </div>
              </div>

              {/* Card 4: Servo Demonstration Gate */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between text-gray-700 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Servo Gate Barrier</span>
                  <Sliders className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isGateOpen ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-lg font-bold text-gray-900">
                    {isGateMoving ? 'Actuating...' : isGateOpen ? 'Gate OPEN (90°)' : 'Gate CLOSED (0°)'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1 font-mono">
                  <p>Control: 50Hz PWM (GPIO 18)</p>
                  <p>Pulse: {isGateOpen ? '2000µs' : '1000µs'}</p>
                  <p>Stall Detection: Nominal</p>
                </div>
              </div>
            </div>

            {/* Environmental & Enclosure Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Enclosure Temperature</p>
                  <p className="text-2xl font-black text-gray-900">{selectedDevice.temperature}°C</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Within safe range (&lt; 55°C)</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Power & Voltage</p>
                  <p className="text-2xl font-black text-gray-900">{selectedDevice.powerVoltage}V</p>
                  <p className="text-[11px] text-gray-600 font-medium">Battery backup: {selectedDevice.batteryPercent}%</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Anti-Tamper Switch</p>
                  <p className="text-2xl font-black text-emerald-700">SECURE</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Cabinet interlock closed</p>
                </div>
              </div>
            </div>

            {/* Visual Gate Simulator Component */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Physical Servo Barrier Demonstration</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Controls the classroom entrance barrier upon successful biometric or RFID check-in
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsGateMoving(true);
                      setIsGateOpen(prev => !prev);
                      setTimeout(() => setIsGateMoving(false), 600);
                      appendLog(`[Manual] Servo Gate toggled to ${!isGateOpen ? 'OPEN (90°)' : 'CLOSED (0°)'}`, 'info');
                    }}
                    disabled={isGateMoving}
                    className="px-4 py-2 rounded-xl bg-[#005B46] hover:bg-[#004D3A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isGateOpen ? <Lock className="w-4 h-4 text-amber-300" /> : <Unlock className="w-4 h-4 text-amber-300" />}
                    <span>{isGateOpen ? 'Close Gate' : 'Open Gate (Pulse)'}</span>
                  </button>
                </div>
              </div>

              {/* Graphical Gate Visualizer */}
              <div className="relative h-40 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-6">
                  {/* Left Post */}
                  <div className="w-6 h-28 bg-gray-700 rounded-lg shadow-md relative flex flex-col items-center justify-between p-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[8px] font-mono text-gray-300 transform -rotate-90">KIOSK</span>
                  </div>

                  {/* Arm */}
                  <div
                    className="w-48 h-4 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg origin-left transition-transform duration-500 flex items-center px-2"
                    style={{
                      transform: isGateOpen ? 'rotate(-75deg)' : 'rotate(0deg)',
                    }}
                  >
                    <div className="flex gap-2 w-full justify-around">
                      <span className="w-3 h-1 bg-red-600 rounded-full" />
                      <span className="w-3 h-1 bg-white rounded-full" />
                      <span className="w-3 h-1 bg-red-600 rounded-full" />
                      <span className="w-3 h-1 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Right Post */}
                  <div className="w-6 h-28 bg-gray-700 rounded-lg shadow-md relative flex flex-col items-center justify-between p-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[8px] font-mono text-gray-300 transform -rotate-90">BARRIER</span>
                  </div>
                </div>

                <div className="absolute bottom-2 left-4 text-[10px] text-gray-500 font-mono">
                  State: {isGateOpen ? 'UNLOCKED (Free Passage)' : 'LOCKED (RFID/Face Required)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: KIOSK FLEET MANAGEMENT (PDF 9.2 Requirements)
           ========================================================================= */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
              <div>
                <h2 className="text-base font-bold text-gray-900">Registered Kiosk Hardware Fleet</h2>
                <p className="text-xs text-gray-500 mt-0.5">Complete hardware inventory mapped to NCCT classrooms and halls</p>
              </div>
              <button
                onClick={() => {
                  appendLog('[Registration] Searching local subnet 192.168.1.0/24 for new ESP32 mDNS beacons...', 'info');
                  setTimeout(() => appendLog('[Registration] No unregistered beacons found.', 'info'), 800);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#005B46] hover:bg-[#004D3A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Scan for New ESP32</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map(device => (
                <div
                  key={device.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:border-[#005B46] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700">
                          {device.deviceCode}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 mt-1.5">{device.name}</h3>
                        <p className="text-xs text-gray-500">{device.room}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          device.status === 'ONLINE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : device.status === 'FALLBACK_NFC'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            device.status === 'ONLINE'
                              ? 'bg-emerald-500 animate-pulse'
                              : device.status === 'FALLBACK_NFC'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span>{device.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-gray-50 text-xs font-mono text-gray-600">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-sans">IP Address</span>
                        <span>{device.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-sans">MAC Address</span>
                        <span>{device.macAddress}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-sans">Firmware</span>
                        <span>{device.firmware}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-sans">Last Heartbeat</span>
                        <span>{device.lastSeen}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      Offline Sync: <strong>{device.pendingSyncCount} events pending</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDeviceId(device.id);
                          setActiveTab('monitoring');
                        }}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                      >
                        Telemetry
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeviceId(device.id);
                          setActiveTab('test');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#005B46] text-white hover:bg-[#004D3A] text-xs font-semibold"
                      >
                        Run Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: HARDWARE DIAGNOSTICS & TEST SUITE (PDF 9.4 Requirements)
           ========================================================================= */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Interactive Diagnostic Console</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Trigger isolated hardware tests on <strong>{selectedDevice.name}</strong> ({selectedDevice.deviceCode})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTestConsoleLogs([])}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
                >
                  Clear Console
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols: Interactive Diagnostic Action Grid */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Diagnostic Test Routines</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: 'ESP32', name: 'ESP32-S3 CPU & Free Heap', desc: 'Checks dual-core 240MHz Xtensa & PSRAM registers', icon: Cpu },
                    { code: 'CAM', name: 'ESP32-CAM Optical Frame', desc: 'Tests OV2640 DVP pipeline & buffalo_sc detector', icon: Camera },
                    { code: 'NFC', name: 'PN532 NFC 13.56MHz Field', desc: 'Tests RF carrier & ISO14443A card reader', icon: Radio },
                    { code: 'OLED', name: 'SSD1306 OLED Display (I2C)', desc: 'Writes test pattern to 128x64 display buffer', icon: Terminal },
                    { code: 'SERVO', name: 'Servo Barrier Motor (PWM)', desc: 'Sweeps barrier arm from 0° to 90° and back', icon: Sliders },
                    { code: 'BUZZER', name: 'Audio Buzzer (GPIO 14)', desc: 'Plays 2.4kHz notification tone for 150ms', icon: Volume2 },
                    { code: 'RTC', name: 'DS3231 RTC Time Sync', desc: 'Checks timekeeping drift against NTP server', icon: Clock },
                    { code: 'TEMP', name: 'Thermistor Temp Sensor', desc: 'Samples ADC on GPIO 34 for enclosure heat', icon: Thermometer },
                    { code: 'POWER', name: 'Power & Battery Bus (INA219)', desc: 'Samples DC voltage, current draw, and battery %', icon: Zap },
                    { code: 'TAMPER', name: 'Anti-Tamper Switch', desc: 'Tests enclosure microswitch continuity', icon: ShieldCheck },
                  ].map(test => {
                    const Icon = test.icon;
                    const isRunning = runningTest === test.code;
                    return (
                      <div
                        key={test.code}
                        className="p-3.5 rounded-xl border border-gray-200 hover:border-[#005B46] bg-gray-50/50 hover:bg-white transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
                              <Icon className="w-4 h-4 text-[#005B46]" />
                              <span>{test.name}</span>
                            </div>
                            {isRunning && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">{test.desc}</p>
                        </div>

                        <button
                          onClick={() => executeHardwareTest(test.name, test.code)}
                          disabled={Boolean(runningTest)}
                          className="mt-3 w-full py-1.5 rounded-lg bg-[#005B46] hover:bg-[#004D3A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isRunning ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Testing...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Run Test</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Live Terminal Output Log */}
              <div className="bg-[#101715] rounded-2xl p-4 text-emerald-300 font-mono text-xs border border-gray-800 shadow-md flex flex-col h-[520px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-[10px] text-gray-300 uppercase tracking-wider">UART0 Log Console</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">115200 Baud</span>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
                  {testConsoleLogs.map((log, i) => (
                    <div key={i} className="leading-tight break-all">
                      <span className="text-gray-500 select-none">[{log.time}] </span>
                      <span
                        className={
                          log.status === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : log.status === 'error'
                            ? 'text-red-400 font-bold'
                            : log.status === 'warn'
                            ? 'text-amber-300'
                            : 'text-gray-300'
                        }
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-800 text-[10px] text-gray-400 flex items-center justify-between">
                  <span>ESP-IDF v5.1.2</span>
                  <span className="text-emerald-400">SYS_READY</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: OFFLINE SYNCHRONIZATION QUEUE (PDF 9.5 Requirements)
           ========================================================================= */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Offline Synchronization Queue</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Outbox-style idempotent event queue storing records during campus network disconnects
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    appendLog('[SyncQueue] Triggering bulk batch synchronization for all pending events...', 'info');
                    syncQueue
                      .filter(s => s.status === 'PENDING' || s.status === 'FAILED')
                      .forEach(handleRetrySync);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#005B46] hover:bg-[#004D3A] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Sync All Pending</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-bold">Event ID</th>
                      <th className="py-3 px-3 font-bold">Device</th>
                      <th className="py-3 px-3 font-bold">Event Type</th>
                      <th className="py-3 px-3 font-bold">Trainee</th>
                      <th className="py-3 px-3 font-bold">Client Created</th>
                      <th className="py-3 px-3 font-bold text-center">Retries</th>
                      <th className="py-3 px-3 font-bold text-center">Sync Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {syncQueue.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                          {item.eventId}
                          <div className="text-[9px] text-gray-400 truncate max-w-[120px]">{item.idempotencyKey}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-mono text-[11px]">{item.deviceCode}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {item.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-800">
                          <div>{item.traineeName}</div>
                          <span className="font-mono text-[10px] text-gray-400">{item.traineeId}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono text-[10px]">
                          {new Date(item.clientCreatedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-700">{item.retryCount}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'SYNCED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'SYNCING'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : item.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : item.status === 'CONFLICT'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.status !== 'SYNCED' && (
                            <button
                              onClick={() => handleRetrySync(item)}
                              className="px-2.5 py-1 rounded bg-[#005B46] hover:bg-[#004D3A] text-white text-xs font-semibold"
                            >
                              Retry Now
                            </button>
                          )}
                          {item.status === 'SYNCED' && (
                            <span className="text-emerald-700 text-xs font-bold flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Synced
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: INCIDENTS & MAINTENANCE LOGS (PDF 9.6 & 9.7 Requirements)
           ========================================================================= */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Hardware Incidents & Maintenance Records</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track physical repairs, component replacements, and field service actions
                </p>
              </div>

              <button
                onClick={() => setIsNewIncidentOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Incident</span>
              </button>
            </div>

            <div className="space-y-3">
              {incidents.map(inc => (
                <div
                  key={inc.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-gray-100 text-gray-700">
                        #{inc.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-xs font-bold text-gray-900">{inc.incidentType}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600 font-medium">{inc.deviceCode}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{inc.room}</span>
                    </div>

                    <p className="text-xs text-gray-700">{inc.description}</p>

                    {inc.resolutionNotes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                        <strong>Resolution:</strong> {inc.resolutionNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inc.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.status}
                    </span>

                    {inc.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#005B46] hover:bg-[#004D3A] text-white text-xs font-semibold"
                      >
                        Mark Repaired
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: LOG HARDWARE INCIDENT
           ========================================================================= */}
        {isNewIncidentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Log Hardware Incident</span>
                </h3>
                <button
                  onClick={() => setIsNewIncidentOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateIncident} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Target Device</label>
                  <select
                    value={newIncidentDevice}
                    onChange={e => setNewIncidentDevice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#005B46]/30"
                  >
                    {devices.map(d => (
                      <option key={d.id} value={d.deviceCode}>
                        {d.name} ({d.deviceCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Incident Type</label>
                    <select
                      value={newIncidentType}
                      onChange={e => setNewIncidentType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#005B46]/30"
                    >
                      <option value="CAMERA_FAIL">CAMERA_FAIL</option>
                      <option value="SERVO_JAM">SERVO_JAM</option>
                      <option value="NFC_TIMEOUT">NFC_TIMEOUT</option>
                      <option value="OVERHEATING">OVERHEATING</option>
                      <option value="TAMPER_ALERT">TAMPER_ALERT</option>
                      <option value="POWER_FLUCTUATION">POWER_FLUCTUATION</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Severity</label>
                    <select
                      value={newIncidentSeverity}
                      onChange={e => setNewIncidentSeverity(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#005B46]/30"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Problem Description & Technician Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newIncidentDesc}
                    onChange={e => setNewIncidentDesc(e.target.value)}
                    placeholder="Describe observed physical symptom (e.g. Servo motor clicking sound, camera lens fogged)..."
                    className="w-full p-3 rounded-xl border border-gray-300 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#005B46]/30"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewIncidentOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    Record Incident
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DeviceOperatorDashboard;
